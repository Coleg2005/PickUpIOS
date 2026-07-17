import mongoose from 'mongoose';

// general schema, think sample game

const GameSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    maxlength: 60
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
    type: String,
    maxlength: 500
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

// Match the app's hot queries: games at a venue (map view), games a user
// leads, and games a user has joined (home screen).
GameSchema.index({ fsq_id: 1 });
GameSchema.index({ leader: 1 });
GameSchema.index({ gameMembers: 1 });

const Game = mongoose.model('Game', GameSchema);

export default Game;