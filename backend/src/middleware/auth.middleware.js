import { TokenBlacklist } from "../models/token-blacklist.model.js";
import { User } from "../models/user.model.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  const isBlacklisted = await TokenBlacklist.findOne({ token }).lean();
  if (isBlacklisted) {
    return res.status(401).json({ message: "Token is no longer valid" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).lean();

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
