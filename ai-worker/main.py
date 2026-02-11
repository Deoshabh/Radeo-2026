import os
import json
import time
import io
import hashlib
import requests
import redis
import pymongo
from PIL import Image
from nudenet import NudeDetector
from ultralytics import YOLO
import imagehash
from minio import Minio
from datetime import datetime

# --- Configuration ---
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
REDIS_QUEUE_NAME = 'image-moderation'

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongo:27017/radeo')
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_BUCKET = os.getenv('MINIO_BUCKET_NAME', 'radeo-reviews')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() == 'true'

# --- Initialization ---
print("Initializing AI Worker...")

# Redis
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=0, decode_responses=True)

# MongoDB
mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client.get_database()
reviews_collection = db['reviews']

# MinIO
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Load AI Models (Global Load)
print("Loading AI Models...")
try:
    nude_detector = NudeDetector()
    yolo_model = YOLO('yolov8n.pt') # Downloads on first run
    print("AI Models Loaded Successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    exit(1)

# --- Logic ---

def download_image(object_name):
    try:
        response = minio_client.get_object(MINIO_BUCKET, object_name)
        data = response.read()
        response.close()
        response.release_conn()
        return io.BytesIO(data)
    except Exception as e:
        print(f"Error downloading {object_name}: {e}")
        return None

def process_image(review_id, image_id):
    print(f"Processing Review: {review_id}, Image: {image_id}")
    
    start_time = time.time()
    
    image_stream = download_image(image_id)
    if not image_stream:
        return

    try:
        pil_image = Image.open(image_stream)
        
        # 1. NSFW Check
        nsfw_score = 0.0
        # NudeNet returns list of dicts: [{'class': '...', 'score': 0.99, 'box': [...]}]
        # We save temp file for NudeNet as it usually expects file path, 
        # but modern versions might support bytes or we save temporarily.
        temp_filename = f"/tmp/{image_id}"
        pil_image.save(temp_filename)
        
        detections = nude_detector.detect(temp_filename)
        os.remove(temp_filename)

        for det in detections:
            if det['class'] in ['EXPOSED_GENITALIA_F', 'EXPOSED_GENITALIA_M', 'EXPOSED_BREAST_F', 'EXPOSED_ANUS']:
                if det['score'] > nsfw_score:
                    nsfw_score = det['score']
        
        # 2. Object Detection (Leather Goods)
        results = yolo_model(pil_image, verbose=False)
        detected_objects = []
        contains_prohibited = False # Or specific logic
        found_target_objects = False # Handbag, suitcase, backpack
        
        target_classes = ['handbag', 'suitcase', 'backpack']
        
        for r in results:
            for c in r.boxes.cls:
                class_name = yolo_model.names[int(c)]
                detected_objects.append(class_name)
                if class_name in target_classes:
                    found_target_objects = True

        detected_objects = list(set(detected_objects)) # Unique

        # 3. Duplicate Check (Perceptual Hash)
        phash = str(imagehash.phash(pil_image))
        
        # Check for duplicate in DB
        is_duplicate = False
        duplicate_check = reviews_collection.find_one({'ai_tags.duplicate_hash': phash})
        if duplicate_check and str(duplicate_check['_id']) != review_id:
            is_duplicate = True

        # Decision Logic
        moderation_flag = False
        
        # Flag if NSFW > 0.65
        if nsfw_score > 0.65:
            moderation_flag = True
            print(f"Flagged NSFW: {nsfw_score}")

        # Flag if NOT a shoe/bag related image (optional strictness)
        # For now, we just tag it. Moderation flag could be set if it's completely irrelevant?
        # Let's keep it simple: Flag if NSFW.

        # Database Update
        update_data = {
            'moderation_flag': moderation_flag,
            'status': 'rejected' if moderation_flag else 'approved', # Auto-approve if safe
            'ai_tags': {
                'nsfw_score': nsfw_score,
                'detected_objects': detected_objects,
                'duplicate_hash': phash,
                'is_duplicate': is_duplicate,
                'processed_at': datetime.utcnow()
            }
        }
        
        reviews_collection.update_one(
            {'_id': pymongo.ObjectId(review_id)},
            {'$set': update_data}
        )
        
        print(f"Completed {review_id} in {time.time() - start_time:.2f}s. Flagged: {moderation_flag}")

    except Exception as e:
        print(f"Error processing image {image_id}: {e}")

# --- Worker Loop ---
def start_worker():
    print(f"Worker listening on {REDIS_QUEUE_NAME}...")
    while True:
        try:
            # BullMQ uses specific key patterns. 
            # For simplicity in this custom worker, we should use a simpler Redis list or
            # adapt to BullMQ's structure.
            # BullMQ adds jobs to a list, but managing the claim/lock is complex in raw Python.
            # ERROR ALERT: Simple Redis `lpop` won't work with BullMQ's complex Lua scripts easily.
            # FIX: We will use a standard Redis List 'image-moderation-queue' for this Python worker,
            # and change the Node.js controller to push to this simple list INSTEAD of using BullMQ 
            # if we want a "Simple Redis listening loop" as requested.
            # 
            # HOWEVER, the user asked for "BullMQ connecting to Valkey".
            # To consume BullMQ from Python is hard. 
            # I will assume the Node.js controller uses `queue.add` which pushes to BullMQ.
            # 
            # ALTERNATIVE: Use a Python BullMQ client? There isn't a mature official one.
            # COMPROMISE: We will implement a simple Redis List consumer in Python 
            # and Update ReviewController to push to this list via `.client.lpush` 
            # OR logic: receive from "image-moderation" list.
            
            # Let's check the Node.js implementation. It uses `new Queue('image-moderation')`.
            # This creates a BullMQ structure. 
            # 
            # REVISION: I will update the Node.js controller in the next step to ALSO 
            # push to a simple list `queue:image-moderation` for the Python worker, 
            # OR changing the requirement to "Node.js adds to Redis List". 
            # Given constraints: "simple Redis listening loop... is preferred".
            # 
            # So I will write this worker to listen to `queue:image-moderation` (List).
            
            # Pop user job from list (blocking)
            job_data_raw = r.blpop('queue:image-moderation', timeout=5)
            
            if job_data_raw:
                queue_name, data_str = job_data_raw
                job = json.loads(data_str)
                process_image(job['reviewId'], job['imageId'])
                
        except redis.exceptions.ConnectionError:
            print("Redis connection lost... retrying in 5s")
            time.sleep(5)
        except Exception as e:
            print(f"Worker Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    start_worker()
