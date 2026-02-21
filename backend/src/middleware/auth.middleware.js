import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TokenBlacklist } from '../models/token-blacklist.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized: missing token' });
    }

    const blacklisted = await TokenBlacklist.findOne({ token }).lean();
    if (blacklisted) {
      return res.status(401).json({ message: 'Unauthorized: token revoked' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
