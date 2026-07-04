import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.patch('/updateProfile', requireAuth, async (req, res) => {
  try {
    const { description } = req.body;
    if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
      return res.status(400).json({ error: 'Invalid description' });
    }
    if (description) {
      await User.updateOne({ _id: req.userId }, { $set: { 'profile.description': description } });
    }
    res.json({ message: 'Profile updated successfully' });
  } catch {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

export default router;
