import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  executionPlan?: string;
  finalSummary?: string;
  dashboardSnapshot?: any;
  auditLog?: any[];
  userCommand?: string;
  createdAt?: string;
  demoMode?: boolean;
}

export function generatePDF(options: PDFExportOptions): string {
  const {
    executionPlan,
    finalSummary,
    dashboardSnapshot,
    auditLog,
    userCommand,
    createdAt,
    demoMode = true
  } = options;

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

  if (demoMode) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 128, 0);
    doc.text('DEMO MODE - Safe for Judges | Mock Data Only', 20, yPosition);
    yPosition += 5;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
  yPosition += 5;

  if (createdAt) {
    doc.text(`Execution Date: ${new Date(createdAt).toLocaleString()}`, 20, yPosition);
    yPosition += 5;
  }

  doc.text('Timezone: Asia/Kolkata', 20, yPosition);
  yPosition += 15;

  if (userCommand) {
    addText('User Command', 14, true);
    addText(userCommand, 10);
    yPosition += 5;
  }

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

  const filename = `lifeos-report-${Date.now()}.pdf`;
  doc.save(filename);

  return filename;
}
