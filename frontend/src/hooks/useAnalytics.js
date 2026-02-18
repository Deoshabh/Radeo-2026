"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Generate a simple session ID for anonymous tracking.
 * Stored in sessionStorage so it resets per browser tab session.
 */
function getSessionId() {
  if (typeof window === "undefined") return null;
  let sid = sessionStorage.getItem("_analytics_sid");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("_analytics_sid", sid);
  }
  return sid;
}

/**
 * Send events using navigator.sendBeacon (fire-and-forget, survives page unload)
 * Falls back to fetch for browsers without sendBeacon
 */
function sendEvent(payload) {
  const url = `${API_URL}/api/v1/analytics/event`;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * React hook for analytics tracking.
 *
 * Usage:
 *   const { track } = useAnalytics();
 *   track("product_view", { productId: "abc", productName: "Nike Air Max" });
 */
export function useAnalytics() {
  const { user } = useAuth();
  const sessionId = useRef(null);

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  const track = useCallback(
    (event, properties = {}) => {
      if (typeof window === "undefined") return;

      sendEvent({
        event,
        properties,
        page: window.location.pathname,
        referrer: document.referrer || undefined,
        sessionId: sessionId.current,
      });
    },
    [], // sendEvent captures API_URL at module level, no deps needed
  );

  /**
   * Track a page view — call once per page mount
   */
  const trackPageView = useCallback(
    (pageTitle) => {
      track("page_view", { title: pageTitle || document.title });
    },
    [track],
  );

  /**
   * Track product view
   */
  const trackProductView = useCallback(
    (product) => {
      track("product_view", {
        productId: product._id || product.id,
        productName: product.name,
        productSlug: product.slug,
        price: product.salePrice || product.price,
        category: product.category?.name,
      });
    },
    [track],
  );

  /**
   * Track add to cart
   */
  const trackAddToCart = useCallback(
    (product, quantity = 1, selectedSize) => {
      track("add_to_cart", {
        productId: product._id || product.id,
        productName: product.name,
        price: product.salePrice || product.price,
        quantity,
        size: selectedSize,
      });
    },
    [track],
  );

  /**
   * Track search
   */
  const trackSearch = useCallback(
    (query, resultCount) => {
      track("product_search", { query, resultCount });
    },
    [track],
  );

  return {
    track,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackSearch,
  };
}
