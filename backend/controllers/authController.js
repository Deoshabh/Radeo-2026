const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =====================
   Helpers
===================== */
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",
  });
};

const generateRefreshToken = async (user, ip) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
  });

  const tokenHash = await bcrypt.hash(token, 10);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ip,
  });

  return token;
};

/* =====================
   Register
===================== */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "customer",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(201)
      .json({
        message: "Registered successfully",
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Login
===================== */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.isBlocked) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Refresh
===================== */
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const storedTokens = await RefreshToken.find({ userId: payload.id });

    let validToken = null;
    for (const t of storedTokens) {
      if (await bcrypt.compare(token, t.tokenHash)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = generateAccessToken(user);

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Get Current User
===================== */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Logout
===================== */
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const tokens = await RefreshToken.find();
      for (const t of tokens) {
        if (await bcrypt.compare(token, t.tokenHash)) {
          await t.deleteOne();
          break;
        }
      }
    }

    res.clearCookie("refreshToken").json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Change Password
===================== */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Forgot Password
===================== */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Log token to console (in production, send via email)
    console.log("=".repeat(50));
    console.log("PASSWORD RESET TOKEN");
    console.log("=".repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(
      `Expires: ${new Date(user.resetPasswordExpires).toLocaleString()}`
    );
    console.log("=".repeat(50));

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Reset Password
===================== */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, token, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (Date.now() > user.resetPasswordExpires) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Verify token
    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password and clear reset token
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};
