import jwt from "jsonwebtoken";

export const signAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");

  return jwt.verify(token, secret);
};
