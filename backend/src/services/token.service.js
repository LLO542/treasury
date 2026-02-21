import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = ({ userId, email, role }) =>
  jwt.sign({ sub: userId, email, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const decodeToken = (token) => jwt.decode(token);
