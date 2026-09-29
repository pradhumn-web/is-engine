import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appendBidderHistory, BIDDER_PROFILE_STORAGE_KEY, createDemoSession, readBidderHistory, readBidderProfile, readDemoSession, SESSION_STORAGE_KEY, summarizeBidderHistory } from './roleSession.js';
import { appendUploadHistory, readUploadHistory, summarizeUploadHistory } from './uploadHistory.js';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [session, setSession] = useState(() => readDemoSession());
  const [lastBidderProfile, setLastBidderProfile] = useState(() => readBidderProfile());
  const [bidderHistory, setBidderHistory] = useState(() => readBidderHistory());
  const [uploadHistory, setUploadHistory] = useState(() => readUploadHistory());

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
    signIn: (role, displayName, bidderProfile) => {
      const nextSession = createDemoSession(role, displayName, bidderProfile);
      if (role === 'contractor') setBidderHistory(appendBidderHistory(nextSession));
      setSession(nextSession);
    },
    signOut: () => setSession(null),
    bidderHistory,
    bidderHistoryStats: summarizeBidderHistory(bidderHistory),
    uploadHistory,
    uploadHistoryStats: summarizeUploadHistory(uploadHistory),
    recordUpload: (file, result, role) => setUploadHistory(appendUploadHistory(file, result, role)),
  }), [session, lastBidderProfile, bidderHistory, uploadHistory]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole must be used inside RoleProvider');
  return value;
}
