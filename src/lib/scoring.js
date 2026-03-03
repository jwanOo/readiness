/* ═══════════════════════════════════════════════════════════════
   AI READINESS SCORING UTILITIES
   ═══════════════════════════════════════════════════════════════ */

/**
 * Compute AI Readiness scores from assessment answers
 * @param {Object} answers - Object with keys like "sectionId_questionIndex" and answer values
 * @returns {Object} - { sap, btp, data, overall, recommendations }
 */
export function computeReadinessFromAnswers(answers) {
  const val = (sId, qi) => (answers[`${sId}_${qi}`] || "").toLowerCase().trim();

  // SAP System Score (0-100)
  let sap = 20;
  const ls = (qi) => val("landscape", qi);
  if (/s\/4|s4|hana|rise|grow/i.test(ls(0) + ls(1) + ls(2))) sap += 18;
  if (/cloud|rise|grow|public/i.test(ls(2))) sap += 14;
  if (/hana/i.test(ls(3))) sap += 8;
  if (/ja|yes|plan/i.test(ls(4))) sap += 5;
  if (/clean.?core|ja|yes/i.test(ls(5))) sap += 15;
  if (/ja|yes|aktiv|nutz/i.test(val("aiSap", 0))) sap += 10;
  if (/ja|yes|aktiv|plan/i.test(val("aiSap", 1))) sap += 10;
  sap = Math.min(100, sap);

  // BTP & AI Platform Score (0-100)
  let btp = 10;
  if (/ja|yes|nutz/i.test(val("btp", 0))) btp += 22;
  if (/ai.?core|integration|datasphere|build/i.test(val("btp", 1))) btp += 15;
  if (/cpea|btpea|subscription/i.test(val("btp", 2))) btp += 10;
  if (/ja|yes|nutz|plan/i.test(val("btp", 3))) btp += 10;
  if (/ja|yes|nutz|plan/i.test(val("btp", 4))) btp += 10;
  if (/ja|yes|ai|joule|core/i.test(val("licensing", 1))) btp += 13;
  if (/ja|yes/i.test(val("licensing", 2))) btp += 10;
  btp = Math.min(100, btp);

  // Data Maturity Score (0-100)
  let data = 10;
  if (/sehr gut|excellent/i.test(val("data", 0))) data += 30;
  else if (/gut|good/i.test(val("data", 0))) data += 20;
  else if (/ausbau|moderate/i.test(val("data", 0))) data += 10;
  if (/ja|yes|vorhanden/i.test(val("data", 1))) data += 25;
  if (/ja|yes|bw|datasphere|lake|warehouse|snowflake/i.test(val("data", 2))) data += 20;
  if (val("aiNonSap", 0).length > 5) data += 8;
  if (val("aiNonSap", 1).length > 5) data += 7;
  data = Math.min(100, data);

  // Overall Score
  const overall = Math.round((sap + btp + data) / 3);

  // Generate recommendations
  const recommendations = generateRecommendations(sap, btp, data);

  return { sap, btp, data, overall, recommendations };
}

/**
 * Generate recommendations based on scores
 * @param {number} sap - SAP score
 * @param {number} btp - BTP score
 * @param {number} data - Data score
 * @returns {Array} - Array of recommendation objects
 */
function generateRecommendations(sap, btp, data) {
  const recommendations = [];

  // SAP recommendations
  if (sap < 33) {
    recommendations.push({
      type: 'critical',
      category: 'SAP System',
      message: 'Migration auf S/4HANA und Clean-Core-Strategie empfohlen',
      icon: '⚠️'
    });
  } else if (sap < 66) {
    recommendations.push({
      type: 'warning',
      category: 'SAP System',
      message: 'Joule aktivieren und Clean-Core-Strategie vorantreiben',
      icon: '💡'
    });
  } else {
    recommendations.push({
      type: 'success',
      category: 'SAP System',
      message: 'SAP-System ist AI-ready',
      icon: '✅'
    });
  }

  // BTP recommendations
  if (btp < 33) {
    recommendations.push({
      type: 'critical',
      category: 'BTP & AI Platform',
      message: 'SAP BTP mit AI Core und CPEA/BTPEA-Lizenzierung erforderlich',
      icon: '⚠️'
    });
  } else if (btp < 66) {
    recommendations.push({
      type: 'warning',
      category: 'BTP & AI Platform',
      message: 'SAP AI Core und SAP Business Data Cloud evaluieren',
      icon: '💡'
    });
  } else {
    recommendations.push({
      type: 'success',
      category: 'BTP & AI Platform',
      message: 'BTP & AI Platform sind einsatzbereit',
      icon: '✅'
    });
  }

  // Data recommendations
  if (data < 33) {
    recommendations.push({
      type: 'critical',
      category: 'Datenreife',
      message: 'Datenstrategie, Data Governance und zentrales DWH aufbauen',
      icon: '⚠️'
    });
  } else if (data < 66) {
    recommendations.push({
      type: 'warning',
      category: 'Datenreife',
      message: 'Data Governance stärken und SAP Datasphere einführen',
      icon: '💡'
    });
  } else {
    recommendations.push({
      type: 'success',
      category: 'Datenreife',
      message: 'Datenreife unterstützt KI-Initiativen',
      icon: '✅'
    });
  }

  return recommendations;
}

/**
 * Calculate overall score from individual scores
 * @param {Object} scores - { sap, btp, data }
 * @returns {number} - Overall score (0-100)
 */
export function calculateOverallScore(scores) {
  if (!scores) return 0;
  const { sap = 0, btp = 0, data = 0 } = scores;
  return Math.round((sap + btp + data) / 3);
}

/**
 * Get color for a score value
 * @param {number} score - Score value (0-100)
 * @returns {string} - Color hex code
 */
export function getScoreColor(score) {
  if (score >= 66) return '#27AE60';
  if (score >= 33) return '#F39C12';
  return '#E74C3C';
}

/**
 * Get label for a score value
 * @param {number} score - Score value (0-100)
 * @returns {string} - Label text
 */
export function getScoreLabel(score) {
  if (score >= 66) return 'AI-Ready';
  if (score >= 33) return 'Teilweise bereit';
  return 'Nicht bereit';
}

/**
 * Get readiness level label and color
 * @param {number} score - Score value (0-100)
 * @returns {Object} - { label, color, bgColor }
 */
export function getReadinessLevel(score) {
  if (score >= 66) {
    return {
      label: 'AI-Ready ✓',
      color: '#27AE60',
      bgColor: '#EAFAF1',
      description: 'Gut für SAP Business AI aufgestellt'
    };
  } else if (score >= 33) {
    return {
      label: 'Teilweise bereit',
      color: '#F39C12',
      bgColor: '#FEF9E7',
      description: 'Grundlagen vorhanden — gezielte Maßnahmen empfohlen'
    };
  } else {
    return {
      label: 'Nicht bereit',
      color: '#E74C3C',
      bgColor: '#FDEDEC',
      description: 'Erheblicher Handlungsbedarf vor KI-Einführung'
    };
  }
}

/**
 * Calculate completion percentage for an assessment
 * @param {Object} answers - Answers object
 * @param {number} totalQuestions - Total number of questions
 * @returns {number} - Completion percentage (0-100)
 */
export function calculateCompletion(answers, totalQuestions) {
  if (!answers || totalQuestions === 0) return 0;
  const answeredCount = Object.values(answers).filter(v => v?.trim()).length;
  return Math.round((answeredCount / totalQuestions) * 100);
}

/**
 * Aggregate scores for analytics
 * @param {Array} assessmentsWithScores - Array of { assessment, scores }
 * @returns {Object} - Aggregated analytics data
 */
export function aggregateAnalytics(assessmentsWithScores) {
  if (!assessmentsWithScores || assessmentsWithScores.length === 0) {
    return {
      totalAssessments: 0,
      averageOverall: 0,
      averageSap: 0,
      averageBtp: 0,
      averageData: 0,
      byStatus: { draft: 0, in_progress: 0, completed: 0 },
      byIndustry: {},
      byReadinessLevel: { ready: 0, partial: 0, notReady: 0 },
      topPerformers: [],
      needsAttention: []
    };
  }

  const total = assessmentsWithScores.length;
  
  // Calculate averages
  const sumScores = assessmentsWithScores.reduce((acc, item) => ({
    overall: acc.overall + (item.scores?.overall || 0),
    sap: acc.sap + (item.scores?.sap || 0),
    btp: acc.btp + (item.scores?.btp || 0),
    data: acc.data + (item.scores?.data || 0)
  }), { overall: 0, sap: 0, btp: 0, data: 0 });

  // Count by status
  const byStatus = assessmentsWithScores.reduce((acc, item) => {
    const status = item.assessment?.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { draft: 0, in_progress: 0, completed: 0 });

  // Count by industry
  const byIndustry = assessmentsWithScores.reduce((acc, item) => {
    const industry = item.assessment?.industry || 'unknown';
    if (!acc[industry]) {
      acc[industry] = { count: 0, totalScore: 0 };
    }
    acc[industry].count++;
    acc[industry].totalScore += item.scores?.overall || 0;
    return acc;
  }, {});

  // Calculate average per industry
  Object.keys(byIndustry).forEach(key => {
    byIndustry[key].averageScore = Math.round(byIndustry[key].totalScore / byIndustry[key].count);
  });

  // Count by readiness level
  const byReadinessLevel = assessmentsWithScores.reduce((acc, item) => {
    const score = item.scores?.overall || 0;
    if (score >= 66) acc.ready++;
    else if (score >= 33) acc.partial++;
    else acc.notReady++;
    return acc;
  }, { ready: 0, partial: 0, notReady: 0 });

  // Top performers (highest scores)
  const topPerformers = [...assessmentsWithScores]
    .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
    .slice(0, 5)
    .map(item => ({
      customerName: item.assessment?.customer_name,
      industry: item.assessment?.industry,
      score: item.scores?.overall || 0
    }));

  // Needs attention (lowest scores)
  const needsAttention = [...assessmentsWithScores]
    .sort((a, b) => (a.scores?.overall || 0) - (b.scores?.overall || 0))
    .slice(0, 5)
    .map(item => ({
      customerName: item.assessment?.customer_name,
      industry: item.assessment?.industry,
      score: item.scores?.overall || 0
    }));

  return {
    totalAssessments: total,
    averageOverall: Math.round(sumScores.overall / total),
    averageSap: Math.round(sumScores.sap / total),
    averageBtp: Math.round(sumScores.btp / total),
    averageData: Math.round(sumScores.data / total),
    byStatus,
    byIndustry,
    byReadinessLevel,
    topPerformers,
    needsAttention
  };
}