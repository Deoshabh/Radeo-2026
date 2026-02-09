const {
  RecaptchaEnterpriseServiceClient,
} = require("@google-cloud/recaptcha-enterprise");

/**
 * Google reCAPTCHA Enterprise Middleware
 * Verifies reCAPTCHA tokens to protect against bots
 * Based on Google's official implementation pattern
 */

// Cache the reCAPTCHA client (recommended by Google)
let recaptchaClient = null;

/**
 * Initialize reCAPTCHA client with credentials
 * Client is cached for reuse across requests (recommended by Google)
 */
function initializeRecaptchaClient() {
  if (recaptchaClient) {
    return recaptchaClient;
  }

  try {
    // Check if credentials are configured
    if (
      !process.env.GOOGLE_CLOUD_PROJECT_ID ||
      !process.env.RECAPTCHA_SITE_KEY
    ) {
      console.warn(
        "⚠️  reCAPTCHA credentials not configured. Verification will be skipped.",
      );
      return null;
    }

    // Create the reCAPTCHA client
    // Client generation is cached (recommended) to avoid repeated initialization
    recaptchaClient = new RecaptchaEnterpriseServiceClient({
      keyFilename:
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        "./google-credentials.json",
    });

    console.log("✅ reCAPTCHA Enterprise client initialized");
    return recaptchaClient;
  } catch (error) {
    console.error("❌ Failed to initialize reCAPTCHA client:", error.message);
    return null;
  }
}

/**
 * Verify reCAPTCHA token with Google
 * @param {string} token - The reCAPTCHA token from frontend
 * @param {string} expectedAction - Expected action name (e.g., 'LOGIN', 'REGISTER')
 * @param {number} minScore - Minimum score threshold (0.0 to 1.0)
 * @returns {Promise<Object>} Verification result
 */
async function verifyRecaptchaToken(token, expectedAction, minScore = 0.5) {
  const client = initializeRecaptchaClient();

  // If client is not initialized (credentials not configured), skip verification
  if (!client) {
    console.warn("⚠️  reCAPTCHA verification skipped - client not initialized");
    return {
      success: true,
      skipped: true,
      reason: "reCAPTCHA not configured",
    };
  }

  if (!token) {
    return {
      success: false,
      error: "No reCAPTCHA token provided",
    };
  }

  try {
    const projectPath = client.projectPath(process.env.GOOGLE_CLOUD_PROJECT_ID);

    // Build the assessment request (following Google's official pattern)
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey:
            process.env.RECAPTCHA_SITE_KEY ||
            "6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl",
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    // Check if the token is valid
    if (!response.tokenProperties.valid) {
      console.log(
        `The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`,
      );
      return {
        success: false,
        error: "Invalid reCAPTCHA token",
        reason: response.tokenProperties.invalidReason,
      };
    }

    // Check if the expected action was executed
    // The `action` property is set by user client in the grecaptcha.enterprise.execute() method
    if (response.tokenProperties.action !== expectedAction) {
      console.log(
        "The action attribute in your reCAPTCHA tag does not match the action you are expecting to score",
      );
      return {
        success: false,
        error: "Action mismatch",
        expected: expectedAction,
        received: response.tokenProperties.action,
      };
    }

    // Get the risk score and the reason(s)
    // For more information on interpreting the assessment, see:
    // https://cloud.google.com/recaptcha/docs/interpret-assessment
    const score = response.riskAnalysis.score;
    console.log(`The reCAPTCHA score is: ${score}`);
    response.riskAnalysis.reasons.forEach((reason) => {
      console.log(`  - ${reason}`);
    });

    // Check the score against minimum threshold
    if (score < minScore) {
      return {
        success: false,
        error: "Score too low",
        score: score,
        minScore: minScore,
      };
    }

    return {
      success: true,
      score: score,
      action: response.tokenProperties.action,
      reasons: response.riskAnalysis.reasons,
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "Verification failed",
      message: error.message,
    };
  }
}

/**
 * Create an assessment to analyse the risk of a UI action
 * (Google's official pattern - can be used for direct API calls)
 *
 * @param {Object} params - Assessment parameters
 * @param {string} params.projectID - Your Google Cloud project ID
 * @param {string} params.recaptchaKey - The reCAPTCHA key associated with the site/app
 * @param {string} params.token - The generated token obtained from the client
 * @param {string} params.recaptchaAction - Action name corresponding to the token
 * @returns {Promise<number|null>} The reCAPTCHA score (0.0 to 1.0) or null if failed
 */
async function createAssessment({
  projectID = process.env.GOOGLE_CLOUD_PROJECT_ID || "radeo-2026",
  recaptchaKey = process.env.RECAPTCHA_SITE_KEY ||
    "6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl",
  token = "",
  recaptchaAction = "",
}) {
  const client = initializeRecaptchaClient();

  if (!client) {
    console.warn("⚠️  reCAPTCHA client not initialized");
    return null;
  }

  const projectPath = client.projectPath(projectID);

  // Build the assessment request
  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  };

  const [response] = await client.createAssessment(request);

  // Check if the token is valid
  if (!response.tokenProperties.valid) {
    console.log(
      `The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`,
    );
    return null;
  }

  // Check if the expected action was executed
  // The `action` property is set by user client in the grecaptcha.enterprise.execute() method
  if (response.tokenProperties.action === recaptchaAction) {
    // Get the risk score and the reason(s)
    // For more information on interpreting the assessment, see:
    // https://cloud.google.com/recaptcha/docs/interpret-assessment
    console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
    response.riskAnalysis.reasons.forEach((reason) => {
      console.log(reason);
    });

    return response.riskAnalysis.score;
  } else {
    console.log(
      "The action attribute in your reCAPTCHA tag does not match the action you are expecting to score",
    );
    return null;
  }
}

/**
 * Express middleware to verify reCAPTCHA token
 * @param {string} expectedAction - Expected action name
 * @param {number} minScore - Minimum score threshold (default: 0.5)
 * @param {boolean} optional - If true, continue even if verification fails (default: false)
 */
const verifyRecaptcha = (expectedAction, minScore = 0.5, optional = false) => {
  return async (req, res, next) => {
    try {
      const token = req.body.recaptchaToken;

      // If reCAPTCHA is optional and no token provided, continue
      if (optional && !token) {
        console.log(
          "ℹ️  Optional reCAPTCHA verification - no token provided, continuing",
        );
        return next();
      }

      const result = await verifyRecaptchaToken(
        token,
        expectedAction,
        minScore,
      );

      // If verification was skipped (not configured), allow request to continue
      if (result.skipped) {
        console.log(
          `ℹ️  reCAPTCHA verification skipped for action: ${expectedAction}`,
        );
        return next();
      }

      if (!result.success) {
        console.log(`❌ reCAPTCHA verification failed:`, result);
        return res.status(400).json({
          message: "reCAPTCHA verification failed",
          error: result.error,
          details: process.env.NODE_ENV === "development" ? result : undefined,
        });
      }

      // Add reCAPTCHA result to request object for logging/analytics
      req.recaptchaResult = result;

      console.log(
        `✅ reCAPTCHA verified for action: ${expectedAction}, score: ${result.score}`,
      );
      next();
    } catch (error) {
      console.error("reCAPTCHA middleware error:", error);

      // In production, fail closed (reject request)
      // In development, fail open (allow request) for easier testing
      if (process.env.NODE_ENV === "production" && !optional) {
        return res.status(500).json({
          message: "reCAPTCHA verification error",
          error: "Internal server error",
        });
      }

      console.warn(
        "⚠️  reCAPTCHA error in development mode - allowing request to continue",
      );
      next();
    }
  };
};

module.exports = {
  verifyRecaptcha,
  verifyRecaptchaToken,
  createAssessment,
  initializeRecaptchaClient,
};
