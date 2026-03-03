/* ═══════════════════════════════════════════════════════════════
   PDF EXPORT SERVICE
   Professional PDF generation using jsPDF
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { INDUSTRIES, CORE_SECTIONS } from './constants';
import { computeReadinessFromAnswers, getReadinessLevel } from './scoring';

/**
 * Generate a professional PDF report for an assessment
 * @param {Object} assessment - Assessment object from database
 * @param {Object} answers - Answers object (key: sectionId_questionIndex, value: answer)
 * @param {Array} allSections - All sections including industry-specific ones
 */
export function generatePDF(assessment, answers, allSections = null) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  const industry = INDUSTRIES[assessment?.industry];
  const scores = computeReadinessFromAnswers(answers || {});
  const readinessLevel = getReadinessLevel(scores.overall);
  
  // Use provided sections or build from core + industry
  const sections = allSections || buildSections(assessment?.industry);
  
  let yPos = margin;

  // ═══════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  const addNewPageIfNeeded = (requiredSpace = 30) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      addHeader();
      return true;
    }
    return false;
  };

  const addHeader = () => {
    // Header line
    doc.setDrawColor(46, 134, 193);
    doc.setLineWidth(0.5);
    doc.line(margin, 10, pageWidth - margin, 10);
    
    // Header text
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text('AI Readiness Check — adesso', margin, 7);
    doc.text(`Seite ${doc.internal.getNumberOfPages()}`, pageWidth - margin, 7, { align: 'right' });
  };

  const addFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `Erstellt am ${new Date().toLocaleDateString('de-DE')} — VERTRAULICH`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // TITLE PAGE
  // ═══════════════════════════════════════════════════════════════
  
  // Logo/Brand area
  doc.setFillColor(27, 58, 92);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Readiness Check', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('SAP AI Readiness Assessment Report', pageWidth / 2, 42, { align: 'center' });
  
  // Customer info box
  yPos = 75;
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(27, 58, 92);
  doc.text('Kunde:', margin + 10, yPos + 12);
  doc.setFontSize(16);
  doc.text(assessment?.customer_name || 'Unbekannt', margin + 10, yPos + 24);
  
  doc.setFontSize(11);
  doc.setTextColor(93, 109, 126);
  doc.text(`Branche: ${industry?.icon || ''} ${industry?.label || assessment?.industry || 'Allgemein'}`, margin + 10, yPos + 36);
  
  // Date
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin - 10, yPos + 12, { align: 'right' });
  
  // ═══════════════════════════════════════════════════════════════
  // READINESS SCORE SECTION
  // ═══════════════════════════════════════════════════════════════
  
  yPos = 135;
  doc.setFontSize(16);
  doc.setTextColor(27, 58, 92);
  doc.text('AI Readiness Assessment', margin, yPos);
  
  yPos += 10;
  
  // Overall score box
  const overallColor = hexToRgb(readinessLevel.color);
  const overallBgColor = hexToRgb(readinessLevel.bgColor);
  
  doc.setFillColor(overallBgColor.r, overallBgColor.g, overallBgColor.b);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
  
  doc.setFontSize(32);
  doc.setTextColor(overallColor.r, overallColor.g, overallColor.b);
  doc.text(`${scores.overall}%`, margin + 20, yPos + 22);
  
  doc.setFontSize(14);
  doc.text('Gesamtbewertung', margin + 55, yPos + 15);
  doc.setFontSize(11);
  doc.text(readinessLevel.description, margin + 55, yPos + 26);
  
  // Individual scores
  yPos += 45;
  const scoreBoxWidth = (contentWidth - 20) / 3;
  
  const drawScoreBox = (x, score, label, sublabel) => {
    const level = getReadinessLevel(score);
    const color = hexToRgb(level.color);
    const bgColor = hexToRgb(level.bgColor);
    
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.roundedRect(x, yPos, scoreBoxWidth, 40, 2, 2, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(color.r, color.g, color.b);
    doc.text(`${score}%`, x + scoreBoxWidth / 2, yPos + 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(27, 58, 92);
    doc.text(label, x + scoreBoxWidth / 2, yPos + 28, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(sublabel, x + scoreBoxWidth / 2, yPos + 35, { align: 'center' });
  };
  
  drawScoreBox(margin, scores.sap, 'SAP System', 'S/4HANA, Clean Core, Joule');
  drawScoreBox(margin + scoreBoxWidth + 10, scores.btp, 'BTP & AI Platform', 'AI Core, Datasphere, BDC');
  drawScoreBox(margin + 2 * (scoreBoxWidth + 10), scores.data, 'Datenreife', 'Qualität, Governance, DWH');
  
  // Recommendations
  yPos += 50;
  doc.setFontSize(12);
  doc.setTextColor(27, 58, 92);
  doc.text('Empfehlungen:', margin, yPos);
  
  yPos += 8;
  scores.recommendations.forEach(rec => {
    const bgColors = {
      critical: { r: 253, g: 237, b: 236 },
      warning: { r: 254, g: 249, b: 231 },
      success: { r: 234, g: 250, b: 241 }
    };
    const textColors = {
      critical: { r: 231, g: 76, b: 60 },
      warning: { r: 183, g: 149, b: 11 },
      success: { r: 39, g: 174, b: 96 }
    };
    
    const bg = bgColors[rec.type];
    const text = textColors[rec.type];
    
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.roundedRect(margin, yPos, contentWidth, 10, 1, 1, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(text.r, text.g, text.b);
    doc.text(`${rec.icon} ${rec.category}: ${rec.message}`, margin + 5, yPos + 7);
    
    yPos += 12;
  });

  // ═══════════════════════════════════════════════════════════════
  // DETAILED ANSWERS SECTION
  // ═══════════════════════════════════════════════════════════════
  
  doc.addPage();
  yPos = margin;
  addHeader();
  
  doc.setFontSize(16);
  doc.setTextColor(27, 58, 92);
  doc.text('Detaillierte Antworten', margin, yPos);
  yPos += 15;
  
  sections.forEach((section, sectionIndex) => {
    addNewPageIfNeeded(40);
    
    // Section header
    const sectionColor = section.isIndustry ? hexToRgb(industry?.color || '#2E86C1') : { r: 27, g: 58, b: 92 };
    
    doc.setFillColor(sectionColor.r, sectionColor.g, sectionColor.b);
    doc.roundedRect(margin, yPos, contentWidth, 10, 1, 1, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(section.title, margin + 5, yPos + 7);
    
    if (section.isIndustry) {
      doc.setFontSize(8);
      doc.text('Branchenspezifisch', pageWidth - margin - 5, yPos + 7, { align: 'right' });
    }
    
    yPos += 15;
    
    // Questions and answers table
    const tableData = section.questions.map((q, qi) => {
      const answer = answers?.[`${section.id}_${qi}`] || '';
      return [
        q.q + (q.hint ? `\n(${q.hint})` : ''),
        answer || '— nicht beantwortet —'
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['Frage', 'Antwort']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        lineColor: [213, 216, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [232, 237, 242],
        textColor: [27, 58, 92],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.5 },
        1: { cellWidth: contentWidth * 0.5 },
      },
      alternateRowStyles: {
        fillColor: [250, 251, 252],
      },
      didDrawPage: (data) => {
        addHeader();
      },
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  });

  // ═══════════════════════════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════════════════════════
  
  addFooter();
  
  // Generate filename
  const customerName = (assessment?.customer_name || 'Assessment')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `AI_Readiness_${customerName}_${dateStr}.pdf`;
  
  // Save the PDF
  doc.save(filename);
  
  return filename;
}

/**
 * Build sections array from industry key
 */
function buildSections(industryKey) {
  const sections = [...CORE_SECTIONS];
  
  if (industryKey && INDUSTRIES[industryKey]) {
    const industry = INDUSTRIES[industryKey];
    const industrySections = industry.specificQuestions.map((sq, i) => ({
      id: `ind_${i}`,
      title: `${industry.icon} ${sq.section}`,
      questions: sq.questions.map(q => ({ q: q.q, hint: q.hint })),
      isIndustry: true,
    }));
    
    // Insert industry sections after aiSap section
    const aiSapIndex = sections.findIndex(s => s.id === 'aiSap');
    if (aiSapIndex >= 0) {
      sections.splice(aiSapIndex + 1, 0, ...industrySections);
    } else {
      sections.push(...industrySections);
    }
  }
  
  return sections;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Export multiple assessments to PDF (batch export)
 * @param {Array} assessmentsWithAnswers - Array of { assessment, answers }
 */
export async function batchExportPDF(assessmentsWithAnswers) {
  for (const { assessment, answers } of assessmentsWithAnswers) {
    generatePDF(assessment, answers);
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Generate analytics report PDF
 * @param {Object} analytics - Analytics data from aggregateAnalytics
 * @param {Array} assessmentsWithScores - All assessments with their scores
 */
export function generateAnalyticsPDF(analytics, assessmentsWithScores) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPos = margin;

  // ═══════════════════════════════════════════════════════════════
  // TITLE
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFillColor(27, 58, 92);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Readiness Analytics', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Übersicht aller Assessments — ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 38, { align: 'center' });
  
  yPos = 65;

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY STATS
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(14);
  doc.setTextColor(27, 58, 92);
  doc.text('Zusammenfassung', margin, yPos);
  yPos += 10;
  
  // Stats boxes
  const statBoxWidth = (contentWidth - 30) / 4;
  const stats = [
    { value: analytics.totalAssessments, label: 'Assessments' },
    { value: `${analytics.averageOverall}%`, label: 'Ø Readiness' },
    { value: analytics.byStatus.completed, label: 'Abgeschlossen' },
    { value: analytics.byReadinessLevel.ready, label: 'AI-Ready' },
  ];
  
  stats.forEach((stat, i) => {
    const x = margin + i * (statBoxWidth + 10);
    
    doc.setFillColor(247, 249, 252);
    doc.roundedRect(x, yPos, statBoxWidth, 30, 2, 2, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(27, 58, 92);
    doc.text(String(stat.value), x + statBoxWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.text(stat.label, x + statBoxWidth / 2, yPos + 24, { align: 'center' });
  });
  
  yPos += 45;

  // ═══════════════════════════════════════════════════════════════
  // READINESS DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(12);
  doc.setTextColor(27, 58, 92);
  doc.text('Readiness-Verteilung', margin, yPos);
  yPos += 8;
  
  const distribution = [
    { label: 'AI-Ready (≥66%)', count: analytics.byReadinessLevel.ready, color: { r: 39, g: 174, b: 96 } },
    { label: 'Teilweise (33-65%)', count: analytics.byReadinessLevel.partial, color: { r: 243, g: 156, b: 18 } },
    { label: 'Nicht bereit (<33%)', count: analytics.byReadinessLevel.notReady, color: { r: 231, g: 76, b: 60 } },
  ];
  
  const barWidth = contentWidth - 60;
  const total = analytics.totalAssessments || 1;
  
  distribution.forEach((item, i) => {
    const percentage = (item.count / total) * 100;
    const width = (percentage / 100) * barWidth;
    
    doc.setFillColor(232, 237, 242);
    doc.roundedRect(margin, yPos, barWidth, 12, 1, 1, 'F');
    
    if (width > 0) {
      doc.setFillColor(item.color.r, item.color.g, item.color.b);
      doc.roundedRect(margin, yPos, Math.max(width, 2), 12, 1, 1, 'F');
    }
    
    doc.setFontSize(9);
    doc.setTextColor(27, 58, 92);
    doc.text(item.label, margin + barWidth + 5, yPos + 8);
    doc.text(`${item.count} (${Math.round(percentage)}%)`, pageWidth - margin, yPos + 8, { align: 'right' });
    
    yPos += 16;
  });
  
  yPos += 10;

  // ═══════════════════════════════════════════════════════════════
  // ALL ASSESSMENTS TABLE
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFontSize(12);
  doc.setTextColor(27, 58, 92);
  doc.text('Alle Assessments', margin, yPos);
  yPos += 8;
  
  const tableData = assessmentsWithScores.map(item => {
    const industry = INDUSTRIES[item.assessment?.industry];
    return [
      item.assessment?.customer_name || 'Unbekannt',
      industry?.label || item.assessment?.industry || '-',
      `${item.scores?.overall || 0}%`,
      `${item.scores?.sap || 0}%`,
      `${item.scores?.btp || 0}%`,
      `${item.scores?.data || 0}%`,
    ];
  });
  
  doc.autoTable({
    startY: yPos,
    head: [['Kunde', 'Branche', 'Gesamt', 'SAP', 'BTP', 'Daten']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [27, 58, 92],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(
      `AI Readiness Analytics — Erstellt am ${new Date().toLocaleDateString('de-DE')} — VERTRAULICH`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`AI_Readiness_Analytics_${dateStr}.pdf`);
}