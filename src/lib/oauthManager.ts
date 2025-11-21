import { supabase, OAuthAccount, AccountUsageLog } from './supabase';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

export class OAuthManager {
  async getAccount(accountId: string): Promise<OAuthAccount | null> {
    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching OAuth account:', error);
      return null;
    }

    return data as OAuthAccount | null;
  }

  async getUserAccounts(userId: string): Promise<OAuthAccount[]> {
    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user OAuth accounts:', error);
      return [];
    }

    return (data as OAuthAccount[]) || [];
  }

  async getDefaultAccount(userId: string): Promise<OAuthAccount | null> {
    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching default OAuth account:', error);
      return null;
    }

    return data as OAuthAccount | null;
  }

  async setDefaultAccount(userId: string, accountId: string): Promise<boolean> {
    const { error: clearError } = await supabase
      .from('oauth_accounts')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (clearError) {
      console.error('Error clearing default accounts:', clearError);
      return false;
    }

    const { error: setError } = await supabase
      .from('oauth_accounts')
      .update({ is_default: true })
      .eq('id', accountId)
      .eq('user_id', userId);

    if (setError) {
      console.error('Error setting default account:', setError);
      return false;
    }

    return true;
  }

  async addAccount(
    userId: string,
    provider: 'gmail' | 'google',
    email: string,
    accessToken: string,
    refreshToken: string | undefined,
    expiresIn: number,
    scope: string
  ): Promise<OAuthAccount | null> {
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    const accounts = await this.getUserAccounts(userId);
    const isFirstAccount = accounts.length === 0;

    const { data, error } = await supabase
      .from('oauth_accounts')
      .insert({
        user_id: userId,
        provider,
        email,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expiry: tokenExpiry,
        scope,
        is_default: isFirstAccount,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding OAuth account:', error);
      return null;
    }

    return data as OAuthAccount;
  }

  async updateAccountTokens(
    accountId: string,
    accessToken: string,
    refreshToken: string | undefined,
    expiresIn: number
  ): Promise<boolean> {
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    const updateData: any = {
      access_token: accessToken,
      token_expiry: tokenExpiry,
      updated_at: new Date().toISOString()
    };

    if (refreshToken) {
      updateData.refresh_token = refreshToken;
    }

    const { error } = await supabase
      .from('oauth_accounts')
      .update(updateData)
      .eq('id', accountId);

    if (error) {
      console.error('Error updating account tokens:', error);
      return false;
    }

    return true;
  }

  async removeAccount(accountId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('oauth_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing OAuth account:', error);
      return false;
    }

    return true;
  }

  isTokenExpired(account: OAuthAccount): boolean {
    if (!account.token_expiry) return false;

    const expiry = new Date(account.token_expiry);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return expiry <= fiveMinutesFromNow;
  }

  async logAccountUsage(
    accountId: string,
    userId: string,
    action: string,
    apiEndpoint?: string
  ): Promise<void> {
    await supabase
      .from('account_usage_log')
      .insert({
        oauth_account_id: accountId,
        user_id: userId,
        action,
        api_endpoint: apiEndpoint
      });
  }

  async validateAccountContext(
    userId: string,
    accountId: string
  ): Promise<{ valid: boolean; message?: string; account?: OAuthAccount }> {
    if (!accountId) {
      return {
        valid: false,
        message: 'No OAuth account selected. Please select an account to continue.'
      };
    }

    const account = await this.getAccount(accountId);

    if (!account) {
      return {
        valid: false,
        message: 'Selected OAuth account not found. Please reconnect your account.'
      };
    }

    if (account.user_id !== userId) {
      return {
        valid: false,
        message: 'Account does not belong to current user.'
      };
    }

    if (this.isTokenExpired(account)) {
      return {
        valid: false,
        message: 'OAuth token has expired. Please reconnect your account.',
        account
      };
    }

    return {
      valid: true,
      account
    };
  }

  getTokenScopes(account: OAuthAccount): string[] {
    return account.scope.split(' ').filter(s => s.length > 0);
  }

  hasRequiredScopes(account: OAuthAccount, requiredScopes: string[]): boolean {
    const accountScopes = this.getTokenScopes(account);
    return requiredScopes.every(scope => accountScopes.includes(scope));
  }
}

export const oauthManager = new OAuthManager();
