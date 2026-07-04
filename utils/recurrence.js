import Game from '../models/Game.js';

const INTERVAL_DAYS = { daily: 1, 'every-other-day': 2, weekly: 7 };

// How long after start time a session is considered over. Must stay well
// under the 2-day TTL on Game.date, or Mongo deletes the game before the
// job can roll it forward.
const GRACE_MS = 2 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 15 * 60 * 1000;

// First occurrence that hasn't finished yet, keeping the original wall-clock
// time (setDate is DST-safe, unlike adding fixed milliseconds).
export const nextOccurrence = (date, recurrence, now = new Date()) => {
  const days = INTERVAL_DAYS[recurrence];
  if (!days) return null;
  const next = new Date(date);
  while (next.getTime() <= now.getTime() - GRACE_MS) {
    next.setDate(next.getDate() + days);
  }
  return next;
};

// Move every finished recurring game to its next occurrence. Members and
// chat history carry over — it's the same standing game.
export const advanceRecurringGames = async () => {
  const cutoff = new Date(Date.now() - GRACE_MS);
  const games = await Game.find({
    recurrence: { $in: Object.keys(INTERVAL_DAYS) },
    date: { $lt: cutoff },
  });

  for (const game of games) {
    const next = nextOccurrence(game.date, game.recurrence);
    if (!next) continue;
    await Game.updateOne({ _id: game._id }, { $set: { date: next } });
  }

  return games.length;
};

export const startRecurrenceJob = () => {
  const run = () =>
    advanceRecurringGames().catch((err) => console.error('Recurrence job error:', err));
  run();
  setInterval(run, CHECK_EVERY_MS);
};
