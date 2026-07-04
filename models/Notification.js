import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['friend-request', 'upcoming-game', 'game-invite'],
    required: true
  },
  object: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'objectModel'
  },
  objectModel: {
    type: String,
    required: true,
    enum: ['User', 'Game']
  },
  // Who triggered the notification (e.g. the friend who sent a game invite);
  // for friend requests the sender is already the object itself
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});
 
const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;