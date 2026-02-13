const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

class CouponService {
    /**
     * Validate a coupon code for a given cart total and user
     * @param {string} code - The coupon code to validate
     * @param {number} cartTotal - The total amount of the cart
     * @param {string} userId - The ID of the user attempting to use the coupon
     * @returns {Promise<object>} - Validation result { valid: boolean, discount: number, message: string, coupon: object }
     */
    async validateCoupon(code, cartTotal, userId) {
        try {
            if (!code) {
                return { valid: false, message: 'Coupon code is required' };
            }

            const coupon = await Coupon.findOne({ code: code.toUpperCase() });

            if (!coupon) {
                return { valid: false, message: 'Invalid coupon code' };
            }

            if (!coupon.active) {
                return { valid: false, message: 'Coupon is inactive' };
            }

            const now = new Date();
            if (now < coupon.startDate) {
                return { valid: false, message: 'Coupon is not yet valid' };
            }

            if (now > coupon.endDate) {
                return { valid: false, message: 'Coupon has expired' };
            }

            if (cartTotal < coupon.minOrderValue) {
                return { 
                    valid: false, 
                    message: `Minimum order value of ₹${coupon.minOrderValue} required` 
                };
            }

            if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
                return { valid: false, message: 'Coupon usage limit reached' };
            }

            // Check if user has already used this coupon (if one-time use per user logic exists)
            // For now, let's assume standard usage limits logic
            // Ideally we'd check Order history here if 'once per user' is a requirement.
            
            let discountAmount = 0;
            if (coupon.type === 'percentage') {
                discountAmount = (cartTotal * coupon.value) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else if (coupon.type === 'flat') {
                discountAmount = coupon.value;
            }

            // Ensure discount doesn't exceed total
            if (discountAmount > cartTotal) {
                discountAmount = cartTotal;
            }

            return {
                valid: true,
                message: 'Coupon applied successfully',
                discount: Math.round(discountAmount), // Round to nearest integer standard
                coupon: {
                    _id: coupon._id,
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value
                }
            };

        } catch (error) {
            console.error('Coupon Validation Error:', error);
            throw new Error('Error validating coupon');
        }
    }

    /**
     * Increment coupon usage count
     * @param {string} couponId 
     */
    async incrementUsage(couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }
}

module.exports = new CouponService();
