export const SESSION_STORAGE_KEY = 'bis_demo_session';
export const BIDDER_PROFILE_STORAGE_KEY = 'bis_demo_bidder_profile';
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
