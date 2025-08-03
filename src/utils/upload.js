const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadsDir = path.join(__dirname, '..', '..', 'uploads');

const imageDir = path.join(baseUploadsDir, 'images');
const videoDir = path.join(baseUploadsDir, 'videos');

// Create directories if not exist
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: videoDir,
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageStorage = multer.diskStorage({
  destination: imageDir,
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage, limits: { fileSize: 100 * 1024 * 1024 } });

module.exports = { uploadImage, uploadVideo };
