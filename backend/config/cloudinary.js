import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'LMS_Courses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});
const uploadImage = multer({ storage: imageStorage });



// ==========================================
// 2. ỐNG NƯỚC DÀNH CHO TÀI LIỆU (LESSONS - PDF)
// ==========================================
const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const originalName = file.originalname.split('.').slice(0, -1).join('.');
    const safeName = originalName.replace(/[^a-zA-Z0-9]/g, "_");

    return {
      folder: 'LMS_Lessons_Docs',
      resource_type: 'raw',   // 👈 QUAN TRỌNG NHẤT
      public_id: `${safeName}_${Date.now()}`,
      format: 'pdf'           // 👈 đảm bảo đúng định dạng
    };
  },
});
const uploadDoc = multer({ storage: docStorage });

export { uploadImage, uploadDoc }; 

export default uploadImage;