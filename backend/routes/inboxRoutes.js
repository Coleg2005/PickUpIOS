import express from 'express';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.use(requireAuth);

router.get('/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (userid !== req.userId) {
      return res.status(403).json({ error: 'Cannot read another user\'s inbox' });
    }
    const notifs = await Notification.find({ recipient: userid })
      .sort({ date: -1 }) // newest first — matches the {recipient, date} index
      .populate('object', '_id username profile name date location sport')
      .populate('sender', '_id username profile');
    res.status(200).json(notifs);
  } catch {
    res.status(500).json({ error: 'Error getting notifications using id' });
  }
});

router.delete('/:notifid', async (req, res) => {
  try {
    const { notifid } = req.params;
    if (!notifid) {
      return res.status(400).json({ error: 'notifid is required' });
    }
    // Only the recipient may delete their notification
    const deletedNotif = await Notification.findOneAndDelete({ _id: notifid, recipient: req.userId });
    if (!deletedNotif) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(deletedNotif);
  } catch {
    res.status(500).json({ error: 'Error deleting notification' });
  }
});

export default router;