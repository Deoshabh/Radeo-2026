'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsAPI } from '@/utils/api';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';
import { normalizeSettingsLayout } from '@/utils/layoutSchema';

const CACHE_KEY = 'site-settings-cache-v1';
const CACHE_TTL_MS = 60 * 60 * 1000;
const THEME_PREVIEW_MODE_KEY = 'theme-preview-mode-v1';
const THEME_PREVIEW_MODE_EVENT = 'theme-preview-mode-changed';

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

const normalizeSettings = (incoming) => normalizeSettingsLayout(
  deepMerge(SITE_SETTINGS_DEFAULTS, incoming || {}),
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex) => {
  const normalized = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const mixRgb = (base, target, amount) => ({
  r: base.r + (target.r - base.r) * amount,
  g: base.g + (target.g - base.g) * amount,
  b: base.b + (target.b - base.b) * amount,
});

const resolveActiveThemeMode = (mode, prefersDark = false) => {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (prefersDark) {
    return 'dark';
  }
  return 'light';
};

const buildPrimaryScale = (baseHex) => {
  const base = hexToRgb(baseHex) || { r: 59, g: 47, b: 47 };
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: rgbToHex(mixRgb(base, white, 0.9)),
    100: rgbToHex(mixRgb(base, white, 0.82)),
    200: rgbToHex(mixRgb(base, white, 0.68)),
    300: rgbToHex(mixRgb(base, white, 0.52)),
    400: rgbToHex(mixRgb(base, white, 0.32)),
    500: rgbToHex(mixRgb(base, white, 0.12)),
    600: rgbToHex(mixRgb(base, black, 0.08)),
    700: rgbToHex(mixRgb(base, black, 0.18)),
    800: rgbToHex(mixRgb(base, black, 0.32)),
    900: rgbToHex(mixRgb(base, black, 0.45)),
  };
};

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
  const [prefersDark, setPrefersDark] = useState(false);
  const [themePreviewMode, setThemePreviewMode] = useState('default');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const readPreviewMode = () => {
      const raw = window.localStorage.getItem(THEME_PREVIEW_MODE_KEY) || 'default';
      const validModes = new Set(['default', 'light', 'dark', 'system']);
      return validModes.has(raw) ? raw : 'default';
    };

    const applyPreviewMode = () => {
      setThemePreviewMode(readPreviewMode());
    };

    applyPreviewMode();

    const handleStorage = (event) => {
      if (event.key && event.key !== THEME_PREVIEW_MODE_KEY) return;
      applyPreviewMode();
    };

    const handleCustomChange = () => {
      applyPreviewMode();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_PREVIEW_MODE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_PREVIEW_MODE_EVENT, handleCustomChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyPreference = () => setPrefersDark(mediaQuery.matches);
    applyPreference();

    const handleChange = (event) => {
      setPrefersDark(Boolean(event.matches));
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

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

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const theme = settings?.theme || {};
    const effects = theme.effects || {};
    const previewResolvedMode = resolveActiveThemeMode(themePreviewMode || 'default', prefersDark);
    const configuredMode = resolveActiveThemeMode(theme.mode || 'light', prefersDark);
    const activeMode = themePreviewMode && themePreviewMode !== 'default' ? previewResolvedMode : configuredMode;
    const lightModeTheme = theme.colorModes?.light || {};
    const darkModeTheme = theme.colorModes?.dark || {};
    const activeModeTheme = activeMode === 'dark' ? darkModeTheme : lightModeTheme;

    const activePrimaryColor =
      activeModeTheme.primaryColor ||
      (activeMode === 'dark' ? darkModeTheme.primaryColor : undefined) ||
      lightModeTheme.primaryColor ||
      theme.primaryColor ||
      '#3B2F2F';
    const activeSecondaryColor =
      activeModeTheme.secondaryColor ||
      (activeMode === 'dark' ? darkModeTheme.secondaryColor : undefined) ||
      lightModeTheme.secondaryColor ||
      theme.secondaryColor ||
      '#E5D3B3';
    const activeBackgroundColor =
      activeModeTheme.backgroundColor ||
      (activeMode === 'dark' ? darkModeTheme.backgroundColor : undefined) ||
      lightModeTheme.backgroundColor ||
      theme.backgroundColor ||
      '#fafaf9';
    const activeTextColor =
      activeModeTheme.textColor ||
      (activeMode === 'dark' ? darkModeTheme.textColor : undefined) ||
      lightModeTheme.textColor ||
      theme.textColor ||
      '#1c1917';

    const primaryScale = buildPrimaryScale(activePrimaryColor);
    const secondaryScale = buildPrimaryScale(activeSecondaryColor);

    root.style.setProperty('--theme-font-family', theme.fontFamily || 'var(--font-inter)');
    root.style.setProperty('--theme-font-scale', String(theme.fontScale || 1));
    root.style.setProperty('--theme-border-radius', theme.borderRadius || '0.5rem');
    root.style.setProperty('--theme-container-width', theme.containerWidth || '1280px');
    root.style.setProperty('--theme-bg-color', activeBackgroundColor);
    root.style.setProperty('--theme-text-color', activeTextColor);
    root.style.setProperty('--theme-primary-color', activePrimaryColor);
    root.style.setProperty('--theme-secondary-color', activeSecondaryColor);
    root.style.setProperty('--color-background', activeBackgroundColor);
    root.style.setProperty('--color-surface', activeMode === 'dark' ? '#1f2937' : '#ffffff');
    root.style.setProperty('--color-text-primary', activeTextColor);
    root.style.setProperty('--color-text-secondary', activeMode === 'dark' ? '#D1D5DB' : theme.accentColor || '#8a7460');
    root.style.setProperty('--color-border', activeMode === 'dark' ? '#374151' : secondaryScale[200] || '#e7e5e4');
    root.style.setProperty('--color-brand-brown', activePrimaryColor || '#3d2f28');
    root.style.setProperty('--color-brand-tan', activeSecondaryColor || '#8b7355');
    root.style.setProperty('--color-brand-cream', secondaryScale[100] || '#d4c4b0');

    // Extended palette for luxury theme components
    root.style.setProperty('--color-accent', theme.accentColor || activeSecondaryColor || '#c9a96e');
    root.style.setProperty('--color-accent-hover', theme.accentHoverColor || primaryScale[600] || '#a07840');
    root.style.setProperty('--color-page-bg', activeBackgroundColor || '#faf8f4');
    root.style.setProperty('--color-card-bg', activeMode === 'dark' ? '#1f2937' : '#ffffff');
    root.style.setProperty('--color-subtle-bg', theme.subtleBgColor || secondaryScale[50] || '#f2ede4');
    root.style.setProperty('--color-border-light', theme.borderColor || secondaryScale[200] || '#e8e0d0');
    root.style.setProperty('--color-heading', activeTextColor || '#2a1a0a');
    root.style.setProperty('--color-body', theme.bodyTextColor || theme.accentColor || '#8a7460');
    root.style.setProperty('--color-muted', theme.mutedTextColor || primaryScale[400] || '#5c3d1e');

    root.style.setProperty('--color-primary-50', primaryScale[50]);
    root.style.setProperty('--color-primary-100', primaryScale[100]);
    root.style.setProperty('--color-primary-200', primaryScale[200]);
    root.style.setProperty('--color-primary-300', primaryScale[300]);
    root.style.setProperty('--color-primary-400', primaryScale[400]);
    root.style.setProperty('--color-primary-500', primaryScale[500]);
    root.style.setProperty('--color-primary-600', primaryScale[600]);
    root.style.setProperty('--color-primary-700', primaryScale[700]);
    root.style.setProperty('--color-primary-800', primaryScale[800]);
    root.style.setProperty('--color-primary-900', primaryScale[900]);
    root.style.setProperty('--color-secondary-50', secondaryScale[50]);
    root.style.setProperty('--color-secondary-100', secondaryScale[100]);
    root.style.setProperty('--color-secondary-200', secondaryScale[200]);
    root.style.setProperty('--color-secondary-300', secondaryScale[300]);
    root.style.setProperty('--color-secondary-400', secondaryScale[400]);
    root.style.setProperty('--color-secondary-500', secondaryScale[500]);

    root.dataset.themeHeaderVariant = theme.headerVariant || 'minimal';
    root.dataset.themeMode = activeMode;
    root.dataset.themePreviewMode = themePreviewMode || 'default';
    root.dataset.themePageTransition = effects.pageTransitions || 'fade';
    root.dataset.themeScrollAnimations = effects.scrollAnimations === false ? 'false' : 'true';
    root.dataset.themeScrollAnimationType = effects.scrollAnimationType || 'fade-in';
    root.dataset.themeCustomCursor = effects.customCursor ? 'true' : 'false';

    const cursorId = 'theme-custom-cursor';
    const existingCursor = document.getElementById(cursorId);
    const cursorEnabled = effects.customCursor && window.matchMedia('(pointer:fine)').matches;

    if (!cursorEnabled) {
      if (existingCursor) existingCursor.remove();
      return;
    }

    const cursorSize = clamp(Number(effects.customCursorSize) || 20, 8, 64);
    const cursorColor = effects.customCursorColor || theme.primaryColor || '#000000';
    const cursorEl = existingCursor || document.createElement('div');
    cursorEl.id = cursorId;
    cursorEl.style.position = 'fixed';
    cursorEl.style.left = '0px';
    cursorEl.style.top = '0px';
    cursorEl.style.width = `${cursorSize}px`;
    cursorEl.style.height = `${cursorSize}px`;
    cursorEl.style.borderRadius = '9999px';
    cursorEl.style.border = `2px solid ${cursorColor}`;
    cursorEl.style.background = `${cursorColor}22`;
    cursorEl.style.pointerEvents = 'none';
    cursorEl.style.zIndex = '99999';
    cursorEl.style.transform = 'translate(-50%, -50%)';
    cursorEl.style.transition = 'width 0.15s ease, height 0.15s ease, border-color 0.15s ease';
    if (!existingCursor) document.body.appendChild(cursorEl);

    const handleMove = (event) => {
      cursorEl.style.left = `${event.clientX}px`;
      cursorEl.style.top = `${event.clientY}px`;
    };

    const handleDown = () => {
      cursorEl.style.width = `${Math.max(6, cursorSize - 6)}px`;
      cursorEl.style.height = `${Math.max(6, cursorSize - 6)}px`;
    };

    const handleUp = () => {
      cursorEl.style.width = `${cursorSize}px`;
      cursorEl.style.height = `${cursorSize}px`;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      cursorEl.remove();
    };
  }, [settings, prefersDark, themePreviewMode]);

  // Live Preview Listener
  useEffect(() => {
    const handleMessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'THEME_UPDATE' && payload) {
        setSettings((prev) => {
          // If payload is the full settings object or a specific section
          // We need to be careful about what we are merging.
          // The Visual Editor sends the 'theme' object or 'homeSections' object.
          // Let's assume payload IS the new settings object or a partial.
          return deepMerge(prev, payload);
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
