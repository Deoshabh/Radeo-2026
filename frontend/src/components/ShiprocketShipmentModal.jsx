'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { FiX, FiTruck, FiPackage, FiMapPin, FiDollarSign } from 'react-icons/fi';

export default function ShiprocketShipmentModal({ order, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Rates, 2: Confirm
  const [rates, setRates] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [weight, setWeight] = useState(0.5);
  const [dimensions, setDimensions] = useState({ length: 10, breadth: 10, height: 10 });
  const [pickupLocation, setPickupLocation] = useState('Primary');
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [shiprocketHealthy, setShiprocketHealthy] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPickupAddresses();
    }
  }, [isOpen]);

  const fetchPickupAddresses = async () => {
    try {
      await adminAPI.getShiprocketHealth();
      setShiprocketHealthy(true);

      const response = await adminAPI.getPickupAddresses();
      setPickupAddresses(response.data?.data?.shipping_address || []);
    } catch (error) {
      setShiprocketHealthy(false);
      setPickupAddresses([]);
      toast.error(error.response?.data?.message || 'Shiprocket is not configured or reachable.');
      console.error('Failed to fetch pickup addresses:', error);
    }
  };

  const fetchShippingRates = async () => {
    if (!shiprocketHealthy) {
      toast.error('Shiprocket is not healthy. Please verify Shiprocket configuration first.');
      return;
    }

    try {
      setLoading(true);
      
      // Get pickup postcode from Shiprocket pickup addresses
      let pickupPostcode = null;
      
      if (pickupAddresses.length === 0) {
        toast.error('No pickup locations configured in Shiprocket. Please add a pickup address first.');
        setLoading(false);
        return;
      }
      
      // Find the selected pickup location
      const selectedPickup = pickupAddresses.find(
        addr => addr.pickup_location === pickupLocation
      );
      
      if (selectedPickup && selectedPickup.pin_code) {
        pickupPostcode = selectedPickup.pin_code;
      } else {
        // Use the first available pickup address if selected location not found
        pickupPostcode = pickupAddresses[0].pin_code;
        setPickupLocation(pickupAddresses[0].pickup_location);
      }
      
      if (!pickupPostcode) {
        toast.error('Invalid pickup location configuration. Please check Shiprocket settings.');
        setLoading(false);
        return;
      }
      
      const response = await adminAPI.getShippingRates({
        pickup_postcode: pickupPostcode,
        delivery_postcode: order.shippingAddress.postalCode,
        weight: weight,
        cod: order.payment.method === 'cod' ? 1 : 0,
        declared_value: order.total / 100, // Convert from cents to rupees
      });

      const couriers = response.data?.data?.available_courier_companies || [];
      
      if (couriers.length === 0) {
        toast.error(
          <div>
            <div>No courier services available. Check:</div>
            <div>1. Pickup PIN: {pickupPostcode}</div>
            <div>2. Delivery PIN: {order.shippingAddress.postalCode}</div>
            <div>3. Shiprocket account has pickup location configured</div>
          </div>
        );
      }
      
      setRates(couriers);
      setStep(2);
    } catch (error) {
      toast.error('Failed to fetch shipping rates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedCourier) {
      toast.error('Please select a courier');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.createShipment(order._id, {
        courier_id: selectedCourier.courier_company_id,
        pickup_location: pickupLocation,
        weight: weight,
        dimensions: dimensions,
      });

      toast.success('Shipment created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Shipment - {order.orderId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FiMapPin /> Shipping Address
            </h3>
            <p className="text-sm text-gray-700">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Phone: {order.shippingAddress.phone}
            </p>
          </div>

          {!shiprocketHealthy && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              Shiprocket is not configured or reachable. Please check admin Shiprocket health/settings and try again.
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Package Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breadth (cm)
                  </label>
                  <input
                    type="number"
                    value={dimensions.breadth}
                    onChange={(e) => setDimensions({ ...dimensions, breadth: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Primary">Primary</option>
                  {pickupAddresses.map((addr, idx) => (
                    <option key={idx} value={addr.pickup_location}>
                      {addr.pickup_location}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchShippingRates}
                disabled={loading || !shiprocketHealthy}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Fetching Rates...
                  </>
                ) : (
                  <>
                    <FiTruck /> Get Shipping Rates
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
              >
                ← Back to Package Details
              </button>

              <h3 className="font-semibold text-lg mb-4">Select Courier Service</h3>

              {rates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No courier services available for this delivery location
                </p>
              ) : (
                <div className="space-y-3">
                  {rates.map((courier) => (
                    <div
                      key={courier.courier_company_id}
                      onClick={() => setSelectedCourier(courier)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCourier?.courier_company_id === courier.courier_company_id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{courier.courier_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Expected Delivery: {courier.etd} {courier.etd_hours && `(${courier.etd_hours} hours)`}
                          </p>
                          {courier.pickup_availability && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Pickup Available
                            </p>
                          )}
                          {order.payment.method === 'cod' && courier.cod === 1 && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ COD Available
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{courier.freight_charge}
                          </p>
                          {courier.cod_charges > 0 && (
                            <p className="text-xs text-gray-500">
                              + ₹{courier.cod_charges} COD
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleCreateShipment}
                disabled={loading || !selectedCourier}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Shipment...
                  </>
                ) : (
                  <>
                    <FiPackage /> Create Shipment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
