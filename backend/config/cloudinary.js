import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Delete an uploaded image given its delivery URL (the secure_url we store on
// the user). Fail-soft: an orphaned image in Cloudinary is not worth failing
// account deletion or a picture replacement over, so errors are only logged.
// Never throws.
export const deleteImageByUrl = async (url) => {
  try {
    if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
    // .../image/upload/<transformations/>v123456/<public_id>.<ext>
    const match = url.match(/\/upload\/(?:.*?v\d+\/)?(.+)\.\w+$/);
    if (!match) return;
    await cloudinary.uploader.destroy(match[1]);
  } catch (err) {
    console.error('Cloudinary delete failed for', url, err);
  }
};

export default cloudinary;