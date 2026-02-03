'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { orderAPI, addressAPI, couponAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiPlus, FiEdit2, FiTag, FiCreditCard, FiDollarSign } from 'react-icons/fi';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const { cart, fetchCart, cartCount, cartTotal } = useCart();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAddresses();
      // Backend returns array directly, not wrapped
      const addressList = Array.isArray(response.data) ? response.data : (response.data.addresses || []);
      console.log('📦 Addresses in checkout:', addressList.length);
      setAddresses(addressList);
      const defaultAddr = addressList.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddr || addressList[0]);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      if (cartCount === 0) {
        toast.error('Your cart is empty');
        router.push('/cart');
      }
    }
  }, [isAuthenticated, cartCount, router]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await addressAPI.addAddress(addressForm);
      toast.success('Address added successfully!');
      fetchAddresses();
      setShowAddressForm(false);
      setAddressForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const response = await couponAPI.validateCoupon(couponCode);
      const coupon = response.data.coupon;
      
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (cart.subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      } else {
        discountAmount = coupon.value;
      }

      setAppliedCoupon(coupon);
      setDiscount(discountAmount);
      toast.success(`Coupon applied! You saved ₹${discountAmount.toLocaleString()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderData = {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
      };

      const response = await orderAPI.createOrder(orderData);
      const order = response.data.order;

      if (paymentMethod === 'razorpay') {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway');
          setIsProcessing(false);
          return;
        }

        // Create Razorpay order
        const rzpResponse = await orderAPI.createRazorpayOrder(order._id);
        const { razorpayOrderId, amount, currency } = rzpResponse.data;

        // Validate Razorpay key is configured
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
          toast.error('Payment system not configured. Please contact support.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: 'Radeo',
          description: `Order ${order.orderId}`,
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              await orderAPI.verifyRazorpayPayment(order._id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              toast.success('Payment successful!');
              fetchCart();
              router.push(`/orders/${order._id}`);
            } catch (error) {
              toast.error('Payment verification failed');
              setIsProcessing(false);
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: selectedAddress.phone,
          },
          theme: {
            color: '#8B4513',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // COD order
        toast.success('Order placed successfully!');
        fetchCart();
        router.push(`/orders/${order._id}`);
      }
    } catch (error) {
      console.error('Order creation error:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Failed to place order';
      const errorField = error.response?.data?.field;
      
      if (errorField) {
        toast.error(`${errorMessage} (Field: ${errorField})`);
      } else {
        toast.error(errorMessage);
      }
      setIsProcessing(false);
    }
  };

  const subtotal = cartTotal || 0;
  const shippingCost = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shippingCost - discount;

  if (loading || !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-primary-900 mb-6 sm:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                  <FiMapPin className="text-brand-brown" />
                  Shipping Address
                </h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2 text-brand-brown hover:text-brand-brown-dark"
                >
                  <FiPlus /> Add New
                </button>
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mb-6 p-4 border border-primary-200 rounded-lg bg-primary-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                      className="md:col-span-2 px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                      className="md:col-span-2 px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      required
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" className="btn btn-primary">
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 ? (
                <p className="text-center text-primary-600 py-8">No addresses found. Please add one.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      onClick={() => setSelectedAddress(address)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddress?._id === address._id
                          ? 'border-brand-brown bg-brand-brown bg-opacity-5'
                          : 'border-primary-200 hover:border-primary-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-primary-900">{address.fullName}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 text-xs bg-brand-brown text-white rounded">Default</span>
                            )}
                          </div>
                          <p className="text-primary-700 text-sm">{address.addressLine1}</p>
                          {address.addressLine2 && <p className="text-primary-700 text-sm">{address.addressLine2}</p>}
                          <p className="text-primary-700 text-sm">
                            {address.city}, {address.state} - {address.pinCode || address.postalCode}
                          </p>
                          <p className="text-primary-600 text-sm mt-1">Phone: {address.phone}</p>
                        </div>
                        <input
                          type="radio"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => setSelectedAddress(address)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2 mb-6">
                <FiCreditCard className="text-brand-brown" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-brand-brown bg-brand-brown bg-opacity-5'
                      : 'border-primary-200 hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiCreditCard className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-semibold text-primary-900">Credit/Debit Card, UPI, Net Banking</p>
                        <p className="text-sm text-primary-600">Secured payment via Razorpay</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-brand-brown bg-brand-brown bg-opacity-5'
                      : 'border-primary-200 hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiDollarSign className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-semibold text-primary-900">Cash on Delivery</p>
                        <p className="text-sm text-primary-600">Pay when you receive</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-primary-900 mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-2">
                  <FiTag /> Have a Coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    disabled={!!appliedCoupon}
                    className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 disabled:bg-primary-50"
                  />
                  {appliedCoupon ? (
                    <button onClick={handleRemoveCoupon} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Remove
                    </button>
                  ) : (
                    <button onClick={handleApplyCoupon} className="px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown-dark">
                      Apply
                    </button>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-primary-700">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-primary-700">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                {subtotal < 1000 && shippingCost > 0 && (
                  <p className="text-xs text-primary-600">Add ₹{(1000 - subtotal).toLocaleString()} more for FREE shipping</p>
                )}
              </div>

              <div className="pt-6 border-t border-primary-200 mb-6">
                <div className="flex justify-between text-xl font-bold text-primary-900">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddress || isProcessing}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>

              <Link href="/cart" className="block text-center mt-4 text-brand-brown hover:underline">
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
