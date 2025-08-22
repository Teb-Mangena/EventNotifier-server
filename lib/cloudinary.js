import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Multer for in-memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // First validate field names
    const allowedFields = ['image', 'pdf'];
    if (!allowedFields.includes(file.fieldname)) {
      return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
    }

    // Then validate file types
    if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed for "image" field'), false);
    }

    if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDFs allowed for "pdf" field'), false);
    }

    cb(null, true);
  }
});

// Helper function to upload file buffer to Cloudinary
const uploadFromBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: "pakamani",
        resource_type: options.resourceType || 'auto',
        format: options.format,
        filename_override: options.fileName,
        use_filename: true
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default uploadFromBuffer;
