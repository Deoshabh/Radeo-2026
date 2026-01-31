const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");

// Generate access token
exports.generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",
  });
};

// Generate refresh token
exports.generateRefreshToken = async (user, ipAddress) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Save refresh token to database
  const refreshToken = new RefreshToken({
    token,
    user: user._id,
    expiresAt,
    createdByIp: ipAddress,
  });

  await refreshToken.save();

  return token;
};

// Generate both tokens
exports.generateTokens = async (user, ipAddress) => {
  const accessToken = exports.generateAccessToken(user._id);
  const refreshToken = await exports.generateRefreshToken(user, ipAddress);

  return { accessToken, refreshToken };
};

// Verify refresh token
exports.verifyRefreshToken = async (token, ipAddress) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Find token in database
    const refreshToken = await RefreshToken.findOne({ token }).populate("user");

    if (!refreshToken || !refreshToken.isActive) {
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens
    const newAccessToken = exports.generateAccessToken(refreshToken.user._id);
    const newRefreshToken = await exports.generateRefreshToken(
      refreshToken.user,
      ipAddress
    );

    // Revoke old refresh token
    refreshToken.revokedAt = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken;
    await refreshToken.save();

    return {
      user: refreshToken.user,
      newAccessToken,
      newRefreshToken,
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
