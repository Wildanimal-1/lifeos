import { supabase } from './supabase';
import { oauthManager } from './oauthManager';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class OAuthService {
  private config: OAuthConfig;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`
    };
  }

  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  getConfigErrors(): string[] {
    const errors: string[] = [];
    if (!this.config.clientId) errors.push('VITE_GOOGLE_CLIENT_ID is not set');
    if (!this.config.clientSecret) errors.push('VITE_GOOGLE_CLIENT_SECRET is not set');
    return errors;
  }

  generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  initiateGoogleOAuth(): void {
    if (!this.isConfigured()) {
      throw new Error('OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in .env file.');
    }

    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_initiated_at', Date.now().toString());

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: REQUIRED_SCOPES.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    window.location.href = authUrl;
  }

  validateState(receivedState: string): boolean {
    const storedState = sessionStorage.getItem('oauth_state');
    const initiatedAt = sessionStorage.getItem('oauth_initiated_at');

    if (!storedState || !initiatedAt) {
      return false;
    }

    const elapsed = Date.now() - parseInt(initiatedAt);
    if (elapsed > 10 * 60 * 1000) {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_initiated_at');
      return false;
    }

    return storedState === receivedState;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange authorization code for tokens');
    }

    return await response.json();
  }

  async getUserInfo(accessToken: string): Promise<{ email: string; id: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      email: data.email,
      id: data.id
    };
  }

  async handleCallback(code: string, state: string): Promise<{ success: boolean; message: string; accountId?: string }> {
    try {
      if (!this.validateState(state)) {
        return {
          success: false,
          message: 'Invalid state parameter. Possible CSRF attack detected.'
        };
      }

      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_initiated_at');

      const tokens = await this.exchangeCodeForTokens(code);
      const userInfo = await getUserInfo(tokens.access_token);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated. Please sign in first.'
        };
      }

      const account = await oauthManager.addAccount(
        user.id,
        'gmail',
        userInfo.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        tokens.scope
      );

      if (!account) {
        return {
          success: false,
          message: 'Failed to save OAuth account to database.'
        };
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        agent: 'AuthSystem',
        action: 'oauth_connected',
        input_summary: `Google account connected: ${userInfo.email}`,
        output_summary: `OAuth tokens stored, expires in ${tokens.expires_in} seconds`,
        user_email: userInfo.email,
        oauth_account_id: account.id
      });

      await oauthManager.logAccountUsage(
        account.id,
        user.id,
        'oauth_connection_completed',
        GOOGLE_TOKEN_URL
      );

      return {
        success: true,
        message: `Successfully connected ${userInfo.email}`,
        accountId: account.id
      };

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during OAuth callback.'
      };
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to refresh access token');
    }

    return await response.json();
  }
}

async function getUserInfo(accessToken: string): Promise<{ email: string; id: string }> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  return {
    email: data.email,
    id: data.id
  };
}

export const oauthService = new OAuthService();
