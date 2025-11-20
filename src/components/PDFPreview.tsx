import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PDFPreviewProps {
  executionId: string;
}

export function PDFPreview({ executionId }: PDFPreviewProps) {
  const [execution, setExecution] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutionData();
  }, [executionId]);

  const loadExecutionData = async () => {
    const { data: exec } = await supabase
      .from('executions')
      .select('*')
      .eq('id', executionId)
      .single();

    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: true });

    setExecution(exec);
    setAuditLogs(logs || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!execution) {
    return <div className="p-8">Execution not found</div>;
  }

  const snapshot = execution.dashboard_snapshot || {};

  return (
    <div className="pdf-preview bg-white p-8 max-w-5xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LifeOS Execution Report</h1>
        <div className="text-sm text-green-700 font-semibold mb-2">
          DEMO MODE - Safe for Judges | Mock Data Only
        </div>
        <div className="text-sm text-gray-600">
          <div>Generated: {new Date().toLocaleString()}</div>
          <div>Execution Date: {new Date(execution.created_at).toLocaleString()}</div>
          <div>Timezone: Asia/Kolkata</div>
        </div>
      </header>

      {execution.user_command && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">User Command</h2>
          <p className="text-gray-800">{execution.user_command}</p>
        </section>
      )}

      {execution.execution_plan && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Execution Plan</h2>
          <p className="text-gray-700">{execution.execution_plan}</p>
        </section>
      )}

      {execution.final_summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-700">{execution.final_summary}</p>
        </section>
      )}

      {snapshot.email_summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Summary</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Urgent emails: {snapshot.email_summary.top_urgent?.length || 0}</p>
            <p>Drafts created: {snapshot.email_summary.drafts_count || 0}</p>
            <p>Replies sent: {snapshot.email_summary.replies_sent || 0}</p>
          </div>
          {snapshot.email_summary.top_urgent?.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold text-gray-800 mb-2">Urgent Emails:</h3>
              {snapshot.email_summary.top_urgent.map((email: any, idx: number) => (
                <div key={idx} className="mb-3 text-sm">
                  <p className="font-medium">Subject: {email.subject}</p>
                  <p className="text-gray-600">From: {email.from}</p>
                  <p className="text-gray-600">{email.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {snapshot.calendar_summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Calendar Summary</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Events today: {snapshot.calendar_summary.events_today || 0}</p>
            <p>Proposed changes: {snapshot.calendar_summary.proposed_changes || 0}</p>
          </div>
        </section>
      )}

      {snapshot.study_summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Study Plan</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Subject: {snapshot.study_summary.subject}</p>
            <p>Days planned: {snapshot.study_summary.days_planned || 0}</p>
            <p>Flashcards: {snapshot.study_summary.flashcards_count || 0}</p>
          </div>
        </section>
      )}

      {auditLogs.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Audit Log</h2>
          {auditLogs.map((log, idx) => (
            <div key={idx} className="mb-3 border-l-2 border-gray-300 pl-3 text-sm">
              <p className="font-medium text-gray-900">{log.agent} - {log.action}</p>
              {log.output_summary && (
                <p className="text-gray-600 text-xs mt-1">{log.output_summary}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </section>
      )}

      <section id="demo-screenshots" className="mb-6 page-break-before">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Demo Screenshots</h2>
        <p className="text-sm text-gray-600 mb-4">Visual examples of the LifeOS interface:</p>

        <div className="space-y-4">
          <div>
            <img
              src="/screenshots/dashboard-main.png"
              alt="Main Dashboard"
              style={{ maxWidth: '100%', marginBottom: '12px', border: '1px solid #e5e7eb' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<p class="text-gray-400 text-sm">Screenshot: dashboard-main.png</p>';
                }
              }}
            />
            <p className="text-xs text-gray-500">Main Dashboard Interface</p>
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <img
                src="/screenshots/command-interface.png"
                alt="Command Interface"
                style={{ maxWidth: '100%', border: '1px solid #e5e7eb' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-gray-400 text-sm">Screenshot: command-interface.png</p>';
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Command Interface</p>
            </div>
            <div style={{ flex: 1 }}>
              <img
                src="/screenshots/execution-results.png"
                alt="Execution Results"
                style={{ maxWidth: '100%', border: '1px solid #e5e7eb' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-gray-400 text-sm">Screenshot: execution-results.png</p>';
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Execution Results</p>
            </div>
          </div>

          <div>
            <img
              src="/screenshots/calendar-management.png"
              alt="Calendar Management"
              style={{ maxWidth: '100%', marginTop: '12px', border: '1px solid #e5e7eb' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<p class="text-gray-400 text-sm">Screenshot: calendar-management.png</p>';
                }
              }}
            />
            <p className="text-xs text-gray-500">Calendar Management & Optimization</p>
          </div>
        </div>
      </section>

      <footer className="text-xs text-gray-500 mt-8 pt-4 border-t">
        <p>Note: For server-side PDF generation with embedded screenshots, use Puppeteer via Edge Function</p>
        <p>Current implementation: Client-side preview ready for print-to-PDF</p>
      </footer>
    </div>
  );
}
