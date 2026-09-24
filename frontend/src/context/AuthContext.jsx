import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/resources';
import { setAccessToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleAuthenticated = useCallback((data) => {
    setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    });
  }, []);

  // Attempt silent refresh on first load (cookie-based refresh token)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authApi.refresh();
        if (!cancelled) handleAuthenticated(data);
      } catch (e) {
        // no valid session, remain logged out
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleAuthenticated]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      handleAuthenticated(data);
      return data.user;
    },
    [handleAuthenticated]
  );

  const hasPermission = useCallback(
    (...perms) => {
      const userPerms = user?.role?.permissions || [];
      if (userPerms.includes('admin:all')) return true;
      return perms.every((p) => userPerms.includes(p));
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, logout, hasPermission }),
    [user, token, loading, login, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
