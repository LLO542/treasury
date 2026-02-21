import { TokenBlacklist } from "../models/token-blacklist.model.js";
import { User } from "../models/user.model.js";
import { wait } from "../utils/async-delay.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const LOGIN_DELAY_MS = Number(process.env.LOGIN_DELAY_MS || 1200);

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email }).lean();
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const user = await User.create({ name, email, password, role: role || "user" });

  return res.status(201).json({
    message: "Registration successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  await wait(LOGIN_DELAY_MS);

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signAccessToken({ sub: user._id.toString(), role: user.role });

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const logout = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(400).json({ message: "Token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    await TokenBlacklist.create({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });
  } catch {
    return res.status(400).json({ message: "Invalid token" });
  }

  return res.status(200).json({ message: "Logout successful" });
};
