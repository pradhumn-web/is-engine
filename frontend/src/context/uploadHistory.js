export const UPLOAD_HISTORY_STORAGE_KEY = 'bis_demo_upload_history';
export const MAX_UPLOAD_HISTORY = 100;
const VALID_ROLES = new Set(['officer', 'contractor']);
const VALID_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);
const VALID_STATUSES = ['Aligned', 'Partial', 'Missing', 'Deviated'];

function safeText(value, max = 180) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function safeFilename(value) {
  const normalized = safeText(value, 300).replaceAll('\\', '/').split('/').pop() || 'uploaded-document';
  return normalized.slice(0, 120);
}

function summarizeMatrix(recommendation) {
  const matrix = Array.isArray(recommendation?.compliance_matrix) ? recommendation.compliance_matrix : [];
  const source = recommendation?.conformance_counts || {};
  return Object.fromEntries(VALID_STATUSES.map(status => [
    status.toLowerCase(), Number.isFinite(Number(source[status]))
      ? Math.max(0, Math.min(999, Number(source[status])))
      : matrix.filter(row => row?.status === status).length,
  ]));
}

function summarizeParameters(parameters = {}) {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return [];
  return Object.entries(parameters).slice(0, 8).flatMap(([key, values]) => {
    if (!Array.isArray(values)) return [];
    const clean = values.map(value => safeText(value, 50)).filter(Boolean).slice(0, 4);
    return clean.length ? [{ label: safeText(key.replaceAll('_', ' '), 40), values: clean }] : [];
  });
}

function createSummary(file, result, role, now) {
  const recommendation = result?.primary_recommendation || result?.recommendations?.[0] || null;
  const standard = recommendation?.standard || {};
  const officer = result?.officer_view || recommendation?.officer_view || {};
  const bidder = result?.contractor_view || recommendation?.contractor_view || {};
  const matrix = Array.isArray(recommendation?.compliance_matrix)
    ? recommendation.compliance_matrix
    : Array.isArray(result?.compliance_matrix) ? result.compliance_matrix : [];
  const counts = summarizeMatrix(recommendation || { compliance_matrix: matrix });
  const extension = safeFilename(file?.name).match(/\.[^.]+$/)?.[0]?.toLowerCase() || '';
  const parsedSize = Number(file?.size);
  const id = `${now.toISOString()}-${Math.random().toString(36).slice(2, 9)}`;
  const recommendations = (Array.isArray(result?.recommendations) ? result.recommendations : recommendation ? [recommendation] : [])
    .slice(0, 3)
    .map(hit => ({
      code: safeText(hit?.standard?.is_code, 48),
      title: safeText(hit?.standard?.title, 120),
      confidence: Number.isFinite(Number(hit?.confidence)) ? Math.round(Number(hit.confidence) * 10) / 10 : null,
    }))
    .filter(hit => hit.code || hit.title);

  const gaps = matrix.filter(row => ['Missing', 'Partial', 'Deviated'].includes(row?.status)).slice(0, 5)
    .map(row => ({ parameter: safeText(row.parameter, 100), status: safeText(row.status, 20), action: safeText(row.action_required, 160) }));

  return {
    id,
    uploadedAt: now.toISOString(),
    filename: safeFilename(file?.name),
    fileType: VALID_EXTENSIONS.has(extension) ? extension.slice(1).toUpperCase() : 'DOCUMENT',
    sizeBytes: Number.isFinite(parsedSize) ? Math.max(0, Math.min(parsedSize, 15 * 1024 * 1024)) : 0,
    uploadedAs: role,
    primaryStandard: safeText(standard.is_code, 48),
    primaryStandardTitle: safeText(standard.title, 120),
    recommendations,
    extractedParameters: summarizeParameters(result?.extracted_parameters),
    officer: {
      counts,
      draftClauseCount: Array.isArray(officer.draft_tender_clauses) ? officer.draft_tender_clauses.length : 0,
      checklistItemCount: Array.isArray(officer.vendor_checklist) ? officer.vendor_checklist.length : 0,
      obsoleteWarningCount: Array.isArray(officer.obsolete_code_checks) ? officer.obsolete_code_checks.length : 0,
    },
    bidder: {
      counts,
      readinessScore: Number.isFinite(Number(bidder.bid_readiness_score)) ? Math.max(0, Math.min(100, Number(bidder.bid_readiness_score))) : null,
      verdict: safeText(bidder.verdict, 64),
      requiredDocuments: Array.isArray(bidder.required_certificates) ? bidder.required_certificates.map(x => safeText(x, 140)).filter(Boolean).slice(0, 6) : [],
      gaps,
    },
  };
}

export function readUploadHistory(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return [];
    const entries = JSON.parse(target.getItem(UPLOAD_HISTORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(entries)) return [];
    return entries.filter(entry => entry && typeof entry === 'object' && VALID_ROLES.has(entry.uploadedAs)
      && typeof entry.filename === 'string' && typeof entry.uploadedAt === 'string' && Number.isFinite(Date.parse(entry.uploadedAt)))
      .slice(0, MAX_UPLOAD_HISTORY);
  } catch {
    return [];
  }
}

export function appendUploadHistory(file, result, role, storage, now = new Date()) {
  const current = readUploadHistory(storage);
  if (!VALID_ROLES.has(role) || !file?.name || !result || typeof result !== 'object') return current;
  const extension = safeFilename(file.name).match(/\.[^.]+$/)?.[0]?.toLowerCase() || '';
  if (!VALID_EXTENSIONS.has(extension)) return current;
  let target = storage;
  if (!target) {
    try { target = globalThis.localStorage; } catch { target = null; }
  }
  const next = [createSummary(file, result, role, now), ...current].slice(0, MAX_UPLOAD_HISTORY);
  try { target?.setItem(UPLOAD_HISTORY_STORAGE_KEY, JSON.stringify(next)); } catch { /* demo analysis should work if local storage is denied */ }
  return next;
}

export function summarizeUploadHistory(entries = []) {
  return {
    uploadCount: entries.length,
    officerUploads: entries.filter(entry => entry.uploadedAs === 'officer').length,
    bidderUploads: entries.filter(entry => entry.uploadedAs === 'contractor').length,
    pdfUploads: entries.filter(entry => entry.fileType === 'PDF').length,
  };
}
