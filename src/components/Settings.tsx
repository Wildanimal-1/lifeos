import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Mail, CheckCircle, AlertCircle, Trash2, Shield, Loader } from 'lucide-react';
import { supabase, UserContext, OAuthAccount } from '../lib/supabase';
import { oauthManager } from '../lib/oauthManager';
import { oauthService } from '../lib/oauth';

interface SettingsProps {
  userId: string;
  userEmail?: string;
  onUpdate: (context: UserContext) => void;
}

export function Settings({ userId, userEmail, onUpdate }: SettingsProps) {
  const [context, setContext] = useState<Partial<UserContext>>({
    calendar_id: 'primary',
    auto_send: false,
    demo_mode: true,
    work_hours: '09:00-18:00',
    timezone: 'Asia/Kolkata'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [oauthConfigErrors, setOauthConfigErrors] = useState<string[]>([]);
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  useEffect(() => {
    loadContext();
    loadAccounts();
    checkOAuthConfig();
  }, [userId]);

  const checkOAuthConfig = () => {
    const configured = oauthService.isConfigured();
    setOauthConfigured(configured);
    if (!configured) {
      setOauthConfigErrors(oauthService.getConfigErrors());
    }
  };

  const loadContext = async () => {
    const { data } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setContext(data);
    }
  };

  const loadAccounts = async () => {
    setAccountsLoading(true);
    const userAccounts = await oauthManager.getUserAccounts(userId);
    setAccounts(userAccounts);
    setAccountsLoading(false);
  };

  const handleSetDefault = async (accountId: string) => {
    const success = await oauthManager.setDefaultAccount(userId, accountId);
    if (success) {
      setMessage('Default account updated successfully');
      await loadAccounts();
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Error: Failed to update default account');
    }
  };

  const handleRemoveAccount = async (accountId: string, email: string) => {
    if (!confirm(`Are you sure you want to disconnect ${email}? This will stop all operations using this account.`)) {
      return;
    }

    const success = await oauthManager.removeAccount(accountId, userId);
    if (success) {
      setMessage('Account disconnected successfully');
      await loadAccounts();
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Error: Failed to disconnect account');
    }
  };

  const handleConnectGoogle = async () => {
    if (!oauthConfigured) {
      setMessage('Error: OAuth not configured. Please check your .env file.');
      return;
    }

    try {
      setConnectingOAuth(true);
      oauthService.initiateGoogleOAuth();
    } catch (error: any) {
      setConnectingOAuth(false);
      setMessage(`Error: ${error.message}`);
    }
  };

  const getAccountStatus = (account: OAuthAccount) => {
    if (oauthManager.isTokenExpired(account)) {
      return { status: 'expired', icon: AlertCircle, color: 'text-red-500 bg-red-50', label: 'Expired' };
    }

    if (account.token_expiry) {
      const expiry = new Date(account.token_expiry);
      const now = new Date();
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilExpiry < 24) {
        return { status: 'expiring', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', label: 'Expiring Soon' };
      }
    }

    return { status: 'valid', icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Connected' };
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('user_contexts')
        .upsert({
          user_id: userId,
          ...context,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setMessage('Settings saved successfully');
      onUpdate(data as UserContext);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="border-b pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
          </div>

          {accountsLoading ? (
            <div className="text-sm text-gray-600">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No accounts connected</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Connect a Google account to use email and calendar features.
                  </p>
                  {!oauthConfigured && (
                    <div className="mt-2 text-xs text-red-700">
                      <p className="font-medium">OAuth not configured:</p>
                      <ul className="list-disc list-inside mt-1">
                        {oauthConfigErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={handleConnectGoogle}
                    disabled={!oauthConfigured || connectingOAuth}
                    className="mt-3 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {connectingOAuth ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Google Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const status = getAccountStatus(account);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={account.id}
                    className={`border rounded-lg p-4 ${account.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {account.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{account.email}</p>
                            {account.is_default && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">Provider: {account.provider}</p>
                          <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{status.label}</span>
                          </div>
                          {account.token_expiry && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(account.token_expiry).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!account.is_default && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            className="px-3 py-1 text-xs border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveAccount(account.id, account.email)}
                          className="px-3 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={handleConnectGoogle}
                disabled={!oauthConfigured || connectingOAuth}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {connectingOAuth ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  '+ Connect Another Account'
                )}
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Calendar ID
          </label>
          <input
            type="text"
            value={context.calendar_id || ''}
            onChange={(e) => setContext({ ...context, calendar_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="primary"
          />
          <p className="text-xs text-gray-500 mt-1">Your Google Calendar ID</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Study Notes Link
          </label>
          <input
            type="text"
            value={context.study_notes_link || ''}
            onChange={(e) => setContext({ ...context, study_notes_link: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://docs.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">Link to your study materials</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Hours
          </label>
          <input
            type="text"
            value={context.work_hours || ''}
            onChange={(e) => setContext({ ...context, work_hours: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="09:00-18:00"
          />
          <p className="text-xs text-gray-500 mt-1">Your preferred working hours</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={context.timezone || 'Asia/Kolkata'}
            onChange={(e) => setContext({ ...context, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          </select>
        </div>

        {userEmail === 'lifeos.demo@gmail.com' && (
          <div className="border-t pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-green-800 mb-1">Demo Account</h3>
                  <p className="text-xs text-green-700 mb-2">
                    You are using the demo account. Demo mode is always enabled for safety.
                  </p>
                  <ul className="text-xs text-green-600 list-disc list-inside space-y-0.5">
                    <li>Uses mock data only</li>
                    <li>Prevents outgoing messages to real accounts</li>
                    <li>Auto-send is disabled for safety</li>
                    <li>Shows visible audit log for transparency</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_send"
            checked={userEmail === 'lifeos.demo@gmail.com' ? false : (context.auto_send || false)}
            onChange={(e) => setContext({ ...context, auto_send: e.target.checked })}
            disabled={userEmail === 'lifeos.demo@gmail.com'}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="auto_send" className="text-sm font-medium text-gray-700">
            Auto-send email replies {userEmail === 'lifeos.demo@gmail.com' && '(Disabled in Demo Mode)'}
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6">
          When enabled, drafted replies will be sent automatically. Default is false for safety.
        </p>

        {message && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            message.includes('Error')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
