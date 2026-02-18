/**
 * Cloudflare Turnstile Utilities
 * Drop-in replacement for Google reCAPTCHA Enterprise
 * - Free, GDPR-friendly, invisible to most users
 * - No score-based system — pass/fail challenge
 */

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * Execute Turnstile challenge for a specific action
 * @param {string} action - The action name (e.g., 'login', 'register')
 * @returns {Promise<string|null>} The Turnstile token
 */
export const executeTurnstile = async (action) => {
  try {
    if (typeof window === 'undefined') return null;

    if (!window.turnstile) {
      await waitForTurnstile(5000);
      if (!window.turnstile) {
        throw new Error('Turnstile failed to load');
      }
    }

    return new Promise((resolve, reject) => {
      // Use invisible mode — renders silently, challenges only suspicious users
      const widgetId = window.turnstile.render('#turnstile-container', {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        callback: (token) => {
          resolve(token);
          // Clean up widget after getting token
          try { window.turnstile.remove(widgetId); } catch {}
        },
        'error-callback': (err) => {
          reject(new Error(`Turnstile error: ${err}`));
          try { window.turnstile.remove(widgetId); } catch {}
        },
        'expired-callback': () => {
          reject(new Error('Turnstile token expired'));
          try { window.turnstile.remove(widgetId); } catch {}
        },
        size: 'invisible',
      });
    });
  } catch (error) {
    console.error('Turnstile error:', error);
    throw error;
  }
};

/**
 * Wait for Turnstile script to load
 * @param {number} timeout - Maximum wait time in ms
 */
const waitForTurnstile = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.turnstile) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Turnstile load timeout'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

/**
 * React hook for Turnstile (drop-in replacement for useRecaptcha)
 * @returns {{ getToken: (action: string) => Promise<string|null> }}
 */
export const useTurnstile = () => {
  const getToken = async (action) => {
    try {
      return await executeTurnstile(action);
    } catch (error) {
      console.error('Failed to get Turnstile token:', error);
      return null;
    }
  };

  return { getToken };
};

/**
 * Turnstile action constants (same as existing reCAPTCHA actions for migration)
 */
export const TURNSTILE_ACTIONS = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  CHECKOUT: 'checkout',
  ADD_TO_CART: 'add_to_cart',
  CONTACT_FORM: 'contact_form',
  REVIEW_SUBMIT: 'review_submit',
};

// Re-export with reCAPTCHA-compatible names for easy migration
export const executeRecaptcha = executeTurnstile;
export const useRecaptcha = useTurnstile;
export const RECAPTCHA_ACTIONS = TURNSTILE_ACTIONS;
