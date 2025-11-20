import { useState } from 'react';
import { Mail, Calendar, BookOpen, FileText, Download, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ComposeModal } from './ComposeModal';

interface DashboardViewProps {
  executionPlan?: string;
  finalSummary?: string;
  dashboardSnapshot?: any;
  auditLog?: any[];
}

export function DashboardView({ executionPlan, finalSummary, dashboardSnapshot, auditLog }: DashboardViewProps) {
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openComposeModal = (draft: any) => {
    setSelectedDraft(draft);
    setIsModalOpen(true);
  };

  const closeComposeModal = () => {
    setIsModalOpen(false);
    setSelectedDraft(null);
  };
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDFReport = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxLineWidth = 170;

    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      const lines = doc.splitTextToSize(text, maxLineWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('LifeOS Execution Report', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 128, 0);
    doc.text('DEMO MODE - Safe for Judges | Mock Data Only', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 5;
    doc.text('Timezone: Asia/Kolkata', 20, yPosition);
    yPosition += 15;

    if (executionPlan) {
      addText('Execution Plan', 14, true);
      addText(executionPlan, 10);
      yPosition += 5;
    }

    if (finalSummary) {
      addText('Summary', 14, true);
      addText(finalSummary, 10);
      yPosition += 5;
    }

    if (dashboardSnapshot?.email_summary) {
      addText('Email Summary', 14, true);
      addText(`Urgent emails: ${dashboardSnapshot.email_summary.top_urgent.length}`, 10);
      addText(`Drafts created: ${dashboardSnapshot.email_summary.drafts_count}`, 10);
      addText(`Replies sent: ${dashboardSnapshot.email_summary.replies_sent}`, 10);
      yPosition += 5;

      if (dashboardSnapshot.email_summary.top_urgent?.length > 0) {
        addText('Urgent Emails:', 12, true);
        dashboardSnapshot.email_summary.top_urgent.forEach((email: any) => {
          addText(`Subject: ${email.subject}`, 10, true);
          addText(`From: ${email.from}`, 9);
          addText(`${email.snippet}`, 9);
          yPosition += 3;
        });
      }
    }

    if (dashboardSnapshot?.calendar_summary) {
      addText('Calendar Summary', 14, true);
      addText(`Events today: ${dashboardSnapshot.calendar_summary.events_today}`, 10);
      addText(`Proposed changes: ${dashboardSnapshot.calendar_summary.proposed_changes}`, 10);
      yPosition += 5;
    }

    if (dashboardSnapshot?.study_summary) {
      addText('Study Plan', 14, true);
      addText(`Subject: ${dashboardSnapshot.study_summary.subject}`, 10);
      addText(`Days planned: ${dashboardSnapshot.study_summary.days_planned}`, 10);
      addText(`Flashcards: ${dashboardSnapshot.study_summary.flashcards_count}`, 10);
      yPosition += 5;
    }

    if (auditLog && auditLog.length > 0) {
      addText('Audit Log', 14, true);
      auditLog.forEach((log) => {
        addText(`${log.agent} - ${log.action}`, 10, true);
        if (log.output_summary) {
          addText(log.output_summary, 9);
        }
        addText(new Date(log.timestamp).toLocaleString(), 8);
        yPosition += 3;
      });
    }

    doc.addPage();
    yPosition = 20;
    addText('Demo Screenshots', 14, true);
    addText('Visual examples available at /public/screenshots/', 10);
    yPosition += 5;
    addText('Available screenshots:', 10, true);
    addText('- dashboard-main.png: Main dashboard interface', 9);
    addText('- command-interface.png: Natural language command input', 9);
    addText('- calendar-management.png: Calendar optimization view', 9);
    addText('- execution-results.png: Complete execution results', 9);
    yPosition += 10;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Note: For PDF with embedded screenshots, use browser Print (Ctrl+P) instead', 20, yPosition);
    yPosition += 5;
    doc.text('Screenshots are accessible in the web interface after running any command', 20, yPosition);

    doc.save('lifeos-demo-report.pdf');
  };

  if (!dashboardSnapshot) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No execution results yet. Enter a command above to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button
          onClick={downloadPDFReport}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      {executionPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Execution Plan</h3>
          <p className="text-blue-800 text-sm">{executionPlan}</p>
        </div>
      )}

      {finalSummary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Summary</h3>
          <p className="text-green-800 text-sm">{finalSummary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboardSnapshot.email_summary && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Email Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Urgent emails:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.email_summary.top_urgent.length}</span>
              </p>
              <p>
                <span className="text-gray-600">Drafts created:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.email_summary.drafts_count}</span>
              </p>
              <p>
                <span className="text-gray-600">Replies sent:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.email_summary.replies_sent}</span>
              </p>
            </div>
          </div>
        )}

        {dashboardSnapshot.calendar_summary && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Calendar Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Events today:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.calendar_summary.events_today}</span>
              </p>
              <p>
                <span className="text-gray-600">Proposed changes:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.calendar_summary.proposed_changes}</span>
              </p>
            </div>
          </div>
        )}

        {dashboardSnapshot.study_summary && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Study Plan</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Subject:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.study_summary.subject}</span>
              </p>
              <p>
                <span className="text-gray-600">Days planned:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.study_summary.days_planned}</span>
              </p>
              <p>
                <span className="text-gray-600">Flashcards:</span>{' '}
                <span className="font-medium">{dashboardSnapshot.study_summary.flashcards_count}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {dashboardSnapshot.email_summary?.top_urgent?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-600" />
            Urgent Emails
          </h3>
          <div className="space-y-3">
            {dashboardSnapshot.email_summary.top_urgent.map((email: any) => (
              <div key={email.id} className="border-l-4 border-red-500 pl-3 py-2">
                <p className="font-medium text-sm">{email.subject}</p>
                <p className="text-xs text-gray-600">From: {email.from}</p>
                <p className="text-xs text-gray-500 mt-1">{email.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboardSnapshot.quick_actions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dashboardSnapshot.quick_actions.map((action: any, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  if (action.type === 'download_csv' && action.data?.csv) {
                    downloadCSV(action.data.csv, 'flashcards.csv');
                  } else if (action.type === 'email_draft' && action.data) {
                    openComposeModal(action.data);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-left transition-colors"
              >
                {action.type === 'download_csv' && <Download className="w-4 h-4" />}
                {action.type === 'email_draft' && <Mail className="w-4 h-4" />}
                {action.type === 'calendar_proposal' && <Calendar className="w-4 h-4" />}
                {action.type === 'study_schedule' && <BookOpen className="w-4 h-4" />}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {auditLog && auditLog.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Audit Log</h3>
          <div className="space-y-2">
            {auditLog.map((log, idx) => (
              <div key={idx} className="text-sm border-l-2 border-gray-300 pl-3 py-1">
                <p className="font-medium text-gray-900">
                  {log.agent} - {log.action}
                </p>
                {log.output_summary && (
                  <p className="text-gray-600 text-xs mt-1">{log.output_summary}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 no-print">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Demo Screenshots
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Visual examples of the LifeOS interface for judges and evaluators:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <img
              src="/screenshots/dashboard-main.png"
              alt="Main Dashboard"
              className="w-full border border-gray-300 rounded-lg shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Main Dashboard</p>
          </div>
          <div>
            <img
              src="/screenshots/command-interface.png"
              alt="Command Interface"
              className="w-full border border-gray-300 rounded-lg shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Command Interface</p>
          </div>
          <div>
            <img
              src="/screenshots/calendar-management.png"
              alt="Calendar Management"
              className="w-full border border-gray-300 rounded-lg shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Calendar Management</p>
          </div>
          <div>
            <img
              src="/screenshots/execution-results.png"
              alt="Execution Results"
              className="w-full border border-gray-300 rounded-lg shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Execution Results</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Note: Use browser Print (Ctrl+P / Cmd+P) to generate PDF with screenshots included
        </p>
      </div>

      {selectedDraft && (
        <ComposeModal
          isOpen={isModalOpen}
          onClose={closeComposeModal}
          draft={selectedDraft}
        />
      )}
    </div>
  );
}
