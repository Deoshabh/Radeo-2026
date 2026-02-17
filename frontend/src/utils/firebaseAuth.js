/**
 * Firebase Authentication Utilities
 * Provides email and phone authentication methods
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  updatePhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import toast from "react-hot-toast";

// ==================== EMAIL AUTHENTICATION ====================

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<Object>} User credential or error
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Update user profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Send email verification
    await sendEmailVerification(userCredential.user);
    toast.success("Registration successful! Please verify your email.");

    return {
      success: true,
      user: userCredential.user,
      token: await userCredential.user.getIdToken(),
      message: "Registration successful! Verification email sent.",
    };
  } catch (error) {
    console.error("Email registration error:", error);

    const errorMessages = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Invalid email address.",
      "auth/operation-not-allowed": "Email/password accounts are not enabled.",
      "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    };

    const message =
      errorMessages[error.code] || "Registration failed. Please try again.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential or error
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      toast.error("Please verify your email before logging in.");
      await signOut(auth);
      return {
        success: false,
        error: "Email not verified",
        needsVerification: true,
      };
    }

    // Don't show success toast here — let the caller show it after backend sync
    return {
      success: true,
      user: userCredential.user,
      token: await userCredential.user.getIdToken(),
    };
  } catch (error) {
    console.error("Email login error:", error);

    const errorMessages = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-credential": "Invalid email or password.",
    };

    const message =
      errorMessages[error.code] || "Login failed. Please try again.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Success or error
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success("Password reset email sent! Check your inbox.");
    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Password reset error:", error);

    const errorMessages = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-not-found": "No account found with this email.",
    };

    const message = errorMessages[error.code] || "Failed to send reset email.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success or error
 */
export const updateUserPassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    await updatePassword(user, newPassword);
    toast.success("Password updated successfully!");
    return { success: true, message: "Password updated" };
  } catch (error) {
    console.error("Update password error:", error);
    
    const errorMessages = {
      "auth/requires-recent-login": "Please log out and log in again to change your password.",
      "auth/weak-password": "Password should be at least 6 characters.",
    };

    const message = errorMessages[error.code] || "Failed to update password.";
    toast.error(message);
    
    return { success: false, error: message, code: error.code };
  }
};

/**
 * Resend email verification
 * @returns {Promise<Object>} Success or error
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    await sendEmailVerification(user);
    toast.success("Verification email sent! Check your inbox.");
    return { success: true, message: "Verification email sent" };
  } catch (error) {
    console.error("Resend verification error:", error);
    toast.error("Failed to send verification email.");
    return { success: false, error: error.message };
  }
};

// ==================== PHONE AUTHENTICATION ====================

/**
 * Set up reCAPTCHA verifier for phone authentication
 * @param {string} containerId - ID of container element for reCAPTCHA
 * @returns {RecaptchaVerifier} reCAPTCHA verifier instance
 */
export const setupRecaptcha = (containerId = "recaptcha-container") => {
  try {
    // Clear any existing reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "normal", // 'invisible' or 'normal'
      callback: (response) => {
        console.log("reCAPTCHA solved");
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired");
        toast.error("reCAPTCHA expired. Please try again.");
      },
    });

    return window.recaptchaVerifier;
  } catch (error) {
    console.error("reCAPTCHA setup error:", error);
    toast.error("Failed to set up reCAPTCHA.");
    return null;
  }
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +91XXXXXXXXXX)
 * @returns {Promise<Object>} Confirmation result or error
 */
export const sendOTP = async (phoneNumber) => {
  try {
    // Validate phone number format
    if (!phoneNumber.startsWith("+")) {
      toast.error(
        "Phone number must include country code (e.g., +91XXXXXXXXXX)",
      );
      return { success: false, error: "Invalid phone number format" };
    }

    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      toast.error("reCAPTCHA not initialized. Please refresh the page.");
      return { success: false, error: "reCAPTCHA not initialized" };
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier,
    );

    toast.success("OTP sent successfully!");
    return {
      success: true,
      confirmationResult,
      message: "OTP sent to your phone",
    };
  } catch (error) {
    console.error("Send OTP error:", error);

    const errorMessages = {
      "auth/invalid-phone-number": "Invalid phone number format.",
      "auth/missing-phone-number": "Phone number is required.",
      "auth/quota-exceeded": "SMS quota exceeded. Try again later.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
    };

    const message =
      errorMessages[error.code] || "Failed to send OTP. Please try again.";
    toast.error(message);

    // Clear and reset reCAPTCHA on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Verify OTP and sign in
 * @param {Object} confirmationResult - Confirmation result from sendOTP
 * @param {string} otp - OTP code received via SMS
 * @returns {Promise<Object>} User credential or error
 */
export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const userCredential = await confirmationResult.confirm(otp);

    // Don't show success toast here — let the caller show it after backend sync
    return {
      success: true,
      user: userCredential.user,
      token: await userCredential.user.getIdToken(),
    };
  } catch (error) {
    console.error("Verify OTP error:", error);

    const errorMessages = {
      "auth/invalid-verification-code":
        "Invalid OTP. Please check and try again.",
      "auth/code-expired": "OTP has expired. Request a new one.",
      "auth/missing-verification-code": "Please enter the OTP.",
    };

    const message = errorMessages[error.code] || "OTP verification failed.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Link phone number to existing account
 * @param {string} phoneNumber - Phone number with country code
 * @param {Object} verificationResult - Result from phone verification
 * @returns {Promise<Object>} Success or error
 */
export const linkPhoneNumber = async (
  phoneNumber,
  verificationId,
  verificationCode,
) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user logged in");
    }

    const credential = PhoneAuthProvider.credential(
      verificationId,
      verificationCode,
    );
    await updatePhoneNumber(user, credential);

    toast.success("Phone number linked successfully!");
    return { success: true, message: "Phone number linked" };
  } catch (error) {
    console.error("Link phone number error:", error);

    const errorMessages = {
      "auth/provider-already-linked":
        "Phone number already linked to this account.",
      "auth/credential-already-in-use":
        "Phone number already in use by another account.",
    };

    const message = errorMessages[error.code] || "Failed to link phone number.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

// ==================== COMMON AUTHENTICATION ====================

/**
 * Sign out current user
 * @returns {Promise<Object>} Success or error
 */
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
    toast.success("Logged out successfully");
    return { success: true, message: "Logged out" };
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Failed to log out.");
    return { success: false, error: error.message };
  }
};

/**
 * Get current user's ID token
 * @returns {Promise<string|null>} Firebase ID token
 */
export const getFirebaseToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error("Get token error:", error);
    return null;
  }
};

/**
 * Get current Firebase user
 * @returns {Object|null} Current user object
 */
export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// ==================== GOOGLE AUTHENTICATION ====================

/**
 * Sign in with Google popup
 * ⚠️  CRITICAL: Clears existing Firebase session to prevent account confusion
 *
 * Issue: When users switch Google accounts, Firebase may reuse cached session
 * Solution: Sign out existing user before initiating new Google sign-in
 *
 * @returns {Promise<Object>} User credential or error
 */
export const loginWithGoogle = async () => {
  try {
    // ✅ CRITICAL FIX #1: Clear existing Firebase session
    // This prevents Firebase from reusing a cached session when switching accounts
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(
        `⚠️  Clearing existing Firebase session for: ${currentUser.email}`,
      );
      await signOut(auth);
    }

    const provider = new GoogleAuthProvider();

    // Optional: Request additional scopes
    provider.addScope("profile");
    provider.addScope("email");

    // ✅ CRITICAL FIX #2: Force account selection + consent flow
    // prompt: "select_account" = Always show account chooser
    // prompt: "consent" = Force re-authentication (even stronger)
    // Using "select_account" is ideal for account switching scenarios
    provider.setCustomParameters({
      prompt: "select_account", // Force account selection dialog
      // Optional: Restrict to specific domain (only if needed)
      // hd: "gmail.com", // Restrict to Gmail accounts only
    });

    // ✅ CRITICAL FIX #3: Use signInWithPopup instead of signInWithRedirect
    // signInWithPopup is more predictable than redirect flow
    const result = await signInWithPopup(auth, provider);

    // Verify the signed-in user
    const signedInUser = result.user;
    console.log(
      `✅ Successfully signed in as: ${signedInUser.email} (UID: ${signedInUser.uid})`,
    );

    // Get credential and token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    // ✅ CRITICAL FIX #4: Verify email is expected (for critical applications)
    // Optional: Log the provider data for debugging
    if (result.additionalUserInfo?.provider === "google.com") {
      console.log("📊 Google Sign-In Details:", {
        email: signedInUser.email,
        displayName: signedInUser.displayName,
        uid: signedInUser.uid,
        isNewUser:
          result.user.metadata.creationTime ===
          result.user.metadata.lastSignInTime,
        provider: result.additionalUserInfo?.provider,
      });
    }

    // Don't show success toast here — let the caller show it after backend sync
    return {
      success: true,
      user: signedInUser,
      token: await signedInUser.getIdToken(),
      googleAccessToken: token,
      isNewUser: result.additionalUserInfo?.isNewUser || false,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);

    const errorMessages = {
      "auth/popup-blocked":
        "Popup was blocked. Please allow popups for this site.",
      "auth/popup-closed-by-user": "Sign-in cancelled.",
      "auth/cancelled-popup-request": "Sign-in cancelled.",
      "auth/account-exists-with-different-credential":
        "An account already exists with this email using a different sign-in method.",
      "auth/auth-domain-config-required":
        "Auth domain configuration is required.",
      "auth/operation-not-allowed": "Google sign-in is not enabled.",
      "auth/unauthorized-domain":
        "This domain is not authorized for Google sign-in.",
    };

    const message =
      errorMessages[error.code] || "Google sign-in failed. Please try again.";
    toast.error(message);

    return { success: false, error: message, code: error.code };
  }
};

/**
 * Sign in with Google redirect (alternative to popup)
 * @returns {Promise<void>}
 */
export const loginWithGoogleRedirect = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");

    await signInWithRedirect(auth, provider);
    // Result will be handled by getGoogleRedirectResult()
  } catch (error) {
    console.error("Google redirect error:", error);
    toast.error("Failed to redirect to Google sign-in.");
  }
};

/**
 * Get result from Google redirect sign-in
 * Call this on page load to check for redirect result
 * @returns {Promise<Object>} User credential or null
 */
export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);

    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      // Don't show success toast here — let the caller show it after backend sync
      return {
        success: true,
        user: result.user,
        token: await result.user.getIdToken(),
        googleAccessToken: token,
      };
    }

    return null;
  } catch (error) {
    console.error("Google redirect result error:", error);

    if (error.code === "auth/account-exists-with-different-credential") {
      toast.error(
        "An account already exists with this email using a different sign-in method.",
      );
    } else {
      toast.error("Google sign-in failed.");
    }

    return { success: false, error: error.message, code: error.code };
  }
};
