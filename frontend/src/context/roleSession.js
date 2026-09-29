export const SESSION_STORAGE_KEY = 'bis_demo_session';
export const VALID_ROLES = ['officer', 'contractor'];

export function createDemoSession(role, displayName = '') {
  if (!VALID_ROLES.includes(role)) throw new Error('Choose Officer or Bidder to continue.');
  const name = String(displayName || '').trim().slice(0, 48) || (role === 'officer' ? 'Demo Officer' : 'Demo Bidder');
  return { role, displayName: name, mode: 'demo', startedAt: new Date().toISOString() };
}

export function readDemoSession(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return null;
    const value = JSON.parse(target.getItem(SESSION_STORAGE_KEY) || 'null');
    if (!value || !VALID_ROLES.includes(value.role) || typeof value.displayName !== 'string') return null;
    return { role: value.role, displayName: value.displayName.slice(0, 48), mode: 'demo', startedAt: value.startedAt || '' };
  } catch {
    return null;
  }
}
