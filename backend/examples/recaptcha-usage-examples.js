/**
 * Example usage of reCAPTCHA Enterprise API
 * This demonstrates how to use the createAssessment function directly
 * Following Google's official implementation pattern
 */

const { createAssessment } = require("./middleware/recaptcha");

/**
 * Example 1: Basic usage with all parameters
 */
async function exampleBasicUsage() {
  const score = await createAssessment({
    projectID: "radeo-2026",
    recaptchaKey: "6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl",
    token: "token-received-from-client",
    recaptchaAction: "LOGIN",
  });

  if (score !== null) {
    console.log(`Assessment successful! Score: ${score}`);

    // Decision logic based on score
    if (score >= 0.7) {
      console.log("✅ High confidence - allow action");
    } else if (score >= 0.5) {
      console.log("⚠️  Medium confidence - proceed with caution");
    } else {
      console.log("❌ Low confidence - block or challenge user");
    }
  } else {
    console.log("❌ Assessment failed");
  }
}

/**
 * Example 2: Using environment variables (recommended)
 */
async function exampleWithEnvVars(token, action) {
  // Uses GOOGLE_CLOUD_PROJECT_ID and RECAPTCHA_SITE_KEY from .env
  const score = await createAssessment({
    token: token,
    recaptchaAction: action,
  });

  return score;
}

/**
 * Example 3: Integration in an Express route
 */
async function exampleExpressRoute(req, res) {
  const { recaptchaToken } = req.body;

  const score = await createAssessment({
    token: recaptchaToken,
    recaptchaAction: "CHECKOUT",
  });

  if (score === null) {
    return res.status(400).json({
      success: false,
      message: "reCAPTCHA verification failed",
    });
  }

  if (score < 0.5) {
    return res.status(403).json({
      success: false,
      message: "Security check failed",
      score: score,
    });
  }

  // Proceed with the actual business logic
  return res.json({
    success: true,
    message: "Verification passed",
    score: score,
  });
}

/**
 * Example 4: Different actions with different thresholds
 */
async function exampleActionBasedThresholds(token, action) {
  const score = await createAssessment({
    token: token,
    recaptchaAction: action,
  });

  if (score === null) {
    return { allowed: false, reason: "Verification failed" };
  }

  // Define thresholds per action
  const thresholds = {
    LOGIN: 0.5, // Balanced
    REGISTER: 0.6, // Stricter for new accounts
    CHECKOUT: 0.7, // Very strict for payments
    ADD_TO_CART: 0.3, // Lenient for browsing
    CONTACT_FORM: 0.5, // Balanced
  };

  const threshold = thresholds[action] || 0.5;

  if (score >= threshold) {
    return {
      allowed: true,
      score: score,
      threshold: threshold,
    };
  } else {
    return {
      allowed: false,
      reason: "Score below threshold",
      score: score,
      threshold: threshold,
    };
  }
}

/**
 * Example 5: Async/await with try-catch
 */
async function exampleWithErrorHandling(token, action) {
  try {
    const score = await createAssessment({
      token: token,
      recaptchaAction: action,
    });

    if (score === null) {
      throw new Error("Assessment returned null");
    }

    return {
      success: true,
      score: score,
    };
  } catch (error) {
    console.error("reCAPTCHA assessment error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export examples for testing
module.exports = {
  exampleBasicUsage,
  exampleWithEnvVars,
  exampleExpressRoute,
  exampleActionBasedThresholds,
  exampleWithErrorHandling,
};

/**
 * USAGE IN YOUR CODE:
 *
 * Option 1: Use createAssessment directly (Google's pattern)
 * const { createAssessment } = require('./middleware/recaptcha');
 * const score = await createAssessment({ token, recaptchaAction: 'LOGIN' });
 *
 * Option 2: Use verifyRecaptcha middleware (our wrapper)
 * const { verifyRecaptcha } = require('./middleware/recaptcha');
 * router.post('/login', verifyRecaptcha('LOGIN', 0.5), loginController);
 *
 * Option 3: Use verifyRecaptchaToken for custom logic
 * const { verifyRecaptchaToken } = require('./middleware/recaptcha');
 * const result = await verifyRecaptchaToken(token, 'LOGIN', 0.5);
 * if (result.success) { ... }
 */
