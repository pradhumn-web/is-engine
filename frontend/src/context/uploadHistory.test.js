import { describe, expect, it } from 'vitest';
import { appendUploadHistory, MAX_UPLOAD_HISTORY, readUploadHistory, summarizeUploadHistory, UPLOAD_HISTORY_STORAGE_KEY } from './uploadHistory.js';

function storageWith(values = {}) {
  return {
    getItem: key => values[key] || null,
    setItem: (key, value) => { values[key] = value; },
  };
}

function sampleResult() {
  return {
    source_filename: 'original-name-not-used.pdf',
    extracted_parameters: { steel_grades: ['Fe 500D'], is_codes: ['IS 1786:2008'], testing: ['NABL test'] },
    primary_recommendation: {
      standard: { is_code: 'IS 1786:2008', title: 'High strength deformed steel bars' },
      confidence: 91.2,
      compliance_matrix: [
        { parameter: 'Tensile and bend properties', status: 'Partial', action_required: 'Attach heat-wise test evidence.' },
        { parameter: 'Heat chemistry', status: 'Missing', action_required: 'Attach chemical analysis.' },
      ],
      officer_view: { draft_tender_clauses: [{}, {}, {}], vendor_checklist: [{}, {}, {}, {}], obsolete_code_checks: [] },
      contractor_view: { bid_readiness_score: 25, verdict: 'HIGH DISQUALIFICATION RISK', required_certificates: ['BIS licence evidence', 'Mill Test Certificate'] },
    },
    recommendations: [],
  };
}

describe('browser-local demo upload history', () => {
  it('stores a filename and role-specific Officer and Bidder details without document bytes or source text', () => {
    const values = {};
    const result = sampleResult();
    result.raw_extracted_text = 'PRIVATE FULL DOCUMENT EXTRACTED TEXT — should never be retained';
    result.document_bytes = 'not stored';
    const history = appendUploadHistory({ name: 'C:\\private\\officer-spec.pdf', size: 42_000 }, result, 'officer', storageWith(values), new Date('2026-09-29T10:00:00.000Z'));
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ filename: 'officer-spec.pdf', fileType: 'PDF', uploadedAs: 'officer', primaryStandard: 'IS 1786:2008' });
    expect(history[0].officer).toMatchObject({ counts: { partial: 1, missing: 1 }, draftClauseCount: 3, checklistItemCount: 4 });
    expect(history[0].bidder).toMatchObject({ readinessScore: 25, verdict: 'HIGH DISQUALIFICATION RISK', gaps: [{ status: 'Partial' }, { status: 'Missing' }] });
    expect(history[0].extractedParameters).toContainEqual({ label: 'testing', values: ['NABL test'] });
    expect(history[0].bidder.gaps[0].action).toBe('Attach heat-wise test evidence.');
    expect(JSON.stringify(history[0])).not.toContain('PRIVATE FULL DOCUMENT EXTRACTED TEXT');
    expect(JSON.stringify(history[0])).not.toContain('document_bytes');
    expect(JSON.parse(values[UPLOAD_HISTORY_STORAGE_KEY])).toHaveLength(1);
  });

  it('labels bidder uploads and derives honest per-role counts', () => {
    const storage = storageWith();
    const now = new Date('2026-09-29T12:00:00.000Z');
    const first = appendUploadHistory({ name: 'tender.pdf', size: 10 }, sampleResult(), 'officer', storage, now);
    const result = appendUploadHistory({ name: 'bidder.docx', size: 25 }, sampleResult(), 'contractor', storage, new Date(now.getTime() + 1000));
    expect(result[0].uploadedAs).toBe('contractor');
    expect(result[1].uploadedAs).toBe('officer');
    expect(summarizeUploadHistory(result)).toEqual({ uploadCount: 2, officerUploads: 1, bidderUploads: 1, pdfUploads: 1 });
    expect(readUploadHistory(storage)).toHaveLength(2);
    expect(first).toHaveLength(1);
  });

  it('ignores unsupported or unsafe inputs and strips path components from filenames', () => {
    const storage = storageWith();
    expect(appendUploadHistory({ name: 'malware.exe' }, sampleResult(), 'officer', storage)).toHaveLength(0);
    expect(appendUploadHistory({ name: '../private/spec.txt' }, sampleResult(), 'officer', storage)[0].filename).toBe('spec.txt');
    expect(appendUploadHistory({ name: 'file.pdf' }, sampleResult(), 'admin', storage)).toHaveLength(1);
  });

  it('keeps at most 100 items and remains usable if local storage is denied', () => {
    const existing = Array.from({ length: MAX_UPLOAD_HISTORY + 3 }, (_, index) => ({
      id: `upload-${index}`, filename: `${index}.pdf`, uploadedAs: 'officer', uploadedAt: new Date(1_800_000_000_000 - index * 1000).toISOString(),
    }));
    expect(readUploadHistory(storageWith({ [UPLOAD_HISTORY_STORAGE_KEY]: JSON.stringify(existing) }))).toHaveLength(MAX_UPLOAD_HISTORY);
    const denied = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(appendUploadHistory({ name: 'spec.pdf' }, sampleResult(), 'officer', denied)).toHaveLength(1);
  });
});
