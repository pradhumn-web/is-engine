import React, { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, Check, ShieldCheck } from 'lucide-react';

const roles = [
  {
    id: 'officer',
    title: 'Buyer / Officer',
    detail: 'Review tender clauses, spot standards gaps and prepare a buyer-side checklist.',
    icon: Building2,
  },
  {
    id: 'contractor',
    title: 'Bidder / Contractor',
    detail: 'Check bid readiness, required documents and the standards linked to your offer.',
    icon: BriefcaseBusiness,
  },
];

export default function LoginScreen({ onSignIn }) {
  const [role, setRole] = useState('officer');
  const [name, setName] = useState('');

  function submit(event) {
    event.preventDefault();
    onSignIn(role, name);
  }

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <a className="login-brand" href="/" aria-label="BIS.SPEC home">
          <span className="brand-mark">[IS]</span>
          <span><b>BIS.SPEC</b><small>STANDARDS INTELLIGENCE</small></span>
        </a>
        <a className="guide-link" href="/sih-user-guide.html">User guide <ArrowRight size={13} /></a>
      </header>

      <main className="login-main">
        <section className="login-story">
          <div className="eyebrow">A PRACTICAL REVIEW DESK FOR PUBLIC PROCUREMENT</div>
          <h1>Better tender checks start with a clearer view of the standard.</h1>
          <p>Choose your workspace to review tender language, compare it with relevant Indian Standards, and see which documents may need attention.</p>
          <div className="login-points">
            <span><Check size={15} /> Start from a sample or your own tender</span>
            <span><Check size={15} /> See buyer and bidder guidance separately</span>
            <span><Check size={15} /> Export a screening summary for review</span>
          </div>
          <div className="login-footnote"><ShieldCheck size={15} /> Screening support for a demo; confirm requirements against official notices.</div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-mark"><ShieldCheck size={18} /></div>
          <div className="eyebrow">SIH PROTOTYPE ACCESS</div>
          <h2 id="login-title">Choose a workspace</h2>
          <p className="login-card-intro">Select the side you want to review as.</p>
          <form onSubmit={submit}>
            <div className="role-choices" role="group" aria-label="Choose a workspace">
              {roles.map(({ id, title, detail, icon: Icon }) => (
                <button
                  className={`role-choice ${role === id ? 'selected' : ''}`}
                  type="button"
                  key={id}
                  aria-pressed={role === id}
                  onClick={() => setRole(id)}
                >
                  <span className="role-choice-icon"><Icon size={18} /></span>
                  <span className="role-choice-copy"><b>{title}</b><small>{detail}</small></span>
                  <span className="role-choice-check"><Check size={13} /></span>
                </button>
              ))}
            </div>
            <label className="login-name-label" htmlFor="demo-display-name">Name for this session <span>optional</span></label>
            <input
              id="demo-display-name"
              className="login-name-input"
              type="text"
              name="displayName"
              autoComplete="name"
              maxLength={48}
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder={role === 'officer' ? 'e.g. Asha Kumar' : 'e.g. Ravi Patel'}
            />
            <button className="primary-btn login-submit" type="submit">
              Continue to {role === 'officer' ? 'Officer desk' : 'Bidder desk'} <ArrowRight size={15} />
            </button>
          </form>
          <p className="demo-auth-note">Demo sign-in only. No password is requested, and this screen does not verify an account or procurement authority.</p>
        </section>
      </main>
      <footer className="login-footer"><span>BIS.SPEC · SIH PROTOTYPE</span><span>Illustrative reference data — verify against current official publications.</span></footer>
    </div>
  );
}
