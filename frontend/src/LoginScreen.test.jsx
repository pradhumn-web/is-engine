import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LoginScreen from './LoginScreen.jsx';

describe('BIS.SPEC demo sign-in screen', () => {
  it('shows separate buyer/officer and bidder workspaces without collecting a password', () => {
    const markup = renderToStaticMarkup(createElement(LoginScreen, { onSignIn: () => {} }));
    expect(markup).toContain('Buyer / Officer');
    expect(markup).toContain('Bidder / Contractor');
    expect(markup).toContain('Choose a workspace');
    expect(markup).toContain('User guide');
    expect(markup).toContain('Demo sign-in only');
    expect(markup).not.toContain('type="password"');
  });

  it('requires bidder experience and a primary technical field in the bidder profile form', () => {
    const markup = renderToStaticMarkup(createElement(LoginScreen, { onSignIn: () => {}, initialRole: 'contractor' }));
    expect(markup).toContain('Bidder profile');
    expect(markup).toContain('id="bidder-experience"');
    expect(markup).toContain('id="bidder-experience" class="login-name-input" type="number"');
    expect(markup).toContain('min="0" max="60" step="1" required');
    expect(markup).toContain('id="bidder-technical-field"');
    expect(markup).toContain('name="technicalField" required');
    expect(markup).toContain('this browser');
    expect(markup).not.toContain('type="password"');
  });
});
