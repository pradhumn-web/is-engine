import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEMO_PDF_DOWNLOADS, DEMO_PROJECTS, EXAMPLES, getWorkspaceNav, hasClauseAudit, UploadHistoryView } from './App.jsx';

describe('BIS.SPEC tender demonstration data', () => {
  it('offers seven tender examples including the three new scenarios', () => {
    expect(EXAMPLES).toHaveLength(7);
    expect(EXAMPLES.map(example => example.name)).toEqual([
      'TMT Rebars Fe 500D',
      '1.1 kV Control Cables',
      '1.5 TR Room ACs',
      'Structural Steel E250',
      'Concrete Paving Blocks',
      'Solar Water Pumping System',
      'ICT Equipment Power Adaptors',
    ]);
  });

  it('keeps each new sample tied to its relevant BIS reference and domain', () => {
    expect(EXAMPLES[4]).toMatchObject({ domain: 'Civil & Construction' });
    expect(EXAMPLES[4].text).toContain('IS 15658:2021');
    expect(EXAMPLES[5]).toMatchObject({ domain: 'Mechanical & HVAC' });
    expect(EXAMPLES[5].text).toContain('IS 17018 (Part 1):2022');
    expect(EXAMPLES[6]).toMatchObject({ domain: 'Electronics & IT' });
    expect(EXAMPLES[6].text).toContain('IS/IEC 62368 (Part 1):2023');
  });

  it('offers clause actions only when a reviewed demo standard has clause data', () => {
    expect(hasClauseAudit({ catalogue_only: true, mandatory_clauses: [] })).toBe(false);
    expect(hasClauseAudit({ catalogue_only: false, mandatory_clauses: [{ clause_no: '5.1' }] })).toBe(true);
    expect(hasClauseAudit({ catalogue_only: false, mandatory_clauses: [] })).toBe(false);
  });

  it('keeps Bidder history Officer-only and Upcoming projects Bidder-only', () => {
    expect(getWorkspaceNav(true).map(([id]) => id)).toContain('history');
    expect(getWorkspaceNav(true).map(([id]) => id)).not.toContain('projects');
    expect(getWorkspaceNav(false).map(([id]) => id)).toContain('projects');
    expect(getWorkspaceNav(false).map(([id]) => id)).not.toContain('history');
  });

  it('provides actionable project-preparation scenarios without claiming a live tender schedule', () => {
    expect(DEMO_PROJECTS).toHaveLength(5);
    expect(DEMO_PROJECTS.every(project => project.illustrative && project.horizon.startsWith('Illustrative'))).toBe(true);
    expect(DEMO_PROJECTS.every(project => EXAMPLES.some(example => example.name === project.exampleName))).toBe(true);
    expect(DEMO_PROJECTS.every(project => project.preparation.length >= 3)).toBe(true);
  });

  it('offers different Officer tender and Bidder offer PDFs for upload practice', () => {
    expect(DEMO_PDF_DOWNLOADS).toHaveLength(2);
    expect(DEMO_PDF_DOWNLOADS.map(pdf => pdf.role)).toEqual(['Officer', 'Bidder']);
    expect(DEMO_PDF_DOWNLOADS[0].filename).not.toBe(DEMO_PDF_DOWNLOADS[1].filename);
    expect(DEMO_PDF_DOWNLOADS[0].detail).toContain('tender draft');
    expect(DEMO_PDF_DOWNLOADS[1].detail).toContain('incomplete');
  });

  it('renders both role-specific finding summaries from a PDF upload history item', () => {
    const html = renderToStaticMarkup(createElement(UploadHistoryView, {
      uploads: [{
        id: 'demo', filename: 'officer-spec.pdf', uploadedAt: '2026-09-29T10:00:00.000Z', fileType: 'PDF', sizeBytes: 2048,
        uploadedAs: 'officer', primaryStandard: 'IS 1786:2008', primaryStandardTitle: 'High strength deformed steel bars', recommendations: [], extractedParameters: [],
        officer: { counts: { aligned: 1, partial: 1, missing: 1, deviated: 0 }, draftClauseCount: 3, checklistItemCount: 5, obsoleteWarningCount: 0 },
        bidder: { counts: { aligned: 1, partial: 1, missing: 1, deviated: 0 }, readinessScore: 42, verdict: 'HIGH DISQUALIFICATION RISK', gaps: [{ parameter: 'Heat chemistry', status: 'Missing', action: 'Attach a heat-analysis report.' }] },
      }],
      stats: { uploadCount: 1, officerUploads: 1, bidderUploads: 0, pdfUploads: 1 },
    }));
    expect(html).toContain('officer-spec.pdf');
    expect(html).toContain('OFFICER REVIEW');
    expect(html).toContain('BIDDER READINESS');
    expect(html).toContain('42%');
    expect(html).toContain('Heat chemistry');
  });
});
