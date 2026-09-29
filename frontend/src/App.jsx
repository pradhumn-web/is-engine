import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight, BarChart3, BookOpen,
  BriefcaseBusiness, Building2, CalendarDays, Check, ChevronDown, Clipboard, ClipboardCheck, Clock3, Copy, Download,
  FileCheck2, FileText, Filter, Layers3, MapPin, Menu, Search, ShieldCheck, Upload, UserRound, UsersRound, X,
} from 'lucide-react';
import { useRole } from './context/RoleContext.jsx';
import LoginScreen from './LoginScreen.jsx';

export const EXAMPLES = [
  { name: 'TMT Rebars Fe 500D', meta: 'CIVIL  /  METRO VIADUCT', domain: 'Civil & Construction', text: 'Supply Fe 500D TMT rebars for metro viaduct foundations, minimum yield strength 500 MPa, elongation not less than 16%. Steel shall comply with IS 1786:2008. Submit heat-wise mill test certificate, carbon equivalent and NABL laboratory tensile and bend reports. BIS ISI licence CM/L shall be valid for the offered grade and manufacturing location.' },
  { name: '1.1 kV Control Cables', meta: 'ELECTRICAL  /  POWER DISTRIBUTION', domain: 'Electrical & Cables', text: 'Supply 1.1 kV (1100 V) PVC insulated copper conductor control cables for power distribution. Cable construction, conductor resistance, insulation resistance and voltage withstand tests shall comply with IS 694:2010. Provide batch traceability, BIS licence and current NABL test report.' },
  { name: '1.5 TR Room ACs', meta: 'MECHANICAL  /  INVERTER SPLIT', domain: 'Mechanical & HVAC', text: 'Supply 1.5 TR inverter split room air conditioners, rated capacity declared by the manufacturer. Submit cooling capacity, power input and ISEER test reports to applicable current BEE label schedule and IS 1391. Include electrical safety, warranty and installation documentation.' },
  { name: 'Structural Steel E250', meta: 'CIVIL  /  BRIDGE GIRDERS', domain: 'Civil & Construction', text: 'Bridge girder plates in structural steel grade E250 B0 conforming to IS 2062:2011. Minimum yield strength 250 MPa, tensile strength 410–540 MPa and impact testing at 0°C. Supply heat-wise mill test certificates, chemical analysis, dimensions and BIS licence.' },
  { name: 'Concrete Paving Blocks', meta: 'CIVIL  /  CAMPUS ACCESS ROAD', domain: 'Civil & Construction', text: 'Supply precast concrete paving blocks for campus access roads and pedestrian areas in the specified shape, thickness, strength class, colour and laying pattern. Product shall comply with IS 15658:2021. Submit lot identification, dimensional inspection records and accredited laboratory test results for the specified performance class.' },
  { name: 'Solar Water Pumping System', meta: 'MECHANICAL  /  REMOTE WATER SUPPLY', domain: 'Mechanical & HVAC', text: 'Supply and commission a solar photovoltaic water pumping system with centrifugal pump, controller and array sized for the stated daily water demand and total dynamic head. The pumping system shall be evaluated against IS 17018 (Part 1):2022. Submit pump performance curve, duty-point test report, controller protections, installation plan and warranty.' },
  { name: 'ICT Equipment Power Adaptors', meta: 'ELECTRONICS & IT  /  OFFICE NETWORK', domain: 'Electronics & IT', text: 'Supply external power adaptors for audio, video and information and communication technology equipment. Safety shall be assessed against IS/IEC 62368 (Part 1):2023, including insulation, temperature, electric shock and fire safeguards applicable to the declared product. Submit model-specific test evidence, markings, rating information and current certification records where applicable.' },
];
export const DEMO_PROJECTS = [
  { id: 'transit-civil', title: 'Urban transit civil works', domain: 'Civil & Construction', location: 'Illustrative urban corridor', horizon: 'Illustrative · no official date', exampleName: 'TMT Rebars Fe 500D', illustrative: true, scope: 'Scenario covering reinforcement steel, structural steel, concrete and related testing for a transport-infrastructure package.', preparation: ['Organise grade-wise mill certificates and batch traceability.', 'Check design compatibility and specified test evidence.', 'Review current standards and applicable notices before responding.'] },
  { id: 'solar-pumping', title: 'Solar water-pumping cluster', domain: 'Mechanical & HVAC', location: 'Illustrative rural water scheme', horizon: 'Illustrative · no official date', exampleName: 'Solar Water Pumping System', illustrative: true, scope: 'Scenario covering solar pump sets, controls, installation and after-sales support across multiple sites.', preparation: ['Prepare pump curves against the stated duty point.', 'Collect controller, installation and warranty documentation.', 'Keep model-specific test reports and service coverage details ready.'] },
  { id: 'campus-electrical', title: 'Public campus electrical renewal', domain: 'Electrical & Cables', location: 'Illustrative education facilities', horizon: 'Illustrative · no official date', exampleName: '1.1 kV Control Cables', illustrative: true, scope: 'Scenario covering internal wiring, low-voltage distribution, protective devices and commissioning records.', preparation: ['Map offered products to the tender’s electrical schedule.', 'Gather cable, switchgear and installation evidence by model.', 'Prepare an inspection and commissioning plan.'] },
  { id: 'healthcare-hvac', title: 'Healthcare ventilation and cooling', domain: 'Mechanical & HVAC', location: 'Illustrative public healthcare sites', horizon: 'Illustrative · no official date', exampleName: '1.5 TR Room ACs', illustrative: true, scope: 'Scenario covering HVAC equipment, ventilation components, controls and performance commissioning.', preparation: ['Prepare performance data at the specified operating conditions.', 'Document filters, controls, service intervals and warranty.', 'Check energy-label and product-scope requirements for each item.'] },
  { id: 'digital-learning', title: 'Digital learning and network equipment', domain: 'Electronics & IT', location: 'Illustrative school and training sites', horizon: 'Illustrative · no official date', exampleName: 'ICT Equipment Power Adaptors', illustrative: true, scope: 'Scenario covering computing devices, displays, connectivity and power accessories for shared learning spaces.', preparation: ['List exact models, interfaces and included accessories.', 'Collect product-safety and applicable registration evidence.', 'Prepare support, replacement and warranty commitments.'] },
];
export const DEMO_PDF_DOWNLOADS = [
  { role: 'Officer', name: 'Officer sample tender', filename: 'BIS-SPEC-Officer-Demo-Tender.pdf', url: '/manus-storage/officer-tender_6732afe8.pdf', detail: 'A tender draft with explicit Fe 500D requirements, acceptance evidence and officer review prompts.' },
  { role: 'Bidder', name: 'Bidder sample technical offer', filename: 'BIS-SPEC-Bidder-Demo-Offer.pdf', url: '/manus-storage/bidder-offer_468884d0.pdf', detail: 'A deliberately incomplete Fe 500D offer to demonstrate missing evidence and readiness gaps.' },
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
  const { isAuthenticated, signIn } = useRole();
  return isAuthenticated ? <Workspace /> : <LoginScreen onSignIn={signIn} />;
}

function Workspace() {
  const { userRole, isOfficer, session, bidderProfile, bidderHistory, bidderHistoryStats, uploadHistory, uploadHistoryStats, recordUpload, signOut } = useRole();
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
  const [catalogCount, setCatalogCount] = useState(50);
  const [analytics, setAnalytics] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      const data = await response.json();
      setResult(data);
      if (file) recordUpload(file, data, userRole);
    } catch (e) { setError(e.message || 'Unable to analyze specification.'); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    api('/api/v1/standards').then(r => r.json()).then(data => setCatalogCount(data.count || data.standards?.length || 50)).catch(() => {});
  }, []);
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

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.querySelector('.app-shell');
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    const items = root.querySelectorAll('[data-reveal]');
    items.forEach((item, index) => {
      item.classList.add('scroll-reveal');
      item.style.setProperty('--reveal-delay', `${Math.min(index * 35, 175)}ms`);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [tab, result]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = event => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    const closeOnOutsideTap = event => { if (!event.target.closest('.topbar')) setMobileMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideTap);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideTap);
    };
  }, [mobileMenuOpen]);

  const nav = getWorkspaceNav(isOfficer);
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">[IS]</div><div><strong>BIS.SPEC</strong><span>STANDARDS INTELLIGENCE</span></div><Tag tone="soft">SIH PROTOTYPE</Tag></div>
      <nav className="main-nav" aria-label="Workspace sections">{nav.map(([id, label, Icon]) => <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setError(''); }}><Icon size={15} />{label}</button>)}</nav>
      <div className="top-actions"><div className="ready"><i />DEMO SESSION</div><button className={`role-switch ${userRole}`} onClick={signOut} title="Change workspace"><span className="role-label">{isOfficer ? 'OFFICER' : 'BIDDER'}</span><span className="role-name">{session.displayName}</span><ChevronDown size={13} /></button><a className="docs-link guide-link" href="/sih-user-guide.html">GUIDE ↗</a><a className="docs-link" href="/docs" target="_blank" rel="noreferrer">API DOCS ↗</a><button className="mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-controls="mobile-sections-menu" onClick={() => setMobileMenuOpen(open => !open)}>{mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}<span>Sections</span><ChevronDown size={13} /></button></div>
      {mobileMenuOpen && <nav className="mobile-menu-panel" id="mobile-sections-menu" aria-label="Phone navigation"><div className="mobile-menu-heading">{isOfficer ? 'Officer workspace' : 'Bidder workspace'}</div>{nav.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setError(''); setMobileMenuOpen(false); }}><Icon size={16} /><span>{label}</span>{tab === id && <Check size={14} />}</button>)}<a href="/sih-user-guide.html"><BookOpen size={16} /><span>User guide</span><ArrowRight size={14} /></a><a href="/docs" target="_blank" rel="noreferrer"><FileText size={16} /><span>API documentation</span><ArrowRight size={14} /></a><button className="mobile-change-role" onClick={() => { setMobileMenuOpen(false); signOut(); }}><Building2 size={16} /><span>Change workspace</span><ArrowRight size={14} /></button></nav>}
    </header>
    <main className="page-wrap">
      <div className="page-heading" data-reveal><div><div className="eyebrow">{isOfficer ? 'BUYER WORKSPACE · TENDER REVIEW' : 'BIDDER WORKSPACE · BID PREPARATION'}</div><h1>{tab === 'analyze' ? (isOfficer ? 'Tender review desk' : 'Bid readiness desk') : tab === 'history' ? 'Bidder history' : tab === 'projects' ? 'Project outlook' : tab === 'analytics' ? (isOfficer ? 'Review activity' : 'Bid activity') : 'Standards library'}</h1><p>{tab === 'analyze' ? (isOfficer ? 'Check requirements before publication and prepare a clearer, evidence-led tender.' : 'See what your bid should demonstrate and which evidence may still be missing.') : tab === 'history' ? 'A browser-local count of demo Bidder sessions and the self-reported profile fields they entered.' : tab === 'projects' ? 'Illustrative public-procurement scenarios to help contractors prepare—not confirmed tenders or official schedules.' : tab === 'analytics' ? 'A session summary of standards coverage, matches and observed gaps.' : 'Search the reference catalog by standard, product or domain.'}</p></div><div className="header-stat"><div className="stat-icon"><ShieldCheck size={17} /></div><div><b>{catalogCount}</b><span>REFERENCE STANDARDS</span></div></div></div>
      {error && <div className="error-banner"><AlertTriangle size={16} />{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
      {tab === 'analyze' && <>
        <section className={`demo-banner role-banner ${userRole}`} data-reveal><div className="demo-mark">{isOfficer ? <Building2 size={16} /> : <BriefcaseBusiness size={16} />}</div><div><b>{isOfficer ? 'OFFICER DESK · TENDER QUALITY CHECK' : 'BIDDER DESK · EVIDENCE READINESS'}</b><span>{isOfficer ? 'Review the draft clauses, standards references and supplier evidence checklist.' : 'Check the sample offer against the cited standard and prepare your supporting documents.'}</span></div><Tag tone="green">DEMO MODE</Tag></section>{isOfficer && <section className="bidder-profile-strip panel" data-reveal><div className="profile-strip-icon"><UserRound size={17} /></div><div><div className="eyebrow">BIDDER PROFILE · SELF-REPORTED DEMO</div><b>{bidderProfile ? bidderProfile.displayName || 'Demo Bidder' : 'No bidder profile added yet'}</b><span>{bidderProfile ? `${bidderProfile.experienceYears} years’ relevant experience · ${bidderProfile.technicalField}` : 'Switch to Bidder / Contractor on this browser to add experience and a main technical field.'}</span></div><Tag tone="soft">{bidderProfile ? 'NOT VERIFIED' : 'OPTIONAL PREVIEW'}</Tag></section>}
        <section className="ingest-grid" data-reveal>
          <div className="panel ingest-panel">
            <div className="panel-top"><div><div className="eyebrow">01 / TENDER INPUT</div><h2>What are you buying?</h2></div><div className="mode-chip"><FileText size={14} /> {isOfficer ? 'DRAFT REVIEW' : 'BID INPUT'}</div></div>
            <div className="quick-label">START WITH AN EXAMPLE</div>
            <div className="example-grid">{EXAMPLES.map((example, i) => <button className={`example-card ${text === example.text ? 'selected-example' : ''}`} key={example.name} onClick={() => { setText(example.text); setFile(null); setDomain('All domains'); setResult(null); }}><span className="example-num">0{i + 1}</span><span><b>{example.name}</b><small>{example.meta}</small></span><ArrowRight size={14} /></button>)}</div>
            <div className="demo-pdf-kit"><div className="demo-pdf-kit-head"><div><span className="eyebrow">UPLOAD-READY DEMO DOCUMENTS</span><b>Try a role-specific PDF</b></div><span className="demo-pdf-note">Text PDF · fictional · no personal data</span></div><div className="demo-pdf-links">{DEMO_PDF_DOWNLOADS.map(sample => <a className={`demo-pdf-link ${sample.role.toLowerCase()}`} key={sample.role} href={sample.url} download={sample.filename} target="_blank" rel="noreferrer"><span><FileText size={15} /><b>{sample.name}</b><small>{sample.detail}</small></span><Download size={15} /></a>)}</div></div>
            <div className="input-tools"><span>TENDER TEXT</span><label className="file-pick upload-emphasis"><Upload size={15} /><span>{file ? file.name : 'Upload PDF / DOCX / TXT'}</span><input aria-label="Upload tender PDF, DOCX or TXT" type="file" accept=".pdf,.docx,.txt" onChange={e => { setFile(e.target.files?.[0] || null); if (e.target.files?.[0]) { setText(''); setResult(null); } }} /></label></div>
            <textarea value={text} onChange={e => { setText(e.target.value); setFile(null); setResult(null); }} placeholder="Paste tender requirements, material properties, test criteria and certification conditions…" />
            <div className="textarea-foot"><span>PASTE TEXT OR UPLOAD PDF / DOCX / TXT</span><span>{text.split('\n').length} LINES&nbsp; / &nbsp;{words} WORDS</span></div>
            <div className="action-row"><label className="domain-select"><Filter size={14} /><select value={domain} onChange={e => setDomain(e.target.value)}>{DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}</select><ChevronDown size={13} /></label><button className="primary-btn" disabled={busy} onClick={runAnalysis}>{busy ? <><span className="spinner" /> ANALYZING…</> : <>Check against BIS standards <ArrowRight size={15} /></>}</button></div>
          </div>
          <aside className="panel process-panel"><div className="eyebrow">REVIEW PROCESS</div><h3>How the review works</h3><div className="flow-step done"><span className="flow-icon"><Check size={14} /></span><div><b>Document intake</b><small>PDF · DOCX · Plain text</small></div><Tag tone="green">READY</Tag></div><div className="flow-step done"><span className="flow-icon"><Activity size={14} /></span><div><b>Hybrid retrieval</b><small>Exact code + keyword match</small></div><Tag tone="green">LIVE</Tag></div><div className={`flow-step ${result ? 'done' : 'pending'}`}><span className="flow-icon">03</span><div><b>Clause comparison</b><small>Alignment · evidence · deviation</small></div><Tag tone={result ? 'green' : ''}>{result ? 'DONE' : 'NEXT'}</Tag></div><div className="process-note"><AlertTriangle size={15} /><span>Screening aid only. Confirm QCO coverage and current editions against official BIS and ministry notifications.</span></div><div className="process-foot"><span>REFERENCE CATALOG</span><b>{catalogCount} <small>STANDARDS</small></b></div></aside>
        </section>
        {result && <section className="results-section" data-reveal>
          <div className="section-title"><div><div className="eyebrow">02 / RESULTS</div><h2>Recommended standards</h2></div>{isOfficer && <button className="outline-btn audit-report-btn" onClick={() => setModal('report')}><FileCheck2 size={15} /> Audit report <span>EXPORT</span></button>}</div>
          <ParameterTags data={result.extracted_parameters} />
          <div className="results-layout"><div className="recommendation-list">{recommendations.map((hit, i) => <StandardCard key={hit.standard.is_code} hit={hit} index={i} onOpen={() => setModal({ type: 'diff', hit })} />)}</div><div className="view-panel panel">{isOfficer ? <OfficerView data={result.officer_view} bidderProfile={bidderProfile} auditAvailable={hasClauseAudit(selected?.standard)} onOpen={() => setModal({ type: 'diff', hit: selected })} /> : <ContractorView data={result.contractor_view} onOpen={() => setModal({ type: 'diff', hit: selected })} />}</div></div>
          <div className="notice-line"><ShieldCheck size={14} />{result.notice}</div>
        </section>}
      </>}
      {tab === 'analytics' && <div data-reveal><Analytics data={analytics} /></div>}
      {tab === 'history' && isOfficer && <BidderHistoryView entries={bidderHistory} stats={bidderHistoryStats} uploads={uploadHistory} uploadStats={uploadHistoryStats} />}
      {tab === 'projects' && !isOfficer && <DemoProjectOutlook technicalField={bidderProfile?.technicalField || ''} onChoose={exampleName => { const example = EXAMPLES.find(item => item.name === exampleName); if (example) { setText(example.text); setFile(null); setDomain('All domains'); setResult(null); setTab('analyze'); } }} />}
      {tab === 'directory' && <section className="panel directory-panel" data-reveal><div className="directory-head"><div><div className="eyebrow">REFERENCE CATALOG / {catalogCount} ENTRIES</div><h2>Indian Standards directory</h2></div><div className="search-box"><Search size={15} /><input placeholder="Search code, product, keyword…" value={search} onChange={e => setSearch(e.target.value)} /></div></div><div className="domain-pills">{DOMAINS.slice(1).map(d => <button key={d} className={domain === d ? 'selected' : ''} onClick={() => setDomain(domain === d ? 'All domains' : d)}>{d}</button>)}</div><Directory data={catalog.filter(s => domain === 'All domains' || s.domain === domain)} loading={catalogLoading} /></section>}
    </main>
    <footer data-reveal><span>© BIS.SPEC / PROCUREMENT INTELLIGENCE</span><span>DEMO REFERENCES — CHECK OFFICIAL BIS NOTIFICATIONS <a href="https://www.bis.gov.in/" target="_blank" rel="noreferrer">BIS ↗</a></span></footer>
    {modal && <Modal data={modal} result={result} onClose={() => setModal(null)} />}
  </div>;
}

export function getWorkspaceNav(isOfficer) {
  return isOfficer
    ? [['analyze', 'Tender desk', Layers3], ['history', 'Bidder history', UsersRound], ['analytics', 'Review activity', BarChart3], ['directory', 'Standards library', BookOpen]]
    : [['analyze', 'Bid readiness', FileCheck2], ['projects', 'Upcoming projects', CalendarDays], ['analytics', 'Bid activity', BarChart3], ['directory', 'Standards library', BookOpen]];
}

function BidderHistoryView({ entries, stats, uploads = [], uploadStats = { uploadCount: 0, officerUploads: 0, bidderUploads: 0, pdfUploads: 0 } }) {
  return <section className="history-view" data-reveal>
    <div className="history-intro panel"><div className="history-intro-mark"><UsersRound size={19} /></div><div><div className="eyebrow">OFFICER DESK · DEMO ACTIVITY</div><h2>Bidder / Contractor history</h2><p>Counts demo Bidder entries made in this browser. A repeated name can represent the same person or different people; names and profiles are not verified.</p></div><Tag tone="amber">LOCAL DEMO ONLY</Tag></div>
    <div className="history-kpis"><div className="panel history-kpi"><span>Bidder demo sessions</span><b>{stats.sessionCount}</b><small>Each successful demo Bidder entry</small></div><div className="panel history-kpi"><span>Distinct names entered</span><b>{stats.distinctNameCount}</b><small>Text labels only, not verified identities</small></div><div className="panel history-kpi"><span>Technical fields shown</span><b>{stats.technicalFieldCount}</b><small>Categories represented in this browser</small></div></div>
    <section className="panel history-register"><div className="history-register-head"><div><div className="eyebrow">RECENT ACTIVITY</div><h3>Demo Bidder entries</h3></div><span>Up to 100 recent entries · stored on this device only</span></div>
      {entries.length ? <div className="history-table-wrap"><table className="history-table"><caption className="sr-only">Browser-local demo Bidder history; all profiles are self-reported and unverified.</caption><thead><tr><th scope="col">Entered</th><th scope="col">Name entered</th><th scope="col">Experience</th><th scope="col">Main technical field</th><th scope="col">Record status</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><td><time dateTime={entry.startedAt}>{formatDemoDate(entry.startedAt)}</time></td><td>{entry.displayName}</td><td>{entry.experienceYears} years</td><td>{entry.technicalField}</td><td><Tag tone="soft">UNVERIFIED DEMO</Tag></td></tr>)}</tbody></table></div> : <Empty text="No Bidder demo sessions have been entered in this browser yet." />}
    </section>
    <UploadHistoryView uploads={uploads} stats={uploadStats} />
    <div className="history-disclaimer"><ShieldCheck size={15} /><span>This history is local to this browser and is not a central bidder registry or procurement record. It may be unavailable on another device or after browser storage is cleared.</span></div>
  </section>;
}

export function UploadHistoryView({ uploads, stats }) {
  return <section className="panel upload-history-register">
    <div className="history-register-head"><div><div className="eyebrow">DOCUMENT ANALYSIS LOG</div><h3>Uploaded tender PDFs and offers</h3><p>History keeps the filename and concise results only; original file bytes and full extracted document text are not retained.</p></div><Tag tone="soft">{stats.uploadCount} UPLOADS · {stats.pdfUploads} PDF</Tag></div>
    {uploads.length ? <div className="upload-history-list">{uploads.map(item => <article className="upload-history-item" key={item.id}>
      <div className="upload-history-top"><div className="upload-history-file"><span className="upload-file-icon"><FileText size={16} /></span><div><b>{item.filename}</b><small><time dateTime={item.uploadedAt}>{formatDemoDate(item.uploadedAt)}</time> · {formatFileSize(item.sizeBytes)} · {item.fileType}</small></div></div><Tag tone={item.uploadedAs === 'officer' ? 'green' : 'amber'}>{item.uploadedAs === 'officer' ? 'OFFICER UPLOAD' : 'BIDDER UPLOAD'}</Tag></div>
      <div className="upload-history-match"><span className="eyebrow">TOP STANDARD MATCH</span><b>{item.primaryStandard || 'No standard match'}{item.primaryStandardTitle ? ` · ${item.primaryStandardTitle}` : ''}</b>{item.recommendations?.length > 1 && <small>Also suggested: {item.recommendations.slice(1).map(hit => hit.code).filter(Boolean).join(' · ')}</small>}</div>
      <div className="upload-role-details"><div className="upload-role-card"><div className="eyebrow">OFFICER REVIEW</div><b>{item.officer?.counts?.aligned || 0} aligned · {item.officer?.counts?.partial || 0} partial · {item.officer?.counts?.missing || 0} missing · {item.officer?.counts?.deviated || 0} deviated</b><small>{item.officer?.draftClauseCount || 0} draft clauses · {item.officer?.checklistItemCount || 0} checklist items · {item.officer?.obsoleteWarningCount || 0} edition checks</small></div><div className="upload-role-card bidder"><div className="eyebrow">BIDDER READINESS</div><b>{item.bidder?.readinessScore === null || item.bidder?.readinessScore === undefined ? 'No clause score' : `${item.bidder.readinessScore}% · ${item.bidder.verdict || 'Screening summary'}`}</b><small>{item.bidder?.counts?.aligned || 0} aligned · {item.bidder?.counts?.partial || 0} partial · {item.bidder?.counts?.missing || 0} missing · {item.bidder?.counts?.deviated || 0} deviated</small></div></div>
      {!!item.bidder?.gaps?.length && <div className="upload-history-gaps"><b>Bidder evidence to review</b><ul>{item.bidder.gaps.slice(0, 3).map((gap, index) => <li key={`${gap.parameter}-${index}`}><Tag tone={gap.status === 'Deviated' || gap.status === 'Missing' ? 'amber' : 'soft'}>{gap.status}</Tag><span>{gap.parameter}</span><small>{gap.action}</small></li>)}</ul></div>}
      {!!item.extractedParameters?.length && <div className="upload-extracted"><span className="eyebrow">EXTRACTED FROM PDF</span>{item.extractedParameters.slice(0, 5).map(group => <span className="upload-extracted-chip" key={group.label}>{group.label}: {group.values.join(', ')}</span>)}</div>}
    </article>)}</div> : <Empty text="No PDF analysis has been uploaded in this browser yet. Download either role-specific sample, return to Tender desk and upload it, then run the check." />}
    <div className="upload-history-foot">{stats.officerUploads} Officer uploads · {stats.bidderUploads} Bidder uploads · browser-local demo log only</div>
  </section>;
}

function formatFileSize(bytes = 0) {
  const size = Number(bytes) || 0;
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDemoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function DemoProjectOutlook({ technicalField, onChoose }) {
  return <section className="project-outlook" data-reveal>
    <div className="project-notice"><CalendarDays size={17} /><div><b>Illustrative project scenarios—not live tenders</b><span>These sample briefs are for bid-preparation practice only. They are not confirmed government projects, procurement notices, dates or commitments. Check official tender portals for live opportunities.</span></div></div>
    <div className="project-outlook-toolbar"><div><div className="eyebrow">BIDDER DESK · INFORMATION BRIEFINGS</div><h2>Upcoming-project scenarios</h2><p>Explore public-procurement themes and prepare the documents commonly needed for similar tenders.</p></div><Tag tone="amber">DEMO SET · {DEMO_PROJECTS.length} SCENARIOS</Tag></div>
    <div className="project-grid">{DEMO_PROJECTS.map(project => <article className="panel project-card" key={project.id} data-reveal>
      <div className="project-card-top"><Tag tone={project.domain === technicalField ? 'green' : 'soft'}>{project.domain === technicalField ? 'YOUR TECHNICAL FIELD' : project.domain.toUpperCase()}</Tag><span className="demo-project-id">DEMO BRIEF</span></div>
      <h3>{project.title}</h3><div className="project-meta"><span><MapPin size={13} />{project.location}</span><span><Clock3 size={13} />{project.horizon}</span></div>
      <p className="project-scope">{project.scope}</p><div className="project-checklist-title"><ClipboardCheck size={14} /> PREPARATION NOTES</div><ul>{project.preparation.map(item => <li key={item}>{item}</li>)}</ul>
      <button className="outline-btn project-sample-btn" onClick={() => onChoose(project.exampleName)}>Open related sample tender <ArrowRight size={14} /></button>
    </article>)}</div>
    <p className="project-data-note">No tender number, issuing authority, location-specific schedule, estimated value or procurement date is asserted in these examples.</p>
  </section>;
}

function ParameterTags({ data = {} }) {
  const entries = Object.entries(data);
  return <section className="panel parameter-panel"><div className="parameter-heading"><div><div className="eyebrow">KEY DETAILS</div><b>Extracted technical parameters</b></div><Tag tone="soft">{entries.length} GROUPS</Tag></div>{entries.length ? <div className="parameter-grid">{entries.map(([key, values]) => <div key={key}><small>{key.replaceAll('_', ' ')}</small><b>{Array.isArray(values) ? values.join(' · ') : String(values)}</b></div>)}</div> : <p className="muted">No explicit technical parameters detected in this tender text.</p>}</section>;
}
function StandardCard({ hit, index, onOpen }) {
  const standard = hit.standard; const counts = hit.conformance_counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const auditAvailable = hasClauseAudit(standard) && (hit.compliance_matrix || []).length > 0;
  return <article className={`standard-card ${index === 0 ? 'primary' : ''}`} data-reveal>
    <div className="card-kicker">{index === 0 ? 'BEST MATCH' : 'ALTERNATIVE MATCH'}<span className="match-badge">[{hit.confidence}% MATCH]</span></div>
    <div className="standard-main"><div><div className="standard-code">{standard.is_code}</div><h3>{standard.title}</h3><p>{standard.scope}</p></div><div className="compliance-pill"><i />{hit.tier} CONFIDENCE</div></div>
    <div className="card-meta"><Tag>{standard.domain}</Tag>{standard.qco_mandatory && <Tag tone="amber">□ QCO MANDATORY</Tag>}<Tag tone="soft">{standard.certification_mark}</Tag></div>
    {auditAvailable ? <div className="conformance"><div className="progress"><i style={{ width: `${Math.max(4, Math.round(100 * (counts.Aligned || 0) / Math.max(1, total)))}%` }} /></div><div className="counts"><span><b className="c-green">{counts.Aligned || 0}</b> Aligned</span><span><b className="c-gray">{counts.Missing || 0}</b> Missing</span><span><b className="c-red">{counts.Deviated || 0}</b> Deviations</span><span><b className="c-amber">{counts.Partial || 0}</b> Partial</span></div></div> : <div className="catalogue-match-note">Directory match only · no clause-level audit criteria populated for this entry.</div>}
    <div className="card-actions">{auditAvailable ? <><button onClick={onOpen}><Layers3 size={14} /> Side-by-side diff</button><button onClick={onOpen}><BookOpen size={14} /> Clause breakdown</button></> : <span className="catalogue-source-hint">OPEN THE BIS SOURCE TO VERIFY</span>}<span>CODE + KEYWORD MATCH</span></div>
  </article>;
}
export function hasClauseAudit(standard) {
  return Boolean(standard && !standard.catalogue_only && standard.mandatory_clauses?.length);
}
function OfficerView({ data, onOpen, bidderProfile, auditAvailable = true }) {
  return <><div className="view-title"><Building2 size={17} /><div><b>Officer view</b><small>BUYER / TENDER AUTHORITY</small></div></div>
    <div className="view-block bidder-profile-card"><h4><UserRound size={14} /> BIDDER PROFILE · DEMO</h4>{bidderProfile ? <><div className="profile-summary"><b>{bidderProfile.displayName || 'Demo Bidder'}</b><span>{bidderProfile.experienceYears} years’ experience</span><span>{bidderProfile.technicalField}</span></div><p>Self-reported in this browser; not independently verified or transmitted to the analysis service.</p></> : <p className="muted">No bidder profile yet. Choose Bidder / Contractor on this browser and complete the demo profile to preview it here.</p>}</div>
    {!auditAvailable ? <div className="catalogue-only-audit-note"><b>Catalogue match only</b><span>This entry has no populated clause-level audit criteria. The standard is discoverable in the directory, but the prototype cannot assess conformance for it.</span></div> : <><div className="view-block"><h4><AlertTriangle size={14} /> OBSOLETE CODE CHECK</h4>{data?.obsolete_code_checks?.length ? data.obsolete_code_checks.map((x, i) => <p className="warn-text" key={i}>{x.cited_code} — {x.warning}</p>) : <p className="muted">No obvious superseded revision citation detected in this text.</p>}</div>
    <div className="view-block"><h4><Clipboard size={14} /> TENDER CLAUSE DRAFTS</h4>{(data?.draft_tender_clauses || []).map(item => <div className="draft-row" key={item.section}><div className="draft-row-head"><span>{item.section}</span><button className="mini-copy" onClick={() => copyText(item.text)}><Copy size={12} /> COPY</button></div><p>{item.text}</p></div>)}</div>
    <div className="view-block"><h4><FileCheck2 size={14} /> VENDOR QUALIFICATION</h4>{(data?.vendor_checklist || []).map(item => <div className="check-row" key={item.document}><Check size={13} /><span>{item.document}</span><small>{item.stage}</small><button className="mini-copy" onClick={() => copyText(item.document)} aria-label="Copy checklist item"><Copy size={12} /></button></div>)}</div>
    <button className="outline-btn wide" onClick={onOpen}>Review clause comparison <ArrowRight size={13} /></button></>}
  </>;
}
function ContractorView({ data, onOpen }) {
  const score = data?.bid_readiness_score ?? 0;
  const matrix = data?.compliance_matrix || [];
  return <><div className="view-title contractor-title"><BriefcaseBusiness size={17} /><div><b>Contractor view</b><small>BIDDER / CONTRACTOR</small></div></div>
    <div className="readiness"><div className="gauge"><strong>{matrix.length ? score : '—'}{matrix.length > 0 && <small>%</small>}</strong><span>{matrix.length ? 'READINESS' : 'REFERENCE'}</span></div><div><Tag tone={matrix.length ? (score >= 85 ? 'green' : 'amber') : 'soft'}>{matrix.length ? data?.verdict || 'ANALYSIS' : 'NO CLAUSE AUDIT'}</Tag><p>{matrix.length ? 'Resolve open evidence gaps before bid submission.' : 'This catalogue entry has not been populated with clause-level audit criteria.'}</p></div></div>
    {matrix.length > 0 && <><div className="view-block"><h4><FileCheck2 size={14} /> ENVELOPE A CHECKLIST</h4>{(data?.required_certificates || []).map((item, i) => <div className="check-row" key={item}><span className="empty-check">{String(i + 1).padStart(2, '0')}</span><span>{item}</span><button className="mini-copy" onClick={() => copyText(item)} aria-label="Copy checklist item"><Copy size={12} /></button></div>)}</div>
    <div className="view-block"><h4><Clipboard size={14} /> COMPLIANCE MATRIX</h4><div className="mini-matrix">{matrix.map((row, i) => <div key={`${row.clause_no}-${i}`}><b>{row.parameter}</b><Tag tone={row.status === 'Aligned' ? 'green' : row.status === 'Deviated' ? 'red' : 'amber'}>{row.status}</Tag><p>{row.action_required}</p></div>)}</div><button className="text-btn" onClick={onOpen}>View side-by-side requirements <ArrowRight size={13} /></button></div></>}
    <div className="view-block"><h4><Layers3 size={14} /> EQUIVALENT OPTIONS</h4>{(data?.equivalent_suggestions || []).map(item => <div className="equiv" key={item.suggestion}><b>{item.suggestion}</b><p>{item.technical_justification}</p><small>COMMERCIAL NOTE · {item.commercial_advantage}</small></div>)}</div>
  </>;
}
function Analytics({ data }) {
  if (!data) return <div className="loading-state"><span className="spinner dark" /> Loading analytics…</div>;
  const domains = Object.entries(data.domain_distribution || {}); const max = Math.max(1, ...domains.map(x => x[1]));
  return <><section className="kpi-grid"><Kpi label="Standards in catalog" value={data.standards_count || 50} note="Across five domains" icon={BookOpen} /><Kpi label="Analyses this session" value={data.analyses_count || 0} note="In-memory session metrics" icon={Activity} /><Kpi label="Core domains" value={domains.length} note="Civil · Electrical · IT · HVAC · PPE" icon={Layers3} /><Kpi label="Audit posture" value="LIVE" note="Evidence-first screening" icon={ShieldCheck} /></section>
    <section className="analytics-grid"><div className="panel chart-panel"><div className="eyebrow">01 / COVERAGE</div><h2>Standards by domain</h2>{domains.map(([name, value]) => <div className="bar-row" key={name}><div><span>{name}</span><b>{value}</b></div><i><em style={{ width: `${value / max * 100}%` }} /></i></div>)}</div>
      <div className="panel chart-panel"><div className="eyebrow">02 / CITATION SIGNAL</div><h2>Frequently matched standards</h2>{data.frequently_cited_standards?.length ? data.frequently_cited_standards.map(x => <div className="rank-row" key={x.is_code}><span>{x.is_code}</span><b>{x.count}</b></div>) : <Empty text="Analyze a tender to populate citation volume." />}</div>
      <div className="panel chart-panel"><div className="eyebrow">03 / NON-CONFORMANCE</div><h2>Prevalent gaps</h2>{data.prevalent_nonconformances?.length ? data.prevalent_nonconformances.map(x => <div className="rank-row" key={x.parameter}><span>{x.parameter}</span><b>{x.count}</b></div>) : <Empty text="Run an analysis to identify recurring gaps." />}</div></section></>;
}
function Kpi({ label, value, note, icon: Icon }) { return <div className="panel kpi" data-reveal><div className="kpi-icon"><Icon size={16} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Empty({ text }) { return <div className="empty-state"><Activity size={17} /><span>{text}</span></div>; }
function Directory({ data, loading }) {
  const [open, setOpen] = useState('');
  if (loading) return <div className="loading-state"><span className="spinner dark" /> Loading directory…</div>;
  if (!data.length) return <Empty text="No standards match this filter." />;
  return <div className="catalog-list">{data.map(standard => <article className="catalog-item" key={standard.is_code} data-reveal><button onClick={() => setOpen(open === standard.is_code ? '' : standard.is_code)}><span className="catalog-code">{standard.is_code}</span><span className="catalog-name"><b>{standard.title}</b><small>{standard.domain} · {standard.catalogue_only ? 'CATALOGUE ONLY · QCO UNVERIFIED' : standard.qco_mandatory ? 'QCO FLAGGED IN DEMO CORPUS' : 'NO QCO FLAG IN THIS CORPUS'}</small></span><span className="catalog-arrow">{open === standard.is_code ? '−' : '+'}</span></button>
    {open === standard.is_code && <div className="catalog-detail"><p>{standard.scope}</p>{standard.url && <a className="catalog-source-link" href={standard.url} target="_blank" rel="noreferrer">Open official BIS source ↗</a>}<div className="parameter-list">{Object.entries(standard.key_parameters || {}).map(([key, value]) => <span key={key}><small>{key.replaceAll('_', ' ')}</small><b>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</b></span>)}</div>{standard.mandatory_clauses?.length ? <div className="clause-grid">{standard.mandatory_clauses.map(clause => <div key={clause.clause_no}><b>{clause.clause_no} · {clause.title}</b><p>{clause.requirement}</p><small>METHOD · {clause.testing_method}</small></div>)}</div> : standard.catalogue_only && <p className="catalogue-only-note">Discovery metadata only: clause summaries, test requirements, certification applicability and QCO status are not populated for this entry.</p>}</div>}</article>)}</div>;
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
