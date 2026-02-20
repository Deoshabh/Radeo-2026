'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { orderAPI, addressAPI, couponAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiCreditCard, FiDollarSign, FiTrash2, FiX } from 'react-icons/fi';
import { formatPrice } from '@/utils/helpers';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const { cart, loading: cartLoading, fetchCart, cartCount, cartTotal } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

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
      const response = await addressAPI.getAll();
      // Backend returns array directly, not wrapped
      const addressList = Array.isArray(response.data) ? response.data : (response.data.addresses || []);
      setAddresses(addressList);
      const defaultAddr = addressList.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddr || addressList[0]);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !cartLoading) {
      fetchAddresses();
      // Only redirect if cart has been loaded (not null/undefined) and is truly empty
      if (cart !== null && cart !== undefined && cartCount === 0) {
        toast.error('Your cart is empty');
        router.push('/cart');
      }
    }
  }, [isAuthenticated, cartLoading, cart, cartCount, router]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await addressAPI.update(editingAddressId, addressForm);
        toast.success('Address updated!');
        setEditingAddressId(null);
      } else {
        await addressAPI.create(addressForm);
        toast.success('Address added successfully!');
      }
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
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (e, address) => {
    e.stopPropagation();
    setEditingAddressId(address._id);
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!confirm('Delete this address?')) return;
    try {
      await addressAPI.delete(addressId);
      toast.success('Address deleted');
      if (selectedAddress?._id === addressId) setSelectedAddress(null);
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
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
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const response = await couponAPI.validate(couponCode);
      const coupon = response.data.coupon;

      let discountAmount = 0;
      if (coupon.type === 'percent') {
        discountAmount = (cart.subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      } else {
        discountAmount = coupon.value;
      }

      setAppliedCoupon(coupon);
      setDiscount(discountAmount);
      toast.success(`Coupon applied! You saved ${formatPrice(discountAmount)}`);
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

      const response = await orderAPI.create(orderData);
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
        const { razorpayOrderId, amount, currency, key } = rzpResponse.data;

        // Use key from backend response (more secure than env variable)
        if (!key) {
          toast.error('Payment system not configured. Please contact support.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: key, // Use key from backend API
          amount: amount,
          currency: currency,
          name: 'Radeo',
          description: `Order ${order.displayOrderId || order.orderId}`,
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
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-heading').trim() || '#3B2F2F',
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pb-32 lg:pb-16">
        {/* Page heading */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-10" style={{ color: 'var(--color-text-primary)' }}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── Main Content ── */}
          <div className="lg:col-span-8 space-y-8">
            {/* ── Shipping Address ── */}
            <section>
              <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="label-upper text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="inline-flex items-center justify-center w-6 h-6 text-[0.625rem] font-medium" style={{ border: '1px solid var(--color-text-secondary)', color: 'var(--color-text-secondary)' }}>1</span>
                  Shipping Address
                </h2>
                <button
                  onClick={() => {
                    if (showAddressForm && !editingAddressId) {
                      handleCancelAddressForm();
                    } else {
                      handleCancelAddressForm();
                      setShowAddressForm(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase transition-colors duration-150"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {showAddressForm && !editingAddressId ? <><FiX className="w-3.5 h-3.5" /> Cancel</> : <><FiPlus className="w-3.5 h-3.5" /> Add New</>}
                </button>
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mb-6 p-5 sm:p-6" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-warm-bg)' }}>
                  <h3 className="label-upper text-xs mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                    {editingAddressId ? 'Edit Address' : 'New Address'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
                      <input
                        type="text"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="input-underline w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Phone</label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="input-underline w-full"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Address Line 1</label>
                      <input
                        type="text"
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="input-underline w-full"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Address Line 2 <span className="normal-case tracking-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="input-underline w-full"
                      />
                    </div>
                    <div>
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="input-underline w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="input-underline w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-upper text-[0.625rem] mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>PIN Code</label>
                      <input
                        type="text"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        className="input-underline w-full"
                        required
                        maxLength="6"
                        pattern="[0-9]{6}"
                        title="Please enter a valid 6-digit PIN code"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="btn-editorial text-xs px-6 py-2.5">
                      {editingAddressId ? 'Update' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddressForm}
                      className="text-xs tracking-[0.08em] uppercase transition-opacity duration-150 hover:opacity-60"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No addresses found. Please add one.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    const isSelected = selectedAddress?._id === address._id;
                    return (
                      <div
                        key={address._id}
                        onClick={() => setSelectedAddress(address)}
                        className="group p-4 sm:p-5 cursor-pointer transition-all duration-200"
                        style={{
                          border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-warm-bg)' : 'transparent',
                          padding: isSelected ? 'calc(1rem - 1px)' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{address.fullName}</span>
                              {address.isDefault && (
                                <span className="label-upper text-[0.5625rem] px-2 py-0.5" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>Default</span>
                              )}
                            </div>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{address.addressLine1}</p>
                            {address.addressLine2 && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{address.addressLine2}</p>}
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {address.city}, {address.state} &ndash; {address.postalCode}
                            </p>
                            <p className="text-xs font-mono mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>{address.phone}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={(e) => handleEditAddress(e, address)}
                              className="p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                              style={{ color: 'var(--color-text-secondary)' }}
                              title="Edit address"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            {!address.isDefault && (
                              <button
                                onClick={(e) => handleDeleteAddress(e, address._id)}
                                className="p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                                style={{ color: 'var(--color-text-secondary)' }}
                                title="Delete address"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Custom radio indicator */}
                            <div
                              className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                              style={{
                                border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderRadius: '50%',
                              }}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--color-accent)', borderRadius: '50%' }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Payment Method ── */}
            <section>
              <div className="mb-5 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="label-upper text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="inline-flex items-center justify-center w-6 h-6 text-[0.625rem] font-medium" style={{ border: '1px solid var(--color-text-secondary)', color: 'var(--color-text-secondary)' }}>2</span>
                  Payment Method
                </h2>
              </div>
              <div className="space-y-3">
                {/* Razorpay */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className="group p-4 sm:p-5 cursor-pointer transition-all duration-200"
                  style={{
                    border: paymentMethod === 'razorpay' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'razorpay' ? 'var(--color-warm-bg)' : 'transparent',
                    padding: paymentMethod === 'razorpay' ? 'calc(1rem - 1px)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiCreditCard className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Card, UPI, Net Banking</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Secured via Razorpay</p>
                      </div>
                    </div>
                    <div
                      className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                      style={{
                        border: `1.5px solid ${paymentMethod === 'razorpay' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: '50%',
                      }}
                    >
                      {paymentMethod === 'razorpay' && (
                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--color-accent)', borderRadius: '50%' }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* COD */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className="group p-4 sm:p-5 cursor-pointer transition-all duration-200"
                  style={{
                    border: paymentMethod === 'cod' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'cod' ? 'var(--color-warm-bg)' : 'transparent',
                    padding: paymentMethod === 'cod' ? 'calc(1rem - 1px)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiDollarSign className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Cash on Delivery</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Pay when delivered</p>
                      </div>
                    </div>
                    <div
                      className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                      style={{
                        border: `1.5px solid ${paymentMethod === 'cod' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: '50%',
                      }}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--color-accent)', borderRadius: '50%' }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 p-6 sm:p-8" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-warm-bg)' }}>
              <h2 className="label-upper text-xs mb-6" style={{ color: 'var(--color-text-secondary)' }}>Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <label className="label-upper text-[0.625rem] mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    disabled={!!appliedCoupon}
                    className="flex-1 bg-transparent text-sm px-0 py-2 font-mono tracking-wider disabled:opacity-40 focus:outline-none"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {appliedCoupon ? (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs tracking-[0.08em] uppercase px-3 py-2 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      className="text-xs tracking-[0.08em] uppercase px-3 py-2 font-medium transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      Apply
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-accent)' }}>
                    {appliedCoupon.code} applied &mdash; saving {formatPrice(discount)}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span style={{ color: shippingCost === 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                    {shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between" style={{ color: 'var(--color-accent)' }}>
                    <span>Discount</span>
                    <span>&minus;{formatPrice(discount)}</span>
                  </div>
                )}
                {subtotal < 1000 && shippingCost > 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Add {formatPrice(1000 - subtotal)} more for complimentary shipping
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="pt-4 mb-6" style={{ borderTop: '1px solid var(--color-text-primary)' }}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total</span>
                  <span className="font-serif text-xl sm:text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="text-[0.6875rem] mt-1 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                  Including all applicable taxes
                </p>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddress || isProcessing}
                className="btn-editorial w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing\u2026' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center mt-4 text-xs tracking-[0.08em] uppercase transition-opacity hover:opacity-60"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Back to Bag
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: Sticky Place Order Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 border-t backdrop-blur-md"
           style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 95%, transparent)', borderColor: 'var(--color-border)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total</span>
          <span className="font-serif text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatPrice(total)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddress || isProcessing}
          className="btn-editorial w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing\u2026' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
