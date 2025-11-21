import { useEffect, useState } from 'react';
import { oauthService } from '../lib/oauth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        let errorMessage = 'OAuth authorization failed.';
        if (error === 'access_denied') {
          errorMessage = 'You declined the authorization request. No account was connected.';
        }
        setStatus('error');
        setMessage(errorMessage);
        setTimeout(() => window.location.href = '/', 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state parameter.');
        setTimeout(() => window.location.href = '/', 3000);
        return;
      }

      const result = await oauthService.handleCallback(code, state);

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setTimeout(() => window.location.href = '/', 2000);
      } else {
        setStatus('error');
        setMessage(result.message);
        setTimeout(() => window.location.href = '/', 4000);
      }
    } catch (error: any) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage(error.message || 'An unexpected error occurred.');
      setTimeout(() => window.location.href = '/', 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 text-blue-600 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900">Connecting Account</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">Success!</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">Connection Failed</h2>
            </>
          )}

          <p className="text-gray-700">{message}</p>

          {status !== 'loading' && (
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    </div>
  );
}
