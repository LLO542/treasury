import { env } from '../config/env.js';
import { TokenBlacklist } from '../models/token-blacklist.model.js';
import { User } from '../models/user.model.js';
import { signAccessToken, decodeToken } from '../services/token.service.js';
import { delay } from '../utils/delay.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.create({ name, email, password, role: role || 'user' });

    return res.status(201).json({
      message: 'User registered',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await delay(env.loginArtificialDelayMs);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const decoded = decodeToken(token);
    if (!decoded?.exp) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const expiresAt = new Date(decoded.exp * 1000);
    await TokenBlacklist.updateOne(
      { token },
      { $set: { token, expiresAt } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};
