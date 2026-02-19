const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const admin = require("../config/firebase");
const { log } = require("../utils/logger");
const { recordSecurityEvent } = require("../utils/securityEvents");
const { cacheClient } = require("../config/redis");

/* =====================
   Helpers
===================== */
const generateAccessToken = (user) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ id: user._id, role: user.role }, accessSecret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",
  });
};

const setRefreshCookie = (res, token) => {
  return res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  return res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
  });
};

const generateRefreshToken = async (user, ip, family = null) => {
  const tokenId = crypto.randomUUID();
  const tokenFamily = family || crypto.randomUUID();
  const token = jwt.sign(
    { id: user._id, jti: tokenId, fam: tokenFamily },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" },
  );

  const tokenHash = await bcrypt.hash(token, 10);

  await RefreshToken.create({
    tokenId,
    userId: user._id,
    tokenHash,
    family: tokenFamily,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ip,
  });

  const sessionRows = await RefreshToken.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  if (sessionRows.length > MAX_ACTIVE_REFRESH_SESSIONS) {
    const staleIds = sessionRows
      .slice(MAX_ACTIVE_REFRESH_SESSIONS)
      .map((row) => row._id);

    if (staleIds.length > 0) {
      const pruned = await RefreshToken.deleteMany({ _id: { $in: staleIds } });
      log.info("Refresh sessions pruned", {
        userId: String(user._id),
        reason: "max_session_cap",
        maxActiveSessions: MAX_ACTIVE_REFRESH_SESSIONS,
        revokedSessions: pruned.deletedCount || 0,
      });
      await recordSecurityEvent({
        eventType: "refresh_sessions_pruned",
        actorUserId: user._id,
        targetUserId: user._id,
        reason: "max_session_cap",
        ip,
        metadata: {
          maxActiveSessions: MAX_ACTIVE_REFRESH_SESSIONS,
          revokedSessions: pruned.deletedCount || 0,
        },
      });
    }
  }

  return token;
};

const normalizeAuthProvider = (providerId) => {
  if (!providerId) return "local";
  if (providerId === "google.com") return "google";
  if (providerId === "facebook.com") return "facebook";
  if (["local", "phone", "password"].includes(providerId)) return providerId;
  return "local";
};

const isStrongPassword = (password = "") => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

const strongPasswordMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number";

const MAX_ACTIVE_REFRESH_SESSIONS = Math.max(
  1,
  Number(process.env.MAX_ACTIVE_REFRESH_SESSIONS || 5),
);

const findLegacyRefreshTokenRecord = async (userId, token) => {
  const legacyCandidates = await RefreshToken.find({
    userId,
    $or: [{ tokenId: { $exists: false } }, { tokenId: null }],
  })
    .sort({ createdAt: -1 })
    .limit(25);

  for (const candidate of legacyCandidates) {
    if (await bcrypt.compare(token, candidate.tokenHash)) {
      return candidate;
    }
  }

  return null;
};

/* =====================
   Register
===================== */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Enforce password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, and a number",
      });
    }

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

    setRefreshCookie(res, refreshToken)
      .status(201)
      .json({
        message: "Registered successfully",
        accessToken,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
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

    setRefreshCookie(res, refreshToken).json({
      message: "Login successful",
      accessToken,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
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

    let validToken = null;
    let isMatch = false;

    if (payload.jti) {
      validToken = await RefreshToken.findOne({
        userId: payload.id,
        tokenId: payload.jti,
      });

      if (validToken) {
        isMatch = await bcrypt.compare(token, validToken.tokenHash);
      } else if (payload.fam) {
        // Token not found but family exists â€” possible theft (token was already rotated)
        const familyExists = await RefreshToken.findOne({
          userId: payload.id,
          family: payload.fam,
        });
        if (familyExists) {
          // Nuke the entire family â€” attacker or legitimate user, one of them has a stolen token
          const nuked = await RefreshToken.deleteMany({
            userId: payload.id,
            family: payload.fam,
          });
          log.warn("Refresh token theft detected â€” family invalidated", {
            userId: String(payload.id),
            family: payload.fam,
            revokedTokens: nuked.deletedCount || 0,
          });
          await recordSecurityEvent({
            eventType: "refresh_token_theft_detected",
            actorUserId: null,
            targetUserId: payload.id,
            reason: "reuse_of_rotated_token",
            ip: req.ip,
            userAgent: req.headers["user-agent"] || null,
            metadata: {
              family: payload.fam,
              revokedTokens: nuked.deletedCount || 0,
            },
          });
          clearRefreshCookie(res);
          return res.status(401).json({ message: "Session compromised â€” please log in again" });
        }
      }
    } else {
      validToken = await findLegacyRefreshTokenRecord(payload.id, token);
      isMatch = Boolean(validToken);
    }

    if (!validToken || !isMatch) {
      if (validToken) {
        await validToken.deleteOne();
      }
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // Mark old token as replaced (for theft detection audit trail)
    const newTokenId = crypto.randomUUID();
    validToken.replacedByTokenId = newTokenId;
    await validToken.save();

    // Rotate: new token in the SAME family
    const tokenFamily = validToken.family || payload.fam || crypto.randomUUID();
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user, req.ip, tokenFamily);

    // Delete the old token after new one is created
    await validToken.deleteOne();

    setRefreshCookie(res, newRefreshToken).json({
      accessToken: newAccessToken,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
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
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      profilePicture: user.profilePicture || "",
      authProvider: user.authProvider,
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
      const refreshSecret =
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      try {
        const payload = jwt.verify(token, refreshSecret);

        if (payload?.id && payload?.jti) {
          const storedToken = await RefreshToken.findOne({
            userId: payload.id,
            tokenId: payload.jti,
          });

          if (storedToken) {
            const isMatch = await bcrypt.compare(token, storedToken.tokenHash);
            if (isMatch) {
              await storedToken.deleteOne();
            }
          }
        } else if (payload?.id) {
          const legacyToken = await findLegacyRefreshTokenRecord(payload.id, token);
          if (legacyToken) {
            await legacyToken.deleteOne();
          }
        }
      } catch (_jwtErr) {
        log.debug("Logout with expired/invalid refresh token");
      }
    }

    clearRefreshCookie(res).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Logout All Sessions
===================== */
exports.logoutAll = async (req, res, next) => {
  try {
    const revoked = await RefreshToken.deleteMany({ userId: req.user._id });
    const revokedCount = revoked.deletedCount || 0;

    log.info("All refresh sessions revoked", {
      userId: String(req.user._id),
      reason: "logout_all",
      revokedSessions: revokedCount,
    });

    await recordSecurityEvent({
      eventType: "refresh_sessions_revoked",
      actorUserId: req.user._id,
      targetUserId: req.user._id,
      reason: "logout_all",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
      metadata: { revokedSessions: revokedCount },
    });

    clearRefreshCookie(res).json({
      message: "All sessions logged out",
      revokedSessions: revokedCount,
    });
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

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: strongPasswordMessage });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    const revoked = await RefreshToken.deleteMany({ userId: user._id });
    log.info("Refresh sessions revoked", {
      userId: String(user._id),
      reason: "password_change",
      revokedSessions: revoked.deletedCount || 0,
    });
    await recordSecurityEvent({
      eventType: "refresh_sessions_revoked",
      actorUserId: req.user.id,
      targetUserId: user._id,
      reason: "password_change",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        revokedSessions: revoked.deletedCount || 0,
      },
    });

    clearRefreshCookie(res).json({
      message: "Password changed successfully. Please sign in again.",
    });
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
      return res.json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + PASSWORD_RESET_TTL_MS;
    await user.save();

    if (process.env.NODE_ENV !== "production") {
      log.info(
        `Password reset requested for ${email}. Token expires at ${new Date(
          user.resetPasswordExpires,
        ).toISOString()}`,
      );
    }

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

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: strongPasswordMessage });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    if (Date.now() > user.resetPasswordExpires) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(400).json({ message: "Reset token has expired" });
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const revoked = await RefreshToken.deleteMany({ userId: user._id });
    log.info("Refresh sessions revoked", {
      userId: String(user._id),
      reason: "password_reset",
      revokedSessions: revoked.deletedCount || 0,
    });
    await recordSecurityEvent({
      eventType: "refresh_sessions_revoked",
      actorUserId: null,
      targetUserId: user._id,
      reason: "password_reset",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        revokedSessions: revoked.deletedCount || 0,
      },
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Firebase Login
===================== */
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseToken, email, phoneNumber, displayName, photoURL } = req.body;

    log.debug("Firebase login request received", {
      hasToken: Boolean(firebaseToken),
      hasEmail: Boolean(email),
    });

    if (!firebaseToken) {
      log.warn("Firebase token missing in login request");
      return res.status(400).json({
        message: "Firebase token is required",
        error: "MISSING_FIREBASE_TOKEN",
      });
    }

    let decodedToken;
    try {
      // Cache Firebase token verification in Valkey (5 min TTL)
      // Reduces Firebase API calls by ~90% for repeat requests
      const tokenHash = crypto.createHash('sha256').update(firebaseToken).digest('hex');
      const cacheKey = `firebase:token:${tokenHash}`;

      try {
        const cached = await cacheClient.get(cacheKey);
        if (cached) {
          decodedToken = JSON.parse(cached);
          log.debug("Firebase token cache HIT", { uid: decodedToken.uid });
        }
      } catch {
        // Cache miss or error â€” proceed to verify
      }

      if (!decodedToken) {
        decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        log.debug("Firebase token verified via API", { uid: decodedToken.uid });
        // Cache the decoded token for 5 minutes
        try {
          await cacheClient.set(cacheKey, JSON.stringify(decodedToken), 'EX', 300);
        } catch {
          // Non-critical â€” continue without caching
        }
      }
    } catch (error) {
      log.error("Firebase token verification failed", error);
      return res.status(401).json({
        message: "Invalid Firebase token",
        error: "FIREBASE_TOKEN_INVALID",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    log.debug("Firebase Login Lookup", {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || email,
    });

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user && decodedToken.email) {
      user = await User.findOne({
        email: decodedToken.email.toLowerCase(),
      });

      if (user && !user.firebaseUid) {
        log.info("Linking Firebase UID to existing email account");
        user.firebaseUid = decodedToken.uid;
        await user.save();
      } else if (user) {
        log.warn("SECURITY: Email matched but different firebaseUid found", {
          email: decodedToken.email,
        });

        return res.status(403).json({
          message:
            "Account security check failed. Please contact support if this is your account.",
          error: "FIREBASE_UID_MISMATCH",
        });
      }
    }

    if (!user) {
      log.debug("Creating new Firebase user");
      user = await User.create({
        name: displayName || decodedToken.name || "User",
        email: decodedToken.email || email,
        phone: decodedToken.phone_number || phoneNumber,
        firebaseUid: decodedToken.uid,
        profilePicture: photoURL || decodedToken.picture,
        role: "customer",
        emailVerified: decodedToken.email_verified || false,
        phoneVerified: !!decodedToken.phone_number,
        authProvider: normalizeAuthProvider(
          decodedToken.firebase.sign_in_provider,
        ),
      });
    } else {
      log.debug("Logging in existing user");

      if (!user.firebaseUid) {
        user.firebaseUid = decodedToken.uid;
      }
      if (!user.profilePicture && (photoURL || decodedToken.picture)) {
        user.profilePicture = photoURL || decodedToken.picture;
      }
      if (decodedToken.email_verified) {
        user.emailVerified = true;
      }
      if (decodedToken.phone_number) {
        user.phoneVerified = true;
        if (!user.phone) {
          user.phone = decodedToken.phone_number;
        }
      }

      if (
        decodedToken.firebase.sign_in_provider &&
        decodedToken.firebase.sign_in_provider !== "password"
      ) {
        user.authProvider = normalizeAuthProvider(
          decodedToken.firebase.sign_in_provider,
        );
      }
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    setRefreshCookie(res, refreshToken).json({
      message: "Firebase authentication successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    log.error("Firebase login error", {
      code: err.code,
      message: err.message,
      name: err.name,
    });
    next(err);
  }
};
