import mongoose from 'mongoose';

// general schema, think sample user

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  profile: { 
    description: {
      type: String,
      default: ''
    },
    picture: {
      // Cloudinary URL once the user uploads one. Empty means "no picture" —
      // the app renders an initials avatar (Avatar.tsx) for falsy values.
      type: String,
      default: ''
    }
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  pushTokens: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  blockedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  }
});


const User = mongoose.model('User', userSchema);

export default User;