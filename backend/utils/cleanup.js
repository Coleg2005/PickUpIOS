import Game from '../models/Game.js';
import GameMessage from '../models/GameMessage.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { GRACE_MS, RECURRING } from './recurrence.js';

const CHECK_EVERY_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Recurring games keep one long-running chat, so trim it by age instead.
const RECURRING_CHAT_RETENTION_MS = 30 * DAY_MS;
// Friend requests nobody acted on eventually stop being worth showing.
const FRIEND_REQUEST_RETENTION_MS = 60 * DAY_MS;

// Remove everything that hangs off a set of games. Call this whenever games
// are deleted so chat history and inbox entries don't outlive them.
export const deleteGameData = async (gameIds) => {
  if (!gameIds.length) return;
  await GameMessage.deleteMany({ gameId: { $in: gameIds } });
  await Notification.deleteMany({ objectModel: 'Game', object: { $in: gameIds } });
};

// Delete one-off games that are over (same cutoff the recurrence job uses to
// call a session finished), along with their chat and notifications.
const deleteEndedGames = async () => {
  const ended = await Game.find(
    { recurrence: { $nin: RECURRING }, date: { $lt: new Date(Date.now() - GRACE_MS) } },
    '_id'
  ).lean();
  const ids = ended.map((g) => g._id);
  await deleteGameData(ids);
  await Game.deleteMany({ _id: { $in: ids } });
  return ids.length;
};

const pruneRecurringChats = async () => {
  const recurring = await Game.find({ recurrence: { $in: RECURRING } }, '_id').lean();
  if (!recurring.length) return 0;
  const { deletedCount } = await GameMessage.deleteMany({
    gameId: { $in: recurring.map((g) => g._id) },
    timestamp: { $lt: new Date(Date.now() - RECURRING_CHAT_RETENTION_MS) },
  });
  return deletedCount;
};

// Ids from `ids` that no longer exist in `Model`.
const missingIds = async (Model, ids) => {
  if (!ids.length) return [];
  const existing = await Model.find({ _id: { $in: ids } }, '_id').lean();
  const alive = new Set(existing.map((d) => d._id.toString()));
  return ids.filter((id) => !alive.has(id.toString()));
};

// Catch anything left behind by the Game.date TTL index or older code paths
// that deleted games/users without cascading.
const deleteOrphans = async () => {
  const deadGames = await missingIds(Game, await GameMessage.distinct('gameId'));
  const { deletedCount: messages } = await GameMessage.deleteMany({ gameId: { $in: deadGames } });

  const deadGameObjs = await missingIds(Game, await Notification.distinct('object', { objectModel: 'Game' }));
  const deadUserObjs = await missingIds(User, await Notification.distinct('object', { objectModel: 'User' }));
  const deadRecipients = await missingIds(User, await Notification.distinct('recipient'));
  const { deletedCount: notifications } = await Notification.deleteMany({
    $or: [
      { objectModel: 'Game', object: { $in: deadGameObjs } },
      { objectModel: 'User', object: { $in: deadUserObjs } },
      { recipient: { $in: deadRecipients } },
    ],
  });

  return { messages, notifications };
};

// Invites the recipient already acted on (joined the game some other way)
// and friend requests that are already accepted or have gone stale.
const deleteStaleNotifications = async () => {
  let count = 0;

  const invites = await Notification.find({ type: 'game-invite' }, 'recipient object').lean();
  if (invites.length) {
    const games = await Game.find({ _id: { $in: invites.map((n) => n.object) } }, 'gameMembers').lean();
    const members = new Map(games.map((g) => [g._id.toString(), new Set(g.gameMembers.map(String))]));
    const joined = invites
      .filter((n) => members.get(n.object.toString())?.has(n.recipient.toString()))
      .map((n) => n._id);
    count += (await Notification.deleteMany({ _id: { $in: joined } })).deletedCount;
  }

  const requests = await Notification.find({ type: 'friend-request' }, 'recipient object').lean();
  if (requests.length) {
    const users = await User.find({ _id: { $in: requests.map((n) => n.recipient) } }, 'friends').lean();
    const friends = new Map(users.map((u) => [u._id.toString(), new Set(u.friends.map(String))]));
    const accepted = requests
      .filter((n) => friends.get(n.recipient.toString())?.has(n.object.toString()))
      .map((n) => n._id);
    count += (await Notification.deleteMany({ _id: { $in: accepted } })).deletedCount;
  }

  count += (await Notification.deleteMany({
    type: 'friend-request',
    date: { $lt: new Date(Date.now() - FRIEND_REQUEST_RETENTION_MS) },
  })).deletedCount;

  return count;
};

const clearExpiredResetTokens = async () => {
  const { modifiedCount } = await User.updateMany(
    { resetToken: { $ne: null }, resetTokenExpiry: { $lt: new Date() } },
    { $set: { resetToken: null, resetTokenExpiry: null } }
  );
  return modifiedCount;
};

export const runCleanup = async () => {
  const endedGames = await deleteEndedGames();
  const recurringMessages = await pruneRecurringChats();
  const orphans = await deleteOrphans();
  const staleNotifications = await deleteStaleNotifications();
  const resetTokens = await clearExpiredResetTokens();
  return { endedGames, recurringMessages, orphans, staleNotifications, resetTokens };
};

export const startCleanupJob = () => {
  const run = () =>
    runCleanup()
      .then((r) => {
        const removed = JSON.stringify(r);
        if (/[1-9]/.test(removed)) console.log('Cleanup job:', removed);
      })
      .catch((err) => console.error('Cleanup job error:', err));
  run();
  setInterval(run, CHECK_EVERY_MS);
};
