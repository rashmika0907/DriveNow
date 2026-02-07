const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Environment variables with defaults
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '5242880', 10); // 5MB default
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads', 'cars');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Ensure uploads directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create upload directory:', error.message);
  throw new Error('Upload directory initialization failed');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Verify directory exists
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(new Error('Failed to access upload directory'), null);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Validate extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension'), null);
      }
      
      cb(null, `car-${uniqueSuffix}${ext}`);
    } catch (error) {
      cb(new Error('Failed to generate filename'), null);
    }
  },
});

// File filter - only images with proper validation
const fileFilter = (req, file, cb) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const extname = ALLOWED_EXTENSIONS.includes(ext);
    const mimetype = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files (${ALLOWED_EXTENSIONS.join(', ')}) are allowed`), false);
    }
  } catch (error) {
    cb(new Error('File validation error'), false);
  }
};

// Configure multer with error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter: fileFilter,
});

// Error handler for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: `File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` 
      });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error) {
    return res.status(400).json({ message: error.message || 'File upload error' });
  }
  next();
};

module.exports = { upload, handleUploadError, MAX_UPLOAD_SIZE, UPLOAD_DIR };

