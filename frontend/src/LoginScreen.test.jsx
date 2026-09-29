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
});
