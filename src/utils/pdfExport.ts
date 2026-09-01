import { jsPDF } from 'jspdf';
import { WeeklyReport, WorkUpdate } from '../types';
import { formatDisplayDate, formatWeekRange } from './dateUtils';

export function exportWeeklyReportPDF(report: WeeklyReport, workUpdates: WorkUpdate[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 18;
  let cursorY = 20;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WorkPulse Executive Weekly Report', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}`, margin, 20);

  cursorY = 38;

  // Report Metadata Grid
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Report Details', margin, cursorY);
  cursorY += 6;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, cursorY, 174, 26, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', margin + 4, cursorY + 7);
  doc.text('Reporting Period:', margin + 4, cursorY + 14);
  doc.text('Submission Status:', margin + 4, cursorY + 21);

  doc.setFont('helvetica', 'normal');
  doc.text(`${report.employeeName} (${report.employeeEmail})`, margin + 35, cursorY + 7);
  doc.text(formatWeekRange(report.weekStart, report.weekEnd), margin + 35, cursorY + 14);
  doc.text(`${report.status} (${report.submittedAt ? formatDisplayDate(report.submittedAt) : 'Draft In Progress'})`, margin + 35, cursorY + 21);

  cursorY += 34;

  // AI Executive Summary Section
  if (report.aiSummary) {
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(margin, cursorY, 174, 38, 2, 2, 'FD');

    doc.setTextColor(67, 56, 202); // indigo-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AI Executive Summary & Insights', margin + 4, cursorY + 7);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const summaryLines = doc.splitTextToSize(report.aiSummary.executiveSummary, 166);
    doc.text(summaryLines, margin + 4, cursorY + 14);

    cursorY += 46;
  }

  // Daily Work Updates Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Daily Work Updates (${workUpdates.length} logged)`, margin, cursorY);
  cursorY += 6;

  if (workUpdates.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No daily work entries recorded for this period.', margin, cursorY);
    cursorY += 8;
  } else {
    workUpdates.forEach(wu => {
      if (cursorY > 260) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${formatDisplayDate(wu.workDate)} (${wu.hoursSpent} hrs | ${wu.projectTag}):`, margin, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(wu.description, 160);
      doc.text(descLines, margin + 4, cursorY + 5);
      cursorY += 6 + descLines.length * 4;
    });
  }

  cursorY += 4;

  // Four Weekly Questions Section
  const questionsList = [
    { label: '1. Main Accomplishments', answer: report.answers.accomplishments },
    { label: '2. Current Work in Progress', answer: report.answers.inProgress },
    { label: '3. Blockers & Challenges', answer: report.answers.blockers },
    { label: '4. Priorities for Next Week', answer: report.answers.nextWeekPriorities },
  ];

  questionsList.forEach(q => {
    if (cursorY > 255) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(q.label, margin, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const ansLines = doc.splitTextToSize(q.answer || 'Not answered', 170);
    doc.text(ansLines, margin, cursorY);
    cursorY += ansLines.length * 4 + 6;
  });

  const fileName = `Weekly_Report_${report.employeeName.replace(/\s+/g, '_')}_${report.weekStart}.pdf`;
  doc.save(fileName);
}
