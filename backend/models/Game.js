import mongoose from 'mongoose';

// general schema, think sample game

const GameSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },
  gameMembers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 172800 }
  },
  location: {
    type: String,
    required: true
  },
  fsq_id: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  maxPlayers: {
    type: Number,
    default: null,
  },
  // Recurring games are rolled forward to their next occurrence by the
  // recurrence job (utils/recurrence.js) instead of expiring via the TTL
  // index on date. 'weekly' repeats on the weekday of the game's date.
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'every-other-day', 'weekly'],
    default: 'none'
  }
});
 
const Game = mongoose.model('Game', GameSchema);

export default Game;