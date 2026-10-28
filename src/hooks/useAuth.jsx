// ---------------------------------------------------------------------------
// AuthContext — the single way any component asks "who is signed in?".
//
// Mirrors useData: state lives in one provider, pages read it through useAuth().
// Backed by the localStorage prototype service, so a real auth backend can be
// dropped into authService.js later without changing call sites.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  readSession,
  authenticate,
  signInAs,
  signOut as clearSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Lazy initialiser: a previous visit's session survives a page refresh.
  const [user, setUser] = useState(() => readSession());

  const signIn = useCallback((username, password) => {
    const result = authenticate(username, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const useDemoAccount = useCallback((username) => {
    const result = signInAs(username);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(() => {
    setUser(clearSession());
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn,
      useDemoAccount,
      signOut,
    }),
    [user, signIn, useDemoAccount, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
