/**
 * AI Action Service for Silava
 * Handles intent recognition and action execution for navigational AI
 */

import { supabase } from './supabase';
import { INDUSTRIES } from './constants';
import { computeReadinessFromAnswers, calculateOverallScore } from './scoring';

// ═══════════════════════════════════════════════════════════════
// INTENT TYPES
// ═══════════════════════════════════════════════════════════════

export const INTENTS = {
  FILL_FROM_CUSTOMER: 'fill_from_customer',
  EXPORT_DOCUMENT: 'export_document',
  NAVIGATE_TO: 'navigate_to',
  SHOW_ASSESSMENTS: 'show_assessments',
  COMPARE: 'compare',
  SHOW_SCORE: 'show_score',
  UNKNOWN: 'unknown',
};

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  PPTX: 'pptx',
  DOCX: 'docx',
  WORD: 'docx',
};

// ═══════════════════════════════════════════════════════════════
// INTENT RECOGNITION
// ═══════════════════════════════════════════════════════════════

/**
 * Recognize user intent from natural language input
 * @param {string} message - User's message
 * @param {string} language - 'de' or 'en'
 * @returns {Object} - { intent, params, confidence }
 */
export function recognizeIntent(message, language = 'de') {
  const lowerMsg = message.toLowerCase().trim();
  
  // ─── FILL FROM CUSTOMER ───
  const fillPatterns = {
    de: [
      /(?:füll|ausfüll|übernehm|kopier|verwend).*(?:von|aus|basierend|daten).*(?:kunde|customer|assessment)/i,
      /(?:daten|antworten).*(?:von|aus).*(?:kunde|customer)/i,
      /(?:basierend auf|based on).*(?:kunde|customer)/i,
      /(?:fill|ausfüllen).*(?:based|basierend)/i,
      /(?:kunde|customer)\s+(\w+).*(?:übernehm|kopier|verwend)/i,
    ],
    en: [
      /(?:fill|copy|use|import).*(?:from|based on).*(?:customer|assessment)/i,
      /(?:data|answers).*(?:from).*(?:customer)/i,
      /(?:based on).*(?:customer)/i,
    ],
  };
  
  for (const pattern of fillPatterns[language] || fillPatterns.de) {
    if (pattern.test(lowerMsg)) {
      // Extract customer name
      const customerMatch = lowerMsg.match(/(?:kunde|customer|von|from|basierend auf|based on)\s+["""]?(\w+(?:\s+\w+)?)["""]?/i);
      const customerName = customerMatch ? customerMatch[1] : extractCustomerName(lowerMsg);
      
      return {
        intent: INTENTS.FILL_FROM_CUSTOMER,
        params: { customerName },
        confidence: 0.9,
      };
    }
  }
  
  // ─── EXPORT DOCUMENT ───
  const exportPatterns = {
    de: [
      /(?:export|erstell|generier|download|speicher).*(?:pdf|powerpoint|pptx|word|docx|dokument|präsentation)/i,
      /(?:als|as)\s+(?:pdf|powerpoint|pptx|word|docx)/i,
      /(?:pdf|powerpoint|pptx|word|docx)\s+(?:export|erstell|generier|download)/i,
    ],
    en: [
      /(?:export|create|generate|download|save).*(?:pdf|powerpoint|pptx|word|docx|document|presentation)/i,
      /(?:as)\s+(?:pdf|powerpoint|pptx|word|docx)/i,
    ],
  };
  
  for (const pattern of exportPatterns[language] || exportPatterns.de) {
    if (pattern.test(lowerMsg)) {
      const format = detectExportFormat(lowerMsg);
      return {
        intent: INTENTS.EXPORT_DOCUMENT,
        params: { format },
        confidence: 0.95,
      };
    }
  }
  
  // ─── NAVIGATE TO SECTION ───
  const navPatterns = {
    de: [
      /(?:geh|navigier|zeig|öffne|spring).*(?:zu|zum|zur|nach|abschnitt|section)/i,
      /(?:abschnitt|section|bereich)\s+(\w+)/i,
      /(?:zum|zur)\s+(\w+)\s*(?:abschnitt|section|bereich)?/i,
    ],
    en: [
      /(?:go|navigate|show|open|jump).*(?:to|section)/i,
      /(?:section)\s+(\w+)/i,
    ],
  };
  
  for (const pattern of navPatterns[language] || navPatterns.de) {
    if (pattern.test(lowerMsg)) {
      const sectionName = extractSectionName(lowerMsg);
      return {
        intent: INTENTS.NAVIGATE_TO,
        params: { sectionName },
        confidence: 0.85,
      };
    }
  }
  
  // ─── SHOW ASSESSMENTS ───
  const showPatterns = {
    de: [
      /(?:zeig|list|such|find).*(?:assessment|kunde|customer|branche|industry)/i,
      /(?:alle|all)\s+(?:assessment|kunde|customer)/i,
      /(?:welche|which).*(?:assessment|kunde|customer)/i,
    ],
    en: [
      /(?:show|list|search|find).*(?:assessment|customer|industry)/i,
      /(?:all)\s+(?:assessment|customer)/i,
    ],
  };
  
  for (const pattern of showPatterns[language] || showPatterns.de) {
    if (pattern.test(lowerMsg)) {
      const industryFilter = extractIndustryFilter(lowerMsg);
      return {
        intent: INTENTS.SHOW_ASSESSMENTS,
        params: { industryFilter },
        confidence: 0.8,
      };
    }
  }
  
  // ─── COMPARE ───
  const comparePatterns = {
    de: [
      /(?:vergleich|compare)/i,
    ],
    en: [
      /(?:compare)/i,
    ],
  };
  
  for (const pattern of comparePatterns[language] || comparePatterns.de) {
    if (pattern.test(lowerMsg)) {
      const customerName = extractCustomerName(lowerMsg);
      return {
        intent: INTENTS.COMPARE,
        params: { customerName },
        confidence: 0.75,
      };
    }
  }
  
  // ─── SHOW SCORE ───
  const scorePatterns = {
    de: [
      /(?:score|bewertung|ergebnis|readiness)/i,
      /(?:wie|what).*(?:score|bewertung|stand)/i,
    ],
    en: [
      /(?:score|rating|result|readiness)/i,
      /(?:what|how).*(?:score|rating)/i,
    ],
  };
  
  for (const pattern of scorePatterns[language] || scorePatterns.de) {
    if (pattern.test(lowerMsg)) {
      return {
        intent: INTENTS.SHOW_SCORE,
        params: {},
        confidence: 0.7,
      };
    }
  }
  
  return {
    intent: INTENTS.UNKNOWN,
    params: {},
    confidence: 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractCustomerName(message) {
  // Try to extract customer name from various patterns
  const patterns = [
    /(?:kunde|customer|von|from)\s+["""]?([A-Za-zÄÖÜäöüß]+(?:\s+[A-Za-zÄÖÜäöüß]+)?)["""]?/i,
    /["""]([^"""]+)["""]/, // Quoted name
    /(?:basierend auf|based on)\s+(\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function detectExportFormat(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('powerpoint') || lowerMsg.includes('pptx') || lowerMsg.includes('präsentation')) {
    return EXPORT_FORMATS.PPTX;
  }
  if (lowerMsg.includes('word') || lowerMsg.includes('docx') || lowerMsg.includes('doc')) {
    return EXPORT_FORMATS.DOCX;
  }
  if (lowerMsg.includes('pdf')) {
    return EXPORT_FORMATS.PDF;
  }
  
  // Default to PDF
  return EXPORT_FORMATS.PDF;
}

function extractSectionName(message) {
  const lowerMsg = message.toLowerCase();
  
  // Map common section names
  const sectionMappings = {
    // German
    'allgemein': 'general',
    'general': 'general',
    'landschaft': 'landscape',
    'landscape': 'landscape',
    'sap': 'landscape',
    'lizenz': 'licensing',
    'licensing': 'licensing',
    'btp': 'btp',
    'cloud': 'cloud',
    'ki': 'aiSap',
    'ai': 'aiSap',
    'joule': 'aiSap',
    'non-sap': 'aiNonSap',
    'daten': 'data',
    'data': 'data',
    'sicherheit': 'security',
    'security': 'security',
    'compliance': 'security',
    'organisation': 'org',
    'org': 'org',
    'team': 'org',
    'use case': 'useCases',
    'usecase': 'useCases',
    'anwendungsfall': 'useCases',
  };
  
  for (const [key, value] of Object.entries(sectionMappings)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }
  
  return null;
}

function extractIndustryFilter(message) {
  const lowerMsg = message.toLowerCase();
  
  // Check for industry keywords
  const industryKeywords = {
    'versicherung': 'insurance',
    'insurance': 'insurance',
    'bank': 'banking',
    'banking': 'banking',
    'automotive': 'automotive',
    'auto': 'automotive',
    'gesundheit': 'healthcare',
    'health': 'healthcare',
    'energie': 'energy',
    'energy': 'energy',
    'retail': 'retail',
    'handel': 'retail',
    'manufacturing': 'manufacturing',
    'fertigung': 'manufacturing',
    'public': 'publicSector',
    'öffentlich': 'publicSector',
  };
  
  for (const [key, value] of Object.entries(industryKeywords)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Search for assessments matching a customer name
 * @param {string} customerName - Customer name to search for
 * @param {string} userId - Current user ID (for permission filtering)
 * @returns {Promise<Array>} - Matching assessments with scores
 */
export async function searchAssessments(customerName, userId) {
  try {
    // Build query - search by customer name (case-insensitive)
    let query = supabase
      .from('assessments')
      .select('*')
      .order('updated_at', { ascending: false });
    
    // Filter by user ownership or assignment
    if (userId) {
      // Get assessments user owns or is assigned to
      const { data: assignments } = await supabase
        .from('section_assignments')
        .select('assessment_id')
        .eq('assigned_to', userId);
      
      const assignedIds = (assignments || []).map(a => a.assessment_id);
      
      // Filter: owned by user OR assigned to user
      query = query.or(`created_by.eq.${userId},id.in.(${assignedIds.join(',')})`);
    }
    
    const { data: assessments, error } = await query;
    
    if (error) throw error;
    
    // Filter by customer name if provided
    let filtered = assessments || [];
    if (customerName) {
      const searchTerm = customerName.toLowerCase();
      filtered = filtered.filter(a => 
        a.customer_name?.toLowerCase().includes(searchTerm) ||
        a.industry?.toLowerCase().includes(searchTerm) ||
        INDUSTRIES[a.industry]?.label?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Load answers and calculate scores for each assessment
    const results = await Promise.all(filtered.map(async (assessment) => {
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessment.id);
      
      // Convert to object format
      const answersObj = {};
      (answers || []).forEach(a => {
        answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
      });
      
      const scores = computeReadinessFromAnswers(answersObj);
      const overall = calculateOverallScore(scores);
      const industryInfo = INDUSTRIES[assessment.industry];
      
      return {
        id: assessment.id,
        customerName: assessment.customer_name,
        industry: assessment.industry,
        industryLabel: industryInfo?.label || assessment.industry,
        industryIcon: industryInfo?.icon || '📋',
        status: assessment.status,
        scores: { ...scores, overall },
        answersCount: (answers || []).length,
        answers: answersObj,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
      };
    }));
    
    // Sort by relevance (exact match first, then by score)
    results.sort((a, b) => {
      const aExact = a.customerName?.toLowerCase() === customerName?.toLowerCase();
      const bExact = b.customerName?.toLowerCase() === customerName?.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return b.scores.overall - a.scores.overall;
    });
    
    return results;
  } catch (error) {
    console.error('Error searching assessments:', error);
    throw error;
  }
}

/**
 * Get answers from a specific assessment
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<Object>} - Answers object
 */
export async function getAssessmentAnswers(assessmentId) {
  try {
    const { data: answers, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    if (error) throw error;
    
    // Convert to object format
    const answersObj = {};
    (answers || []).forEach(a => {
      answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
    });
    
    return answersObj;
  } catch (error) {
    console.error('Error getting assessment answers:', error);
    throw error;
  }
}

/**
 * Get all assessments for a user (owned or assigned)
 * @param {string} userId - User ID
 * @param {string} industryFilter - Optional industry filter
 * @returns {Promise<Array>} - Assessments with basic info
 */
export async function getUserAssessments(userId, industryFilter = null) {
  try {
    // Get assessments user owns
    let query = supabase
      .from('assessments')
      .select('*')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });
    
    if (industryFilter) {
      query = query.eq('industry', industryFilter);
    }
    
    const { data: ownedAssessments, error: ownedError } = await query;
    if (ownedError) throw ownedError;
    
    // Get assessments user is assigned to
    const { data: assignments } = await supabase
      .from('section_assignments')
      .select('assessment_id')
      .eq('assigned_to', userId);
    
    const assignedIds = [...new Set((assignments || []).map(a => a.assessment_id))];
    const ownedIds = (ownedAssessments || []).map(a => a.id);
    const additionalIds = assignedIds.filter(id => !ownedIds.includes(id));
    
    let assignedAssessments = [];
    if (additionalIds.length > 0) {
      let assignedQuery = supabase
        .from('assessments')
        .select('*')
        .in('id', additionalIds);
      
      if (industryFilter) {
        assignedQuery = assignedQuery.eq('industry', industryFilter);
      }
      
      const { data } = await assignedQuery;
      assignedAssessments = data || [];
    }
    
    // Combine and deduplicate
    const allAssessments = [...(ownedAssessments || []), ...assignedAssessments];
    
    // Add industry info
    return allAssessments.map(a => ({
      id: a.id,
      customerName: a.customer_name,
      industry: a.industry,
      industryLabel: INDUSTRIES[a.industry]?.label || a.industry,
      industryIcon: INDUSTRIES[a.industry]?.icon || '📋',
      status: a.status,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  } catch (error) {
    console.error('Error getting user assessments:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION RESULT FORMATTERS
// ═══════════════════════════════════════════════════════════════

/**
 * Format search results for display in chat
 * @param {Array} results - Search results
 * @param {string} language - 'de' or 'en'
 * @returns {Object} - Formatted message with action buttons
 */
export function formatSearchResults(results, language = 'de') {
  if (results.length === 0) {
    return {
      message: language === 'de' 
        ? '❌ Keine passenden Assessments gefunden.'
        : '❌ No matching assessments found.',
      actions: [],
    };
  }
  
  const header = language === 'de'
    ? `🔍 **${results.length} Assessment(s) gefunden:**\n\n`
    : `🔍 **Found ${results.length} assessment(s):**\n\n`;
  
  const items = results.slice(0, 5).map((r, i) => {
    const completeness = r.answersCount > 0 ? `${r.answersCount} Antworten` : 'Keine Antworten';
    return `${i + 1}. **${r.customerName}** (${r.industryIcon} ${r.industryLabel})\n   Score: ${r.scores.overall}% | ${completeness}`;
  }).join('\n\n');
  
  const footer = results.length > 5 
    ? `\n\n_...und ${results.length - 5} weitere_`
    : '';
  
  const prompt = language === 'de'
    ? '\n\n**Welches Assessment soll ich verwenden?**'
    : '\n\n**Which assessment should I use?**';
  
  return {
    message: header + items + footer + prompt,
    actions: results.slice(0, 5).map(r => ({
      type: 'fill',
      label: r.customerName,
      assessmentId: r.id,
      answersCount: r.answersCount,
    })),
  };
}

/**
 * Format fill confirmation message
 * @param {Object} sourceAssessment - Source assessment info
 * @param {number} answersCount - Number of answers to copy
 * @param {string} language - 'de' or 'en'
 * @returns {Object} - Confirmation message with actions
 */
export function formatFillConfirmation(sourceAssessment, answersCount, language = 'de') {
  const message = language === 'de'
    ? `✅ **${answersCount} Antworten** von **${sourceAssessment.customerName}** übernommen!\n\nDie Antworten wurden in das aktuelle Assessment eingefügt. Bitte überprüfen und bei Bedarf anpassen.`
    : `✅ **${answersCount} answers** copied from **${sourceAssessment.customerName}**!\n\nThe answers have been inserted into the current assessment. Please review and adjust as needed.`;
  
  return {
    message,
    actions: [
      { type: 'navigate', label: language === 'de' ? 'Zur Zusammenfassung' : 'Go to Summary', target: 'summary' },
    ],
  };
}

/**
 * Format export confirmation message
 * @param {string} format - Export format
 * @param {string} language - 'de' or 'en'
 * @returns {Object} - Message with export actions
 */
export function formatExportMessage(format, language = 'de') {
  const formatLabels = {
    pdf: 'PDF',
    pptx: 'PowerPoint',
    docx: 'Word',
  };
  
  const message = language === 'de'
    ? `📄 **${formatLabels[format] || format} Export** wird generiert...\n\nDer Download startet automatisch.`
    : `📄 **${formatLabels[format] || format} Export** is being generated...\n\nDownload will start automatically.`;
  
  return {
    message,
    actions: [
      { type: 'export', label: '📄 PDF', format: 'pdf' },
      { type: 'export', label: '📊 PowerPoint', format: 'pptx' },
      { type: 'export', label: '📝 Word', format: 'docx' },
    ],
  };
}

/**
 * Format navigation message
 * @param {string} sectionId - Target section ID
 * @param {string} sectionTitle - Section title
 * @param {string} language - 'de' or 'en'
 * @returns {Object} - Navigation message
 */
export function formatNavigationMessage(sectionId, sectionTitle, language = 'de') {
  const message = language === 'de'
    ? `📍 Navigiere zu **${sectionTitle}**...`
    : `📍 Navigating to **${sectionTitle}**...`;
  
  return {
    message,
    actions: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION MAPPINGS
// ═══════════════════════════════════════════════════════════════

export const SECTION_MAPPINGS = {
  general: { de: 'Allgemeine Informationen', en: 'General Information' },
  landscape: { de: 'SAP-Systemlandschaft', en: 'SAP System Landscape' },
  licensing: { de: 'Lizenzierung', en: 'Licensing' },
  btp: { de: 'SAP BTP', en: 'SAP BTP' },
  cloud: { de: 'Cloud & Integration', en: 'Cloud & Integration' },
  aiSap: { de: 'KI im SAP-Umfeld', en: 'AI in SAP Environment' },
  aiNonSap: { de: 'Non-SAP KI', en: 'Non-SAP AI' },
  data: { de: 'Datengrundlage', en: 'Data Foundation' },
  security: { de: 'Compliance & Governance', en: 'Compliance & Governance' },
  org: { de: 'Organisation & Kompetenzen', en: 'Organization & Skills' },
  useCases: { de: 'Use Cases & Priorisierung', en: 'Use Cases & Prioritization' },
};

export function getSectionTitle(sectionId, language = 'de') {
  return SECTION_MAPPINGS[sectionId]?.[language] || sectionId;
}

export function findSectionIndex(sections, sectionId) {
  return sections.findIndex(s => s.id === sectionId);
}