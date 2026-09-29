import { describe, expect, it } from 'vitest';
import { createDemoSession, readDemoSession, SESSION_STORAGE_KEY } from './roleSession.js';

function storageWith(value) {
  return { getItem: key => key === SESSION_STORAGE_KEY ? value : null };
}

describe('demo role sessions', () => {
  it('creates a named officer session without collecting credentials', () => {
    const session = createDemoSession('officer', '  Asha  ');
    expect(session).toMatchObject({ role: 'officer', displayName: 'Asha', mode: 'demo' });
    expect(session.startedAt).toBeTruthy();
  });

  it('uses a safe default name and rejects an unknown role', () => {
    expect(createDemoSession('contractor').displayName).toBe('Demo Bidder');
    expect(() => createDemoSession('admin')).toThrow('Choose Officer or Bidder to continue.');
  });

  it('restores a valid session and ignores corrupt or unsupported storage', () => {
    expect(readDemoSession(storageWith('{"role":"contractor","displayName":"Ravi"}'))).toMatchObject({ role: 'contractor', displayName: 'Ravi' });
    expect(readDemoSession(storageWith('not-json'))).toBeNull();
    expect(readDemoSession(storageWith('{"role":"admin","displayName":"A"}'))).toBeNull();
  });
});
