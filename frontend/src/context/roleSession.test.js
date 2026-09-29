import { describe, expect, it } from 'vitest';
import { BIDDER_PROFILE_STORAGE_KEY, createDemoSession, readBidderProfile, readDemoSession, SESSION_STORAGE_KEY, TECHNICAL_FIELDS } from './roleSession.js';

function storageWith(values) {
  return { getItem: key => values[key] || null };
}

const bidderProfile = { experienceYears: '8', technicalField: 'Civil & Construction' };

describe('demo role sessions', () => {
  it('creates a named officer session without collecting credentials', () => {
    const session = createDemoSession('officer', '  Asha  ');
    expect(session).toMatchObject({ role: 'officer', displayName: 'Asha', mode: 'demo' });
    expect(session.startedAt).toBeTruthy();
  });

  it('requires bidder experience and an allowlisted technical field', () => {
    const session = createDemoSession('contractor', 'Ravi Patel', bidderProfile);
    expect(session.bidderProfile).toMatchObject({ displayName: 'Ravi Patel', experienceYears: 8, technicalField: 'Civil & Construction' });
    expect(() => createDemoSession('contractor', 'Ravi')).toThrow('Bidder experience and technical field are required.');
    expect(() => createDemoSession('contractor', 'Ravi', { experienceYears: 99, technicalField: 'admin' })).toThrow();
    expect(TECHNICAL_FIELDS).toContain('Electronics & IT');
  });

  it('uses a safe default officer name and rejects an unknown role', () => {
    expect(createDemoSession('officer').displayName).toBe('Demo Officer');
    expect(() => createDemoSession('admin')).toThrow('Choose Officer or Bidder to continue.');
  });

  it('restores complete sessions and ignores corrupt, unsupported or incomplete bidder storage', () => {
    const valid = { role: 'contractor', displayName: 'Ravi', bidderProfile: bidderProfile, mode: 'demo' };
    expect(readDemoSession(storageWith({ [SESSION_STORAGE_KEY]: JSON.stringify(valid) }))).toMatchObject({ role: 'contractor', bidderProfile: { experienceYears: 8, technicalField: 'Civil & Construction' } });
    expect(readDemoSession(storageWith({ [SESSION_STORAGE_KEY]: 'not-json' }))).toBeNull();
    expect(readDemoSession(storageWith({ [SESSION_STORAGE_KEY]: '{"role":"admin","displayName":"A"}' }))).toBeNull();
    expect(readDemoSession(storageWith({ [SESSION_STORAGE_KEY]: '{"role":"contractor","displayName":"A"}' }))).toBeNull();
  });

  it('loads a valid bidder profile from browser-local profile storage', () => {
    const value = { displayName: 'Ravi', ...bidderProfile };
    expect(readBidderProfile(storageWith({ [BIDDER_PROFILE_STORAGE_KEY]: JSON.stringify(value) }))).toEqual({ displayName: 'Ravi', experienceYears: 8, technicalField: 'Civil & Construction' });
  });
});
