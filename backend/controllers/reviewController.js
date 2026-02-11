const Review = require('../models/Review');
const Product = require('../models/Product');
// const { Queue } = require('bullmq'); // Removed in favor of simple redis list
const Minio = require('minio');
const crypto = require('crypto');
const path = require('path');

// Initialize MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'radeo-reviews';

// Ensure bucket exists
(async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created.`);
      
      // Set public policy for read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (err) {
    console.error('MinIO Bucket Error:', err);
  }
})();

// Initialize Redis Client for Queue (using ioredis)
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Helper: Upload to MinIO
const uploadToMinio = async (file) => {
  const fileExt = path.extname(file.originalname);
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  
  await minioClient.putObject(BUCKET_NAME, fileName, file.buffer, file.size, {
    'Content-Type': file.mimetype
  });

  return {
    url: `/api/v1/storage/${BUCKET_NAME}/${fileName}`,
    publicId: fileName
  };
};

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user.id;

    // 1. Validation
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // 2. Handle Image Uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToMinio(file);
        images.push(uploadResult);
      }
    }

    // 3. Create Review
    const review = await Review.create({
      user: userId,
      product: productId,
      rating: Number(rating),
      title,
      comment,
      images,
      status: 'pending'
    });

    // 4. Dispatch Moderation Jobs if images exist
    if (images.length > 0) {
      for (const image of images) {
        // Push to simple Redis list queue
        const jobData = JSON.stringify({
          reviewId: review._id.toString(),
          imageId: image.publicId,
          bucketName: BUCKET_NAME
        });
        
        await redisClient.rpush('queue:image-moderation', jobData);
      }
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// Get Reviews for a Product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const query = { product: productId, status: 'approved' };
    
    // Sort options
    let sortOptions = {};
    if (sort === 'newest') sortOptions = { createdAt: -1 };
    else if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'highest') sortOptions = { rating: -1 };
    else if (sort === 'lowest') sortOptions = { rating: 1 };
    else if (sort === 'helpful') sortOptions = { helpfulVotes: -1 };

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName profilePicture')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReviews: count
    });
  } catch (error) {
    console.error('Get Product Reviews Error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// Get My Reviews (Logged in user)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get My Reviews Error:', error);
    res.status(500).json({ message: 'Failed to fetch your reviews', error: error.message });
  }
};

// Update Review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: id, user: userId });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Handle new images if any (append to existing)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToMinio(file);
        review.images.push(uploadResult);
        
        // Re-trigger moderation for new images
        const jobData = JSON.stringify({
          reviewId: review._id.toString(),
          imageId: uploadResult.publicId,
          bucketName: BUCKET_NAME
        });
        await redisClient.rpush('queue:image-moderation', jobData);
      }
      review.status = 'pending'; // Re-set to pending if images added
    }

    if (rating) review.rating = Number(rating);
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Update Review Error:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Allow user to delete own review, or admin to delete any
    const query = { _id: id };
    if (req.user.role !== 'admin') {
      query.user = userId;
    }

    const review = await Review.findOneAndDelete(query);

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete Review Error:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

// Mark Review Helpful
exports.markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Marked as helpful', helpfulVotes: review.helpfulVotes });
  } catch (error) {
    console.error('Mark Helpful Error:', error);
    res.status(500).json({ message: 'Failed to mark review as helpful', error: error.message });
  }
};

// Upload Review Photos (Standalone - possibly deprecated or used by separate flow)
exports.uploadReviewPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const result = await uploadToMinio(file);
      uploadedImages.push(result);
    }

    res.json({ 
      success: true, 
      message: 'Photos uploaded successfully',
      images: uploadedImages 
    });
  } catch (error) {
    console.error('Upload Photos Error:', error);
    res.status(500).json({ message: 'Failed to upload photos', error: error.message });
  }
};
