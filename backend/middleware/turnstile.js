/**
 * Cloudflare Turnstile Verification Middleware
 * Replaces Google reCAPTCHA Enterprise with Cloudflare Turnstile
 * - Free, GDPR-friendly, invisible to most users
 * - Uses https://challenges.cloudflare.com/turnstile/v0/siteverify
 */

const { log } = require('../utils/logger');

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile token against Cloudflare's API
 * @param {string} token - The Turnstile token from the frontend widget
 * @param {string} remoteIp - The client's IP address
 * @returns {Promise<Object>} Verification result
 */
async function verifyTurnstileToken(token, remoteIp) {
  if (!TURNSTILE_SECRET_KEY) {
    log.warn('Turnstile secret key not configured — verification skipped');
    return { success: true, skipped: true, reason: 'Turnstile not configured' };
  }

  if (!token) {
    return { success: false, error: 'No Turnstile token provided' };
  }

  try {
    const body = new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!data.success) {
      log.warn('Turnstile verification failed', {
        errorCodes: data['error-codes'],
      });
      return {
        success: false,
        error: 'Turnstile verification failed',
        errorCodes: data['error-codes'] || [],
      };
    }

    return {
      success: true,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      action: data.action,
      cdata: data.cdata,
    };
  } catch (error) {
    log.error('Turnstile API call failed', error);
    return {
      success: false,
      error: 'Verification request failed',
      message: error.message,
    };
  }
}

/**
 * Express middleware to verify Turnstile token
 * Drop-in replacement for verifyRecaptcha middleware
 *
 * @param {string} expectedAction - Expected action name (for logging, Turnstile validates action server-side)
 * @param {Object} options
 * @param {boolean} options.optional - If true, continue even if verification fails (default: false)
 */
const verifyTurnstile = (expectedAction, { optional = false } = {}) => {
  return async (req, res, next) => {
    try {
      // Accept token from body (turnstileToken) or fall back to recaptchaToken for migration
      const token = req.body.turnstileToken || req.body.recaptchaToken;

      if (optional && !token) {
        return next();
      }

      const result = await verifyTurnstileToken(token, req.ip);

      if (result.skipped) {
        return next();
      }

      if (!result.success) {
        if (optional) {
          req.turnstileResult = { ...result, optionalBypass: true };
          return next();
        }

        return res.status(400).json({
          message: 'Challenge verification failed',
          error: result.error,
          ...(process.env.NODE_ENV === 'development' && { details: result }),
        });
      }

      req.turnstileResult = result;
      next();
    } catch (error) {
      log.error(`Turnstile middleware error for action ${expectedAction}`, error);

      if (optional) {
        req.turnstileResult = { success: false, error: error.message, optionalBypass: true };
        return next();
      }

      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          message: 'Challenge verification error',
          error: 'Internal server error',
        });
      }

      next();
    }
  };
};

module.exports = {
  verifyTurnstile,
  verifyTurnstileToken,
};
