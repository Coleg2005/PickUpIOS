import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD && !process.env.SECRET_KEY) {
  console.error('❌ SECRET_KEY must be set in production');
  process.exit(1);
}

export const SECRET = process.env.SECRET_KEY || 'dev-secret-key';

// Verifies the Bearer JWT and sets req.userId to the authenticated user's id.
// Also rejects banned accounts so a ban takes effect on their next request,
// not just their next login.
export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(auth.split(' ')[1], SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(decoded._id, 'isBanned').lean();
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }
    req.userId = decoded._id;
    next();
  } catch {
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};

// Requires requireAuth to have run first; allows only moderators and admins.
export const requireModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId, 'role').lean();
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Moderator access required' });
    }
    req.userRole = user.role;
    next();
  } catch {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};
