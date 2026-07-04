import mongoose from 'mongoose';

// general schema, think sample game

const GameMessageSchema = new mongoose.Schema({

  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'system'], // for "Player joined" messages
    required: true
  }
});

// Chat history is always fetched per game in timestamp order.
GameMessageSchema.index({ gameId: 1, timestamp: 1 });

const GameMessage = mongoose.model('GameMessage', GameMessageSchema);

export default GameMessage;