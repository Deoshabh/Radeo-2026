/**
 * Currency Utility
 * Centralizes all monetary calculations to avoid floating point errors.
 * 
 * Rules:
 * - All internal calculations should ideally be done in integer (paise) if complex.
 * - For simple display/storage, we trust the standard rounding but enforce it here.
 */

const CurrencyUtils = {
    /**
     * Convert INR to Paise (safe integer)
     * Used for Razorpay and other payment gateways requiring smallest currency unit.
     * @param {number} amountInRupees 
     * @returns {number} amountInPaise
     */
    toPaise: (amountInRupees) => {
        if (!amountInRupees) return 0;
        // Round to 2 decimal places first to avoid 19.999999 issues, then multiply
        return Math.round(Number(amountInRupees) * 100);
    },

    /**
     * Convert Paise to INR
     * @param {number} amountInPaise 
     * @returns {number} amountInRupees
     */
    fromPaise: (amountInPaise) => {
        if (!amountInPaise) return 0;
        return Number(amountInPaise) / 100;
    },

    /**
     * Format currency for display (e.g., "₹ 1,200.00")
     * @param {number} amount 
     * @returns {string} formattedString
     */
    format: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Safe addition of monetary values
     * @param {number} a 
     * @param {number} b 
     * @returns {number} result
     */
    add: (a, b) => {
        const aPaise = Math.round(a * 100);
        const bPaise = Math.round(b * 100);
        return (aPaise + bPaise) / 100;
    },

    /**
     * Safe subtraction
     * @param {number} a 
     * @param {number} b 
     * @returns {number} result
     */
    subtract: (a, b) => {
        const aPaise = Math.round(a * 100);
        const bPaise = Math.round(b * 100);
        return (aPaise - bPaise) / 100;
    }
};

module.exports = CurrencyUtils;
