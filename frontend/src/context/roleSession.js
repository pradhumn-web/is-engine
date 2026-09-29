export const SESSION_STORAGE_KEY = 'bis_demo_session';
export const BIDDER_PROFILE_STORAGE_KEY = 'bis_demo_bidder_profile';
export const BIDDER_HISTORY_STORAGE_KEY = 'bis_demo_bidder_history';
export const MAX_BIDDER_HISTORY = 100;
export const VALID_ROLES = ['officer', 'contractor'];
export const TECHNICAL_FIELDS = [
  'Civil & Construction',
  'Electrical & Cables',
  'Electronics & IT',
  'Mechanical & HVAC',
  'Textiles & PPE',
  'Quality / Testing',
  'Other',
];

export function normalizeBidderProfile(profile = {}) {
  const years = Number(profile.experienceYears);
  const experienceYears = Number.isInteger(years) && years >= 0 && years <= 60 ? years : null;
  const technicalField = TECHNICAL_FIELDS.includes(profile.technicalField) ? profile.technicalField : '';
  const displayName = String(profile.displayName || '').trim().slice(0, 48);
  return { displayName, experienceYears, technicalField };
}

export function readBidderProfile(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return null;
    const value = JSON.parse(target.getItem(BIDDER_PROFILE_STORAGE_KEY) || 'null');
    if (!value) return null;
    const profile = normalizeBidderProfile(value);
    return profile.technicalField && profile.experienceYears !== null ? profile : null;
  } catch {
    return null;
  }
}

export function createDemoSession(role, displayName = '', bidderProfile = {}) {
  if (!VALID_ROLES.includes(role)) throw new Error('Choose Officer or Bidder to continue.');
  const name = String(displayName || '').trim().slice(0, 48) || (role === 'officer' ? 'Demo Officer' : 'Demo Bidder');
  const profile = normalizeBidderProfile(bidderProfile);
  if (role === 'contractor' && (!profile.technicalField || profile.experienceYears === null)) {
    throw new Error('Bidder experience and technical field are required.');
  }
  return {
    role,
    displayName: name,
    ...(role === 'contractor' ? { bidderProfile: { ...profile, displayName: name } } : {}),
    mode: 'demo',
    startedAt: new Date().toISOString(),
  };
}

export function readDemoSession(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return null;
    const value = JSON.parse(target.getItem(SESSION_STORAGE_KEY) || 'null');
    if (!value || !VALID_ROLES.includes(value.role) || typeof value.displayName !== 'string') return null;
    const bidderProfile = normalizeBidderProfile(value.bidderProfile);
    if (value.role === 'contractor' && (!bidderProfile.technicalField || bidderProfile.experienceYears === null)) return null;
    return {
      role: value.role,
      displayName: value.displayName.slice(0, 48),
      ...(value.role === 'contractor' ? { bidderProfile: { ...bidderProfile, displayName: value.displayName.slice(0, 48) } } : {}),
      mode: 'demo',
      startedAt: value.startedAt || '',
    };
  } catch {
    return null;
  }
}

export function readBidderHistory(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return [];
    const entries = JSON.parse(target.getItem(BIDDER_HISTORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(entries)) return [];
    return entries.map(entry => {
      const profile = normalizeBidderProfile(entry);
      const startedAt = typeof entry.startedAt === 'string' && Number.isFinite(Date.parse(entry.startedAt))
        ? new Date(entry.startedAt).toISOString()
        : '';
      if (!startedAt || !profile.technicalField || profile.experienceYears === null) return null;
      return {
        id: String(entry.id || startedAt).slice(0, 96),
        displayName: profile.displayName || 'Demo Bidder',
        experienceYears: profile.experienceYears,
        technicalField: profile.technicalField,
        startedAt,
      };
    }).filter(Boolean).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)).slice(0, MAX_BIDDER_HISTORY);
  } catch {
    return [];
  }
}

export function appendBidderHistory(session, storage, now = new Date()) {
  let target = storage;
  if (!target) {
    try { target = globalThis.localStorage; } catch { target = null; }
  }
  const current = readBidderHistory(target);
  const profile = normalizeBidderProfile(session?.bidderProfile);
  if (session?.role !== 'contractor' || !profile.technicalField || profile.experienceYears === null) return current;
  const startedAt = new Date(session.startedAt || now).toISOString();
  const entry = {
    id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
    displayName: String(session.displayName || profile.displayName || 'Demo Bidder').trim().slice(0, 48),
    experienceYears: profile.experienceYears,
    technicalField: profile.technicalField,
    startedAt,
  };
  const next = [entry, ...current].slice(0, MAX_BIDDER_HISTORY);
  try { target?.setItem(BIDDER_HISTORY_STORAGE_KEY, JSON.stringify(next)); } catch { /* local demo history is optional */ }
  return next;
}

export function summarizeBidderHistory(entries = []) {
  return {
    sessionCount: entries.length,
    distinctNameCount: new Set(entries.map(entry => String(entry.displayName || '').trim().toLocaleLowerCase()).filter(Boolean)).size,
    technicalFieldCount: new Set(entries.map(entry => entry.technicalField).filter(field => TECHNICAL_FIELDS.includes(field))).size,
  };
}
