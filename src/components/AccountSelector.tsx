import { useState, useEffect, useRef } from 'react';
import { Mail, ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { OAuthAccount } from '../lib/supabase';
import { oauthManager } from '../lib/oauthManager';

interface AccountSelectorProps {
  userId: string;
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string | null) => void;
  disabled?: boolean;
}

export function AccountSelector({ userId, selectedAccountId, onAccountSelect, disabled }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadAccounts = async () => {
    setLoading(true);
    const userAccounts = await oauthManager.getUserAccounts(userId);
    setAccounts(userAccounts);
    setLoading(false);

    if (userAccounts.length > 0 && !selectedAccountId) {
      const defaultAccount = userAccounts.find(acc => acc.is_default) || userAccounts[0];
      onAccountSelect(defaultAccount.id);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  const getAccountStatus = (account: OAuthAccount) => {
    if (oauthManager.isTokenExpired(account)) {
      return { status: 'expired', icon: AlertCircle, color: 'text-red-500', label: 'Expired' };
    }

    if (account.token_expiry) {
      const expiry = new Date(account.token_expiry);
      const now = new Date();
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilExpiry < 24) {
        return { status: 'expiring', icon: Clock, color: 'text-yellow-500', label: 'Expiring Soon' };
      }
    }

    return { status: 'valid', icon: CheckCircle, color: 'text-green-500', label: 'Connected' };
  };

  const formatScopes = (scope: string) => {
    const scopes = scope.split(' ');
    const simplifiedScopes = scopes.map(s => {
      if (s.includes('gmail')) return 'Gmail';
      if (s.includes('calendar')) return 'Calendar';
      if (s.includes('userinfo')) return 'Profile';
      return s;
    });
    return [...new Set(simplifiedScopes)].join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
        <Mail className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-700">No account connected. Please add one in Settings.</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Mail className="w-4 h-4 text-gray-600 flex-shrink-0" />
          {selectedAccount ? (
            <>
              <span className="text-sm font-medium text-gray-900 truncate">
                {selectedAccount.email}
              </span>
              {(() => {
                const status = getAccountStatus(selectedAccount);
                const StatusIcon = status.icon;
                return <StatusIcon className={`w-4 h-4 flex-shrink-0 ${status.color}`} />;
              })()}
            </>
          ) : (
            <span className="text-sm text-gray-600">Select an account</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-700">Running as:</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {accounts.map((account) => {
              const status = getAccountStatus(account);
              const StatusIcon = status.icon;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onAccountSelect(account.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedAccountId === account.id ? 'bg-blue-50' : ''
                  }`}
                  title={`Scopes: ${formatScopes(account.scope)}\nExpires: ${account.token_expiry ? new Date(account.token_expiry).toLocaleString() : 'Unknown'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        selectedAccountId === account.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {account.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{account.email}</p>
                        <p className="text-xs text-gray-500">{account.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      {account.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
