// ===============================
// Real-time Order Tracker Component
// ===============================
"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { formatDateTime as formatDate } from "@/utils/helpers";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiMapPin,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

/**
 * OrderTracker Component
 * Real-time shipment tracking with Soketi/Pusher
 *
 * @param {String} orderId - MongoDB Order ID
 * @param {Object} order - Initial order data
 * @param {Boolean} showTimeline - Show full timeline (default: true)
 */
export default function OrderTracker({ orderId, order, showTimeline = true }) {
  const [trackingData, setTrackingData] = useState(order?.shipping || {});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);

  // Initialize Soketi/Pusher connection
  useEffect(() => {
    if (!orderId) return;

    // Initialize Pusher client (Soketi compatible)
    const pusher = new Pusher(process.env.NEXT_PUBLIC_SOKETI_KEY || "app-key", {
      wsHost: process.env.NEXT_PUBLIC_SOKETI_HOST || "localhost",
      wsPort: parseInt(process.env.NEXT_PUBLIC_SOKETI_PORT || "6001"),
      forceTLS: process.env.NEXT_PUBLIC_SOKETI_TLS === "true",
      encrypted: process.env.NEXT_PUBLIC_SOKETI_TLS === "true",
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      cluster: process.env.NEXT_PUBLIC_SOKETI_CLUSTER || "mt1",
    });

    pusherRef.current = pusher;

    // Connection state handlers
    pusher.connection.bind("connected", () => {
      console.log("✅ Soketi connected");
      setIsConnected(true);
    });

    pusher.connection.bind("disconnected", () => {
      console.log("⚠️ Soketi disconnected");
      setIsConnected(false);
    });

    pusher.connection.bind("error", (err) => {
      console.error("❌ Soketi connection error:", err);
      setIsConnected(false);
    });

    // Subscribe to order-specific channel
    const channel = pusher.subscribe(`order-${orderId}`);
    channelRef.current = channel;

    // Listen for tracking updates
    channel.bind("tracking-update", (data) => {
      console.log("📦 Tracking update received:", data);

      setTrackingData((prev) => ({
        ...prev,
        awb_code: data.awbCode || prev.awb_code,
        courier_name: data.courierName || prev.courier_name,
        current_status: data.currentStatus || prev.current_status,
        estimated_delivery_date:
          data.estimatedDelivery || prev.estimated_delivery_date,
        trackingHistory: data.trackingHistory || prev.trackingHistory || [],
        last_tracking_update: new Date().toISOString(),
      }));

      setLastUpdate(new Date());
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(`order-${orderId}`);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [orderId]);

  // Get status icon and color
  const getStatusIcon = (status) => {
    const statusUpper = status?.toUpperCase() || "";

    if (statusUpper.includes("DELIVERED")) {
      return { icon: FiCheckCircle, color: "text-green-600", bg: "bg-green-100" };
    }
    if (
      statusUpper.includes("OUT FOR DELIVERY") ||
      statusUpper.includes("IN TRANSIT")
    ) {
      return { icon: FiTruck, color: "text-blue-600", bg: "bg-blue-100" };
    }
    if (statusUpper.includes("PICKED UP") || statusUpper.includes("AWB")) {
      return { icon: FiPackage, color: "text-yellow-600", bg: "bg-yellow-100" };
    }
    if (
      statusUpper.includes("CANCELLED") ||
      statusUpper.includes("RTO") ||
      statusUpper.includes("LOST")
    ) {
      return { icon: FiAlertCircle, color: "text-red-600", bg: "bg-red-100" };
    }

    return { icon: FiPackage, color: "text-gray-600", bg: "bg-gray-100" };
  };

  const { icon: StatusIcon, color: statusColor, bg: statusBg } = getStatusIcon(
    trackingData.current_status,
  );

  if (!trackingData.awb_code) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <FiPackage className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <h3 className="mb-1 text-lg font-semibold text-gray-700">
          Shipment Not Created Yet
        </h3>
        <p className="text-sm text-gray-600">
          Your order is being prepared. Tracking will be available once shipped.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Indicator */}
      {lastUpdate && (
        <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-2 text-sm">
          <span className="flex items-center gap-2 text-green-700">
            <FiRefreshCw className="h-4 w-4" />
            Last updated: {formatDate(lastUpdate)}
          </span>
          <span
            className={`flex items-center gap-2 ${isConnected ? "text-green-600" : "text-gray-500"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? "animate-pulse bg-green-500" : "bg-gray-400"}`}
            />
            {isConnected ? "Live" : "Reconnecting..."}
          </span>
        </div>
      )}

      {/* Current Status Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-3 ${statusBg}`}>
            <StatusIcon className={`h-8 w-8 ${statusColor}`} />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 text-xl font-bold text-gray-900">
              {trackingData.current_status || "Processing"}
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              {trackingData.courier_name && (
                <>
                  Courier: <span className="font-medium">{trackingData.courier_name}</span>
                </>
              )}
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <FiPackage className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">AWB:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {trackingData.awb_code}
                </span>
              </div>

              {trackingData.estimated_delivery_date && (
                <div className="flex items-center gap-2 text-sm">
                  <FiClock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Expected:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(trackingData.estimated_delivery_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      {showTimeline && trackingData.trackingHistory?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Tracking History</h3>

          <div className="relative space-y-6">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />

            {trackingData.trackingHistory
              .slice()
              .reverse()
              .map((event, index) => {
                const {
                  icon: EventIcon,
                  color: eventColor,
                  bg: eventBg,
                } = getStatusIcon(event.status);

                return (
                  <div key={index} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 rounded-full p-2 ${eventBg}`}>
                      <EventIcon className={`h-4 w-4 ${eventColor}`} />
                    </div>

                    {/* Event details */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.status}</h4>
                          {event.location && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                              <FiMapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
