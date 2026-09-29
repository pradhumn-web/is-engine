import { describe, expect, it } from 'vitest';
import { appendBidderHistory, BIDDER_HISTORY_STORAGE_KEY, BIDDER_PROFILE_STORAGE_KEY, createDemoSession, MAX_BIDDER_HISTORY, readBidderHistory, readBidderProfile, readDemoSession, SESSION_STORAGE_KEY, summarizeBidderHistory, TECHNICAL_FIELDS } from './roleSession.js';

function storageWith(values) {
  return {
    getItem: key => values[key] || null,
    setItem: (key, value) => { values[key] = value; },
  };
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

  it('records only explicit Bidder demo entries and derives honest local counts', () => {
    const values = {};
    const storage = storageWith(values);
    appendBidderHistory({ role: 'officer', displayName: 'Asha' }, storage);
    appendBidderHistory({ role: 'contractor', displayName: 'Ravi Patel', bidderProfile: { experienceYears: 8, technicalField: 'Civil & Construction' }, startedAt: '2026-09-28T10:00:00.000Z' }, storage);
    appendBidderHistory({ role: 'contractor', displayName: 'Neha Shah', bidderProfile: { experienceYears: 4, technicalField: 'Electronics & IT' }, startedAt: '2026-09-29T10:00:00.000Z' }, storage);
    const entries = readBidderHistory(storage);
    expect(entries.map(entry => entry.displayName)).toEqual(['Neha Shah', 'Ravi Patel']);
    expect(summarizeBidderHistory(entries)).toEqual({ sessionCount: 2, distinctNameCount: 2, technicalFieldCount: 2 });
  });

  it('drops malformed records and keeps at most 100 valid recent sessions', () => {
    const entries = Array.from({ length: MAX_BIDDER_HISTORY + 3 }, (_, i) => ({
      id: `session-${i}`, displayName: `Bidder ${i}`, experienceYears: i % 61,
      technicalField: 'Civil & Construction', startedAt: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
    }));
    entries.push({ id: 'invalid', displayName: 'Unknown', experienceYears: 7, technicalField: 'admin', startedAt: 'not-a-date' });
    const storage = storageWith({ [BIDDER_HISTORY_STORAGE_KEY]: JSON.stringify(entries) });
    const result = readBidderHistory(storage);
    expect(result).toHaveLength(MAX_BIDDER_HISTORY);
    expect(result[0].displayName).toBe(`Bidder ${MAX_BIDDER_HISTORY + 2}`);
  });

  it('does not block demo entry when browser storage is denied', () => {
    const deniedStorage = {
      getItem: () => { throw new Error('Storage denied'); },
      setItem: () => { throw new Error('Storage denied'); },
    };
    const result = appendBidderHistory({
      role: 'contractor', displayName: 'Ravi Patel', bidderProfile: { experienceYears: 8, technicalField: 'Civil & Construction' },
    }, deniedStorage);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ displayName: 'Ravi Patel', technicalField: 'Civil & Construction' });
  });
});
