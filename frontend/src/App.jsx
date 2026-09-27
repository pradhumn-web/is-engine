import { useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight, BarChart3, BookOpen,
  BriefcaseBusiness, Building2, Check, ChevronDown, Clipboard, Copy, Download,
  FileCheck2, FileText, Filter, Layers3, Search, ShieldCheck, Upload, X,
} from 'lucide-react';
import { useRole } from './context/RoleContext.jsx';

const EXAMPLES = [
  { name: 'TMT Rebars Fe 500D', meta: 'CIVIL  /  METRO VIADUCT', domain: 'Civil & Construction', text: 'Supply Fe 500D TMT rebars for metro viaduct foundations, minimum yield strength 500 MPa, elongation not less than 16%. Steel shall comply with IS 1786:2008. Submit heat-wise mill test certificate, carbon equivalent and NABL laboratory tensile and bend reports. BIS ISI licence CM/L shall be valid for the offered grade and manufacturing location.' },
  { name: '1.1 kV Control Cables', meta: 'ELECTRICAL  /  POWER DISTRIBUTION', domain: 'Electrical & Cables', text: 'Supply 1.1 kV (1100 V) PVC insulated copper conductor control cables for power distribution. Cable construction, conductor resistance, insulation resistance and voltage withstand tests shall comply with IS 694:2010. Provide batch traceability, BIS licence and current NABL test report.' },
  { name: '1.5 TR Room ACs', meta: 'MECHANICAL  /  INVERTER SPLIT', domain: 'Mechanical & HVAC', text: 'Supply 1.5 TR inverter split room air conditioners, rated capacity declared by the manufacturer. Submit cooling capacity, power input and ISEER test reports to applicable current BEE label schedule and IS 1391. Include electrical safety, warranty and installation documentation.' },
  { name: 'Structural Steel E250', meta: 'CIVIL  /  BRIDGE GIRDERS', domain: 'Civil & Construction', text: 'Bridge girder plates in structural steel grade E250 B0 conforming to IS 2062:2011. Minimum yield strength 250 MPa, tensile strength 410–540 MPa and impact testing at 0°C. Supply heat-wise mill test certificates, chemical analysis, dimensions and BIS licence.' },
];
const DOMAINS = ['All domains', 'Civil & Construction', 'Electrical & Cables', 'Electronics & IT', 'Mechanical & HVAC', 'Textiles & PPE'];
const api = async (path, options) => {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || `Request failed (${response.status})`);
  return response;
};
const copyText = async (text) => { try { await navigator.clipboard.writeText(text); } catch { /* clipboard may be blocked in a preview */ } };
function Tag({ children, tone = '' }) { return <span className={`tag ${tone}`}>{children}</span>; }

function App() {
  const { userRole, toggleRole, isOfficer } = useRole();
  const [tab, setTab] = useState('analyze');
  const [text, setText] = useState(EXAMPLES[0].text);
  const [domain, setDomain] = useState('All domains');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const showcaseStarted = useRef(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const selected = result?.primary_recommendation;
  const recommendations = result?.recommendations || [];

  async function runAnalysis() {
    if (!text.trim() && !file) { setError('Add specification text or choose a document to analyze.'); return; }
    setBusy(true); setError('');
    try {
      let response;
      if (file) {
        const form = new FormData(); form.append('file', file); form.append('role', userRole);
        if (domain !== 'All domains') form.append('domain_filter', domain);
        response = await api('/api/v1/analyze-file', { method: 'POST', body: form });
      } else {
        response = await api('/api/v1/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ procurement_text: text, domain_filter: domain === 'All domains' ? null : domain, top_k: 5, role: userRole }) });
      }
      setResult(await response.json());
    } catch (e) { setError(e.message || 'Unable to analyze specification.'); }
    finally { setBusy(false); }
  }

  useEffect(() => { if (showcaseStarted.current) return; showcaseStarted.current = true; runAnalysis().catch(() => {}); }, []); // preloaded SIH showcase
  useEffect(() => {
    if (tab !== 'directory') return;
    let active = true; setCatalogLoading(true);
    api(`/api/v1/standards?search=${encodeURIComponent(search)}`).then(r => r.json()).then(x => { if (active) setCatalog(x.standards || []); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [tab, search]);
  useEffect(() => {
    if (tab !== 'analytics') return;
    api('/api/v1/analytics').then(r => r.json()).then(setAnalytics).catch(e => setError(e.message));
  }, [tab, result]);

  const nav = [['analyze', 'Analyze & Match', Layers3], ['analytics', 'Analytics Dashboard', BarChart3], ['directory', 'BIS Directory', BookOpen]];
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">[IS]</div><div><strong>BIS.SPEC</strong><span>STANDARDS INTELLIGENCE</span></div><Tag tone="soft">SIH PROTOTYPE</Tag></div>
      <nav className="main-nav">{nav.map(([id, label, Icon]) => <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => { setTab(id); setError(''); }}><Icon size={15} />{label}</button>)}</nav>
      <div className="top-actions"><div className="ready"><i />RAG READY</div><button className={`role-switch ${userRole}`} onClick={toggleRole} title="Toggle viewing mode">{isOfficer ? <Building2 size={15} /> : <BriefcaseBusiness size={15} />}<span>{isOfficer ? 'BUYER / OFFICER' : 'BIDDER / CONTRACTOR'}</span><ChevronDown size={13} /></button><a className="docs-link guide-link" href="/guide/">GUIDE ↗</a><a className="docs-link" href="/docs" target="_blank" rel="noreferrer">API DOCS ↗</a></div>
    </header>
    <main className="page-wrap">
      <div className="page-heading"><div><div className="eyebrow">SIH PROTOTYPE / PROCUREMENT ASSURANCE / INDIA</div><h1>{tab === 'analyze' ? 'Specification workbench' : tab === 'analytics' ? 'Compliance analytics' : 'Standards directory'}</h1><p>{tab === 'analyze' ? 'Map tender language to standards. Surface evidence gaps before bid or publication.' : tab === 'analytics' ? 'A live view of standards coverage, citations and observed non-conformance.' : 'Search the embedded reference catalog and inspect clause-level summaries.'}</p></div><div className="header-stat"><div className="stat-icon"><ShieldCheck size={17} /></div><div><b>20</b><span>REFERENCE STANDARDS</span></div></div></div>
      {error && <div className="error-banner"><AlertTriangle size={16} />{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
      {tab === 'analyze' && <>
        <section className="demo-banner"><div className="demo-mark"><Activity size={16} /></div><div><b>SIH LIVE DEMO · PROCUREMENT INTELLIGENCE</b><span>Showcase tender is preloaded. Analyze it now, switch examples, or upload your own file.</span></div><Tag tone="green">DEMO READY</Tag></section>
        <section className="ingest-grid">
          <div className="panel ingest-panel">
            <div className="panel-top"><div><div className="eyebrow">01 / INGEST SPECIFICATION</div><h2>What are you buying?</h2></div><div className="mode-chip"><FileText size={14} /> TENDER INPUT</div></div>
            <div className="quick-label">LOAD A REPRESENTATIVE EXAMPLE</div>
            <div className="example-grid">{EXAMPLES.map((example, i) => <button className={`example-card ${text === example.text ? 'selected-example' : ''}`} key={example.name} onClick={() => { setText(example.text); setFile(null); setDomain('All domains'); setResult(null); }}><span className="example-num">0{i + 1}</span><span><b>{example.name}</b><small>{example.meta}</small></span><ArrowRight size={14} /></button>)}</div>
            <div className="input-tools"><span>SPECIFICATION TEXT</span><label className="file-pick"><Upload size={14} />{file ? file.name : 'Upload PDF / DOCX / TXT'}<input type="file" accept=".pdf,.docx,.txt" onChange={e => { setFile(e.target.files?.[0] || null); if (e.target.files?.[0]) { setText(''); setResult(null); } }} /></label></div>
            <textarea value={text} onChange={e => { setText(e.target.value); setFile(null); setResult(null); }} placeholder="Paste tender requirements, material properties, test criteria and certification conditions…" />
            <div className="textarea-foot"><span>UTF-8 · SECTION-AWARE PARSING</span><span>{text.split('\n').length} LINES&nbsp; / &nbsp;{words} WORDS</span></div>
            <div className="action-row"><label className="domain-select"><Filter size={14} /><select value={domain} onChange={e => setDomain(e.target.value)}>{DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}</select><ChevronDown size={13} /></label><button className="primary-btn" disabled={busy} onClick={runAnalysis}>{busy ? <><span className="spinner" /> ANALYZING…</> : <>Analyze Specs & Recommend BIS Standards <ArrowRight size={15} /></>}</button></div>
          </div>
          <aside className="panel process-panel"><div className="eyebrow">WORKFLOW STATUS</div><h3>From text to assurance</h3><div className="flow-step done"><span className="flow-icon"><Check size={14} /></span><div><b>Document intake</b><small>PDF · DOCX · Plain text</small></div><Tag tone="green">READY</Tag></div><div className="flow-step done"><span className="flow-icon"><Activity size={14} /></span><div><b>Hybrid retrieval</b><small>BM25 + TF-IDF + exact codes</small></div><Tag tone="green">LIVE</Tag></div><div className={`flow-step ${result ? 'done' : 'pending'}`}><span className="flow-icon">03</span><div><b>Clause comparison</b><small>Alignment · evidence · deviation</small></div><Tag tone={result ? 'green' : ''}>{result ? 'DONE' : 'NEXT'}</Tag></div><div className="process-note"><AlertTriangle size={15} /><span>Screening aid only. Confirm QCO coverage and current editions against official BIS and ministry notifications.</span></div><div className="process-foot"><span>IN-MEMORY INDEX</span><b>20 <small>STANDARDS</small></b></div></aside>
        </section>
        {result && <section className="results-section">
          <div className="section-title"><div><div className="eyebrow">02 / RETRIEVAL RESULTS</div><h2>Recommended standards</h2></div><button className="outline-btn" onClick={() => setModal('report')}><FileCheck2 size={14} /> Audit report</button></div>
          <ParameterTags data={result.extracted_parameters} />
          <div className="results-layout"><div className="recommendation-list">{recommendations.map((hit, i) => <StandardCard key={hit.standard.is_code} hit={hit} index={i} onOpen={() => setModal({ type: 'clauses', hit })} />)}</div><div className="view-panel panel">{isOfficer ? <OfficerView data={result.officer_view} onOpen={() => setModal({ type: 'diff', hit: selected })} /> : <ContractorView data={result.contractor_view} onOpen={() => setModal({ type: 'diff', hit: selected })} />}</div></div>
          <div className="notice-line"><ShieldCheck size={14} />{result.notice}</div>
        </section>}
      </>}
      {tab === 'analytics' && <Analytics data={analytics} />}
      {tab === 'directory' && <section className="panel directory-panel"><div className="directory-head"><div><div className="eyebrow">REFERENCE CATALOG / 20 ENTRIES</div><h2>Indian Standards directory</h2></div><div className="search-box"><Search size={15} /><input placeholder="Search code, product, keyword…" value={search} onChange={e => setSearch(e.target.value)} /></div></div><div className="domain-pills">{DOMAINS.slice(1).map(d => <button key={d} className={domain === d ? 'selected' : ''} onClick={() => setDomain(domain === d ? 'All domains' : d)}>{d}</button>)}</div><Directory data={catalog.filter(s => domain === 'All domains' || s.domain === domain)} loading={catalogLoading} /></section>}
    </main>
    <footer><span>© BIS.SPEC / PROCUREMENT INTELLIGENCE</span><span>REFERENCE CORPUS — VALIDATE AGAINST OFFICIAL NOTIFICATIONS <a href="https://www.bis.gov.in/" target="_blank" rel="noreferrer">BIS ↗</a></span></footer>
    {modal && <Modal data={modal} result={result} onClose={() => setModal(null)} />}
  </div>;
}

function ParameterTags({ data = {} }) {
  const entries = Object.entries(data);
  return <section className="panel parameter-panel"><div className="parameter-heading"><div><div className="eyebrow">ENGINEERING SIGNALS</div><b>Extracted technical parameters</b></div><Tag tone="soft">{entries.length} GROUPS</Tag></div>{entries.length ? <div className="parameter-grid">{entries.map(([key, values]) => <div key={key}><small>{key.replaceAll('_', ' ')}</small><b>{Array.isArray(values) ? values.join(' · ') : String(values)}</b></div>)}</div> : <p className="muted">No explicit technical parameters detected in this tender text.</p>}</section>;
}
function StandardCard({ hit, index, onOpen }) {
  const standard = hit.standard; const counts = hit.conformance_counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return <article className={`standard-card ${index === 0 ? 'primary' : ''}`}>
    <div className="card-kicker">{index === 0 ? 'PRIMARY REGULATORY RECOMMENDATION' : 'ALTERNATIVE MATCH'}<span className="match-badge">[{hit.confidence}% MATCH]</span></div>
    <div className="standard-main"><div><div className="standard-code">{standard.is_code}</div><h3>{standard.title}</h3><p>{standard.scope}</p></div><div className="compliance-pill"><i />{hit.tier} CONFIDENCE</div></div>
    <div className="card-meta"><Tag>{standard.domain}</Tag>{standard.qco_mandatory && <Tag tone="amber">□ QCO MANDATORY</Tag>}<Tag tone="soft">{standard.certification_mark}</Tag></div>
    <div className="conformance"><div className="progress"><i style={{ width: `${Math.max(4, Math.round(100 * (counts.Aligned || 0) / Math.max(1, total)))}%` }} /></div><div className="counts"><span><b className="c-green">{counts.Aligned || 0}</b> Aligned</span><span><b className="c-gray">{counts.Missing || 0}</b> Missing</span><span><b className="c-red">{counts.Deviated || 0}</b> Deviations</span><span><b className="c-amber">{counts.Partial || 0}</b> Partial</span></div></div>
    <div className="card-actions"><button onClick={onOpen}><Layers3 size={14} /> Side-by-side diff</button><button onClick={onOpen}><BookOpen size={14} /> Clause breakdown</button><span>HYBRID MATCH / BM25 + TF-IDF</span></div>
  </article>;
}
function OfficerView({ data, onOpen }) {
  return <><div className="view-title"><Building2 size={17} /><div><b>Officer view</b><small>BUYER / TENDER AUTHORITY</small></div></div>
    <div className="view-block"><h4><AlertTriangle size={14} /> OBSOLETE CODE CHECK</h4>{data?.obsolete_code_checks?.length ? data.obsolete_code_checks.map((x, i) => <p className="warn-text" key={i}>{x.cited_code} — {x.warning}</p>) : <p className="muted">No obvious superseded revision citation detected in this text.</p>}</div>
    <div className="view-block"><h4><Clipboard size={14} /> TENDER CLAUSE DRAFTS</h4>{(data?.draft_tender_clauses || []).map(item => <div className="draft-row" key={item.section}><div className="draft-row-head"><span>{item.section}</span><button className="mini-copy" onClick={() => copyText(item.text)}><Copy size={12} /> COPY</button></div><p>{item.text}</p></div>)}</div>
    <div className="view-block"><h4><FileCheck2 size={14} /> VENDOR QUALIFICATION</h4>{(data?.vendor_checklist || []).map(item => <div className="check-row" key={item.document}><Check size={13} /><span>{item.document}</span><small>{item.stage}</small><button className="mini-copy" onClick={() => copyText(item.document)} aria-label="Copy checklist item"><Copy size={12} /></button></div>)}</div>
    <button className="outline-btn wide" onClick={onOpen}>Review clause comparison <ArrowRight size={13} /></button>
  </>;
}
function ContractorView({ data, onOpen }) {
  const score = data?.bid_readiness_score ?? 0;
  const matrix = data?.compliance_matrix || [];
  return <><div className="view-title contractor-title"><BriefcaseBusiness size={17} /><div><b>Contractor view</b><small>BIDDER / CONTRACTOR</small></div></div>
    <div className="readiness"><div className="gauge"><strong>{score}<small>%</small></strong><span>READINESS</span></div><div><Tag tone={score >= 85 ? 'green' : 'amber'}>{data?.verdict || 'NO ANALYSIS'}</Tag><p>Resolve open evidence gaps before bid submission.</p></div></div>
    <div className="view-block"><h4><FileCheck2 size={14} /> ENVELOPE A CHECKLIST</h4>{(data?.required_certificates || []).map((item, i) => <div className="check-row" key={item}><span className="empty-check">{String(i + 1).padStart(2, '0')}</span><span>{item}</span><button className="mini-copy" onClick={() => copyText(item)} aria-label="Copy checklist item"><Copy size={12} /></button></div>)}</div>
    <div className="view-block"><h4><Clipboard size={14} /> COMPLIANCE MATRIX</h4><div className="mini-matrix">{matrix.map((row, i) => <div key={`${row.clause_no}-${i}`}><b>{row.parameter}</b><Tag tone={row.status === 'Aligned' ? 'green' : row.status === 'Deviated' ? 'red' : 'amber'}>{row.status}</Tag><p>{row.action_required}</p></div>)}</div><button className="text-btn" onClick={onOpen}>View side-by-side requirements <ArrowRight size={13} /></button></div>
    <div className="view-block"><h4><Layers3 size={14} /> EQUIVALENT OPTIONS</h4>{(data?.equivalent_suggestions || []).map(item => <div className="equiv" key={item.suggestion}><b>{item.suggestion}</b><p>{item.technical_justification}</p><small>COMMERCIAL NOTE · {item.commercial_advantage}</small></div>)}</div>
  </>;
}
function Analytics({ data }) {
  if (!data) return <div className="loading-state"><span className="spinner dark" /> Loading analytics…</div>;
  const domains = Object.entries(data.domain_distribution || {}); const max = Math.max(1, ...domains.map(x => x[1]));
  return <><section className="kpi-grid"><Kpi label="Standards indexed" value={data.standards_count || 20} note="Across five domains" icon={BookOpen} /><Kpi label="Analyses this session" value={data.analyses_count || 0} note="In-memory session metrics" icon={Activity} /><Kpi label="Core domains" value={domains.length} note="Civil · Electrical · IT · HVAC · PPE" icon={Layers3} /><Kpi label="Audit posture" value="LIVE" note="Evidence-first screening" icon={ShieldCheck} /></section>
    <section className="analytics-grid"><div className="panel chart-panel"><div className="eyebrow">01 / COVERAGE</div><h2>Standards by domain</h2>{domains.map(([name, value]) => <div className="bar-row" key={name}><div><span>{name}</span><b>{value}</b></div><i><em style={{ width: `${value / max * 100}%` }} /></i></div>)}</div>
      <div className="panel chart-panel"><div className="eyebrow">02 / CITATION SIGNAL</div><h2>Frequently matched standards</h2>{data.frequently_cited_standards?.length ? data.frequently_cited_standards.map(x => <div className="rank-row" key={x.is_code}><span>{x.is_code}</span><b>{x.count}</b></div>) : <Empty text="Analyze a tender to populate citation volume." />}</div>
      <div className="panel chart-panel"><div className="eyebrow">03 / NON-CONFORMANCE</div><h2>Prevalent gaps</h2>{data.prevalent_nonconformances?.length ? data.prevalent_nonconformances.map(x => <div className="rank-row" key={x.parameter}><span>{x.parameter}</span><b>{x.count}</b></div>) : <Empty text="Run an analysis to identify recurring gaps." />}</div></section></>;
}
function Kpi({ label, value, note, icon: Icon }) { return <div className="panel kpi"><div className="kpi-icon"><Icon size={16} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Empty({ text }) { return <div className="empty-state"><Activity size={17} /><span>{text}</span></div>; }
function Directory({ data, loading }) {
  const [open, setOpen] = useState('');
  if (loading) return <div className="loading-state"><span className="spinner dark" /> Loading directory…</div>;
  if (!data.length) return <Empty text="No standards match this filter." />;
  return <div className="catalog-list">{data.map(standard => <article className="catalog-item" key={standard.is_code}><button onClick={() => setOpen(open === standard.is_code ? '' : standard.is_code)}><span className="catalog-code">{standard.is_code}</span><span className="catalog-name"><b>{standard.title}</b><small>{standard.domain} · {standard.qco_mandatory ? 'QCO FLAGGED' : 'NO QCO FLAG IN THIS CORPUS'}</small></span><span className="catalog-arrow">{open === standard.is_code ? '−' : '+'}</span></button>
    {open === standard.is_code && <div className="catalog-detail"><p>{standard.scope}</p><div className="parameter-list">{Object.entries(standard.key_parameters || {}).map(([key, value]) => <span key={key}><small>{key.replaceAll('_', ' ')}</small><b>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</b></span>)}</div><div className="clause-grid">{standard.mandatory_clauses.map(clause => <div key={clause.clause_no}><b>{clause.clause_no} · {clause.title}</b><p>{clause.requirement}</p><small>METHOD · {clause.testing_method}</small></div>)}</div></div>}</article>)}</div>;
}
function Modal({ data, result, onClose }) {
  const hit = data?.hit || result?.primary_recommendation; const [filter, setFilter] = useState('All');
  const matrix = hit?.compliance_matrix || []; const visible = matrix.filter(row => filter === 'All' || row.status.toLowerCase() === filter.toLowerCase()); const report = data === 'report';
  async function downloadPdf() { if (!result) return; const response = await api('/api/v1/export-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bis-compliance-audit.pdf'; anchor.click(); URL.revokeObjectURL(url); }
  function downloadJson() { const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bis-audit.json'; anchor.click(); URL.revokeObjectURL(url); }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal"><header><div><div className="eyebrow">{report ? 'AUDIT EXPORT' : 'CLAUSE COMPARATOR'}</div><h2>{report ? 'Compliance audit report' : hit?.standard?.is_code || 'Clause analysis'}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></header>
    {report ? <><div className="report-sheet"><div className="report-logo">[IS] <b>BIS.SPEC / AUDIT SHEET</b></div><p>Generated {result?.generated_at || '—'} · Reference: {hit?.standard?.is_code || '—'}</p><h3>Screening summary</h3><p>{hit?.standard?.title || 'No primary recommendation yet.'}</p><div className="report-stats"><span><b>{hit?.confidence || 0}%</b> match</span><span><b>{result?.contractor_view?.bid_readiness_score || 0}%</b> readiness</span><span><b>{matrix.length}</b> clauses</span></div><h3>Extracted parameters</h3><p>{Object.entries(result?.extracted_parameters || {}).map(([k, v]) => `${k.replaceAll('_', ' ')}: ${v.join(', ')}`).join('  /  ') || 'No parameter values found.'}</p><h3>Recommended action</h3><p>Review clause findings and confirm all applicable editions, quality control orders and tender-specific requirements against authoritative records before procurement decisions.</p></div><div className="modal-actions"><button className="outline-btn" onClick={downloadJson}><Download size={14} /> JSON</button><button className="outline-btn" onClick={() => window.print()}>Print</button><button className="primary-btn" onClick={downloadPdf}><Download size={14} /> Download PDF</button></div></> : <><div className="diff-head"><div><small>TENDER SPECIFICATION CONTENT</small><p>{hit?.compliance_matrix?.[0]?.tender_requirement || 'Tender content not available.'}</p></div><ArrowRight size={17} /><div><small>REFERENCE REQUIREMENT · {hit?.standard?.is_code}</small><p>{hit?.standard?.scope}</p></div></div><div className="filter-tabs">{['All', 'Missing', 'Deviated', 'Partial', 'Aligned'].map(status => <button className={filter === status ? 'selected' : ''} key={status} onClick={() => setFilter(status)}>{status}</button>)}</div><div className="matrix-list">{visible.map((row, i) => <article className="matrix-row" key={`${row.clause_no}-${i}`}><div className="matrix-top"><b>{row.clause_no} / {row.parameter}</b><Tag tone={row.status === 'Aligned' ? 'green' : row.status === 'Deviated' ? 'red' : 'amber'}>{row.status}</Tag></div><div className="matrix-cols"><p><small>TENDER TEXT</small>{row.tender_requirement}</p><p><small>STANDARD REQUIREMENT</small>{row.standard_spec}</p></div><div className="action-required"><AlertTriangle size={13} /><span>{row.action_required}</span><button onClick={() => copyText(row.action_required)}><Copy size={13} /> COPY</button></div></article>)}</div><div className="modal-actions"><span>NOT OFFICIAL ADVICE · VALIDATE BEFORE USE</span><button className="outline-btn" onClick={onClose}>Close</button></div></>}
  </section></div>;
}
export default App;
