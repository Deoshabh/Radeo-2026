const crypto = require('crypto');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const CurrencyUtils = require('../utils/currencyUtils');
const { log } = require('../utils/logger');

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

            const inputCode = code.toUpperCase().trim();
            const prefix = inputCode.slice(0, 3);

            // Prefix query to narrow candidates, then timing-safe compare
            const candidates = await Coupon.find({
                code: { $regex: `^${prefix}`, $options: 'i' },
            }).lean();

            let coupon = null;
            for (const candidate of candidates) {
                const storedBuf = Buffer.from(candidate.code, 'utf8');
                const inputBuf = Buffer.from(inputCode, 'utf8');
                if (storedBuf.length === inputBuf.length) {
                    if (crypto.timingSafeEqual(storedBuf, inputBuf)) {
                        coupon = candidate;
                    }
                }
            }

            if (!coupon) {
                return { valid: false, message: 'Invalid coupon code' };
            }

            // --- Field names match Coupon model exactly ---
            if (!coupon.isActive) {
                return { valid: false, message: 'Coupon is inactive' };
            }

            const now = new Date();
            if (coupon.validFrom && now < coupon.validFrom) {
                return { valid: false, message: 'Coupon is not yet valid' };
            }

            if (now > coupon.expiry) {
                return { valid: false, message: 'Coupon has expired' };
            }

            if (cartTotal < coupon.minOrder) {
                return { 
                    valid: false, 
                    message: `Minimum order value of ${CurrencyUtils.format(coupon.minOrder)} required` 
                };
            }

            // Global usage limit
            if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
                return { valid: false, message: 'Coupon usage limit reached' };
            }

            // Per-user usage limit
            if (userId && coupon.perUserLimit != null) {
                const userUsageCount = await Order.countDocuments({
                    user: userId,
                    'coupon.code': coupon.code,
                    status: { $ne: 'cancelled' },
                });
                if (userUsageCount >= coupon.perUserLimit) {
                    return { valid: false, message: 'You have already used this coupon the maximum number of times' };
                }
            }

            // First-order-only check
            if (coupon.firstOrderOnly && userId) {
                const prevOrders = await Order.countDocuments({
                    user: userId,
                    status: { $ne: 'cancelled' },
                });
                if (prevOrders > 0) {
                    return { valid: false, message: 'This coupon is valid for first orders only' };
                }
            }

            // Calculate discount — type is 'flat' or 'percent' (matches model enum)
            let discountAmount = 0;
            if (coupon.type === 'percent') {
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
                discount: Math.round(discountAmount),
                coupon: {
                    _id: coupon._id,
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    maxDiscount: coupon.maxDiscount,
                }
            };

        } catch (error) {
            log.error('Coupon Validation Error:', error);
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
