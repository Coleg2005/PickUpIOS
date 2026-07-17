import express from 'express';
import User from '../models/User.js';
import Game from '../models/Game.js'
import Notification from '../models/Notification.js';
import { sendPushNotifications } from '../utils/push.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

const FSQ_KEY = process.env.FSQ_KEY;

// Every game route requires a logged-in user (also keeps the FSQ proxy from anonymous abuse)
router.use(requireAuth);

router.get('/places/search', async (req, res) => {
  try {
    const { query, ll, radius, limit = 50 } = req.query;

    if (!FSQ_KEY) {
      return res.status(500).json({ error: 'FSQ_KEY is not configured on the backend' });
    }

    if (!query || !ll || !radius) {
      return res.status(400).json({ error: 'query, ll, and radius are required' });
    }

    const url = new URL('https://places-api.foursquare.com/places/search');
    url.searchParams.set('query', String(query));
    url.searchParams.set('ll', String(ll));
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FSQ_KEY}`,
        'X-Places-Api-Version': '2025-06-17',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('FSQ places search failed:', response.status, data);
      return res.status(response.status).json({ error: 'Failed to fetch places' });
    }

    return res.json({ results: data.results || [] });
  } catch (error) {
    console.error('Places search error:', error);
    return res.status(500).json({ error: 'Failed to fetch places' });
  }
});

router.get('/places/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!FSQ_KEY) {
      return res.status(500).json({ error: 'FSQ_KEY is not configured on the backend' });
    }

    if (!placeId) {
      return res.status(400).json({ error: 'placeId is required' });
    }

    const response = await fetch(`https://places-api.foursquare.com/places/${placeId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FSQ_KEY}`,
        'X-Places-Api-Version': '2025-06-17',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('FSQ place details failed:', response.status, data);
      return res.status(response.status).json({ error: 'Failed to fetch place details' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Place details error:', error);
    return res.status(500).json({ error: 'Failed to fetch place details' });
  }
});


const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 500;

// Create game works
router.post('', async (req, res) => {

  try {
    let { name, date, location, fsq_id, sport, leader, description, maxPlayers, recurrence } = req.body;
    if (!name || !date || !location || !fsq_id || !sport || !leader ) {
      return res.status(400).json({ error: 'name, date, location, sport, and leader are required' });
    }
    name = String(name).trim();
    if (!name || name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Game name must be 1-${MAX_NAME_LENGTH} characters` });
    }
    if (description && String(description).length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters` });
    }
    if (recurrence && !['none', 'daily', 'every-other-day', 'weekly'].includes(recurrence)) {
      return res.status(400).json({ error: 'Invalid recurrence' });
    }
    const leadUser = await User.findOne({username: leader});
    if (!leadUser) {
      return res.status(404).json({ error: 'Leader not found' });
    }
    if (leadUser._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only create games as yourself' });
    }
    const game = new Game({ name, gameMembers: [leadUser], date, location, fsq_id, sport, leader: leadUser._id, description, maxPlayers: maxPlayers || null, recurrence: recurrence || 'none' });
    await game.save();

    res.status(201).json({ message: 'Game created successfully' });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// All distinct fsq_ids that currently have games
router.get('/active-locations', async (req, res) => {
  try {
    const fsq_ids = await Game.distinct('fsq_id');
    res.json(fsq_ids);
  } catch (error) {
    console.error('Active locations error:', error);
    res.status(500).json({ error: 'Error fetching active locations' });
  }
});

// Bulk fetch games for multiple locations in one query
router.post('/by-locations', async (req, res) => {
  try {
    const { fsq_ids } = req.body;
    if (!fsq_ids || !Array.isArray(fsq_ids) || fsq_ids.length === 0) {
      return res.status(400).json({ error: 'fsq_ids array is required' });
    }
    const games = await Game.find({ fsq_id: { $in: fsq_ids } }).populate('gameMembers', '_id');
    // Group by fsq_id
    const grouped = {};
    for (const game of games) {
      if (!grouped[game.fsq_id]) grouped[game.fsq_id] = [];
      grouped[game.fsq_id].push(game);
    }
    res.json(grouped);
  } catch (error) {
    console.error('Games by locations error:', error);
    res.status(500).json({ error: 'Error fetching games by locations' });
  }
});

router.get('/location/:locationID', async (req, res) => {
  try {
    const { locationID } = req.params;
    if (!locationID) {
      return res.status(400).json({ error: 'locationID is required' });
    }
    const games = await Game.find({ fsq_id: locationID }).populate('gameMembers', '_id username profile').populate('leader', '_id username profile');
    res.json(games);
  } catch {
    res.status(500).json({ error: 'Error getting game' });
  }
});

// use user id as arg not username
router.get('/user/lead/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!userid) {
      return res.status(400).json({ error: 'user id is required' });
    }

    const games = await Game.find({ leader: userid }).populate('gameMembers', '_id');
    res.json(games);
  } catch {
    res.status(500).json({ error: 'Error getting lead game' });
  }
});

// use user id as arg not username
router.get('/user/member/:userid', async (req, res) => {
  try {
    const { userid } = req.params;
    if (!userid) {
      return res.status(400).json({ error: 'userid is required' });
    }

    const games = await Game.find({ gameMembers: userid, leader: { $ne: userid } }).populate('gameMembers', '_id');
    res.json(games);
  } catch {
    res.status(500).json({ error: 'Error getting member game' });
  }
});

// get games using game id
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    const game = await Game.findById(id).populate('gameMembers', '_id username profile').populate('leader', '_id username profile');
    if (!game) {
      return res.status(400).json({ error: 'game not found'});
    }

    res.status(200).json(game);

  } catch {
    res.status(500).json({ error: 'Error getting game using id' });
  }
});

// delete game works
router.delete('/:gameid', async (req, res) => {
  try {
    const { gameid } = req.params;
    if (!gameid) {
      return res.status(400).json({ error: 'gameid is required' });
    }
    const game = await Game.findOne({ _id: gameid });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.leader.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the game leader can delete the game' });
    }
    await game.deleteOne();
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Error deleting game' });
  }
});

// remove member works
router.patch('/removeMember', async (req, res) => {
  try {
    const { gameid, gameMember } = req.body;
    if (!gameid || !gameMember) {
      return res.status(400).json({ error: 'gameid, and gameMember are required', gameMember});
    }
    const game = await Game.findOne({ _id: gameid });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Only the member themselves (leaving) or the game leader (kicking) may remove a member
    const isSelf = gameMember === req.userId;
    const isLeader = game.leader.toString() === req.userId;
    if (!isSelf && !isLeader) {
      return res.status(403).json({ error: 'Not authorized to remove this member' });
    }

    const member = await User.findOne({_id: gameMember});
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Remove member if present
    const initialLength = game.gameMembers.length;
    game.gameMembers = game.gameMembers.filter((existingMember) => existingMember._id.toString() !== member._id.toString());
    if (game.gameMembers.length === initialLength) {
      return res.status(404).json({ error: 'User not in game' });
    }

    await game.save();
    res.json({ message: 'Game member removed successfully' });
  } catch (error) {
    console.error('Remove game member error:', error);
    res.status(500).json({ error: 'Error removing game member' });
  }
});

// Invite a friend to a game — creates a game-invite notification in their inbox
router.post('/invite', async (req, res) => {
  try {
    const { gameid, friendid } = req.body;
    if (!gameid || !friendid) {
      return res.status(400).json({ error: 'gameid and friendid are required' });
    }

    const game = await Game.findById(gameid);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const isMember = game.gameMembers.some((m) => (m._id || m).toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Only game members can invite friends' });
    }

    const sender = await User.findById(req.userId);
    const friend = await User.findById(friendid);
    if (!sender || !friend) return res.status(404).json({ error: 'User not found' });

    // Only friends can be invited
    const isFriend = (sender.friends || []).some((f) => (f._id || f).toString() === friend._id.toString());
    if (!isFriend) {
      return res.status(403).json({ error: 'You can only invite your friends' });
    }

    if ((friend.blockedUsers || []).some((b) => b.toString() === req.userId)) {
      return res.status(403).json({ error: 'Unable to invite this user' });
    }

    if (game.gameMembers.some((m) => (m._id || m).toString() === friend._id.toString())) {
      return res.status(400).json({ error: 'Already in this game' });
    }

    if (game.maxPlayers && game.gameMembers.length >= game.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // One pending invite per person per game, regardless of who sent it
    const existing = await Notification.findOne({ recipient: friend._id, type: 'game-invite', object: game._id });
    if (existing) {
      return res.status(400).json({ error: 'Already invited to this game' });
    }

    const notif = new Notification({
      recipient: friend._id,
      date: new Date(),
      type: 'game-invite',
      object: game._id,
      objectModel: 'Game',
      sender: sender._id,
    });
    await notif.save();
    sendPushNotifications(friend.pushTokens, 'Game Invite', `${sender.username} invited you to ${game.name}`, { type: 'game-invite', gameId: game._id.toString() });

    res.json({ message: 'Invite sent' });
  } catch (error) {
    console.error('Game invite error:', error);
    res.status(500).json({ error: 'Error sending game invite' });
  }
});

// add game member works
router.patch('/member', async (req, res) => {
  try {
    const { gameid, gameMember } = req.body;
    if (!gameid || !gameMember) {
      return res.status(400).json({ error: 'gameid, and gameMember are required', gameMember});
    }
    // Users can only join games as themselves
    if (gameMember !== req.userId) {
      return res.status(403).json({ error: 'You can only join a game as yourself' });
    }
    const game = await Game.findOne({ _id: gameid });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const member = await User.findOne({_id: gameMember});
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (game.gameMembers.some((existingMember) => existingMember._id.toString() === member._id.toString())) {
      return res.status(400).json({ error: 'User already in game' });
    }

    game.gameMembers.push(member._id);
    await game.save();
    res.json({ message: 'Game member added successfully' });
  } catch (error) {
    console.error('Add game member error:', error);
    res.status(500).json({ error: 'Error adding game member' });
  }
});

export default router;