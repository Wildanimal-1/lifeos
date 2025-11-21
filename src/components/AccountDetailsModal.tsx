import { X, Shield, Calendar, Mail, AlertTriangle } from 'lucide-react';
import { OAuthAccount } from '../lib/supabase';

interface AccountDetailsModalProps {
  account: OAuthAccount;
  onClose: () => void;
  onDisconnect: (accountId: string) => Promise<void>;
}

export function AccountDetailsModal({ account, onClose, onDisconnect }: AccountDetailsModalProps) {
  const handleDisconnect = async () => {
    if (confirm(`Are you sure you want to disconnect ${account.email}? This will stop all operations using this account.`)) {
      await onDisconnect(account.id);
      onClose();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseScopes = (scopeString: string): string[] => {
    return scopeString.split(' ').filter(s => s.length > 0);
  };

  const getScopeLabel = (scope: string): string => {
    if (scope.includes('gmail.send')) return 'Gmail: Send Emails';
    if (scope.includes('gmail.compose')) return 'Gmail: Compose Emails';
    if (scope.includes('gmail.modify')) return 'Gmail: Modify Emails';
    if (scope.includes('gmail.readonly')) return 'Gmail: Read Emails';
    if (scope.includes('calendar.events')) return 'Calendar: Manage Events';
    if (scope.includes('calendar.readonly')) return 'Calendar: Read Events';
    if (scope.includes('userinfo.email')) return 'Profile: Email Address';
    if (scope.includes('userinfo.profile')) return 'Profile: Basic Info';
    return scope;
  };

  const scopes = parseScopes(account.scope);
  const isExpired = account.token_expiry && new Date(account.token_expiry) < new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
              {account.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
              <p className="text-sm text-gray-600">{account.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Safety Notice</p>
                <p className="text-xs text-blue-700 mt-1">
                  <strong>auto_send = false</strong> by default. All email drafts require manual review and confirmation before sending.
                </p>
              </div>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Token Expired</p>
                  <p className="text-xs text-red-700 mt-1">
                    This account's OAuth token has expired. Please reconnect to continue using this account.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Account Email</label>
              <div className="mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{account.email}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Provider</label>
              <div className="mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900 capitalize">{account.provider}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4" />
                OAuth Scopes Granted
              </label>
              <div className="mt-2 space-y-2">
                {scopes.length === 0 ? (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">No scopes available</p>
                  </div>
                ) : (
                  scopes.map((scope, idx) => (
                    <div key={idx} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
                      {scope.includes('gmail') ? (
                        <Mail className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      ) : scope.includes('calendar') ? (
                        <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Shield className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{getScopeLabel(scope)}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono break-all">{scope}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Connected At</label>
                <div className="mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-900">{formatDate(account.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Token Expiry</label>
                <div className={`mt-2 px-4 py-3 border rounded-lg ${
                  isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-sm ${isExpired ? 'text-red-900 font-medium' : 'text-gray-900'}`}>
                    {formatDate(account.token_expiry)}
                  </p>
                  {isExpired && <p className="text-xs text-red-700 mt-1">Expired</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Last Updated</label>
              <div className="mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900">{formatDate(account.updated_at)}</p>
              </div>
            </div>

            {account.is_default && (
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  This is your default account for all operations
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Disconnect Account
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
