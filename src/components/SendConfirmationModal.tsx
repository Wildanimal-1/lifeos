import { useState } from 'react';
import { X, AlertTriangle, Mail, Send } from 'lucide-react';
import { EmailDraft, OAuthAccount } from '../lib/supabase';

interface SendConfirmationModalProps {
  draft: EmailDraft;
  account: OAuthAccount;
  onConfirm: (draftId: string) => Promise<void>;
  onCancel: () => void;
}

export function SendConfirmationModal({ draft, account, onConfirm, onCancel }: SendConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!confirmed) return;

    setSending(true);
    try {
      await onConfirm(draft.id);
    } catch (error) {
      console.error('Send failed:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Confirm Send Email</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={sending}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Review Before Sending</p>
              <p className="text-xs text-yellow-700 mt-1">
                This email will be sent immediately from your connected account. Please review all details carefully.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">From Account</label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {account.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{account.email}</p>
                    <p className="text-xs text-gray-600">{account.provider}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">To</label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm text-gray-900">{draft.to_address}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Subject</label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm text-gray-900">{draft.subject}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Message Body</label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">{draft.draft_body}</pre>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                disabled={sending}
              />
              <span className="text-sm text-gray-700 select-none group-hover:text-gray-900">
                I have reviewed this draft and confirm that I want to send this email from <strong>{account.email}</strong> to <strong>{draft.to_address}</strong>
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!confirmed || sending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
