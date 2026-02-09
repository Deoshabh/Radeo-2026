const ContactMessage = require('../models/ContactMessage');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Submit contact form
// @route   POST /api/v1/contact
// @access  Public
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedSubject = String(subject || '').trim();
    const normalizedMessage = String(message || '').trim();

    if (!normalizedName || !normalizedEmail || !normalizedMessage) {
      return res
        .status(400)
        .json({ message: 'name, email, and message are required' });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    const doc = await ContactMessage.create({
      name: normalizedName,
      email: normalizedEmail,
      subject: normalizedSubject,
      message: normalizedMessage,
      source: 'website',
    });

    return res.status(201).json({
      message: 'Message received successfully',
      id: doc._id,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0];
      return res.status(400).json({
        message: firstError?.message || 'Invalid contact form payload',
      });
    }

    console.error('Submit contact message error:', error);
    return res.status(500).json({
      message: 'Failed to submit contact form',
    });
  }
};
