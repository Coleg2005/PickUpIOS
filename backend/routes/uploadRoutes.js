import { Router } from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

router.get("/pfp/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const user = await User.findById(userid);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const picture = user.profile?.picture;

    if (!picture) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    if (picture.startsWith("http://") || picture.startsWith("https://")) {
      return res.redirect(picture);
    }

    return res.sendFile(path.resolve(process.cwd(), picture));
  } catch (err) {
    console.error("Profile picture fetch error:", err);
    res.status(500).json({ error: "Failed to load profile picture" });
  }
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Only the authenticated user can change their own picture
    const user = await User.findById(req.userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "profile-pictures" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    if (!result?.secure_url) {
      return res.status(500).json({ error: "Cloudinary upload failed" });
    }

    // Save new image URL
    await User.updateOne({ _id: user._id }, { $set: { 'profile.picture': result.secure_url } });

    res.status(201).json({
      message: "Picture uploaded successfully",
      url: result.secure_url,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;