const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");

/* =====================
   Helpers
===================== */
const generateAccessToken = (user) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ id: user._id, role: user.role }, accessSecret, {
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

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
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

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

    res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
      })
      .json({ message: "Logged out" });
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

    // In production, send this token via email provider. Never log plaintext tokens.
    if (process.env.NODE_ENV !== "production") {
      console.log(
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

/* =====================
   Firebase Login
===================== */
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseToken, email, phoneNumber, displayName, photoURL, uid } =
      req.body;

    // Detailed logging for debugging
    console.log(`📋 Firebase Login Request Received:`, {
      hasToken: !!firebaseToken,
      tokenLength: firebaseToken ? firebaseToken.length : 0,
      email,
      uid,
      bodyKeys: Object.keys(req.body),
      contentType: req.headers["content-type"],
    });

    if (!firebaseToken) {
      console.warn(`⚠️  MISSING FIREBASE TOKEN:`, {
        requestBodyKeys: Object.keys(req.body || {}),
        contentType: req.headers["content-type"],
        hasAuthorizationHeader: Boolean(req.headers.authorization),
        hasCookieHeader: Boolean(req.headers.cookie),
      });
      return res.status(400).json({
        message: "Firebase token is required",
        error: "MISSING_FIREBASE_TOKEN",
        received: Object.keys(req.body),
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log(`✅ Firebase token verified for UID: ${decodedToken.uid}`);
    } catch (error) {
      console.error("Firebase token verification error:", {
        code: error.code,
        message: error.message,
        tokenLength: firebaseToken.length,
      });
      return res.status(401).json({
        message: "Invalid Firebase token",
        error: "FIREBASE_TOKEN_INVALID",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // ✅ SECURITY FIX: Prioritize Firebase UID for user lookup
    // Firebase UID is the source of truth for OAuth-based logins
    // Email matching is unreliable because:
    // - Multiple Gmail accounts can use the same business domain
    // - Users can change their email
    // - Different OAuth providers may use same email
    //
    // LOOKUP ORDER:
    // 1. firebaseUid (primary, unique identifier from Firebase)
    // 2. email (secondary, for linking existing email-based accounts)
    // 3. phone (tertiary, if available)

    console.log(`🔐 Firebase Login Lookup:`, {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || email,
      phone: decodedToken.phone_number || phoneNumber,
    });

    // IMPORTANT: Look up by Firebase UID FIRST
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    // If not found by UID, check email (for first-time logins or account linking)
    // But only if the email matches EXACTLY (case-insensitive)
    if (!user && decodedToken.email) {
      user = await User.findOne({
        email: { $regex: `^${decodedToken.email}$`, $options: "i" }, // Case-insensitive exact match
      });

      // If found by email, MUST link the Firebase UID to this account
      if (user && !user.firebaseUid) {
        console.log(
          `ℹ️  Linking Firebase UID to existing email account: ${decodedToken.email}`,
        );
        user.firebaseUid = decodedToken.uid;
        await user.save();
      } else if (user) {
        // Email matched but already has different firebaseUid - SECURITY ISSUE
        // This prevents account takeover
        console.warn(
          `⚠️  SECURITY: Email matched but different firebaseUid found. Possible account hijack attempt.`,
          {
            foundUid: user.firebaseUid,
            incomingUid: decodedToken.uid,
            email: decodedToken.email,
          },
        );

        // Reject to prevent account confusion
        return res.status(403).json({
          message:
            "Account security check failed. Please contact support if this is your account.",
          error: "FIREBASE_UID_MISMATCH",
        });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      console.log(`✅ Creating new Firebase user: ${decodedToken.email}`);
      user = await User.create({
        name: displayName || decodedToken.name || "User",
        email: decodedToken.email || email,
        phone: decodedToken.phone_number || phoneNumber,
        firebaseUid: decodedToken.uid, // Always set Firebase UID
        profilePicture: photoURL || decodedToken.picture,
        role: "customer",
        emailVerified: decodedToken.email_verified || false,
        phoneVerified: !!decodedToken.phone_number,
        authProvider: normalizeAuthProvider(decodedToken.firebase.sign_in_provider), // 'phone', 'password', google.com, etc.
      });
    } else {
      // Update existing user with Firebase data
      console.log(`✅ Logging in existing user: ${user.email}`);

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
      // Update authProvider if coming from OAuth
      if (
        decodedToken.firebase.sign_in_provider &&
        decodedToken.firebase.sign_in_provider !== "password"
      ) {
        user.authProvider = decodedToken.firebase.sign_in_provider;
      }
      await user.save();
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    // Set refresh token cookie and return access token
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: process.env.NODE_ENV === "production" ? ".radeo.in" : undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
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
        },
      });
  } catch (err) {
    console.error("Firebase login error:", {
      code: err.code,
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    next(err);
  }
};
