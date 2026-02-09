'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsAPI } from '@/utils/api';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';

const CACHE_KEY = 'site-settings-cache-v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

const SiteSettingsContext = createContext(null);

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, incoming) => {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming : base;
  }

  if (!isObject(base)) {
    return incoming === undefined ? base : incoming;
  }

  const merged = { ...base };
  const keys = new Set([...Object.keys(base), ...Object.keys(incoming || {})]);

  keys.forEach((key) => {
    const baseValue = base[key];
    const incomingValue = incoming?.[key];

    if (incomingValue === undefined) {
      merged[key] = baseValue;
      return;
    }

    if (isObject(baseValue)) {
      merged[key] = deepMerge(baseValue, incomingValue);
      return;
    }

    if (Array.isArray(baseValue)) {
      merged[key] = Array.isArray(incomingValue) ? incomingValue : baseValue;
      return;
    }

    merged[key] = incomingValue;
  });

  return merged;
};

const normalizeSettings = (incoming) => deepMerge(SITE_SETTINGS_DEFAULTS, incoming || {});

const readCache = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.settings || null;
  } catch {
    return null;
  }
};

const writeCache = (settings) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        settings,
        expiresAt: Date.now() + CACHE_TTL_MS,
      }),
    );
  } catch {
    // Ignore cache write failures
  }
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(SITE_SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async ({ force = false } = {}) => {
    try {
      if (!force) {
        const cached = readCache();
        if (cached) {
          setSettings(normalizeSettings(cached));
          setLoading(false);
        }
      }

      const response = await settingsAPI.getPublicSettings();
      const remoteSettings = response?.data?.settings || {};
      const merged = normalizeSettings(remoteSettings);

      setSettings(merged);
      writeCache(merged);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
      setError(err);

      if (typeof window !== 'undefined') {
        const cached = readCache();
        if (cached) {
          setSettings(normalizeSettings(cached));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refreshSettings: () => fetchSettings({ force: true }),
    }),
    [settings, loading, error, fetchSettings],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return context;
};
