/**
 * Google reCAPTCHA Enterprise Utilities
 * Provides functions to execute reCAPTCHA and get tokens for protected actions
 */

const RECAPTCHA_SITE_KEY = "6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl";

/**
 * Execute reCAPTCHA Enterprise for a specific action
 * @param {string} action - The action name (e.g., 'LOGIN', 'REGISTER', 'CHECKOUT')
 * @returns {Promise<string>} The reCAPTCHA token
 */
export const executeRecaptcha = async (action) => {
  try {
    // Wait for grecaptcha to be available
    if (typeof window === "undefined") {
      console.warn("reCAPTCHA: Window object not available (SSR)");
      return null;
    }

    // Check if grecaptcha is loaded
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      console.warn("reCAPTCHA: grecaptcha.enterprise is not loaded yet");

      // Wait for grecaptcha to load (with timeout)
      await waitForRecaptcha(5000);

      if (!window.grecaptcha || !window.grecaptcha.enterprise) {
        throw new Error("reCAPTCHA failed to load");
      }
    }

    // Wait for grecaptcha to be ready and execute
    return new Promise((resolve, reject) => {
      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(
            RECAPTCHA_SITE_KEY,
            { action },
          );
          resolve(token);
        } catch (error) {
          console.error("reCAPTCHA execution error:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("reCAPTCHA error:", error);
    throw error;
  }
};

/**
 * Wait for grecaptcha to be available
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<void>}
 */
const waitForRecaptcha = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error("reCAPTCHA load timeout"));
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };

    checkRecaptcha();
  });
};

/**
 * React hook for reCAPTCHA
 * @returns {Object} Object with executeRecaptcha function
 */
export const useRecaptcha = () => {
  const getToken = async (action) => {
    try {
      return await executeRecaptcha(action);
    } catch (error) {
      console.error("Failed to get reCAPTCHA token:", error);
      // Return null on error - backend should handle this gracefully
      return null;
    }
  };

  return { getToken };
};

/**
 * reCAPTCHA action constants
 */
export const RECAPTCHA_ACTIONS = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  CHECKOUT: "CHECKOUT",
  ADD_TO_CART: "ADD_TO_CART",
  CONTACT_FORM: "CONTACT_FORM",
  REVIEW_SUBMIT: "REVIEW_SUBMIT",
};
