import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BIDDER_PROFILE_STORAGE_KEY, createDemoSession, readBidderProfile, readDemoSession, SESSION_STORAGE_KEY } from './roleSession.js';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [session, setSession] = useState(() => readDemoSession());
  const [lastBidderProfile, setLastBidderProfile] = useState(() => readBidderProfile());

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_STORAGE_KEY);
      if (session?.role === 'contractor' && session.bidderProfile?.technicalField && session.bidderProfile?.experienceYears !== null) {
        const profile = { ...session.bidderProfile, displayName: session.displayName };
        localStorage.setItem(BIDDER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
        setLastBidderProfile(profile);
      }
    } catch { /* Demo mode remains usable when storage is unavailable. */ }
  }, [session]);

  const value = useMemo(() => ({
    session,
    userRole: session?.role || null,
    displayName: session?.displayName || '',
    isAuthenticated: Boolean(session),
    isOfficer: session?.role === 'officer',
    isContractor: session?.role === 'contractor',
    bidderProfile: session?.role === 'contractor' ? session.bidderProfile || null : lastBidderProfile,
    signIn: (role, displayName, bidderProfile) => setSession(createDemoSession(role, displayName, bidderProfile)),
    signOut: () => setSession(null),
  }), [session, lastBidderProfile]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole must be used inside RoleProvider');
  return value;
}
