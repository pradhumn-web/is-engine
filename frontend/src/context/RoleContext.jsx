import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createDemoSession, readDemoSession, SESSION_STORAGE_KEY } from './roleSession.js';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [session, setSession] = useState(() => readDemoSession());

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch { /* Demo mode remains usable when storage is unavailable. */ }
  }, [session]);

  const value = useMemo(() => ({
    session,
    userRole: session?.role || null,
    displayName: session?.displayName || '',
    isAuthenticated: Boolean(session),
    isOfficer: session?.role === 'officer',
    isContractor: session?.role === 'contractor',
    signIn: (role, displayName) => setSession(createDemoSession(role, displayName)),
    signOut: () => setSession(null),
  }), [session]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole must be used inside RoleProvider');
  return value;
}
