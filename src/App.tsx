import { useState, useEffect } from 'react';
import { supabase, UserContext } from './lib/supabase';
import { Orchestrator, OrchestratorOutput } from './agents/orchestrator';
import { compileWeeklySnapshot } from './agents/weeklyCompiler';
import { CommandInput } from './components/CommandInput';
import { DashboardView } from './components/DashboardView';
import { AuthForm } from './components/AuthForm';
import { Settings } from './components/Settings';
import { InstallPrompt } from './components/InstallPrompt';
import { Toast } from './components/Toast';
import { ProgressModal } from './components/ProgressModal';
import { AccountSelector } from './components/AccountSelector';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { AuthCallback } from './components/AuthCallback';
import { generatePDF } from './lib/pdfExport';
import { oauthManager } from './lib/oauthManager';
import { Brain, Settings as SettingsIcon, LogOut, History, FileText, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorOutput | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; link?: string } | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [runningAccountEmail, setRunningAccountEmail] = useState<string | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<any>(null);
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth/callback') {
      setIsAuthCallback(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserContext(session.user.id);
        loadExecutions(session.user.id);
        loadCurrentAccount(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserContext(session.user.id);
          await loadExecutions(session.user.id);
          await loadCurrentAccount(session.user.id);

          if (event === 'SIGNED_IN') {
            setToast({
              message: `Signed in as ${session.user.email} — connected successfully`,
              type: 'success'
            });

            await supabase.from('audit_logs').insert({
              user_id: session.user.id,
              agent: 'AuthSystem',
              action: 'oauth_connected',
              input_summary: `User signed in: ${session.user.email}`,
              output_summary: 'OAuth connection established',
              user_email: session.user.email
            });
          }
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserContext = async (userId: string) => {
    const { data } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setUserContext(data as UserContext);
    } else {
      const defaultContext = {
        user_id: userId,
        calendar_id: 'primary',
        auto_send: false,
        demo_mode: true,
        work_hours: '09:00-18:00',
        timezone: 'Asia/Kolkata'
      };

      const { data: newContext } = await supabase
        .from('user_contexts')
        .insert(defaultContext)
        .select()
        .single();

      setUserContext(newContext as UserContext);
    }
  };

  const loadExecutions = async (userId: string) => {
    const { data } = await supabase
      .from('executions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setExecutions(data);
    }
  };

  const loadCurrentAccount = async (userId: string) => {
    const defaultAccount = await oauthManager.getDefaultAccount(userId);
    if (defaultAccount) {
      setCurrentAccount(defaultAccount);
    } else {
      const accounts = await oauthManager.getUserAccounts(userId);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!user) return;

    const success = await oauthManager.removeAccount(accountId, user.id);
    if (success) {
      setToast({
        message: 'Account disconnected successfully',
        type: 'success'
      });
      await loadCurrentAccount(user.id);
      setShowAccountDetails(false);
      setCurrentAccount(null);
    } else {
      setToast({
        message: 'Failed to disconnect account',
        type: 'error'
      });
    }
  };

  const handleCommand = async (command: string, source: 'text' | 'speech' = 'text') => {
    if (!user || !userContext) return;

    if (!selectedAccountId) {
      setToast({
        message: 'Please select an OAuth account before running commands',
        type: 'error'
      });
      return;
    }

    const validation = await oauthManager.validateAccountContext(user.id, selectedAccountId);
    if (!validation.valid) {
      setToast({
        message: validation.message || 'Invalid account selection',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setShowHistory(false);
    setRunningAccountEmail(validation.account?.email || null);
    try {
      const orchestrator = new Orchestrator();
      const output = await orchestrator.execute({
        user_command: command,
        user_context: userContext,
        oauth_account_id: selectedAccountId,
        options: { source }
      });

      setResult(output);

      if (output.voice_summary_text && source === 'speech') {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(output.voice_summary_text);
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        }
      }

      await loadExecutions(user.id);
    } catch (error: any) {
      console.error('Execution error:', error);
      setToast({
        message: error.message || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setRunningAccountEmail(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserContext(null);
    setResult(null);
  };

  const loadExecution = async (executionId: string) => {
    const { data: execution } = await supabase
      .from('executions')
      .select('*')
      .eq('id', executionId)
      .single();

    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });

    if (execution) {
      setResult({
        execution_id: execution.id,
        execution_plan: execution.execution_plan || '',
        final_summary: execution.final_summary || '',
        dashboard_snapshot: execution.dashboard_snapshot,
        audit_log: logs || []
      });
      setShowHistory(false);
    }
  };

  const handleExportWeeklyPDF = async () => {
    try {
      if (!userContext) {
        setToast({
          message: 'User context not loaded',
          type: 'error'
        });
        return;
      }

      setShowProgress(true);
      setProgressMessage('Compiling weekly report...');

      const startTime = Date.now();

      const snapshot = await compileWeeklySnapshot({
        userId: user.id,
        userContext: userContext
      });

      const compileTime = Date.now() - startTime;

      if (compileTime < 8000) {
        setProgressMessage('Generating PDF...');
      }

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', snapshot.week_start)
        .lte('timestamp', snapshot.week_end)
        .order('timestamp', { ascending: true });

      const filename = generatePDF({
        executionPlan: snapshot.execution_plan,
        finalSummary: `Weekly report for ${snapshot.week_start} to ${snapshot.week_end}`,
        dashboardSnapshot: snapshot.dashboard_snapshot,
        auditLog: auditLogs || [],
        userCommand: `Weekly Report: ${snapshot.week_start} - ${snapshot.week_end}`,
        createdAt: snapshot.created_at,
        demoMode: userContext?.demo_mode
      });

      await supabase
        .from('weekly_snapshots')
        .update({
          pdf_path: `exports/${filename}`,
          public_url: `${window.location.origin}/exports/${filename}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', snapshot.id);

      setShowProgress(false);

      setToast({
        message: `Weekly PDF generated: ${filename}`,
        type: 'success',
        link: `${window.location.origin}/exports/${filename}`
      });
    } catch (error: any) {
      setShowProgress(false);
      setToast({
        message: `Failed to generate weekly PDF: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleExportCommandPDF = async (executionId?: string) => {
    try {
      let executionData;
      let auditLogs;

      if (executionId) {
        const { data: execution } = await supabase
          .from('executions')
          .select('*')
          .eq('id', executionId)
          .single();

        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: true });

        executionData = execution;
        auditLogs = logs;
      } else if (result) {
        const { data: execution } = await supabase
          .from('executions')
          .select('*')
          .eq('id', result.execution_id)
          .single();

        executionData = execution;
        auditLogs = result.audit_log;
      } else {
        setToast({
          message: 'No execution available. Run a command first.',
          type: 'error'
        });
        return;
      }

      if (!executionData) {
        setToast({
          message: 'Failed to load execution data',
          type: 'error'
        });
        return;
      }

      const filename = generatePDF({
        executionPlan: executionData.execution_plan,
        finalSummary: executionData.final_summary,
        dashboardSnapshot: executionData.dashboard_snapshot,
        auditLog: auditLogs || [],
        userCommand: executionData.user_command,
        createdAt: executionData.created_at,
        demoMode: userContext?.demo_mode
      });

      setToast({
        message: `PDF generated: ${filename}`,
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: `Failed to generate PDF: ${error.message}`,
        type: 'error'
      });
    }
  };

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">LifeOS</h1>
            </div>
            <p className="text-gray-600">Multi-Agent Personal Automation System</p>
          </div>
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">LifeOS</h1>
            {userContext?.demo_mode && (
              <span className="px-2 py-1 bg-green-100 border border-green-300 text-green-800 text-xs font-semibold rounded-full">
                DEMO MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentAccount && (
              <button
                onClick={() => setShowAccountDetails(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
                title="View account details"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  {currentAccount.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs text-gray-600 font-medium">Connected as:</span>
                  <span className="text-sm text-gray-900 font-semibold">{currentAccount.email}</span>
                </div>
                <User className="w-4 h-4 text-blue-600 md:hidden" />
              </button>
            )}
            <button
              onClick={handleExportWeeklyPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="Export Weekly PDF Report"
              title="Export Weekly PDF Report"
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Weekly Report</span>
            </button>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowSettings(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowHistory(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {showSettings ? (
          <Settings userId={user.id} onUpdate={setUserContext} />
        ) : showHistory ? (
          <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Execution History</h2>
            {executions.length === 0 ? (
              <p className="text-gray-500">No executions yet</p>
            ) : (
              <div className="space-y-2">
                {executions.map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => loadExecution(exec.id)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-sm">{exec.user_command}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded ${
                          exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                          exec.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exec.status}
                        </span>
                        <span>{new Date(exec.created_at).toLocaleString()}</span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCommandPDF(exec.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                      aria-label="Export Command PDF"
                      title="Export Command PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                What would you like to accomplish?
              </h2>
              <p className="text-gray-600">
                Enter a command to triage emails, optimize your calendar, or create study plans
              </p>
            </div>

            <div className="w-full max-w-4xl mx-auto mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Running as:
                </label>
                <AccountSelector
                  userId={user.id}
                  selectedAccountId={selectedAccountId}
                  onAccountSelect={setSelectedAccountId}
                  disabled={loading}
                />
                {selectedAccountId && (
                  <p className="text-xs text-gray-500 mt-2">
                    All operations will use this account. Account must be valid and have appropriate OAuth scopes.
                  </p>
                )}
              </div>
            </div>

            <CommandInput onSubmit={handleCommand} loading={loading} />

            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700 font-medium">Processing your request...</span>
                  </div>
                  {runningAccountEmail && (
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Running as:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">{runningAccountEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && result && (
              <DashboardView
                executionPlan={result.execution_plan}
                finalSummary={result.final_summary}
                dashboardSnapshot={result.dashboard_snapshot}
                auditLog={result.audit_log}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>LifeOS - Multi-Agent Personal Automation System</p>
        <p className="mt-1">
          Timezone: {userContext?.timezone || 'Asia/Kolkata'} |
          Demo Mode: {userContext?.demo_mode ? 'ON' : 'OFF'} |
          Auto-send: {userContext?.demo_mode ? 'Disabled (Demo)' : (userContext?.auto_send ? 'Enabled' : 'Disabled')}
        </p>
      </footer>

      <InstallPrompt />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          link={toast.link}
          onClose={() => setToast(null)}
        />
      )}

      <ProgressModal
        isOpen={showProgress}
        title="Generating Weekly Report"
        message={progressMessage}
      />

      {showAccountDetails && currentAccount && (
        <AccountDetailsModal
          account={currentAccount}
          onClose={() => setShowAccountDetails(false)}
          onDisconnect={handleDisconnectAccount}
        />
      )}
    </div>
  );
}

export default App;
