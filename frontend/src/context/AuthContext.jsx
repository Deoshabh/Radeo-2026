'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI, getFriendlyError } from '@/utils/api';
import Cookies from 'js-cookie';
import {
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
  onAuthStateChange,
  getFirebaseToken
} from '@/utils/firebaseAuth';

const AuthContext = createContext();

/* ─── Helper: sync Firebase user → backend ─── */
async function syncWithBackend(firebaseUser, token) {
  const response = await authAPI.firebaseLogin({
    firebaseToken: token,
    email: firebaseUser.email,
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
  });
  return response.data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Guards ──
  // When true, the onAuthStateChanged listener skips backend sync
  // because a login/register flow is actively handling it.
  const loginInProgress = useRef(false);
  const isMounted = useRef(true);

  const setLoginInProgress = useCallback((active) => {
    loginInProgress.current = active;
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // ─── Guard: if a login flow is in progress, it will set the user ───
          if (loginInProgress.current) {
            return; // loading will be set to false by the login flow
          }

          const accessToken = Cookies.get('accessToken');

          // If we have a backend token, validate it
          if (accessToken) {
            try {
              const response = await authAPI.getCurrentUser();
              if (isMounted.current) setUser(response.data);
              return;
            } catch {
              // Token invalid — clear it and try to re-establish
              Cookies.remove('accessToken');
            }
          }

          // No valid backend session — re-establish from Firebase token
          // (handles page refresh when cookie expired but Firebase session is alive)
          try {
            const token = await firebaseUser.getIdToken(true);
            const data = await syncWithBackend(firebaseUser, token);
            if (isMounted.current) {
              if (data.accessToken) {
                Cookies.set('accessToken', data.accessToken, { expires: 1, secure: true, sameSite: 'Strict', path: '/' });
              }
              setUser(data.user);
            }
          } catch (syncErr) {
            console.error('Session restoration failed:', syncErr.message);
            if (isMounted.current) setUser(null);
          }
        } else {
          if (isMounted.current) {
            setUser(null);
            Cookies.remove('accessToken');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        // Only update loading if a login flow isn't controlling it
        if (isMounted.current && !loginInProgress.current) {
          setLoading(false);
        }
      }
    });

    // Safety net: ensure loading is false even if Firebase is slow/broken
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        setLoading(false);
      }
    }, 4000);

    return () => {
      isMounted.current = false;
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const login = async (credentials) => {
    loginInProgress.current = true;
    try {
      const { user: firebaseUser, token } = await loginWithEmail(credentials.email, credentials.password);

      if (!firebaseUser) return { success: false, error: 'Firebase login failed' };

      const data = await syncWithBackend(firebaseUser, token);
      Cookies.set('accessToken', data.accessToken, { expires: 1, secure: true, sameSite: 'Strict', path: '/' });
      setUser(data.user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login context error:', error);
      return { success: false, error: getFriendlyError(error) };
    } finally {
      loginInProgress.current = false;
    }
  };

  const register = async (userData) => {
    loginInProgress.current = true;
    try {
      const { user: firebaseUser, token } = await registerWithEmail(userData.email, userData.password, userData.name);

      if (!firebaseUser) return { success: false, error: 'Firebase registration failed' };

      const data = await syncWithBackend(firebaseUser, token);
      Cookies.set('accessToken', data.accessToken, { expires: 1, secure: true, sameSite: 'Strict', path: '/' });
      setUser(data.user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Registration context error:', error);
      return { success: false, error: getFriendlyError(error) };
    } finally {
      loginInProgress.current = false;
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('accessToken');
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setLoginInProgress,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
