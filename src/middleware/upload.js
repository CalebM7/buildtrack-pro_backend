import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Using a basic synchronous params function (more stable)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'buildtrackpro',
      resource_type: 'image',
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError('Only JPEG, PNG, and WEBP images are allowed', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return next(new ApiError(400, err.message));
  }
  return next(err);
};

export default upload;
