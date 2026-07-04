import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPushNotifications } from '../utils/push.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

// All friend operations act on behalf of the authenticated user (req.userId);
// the client-supplied userid is ignored so users can't act as someone else.
router.use(requireAuth);

router.patch('/request', async (req, res) => {
  try {
    const userid = req.userId;
    const { friendid } = req.body;
    if (!friendid) {
      return res.status(400).json({ error: 'friend is required' });
    }
    const user = await User.findOne({ _id: userid });
    const friend = await User.findOne({ _id: friendid });

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    const alreadyFriend = (user.friends || []).some(f => (f._id || f).toString() === friend._id.toString());
    if (alreadyFriend) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Blocked either way — generic message so blocking isn't revealed
    const blockedEitherWay =
      (user.blockedUsers || []).some(b => b.toString() === friend._id.toString()) ||
      (friend.blockedUsers || []).some(b => b.toString() === user._id.toString());
    if (blockedEitherWay) {
      return res.status(403).json({ error: 'Unable to send friend request' });
    }

    // Don't create (or push) duplicate pending requests
    const existingRequest = await Notification.findOne({ recipient: friend._id, type: 'friend-request', object: user._id });
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already pending' });
    }

    const notif = new Notification({ recipient: friend._id, date: new Date(), type: 'friend-request', object: user._id, objectModel: 'User' });
    await notif.save();
    sendPushNotifications(friend.pushTokens, 'New Friend Request', `${user.username} wants to be your friend`, { type: 'friend-request' });
    res.json({ message: 'Friend requested successfully' });
  } catch {
    res.status(500).json({ error: 'Error requesting friend' });
  }
});

router.patch('/accept', async (req, res) => {
  try {
    const userid = req.userId;
    const { friendid } = req.body;
    if (!friendid) {
      return res.status(400).json({ error: 'friend is required' });
    }
    const user = await User.findOne({ _id: userid });
    const friend = await User.findOne({ _id: friendid });

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    const alreadyFriend = (user.friends || []).some(f => (f._id || f).toString() === friend._id.toString());
    if (alreadyFriend) {
      return res.status(400).json({ error: 'Already friends' });
    }

    await User.updateOne({ _id: user._id }, { $addToSet: { friends: friend._id } });
    await User.updateOne({ _id: friend._id }, { $addToSet: { friends: user._id } });

    sendPushNotifications(friend.pushTokens, 'Friend Request Accepted', `${user.username} accepted your friend request`, { type: 'friend-accepted' });
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept friend error:', err);
    res.status(500).json({ error: 'Error accepting friend request' });
  }
});

router.patch('/remove', async (req, res) => {
  try {
    const userid = req.userId;
    const { friendid } = req.body;
    if (!friendid) {
      return res.status(400).json({ error: 'friend is required' });
    }
    const user = await User.findOne({ _id: userid });
    const friend = await User.findOne({ _id: friendid });

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    await User.updateOne({ _id: user._id }, { $pull: { friends: friend._id } });
    await User.updateOne({ _id: friend._id }, { $pull: { friends: user._id } });

    res.json({ message: 'Friend removed successfully' });
  } catch {
    res.status(500).json({ error: 'Error removing friend' });
  }
});

router.get('/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!userid) {
      return res.status(400).json({ error: 'id is required' });
    }
    const user = await User.findById(userid).populate('friends', '_id username profile');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user.friends);
  } catch {
    res.status(500).json({ error: 'Error getting friends using id' });
  }
});

export default router;