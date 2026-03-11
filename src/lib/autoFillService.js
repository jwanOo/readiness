/**
 * Auto-Fill Service
 * 
 * Provides AI-powered suggestions for assessment questions based on:
 * 1. Company profile (industry, size, known systems)
 * 2. Previous assessments from the same customer
 * 3. Similar companies in the same industry
 * 4. SAP knowledge base best practices
 */

import { supabase } from './supabase';
import { SAP_AI_PRODUCTS, SAP_AI_USE_CASES, SAP_AI_ROADMAP } from './sapAIKnowledge';

// Cache for suggestions to avoid repeated API calls
const suggestionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get auto-fill suggestions for a specific question
 */
export async function getAutoFillSuggestion({
  questionKey,
  questionText,
  questionHint,
  sectionId,
  sectionTitle,
  industry,
  customerName,
  assessmentId,
  existingAnswers = {},
  language = 'de',
}) {
  // Check cache first
  const cacheKey = `${assessmentId}_${questionKey}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const suggestions = [];
    
    // 1. Check for previous answers from same customer
    const previousAnswer = await findPreviousCustomerAnswer(customerName, sectionId, questionKey);
    if (previousAnswer) {
      suggestions.push({
        type: 'previous',
        value: previousAnswer.answer,
        confidence: 0.9,
        source: `Vorherige Antwort vom ${new Date(previousAnswer.answered_at).toLocaleDateString('de-DE')}`,
        icon: '📋',
      });
    }

    // 2. Check for similar answers from same industry
    const industryAnswers = await findIndustryAnswers(industry, sectionId, questionKey);
    if (industryAnswers.length > 0) {
      const mostCommon = getMostCommonAnswer(industryAnswers);
      if (mostCommon) {
        suggestions.push({
          type: 'industry',
          value: mostCommon.answer,
          confidence: Math.min(0.8, mostCommon.count / industryAnswers.length),
          source: `Häufigste Antwort in ${industry} (${mostCommon.count}/${industryAnswers.length} Kunden)`,
          icon: '🏢',
        });
      }
    }

    // 3. Generate AI suggestion based on context
    const aiSuggestion = await generateAISuggestion({
      questionText,
      questionHint,
      sectionTitle,
      industry,
      customerName,
      existingAnswers,
      language,
    });
    if (aiSuggestion) {
      suggestions.push({
        type: 'ai',
        value: aiSuggestion.value,
        confidence: aiSuggestion.confidence || 0.7,
        source: 'KI-Empfehlung basierend auf Kontext',
        icon: '🤖',
      });
    }

    // 4. Check SAP knowledge base for best practices
    const sapSuggestion = getSAPKnowledgeSuggestion(sectionId, questionKey, industry);
    if (sapSuggestion) {
      suggestions.push({
        type: 'knowledge',
        value: sapSuggestion.value,
        confidence: 0.6,
        source: 'SAP Best Practice',
        icon: '📚',
      });
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Cache the result
    const result = {
      questionKey,
      suggestions,
      hasHighConfidence: suggestions.some(s => s.confidence >= 0.8),
      bestSuggestion: suggestions[0] || null,
    };
    
    suggestionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error getting auto-fill suggestion:', error);
    return {
      questionKey,
      suggestions: [],
      hasHighConfidence: false,
      bestSuggestion: null,
      error: error.message,
    };
  }
}

/**
 * Get suggestions for all questions in a section
 */
export async function getSectionSuggestions({
  section,
  industry,
  customerName,
  assessmentId,
  existingAnswers = {},
  language = 'de',
}) {
  const suggestions = {};
  
  for (let qi = 0; qi < section.questions.length; qi++) {
    const q = section.questions[qi];
    const questionKey = `${section.id}_${qi}`;
    
    // Skip if already answered
    if (existingAnswers[questionKey]?.trim()) {
      continue;
    }
    
    const suggestion = await getAutoFillSuggestion({
      questionKey,
      questionText: q.q,
      questionHint: q.hint,
      sectionId: section.id,
      sectionTitle: section.title,
      industry,
      customerName,
      assessmentId,
      existingAnswers,
      language,
    });
    
    if (suggestion.bestSuggestion) {
      suggestions[questionKey] = suggestion;
    }
  }
  
  return suggestions;
}

/**
 * Find previous answers from the same customer
 */
async function findPreviousCustomerAnswer(customerName, sectionId, questionKey) {
  if (!customerName) return null;
  
  try {
    const [, questionIndex] = questionKey.split('_');
    
    const { data, error } = await supabase
      .from('answers')
      .select(`
        answer,
        answered_at,
        assessments!inner (customer_name)
      `)
      .eq('section_id', sectionId)
      .eq('question_index', parseInt(questionIndex))
      .ilike('assessments.customer_name', `%${customerName}%`)
      .order('answered_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error finding previous customer answer:', error);
    return null;
  }
}

/**
 * Find answers from similar companies in the same industry
 */
async function findIndustryAnswers(industry, sectionId, questionKey) {
  if (!industry) return [];
  
  try {
    const [, questionIndex] = questionKey.split('_');
    
    const { data, error } = await supabase
      .from('answers')
      .select(`
        answer,
        assessments!inner (industry)
      `)
      .eq('section_id', sectionId)
      .eq('question_index', parseInt(questionIndex))
      .eq('assessments.industry', industry)
      .not('answer', 'is', null)
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error finding industry answers:', error);
    return [];
  }
}

/**
 * Get the most common answer from a list
 */
function getMostCommonAnswer(answers) {
  if (!answers || answers.length === 0) return null;
  
  const counts = {};
  answers.forEach(a => {
    const normalized = a.answer?.trim().toLowerCase();
    if (normalized) {
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  });
  
  let maxCount = 0;
  let mostCommon = null;
  
  Object.entries(counts).forEach(([answer, count]) => {
    if (count > maxCount) {
      maxCount = count;
      // Find original casing
      mostCommon = answers.find(a => a.answer?.trim().toLowerCase() === answer)?.answer;
    }
  });
  
  return mostCommon ? { answer: mostCommon, count: maxCount } : null;
}

/**
 * Generate AI suggestion based on context
 */
async function generateAISuggestion({
  questionText,
  questionHint,
  sectionTitle,
  industry,
  customerName,
  existingAnswers,
  language,
}) {
  // Build context from existing answers
  const contextParts = [];
  
  if (customerName) {
    contextParts.push(`Kunde: ${customerName}`);
  }
  if (industry) {
    contextParts.push(`Branche: ${industry}`);
  }
  
  // Add relevant existing answers as context
  const relevantAnswers = Object.entries(existingAnswers)
    .filter(([key, value]) => value?.trim())
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  if (relevantAnswers) {
    contextParts.push(`Bisherige Antworten:\n${relevantAnswers}`);
  }

  // Use pattern matching for common question types
  const suggestion = getPatternBasedSuggestion(questionText, questionHint, industry, existingAnswers);
  if (suggestion) {
    return suggestion;
  }

  // For more complex questions, we could call an AI API here
  // For now, return null to indicate no AI suggestion available
  return null;
}

/**
 * Get suggestion based on question patterns
 */
function getPatternBasedSuggestion(questionText, questionHint, industry, existingAnswers) {
  const q = questionText.toLowerCase();
  
  // SAP System questions
  if (q.includes('sap') && (q.includes('system') || q.includes('nutzen'))) {
    if (q.includes('s/4') || q.includes('s4')) {
      return {
        value: 'S/4HANA 2023 (On-Premise)',
        confidence: 0.5,
      };
    }
    if (q.includes('btp')) {
      return {
        value: 'Ja, SAP BTP mit Integration Suite und AI Core',
        confidence: 0.5,
      };
    }
  }
  
  // Yes/No questions
  if (q.includes('nutzen sie') || q.includes('setzen sie') || q.includes('gibt es')) {
    // Check hint for context
    if (questionHint?.toLowerCase().includes('ja') || questionHint?.toLowerCase().includes('nein')) {
      return {
        value: 'Ja, in Planung',
        confidence: 0.4,
      };
    }
  }
  
  // Cloud strategy questions
  if (q.includes('cloud') && q.includes('strategie')) {
    return {
      value: 'Hybrid Cloud mit Fokus auf SAP BTP',
      confidence: 0.5,
    };
  }
  
  // Data quality questions
  if (q.includes('qualität') && (q.includes('daten') || q.includes('stamm'))) {
    return {
      value: 'Gut - kontinuierliche Verbesserung durch Data Governance',
      confidence: 0.5,
    };
  }
  
  // Budget questions
  if (q.includes('budget') && q.includes('ki')) {
    return {
      value: '50-200k EUR',
      confidence: 0.4,
    };
  }
  
  return null;
}

/**
 * Get suggestion from SAP knowledge base
 */
function getSAPKnowledgeSuggestion(sectionId, questionKey, industry) {
  // Best practices based on section
  const bestPractices = {
    landscape: 'S/4HANA mit Clean Core Strategie empfohlen',
    btp: 'SAP BTP mit CPEA-Lizenzierung für maximale Flexibilität',
    aiSap: 'SAP Joule und AI Core für integrierte KI-Funktionen',
    licensing: 'CPEA oder BTPEA für Cloud-Services',
    cloud: 'Hybrid Cloud mit SAP BTP als zentrale Plattform',
    data: 'Zentrale Datenstrategie mit SAP Datasphere',
    security: 'KI-Richtlinie und DSGVO-konforme Datenverarbeitung',
    org: 'Dediziertes KI-Team mit CDO-Sponsorship',
    useCases: 'Quick-Win Use Cases mit hohem ROI priorisieren',
  };
  
  const value = bestPractices[sectionId];
  return value ? { value } : null;
}

/**
 * Apply multiple suggestions at once
 */
export function applySuggestions(suggestions, currentAnswers) {
  const newAnswers = { ...currentAnswers };
  
  Object.entries(suggestions).forEach(([questionKey, suggestion]) => {
    if (suggestion.bestSuggestion && !currentAnswers[questionKey]?.trim()) {
      newAnswers[questionKey] = suggestion.bestSuggestion.value;
    }
  });
  
  return newAnswers;
}

/**
 * Clear suggestion cache
 */
export function clearSuggestionCache(assessmentId = null) {
  if (assessmentId) {
    // Clear only for specific assessment
    for (const key of suggestionCache.keys()) {
      if (key.startsWith(`${assessmentId}_`)) {
        suggestionCache.delete(key);
      }
    }
  } else {
    // Clear all
    suggestionCache.clear();
  }
}

/**
 * Get company profile suggestions based on customer name
 */
export async function getCompanyProfileSuggestions(customerName) {
  if (!customerName || customerName.length < 3) return null;
  
  try {
    // Check if we have existing data for this customer
    const { data: existingAssessments } = await supabase
      .from('assessments')
      .select('industry, industries, created_at')
      .ilike('customer_name', `%${customerName}%`)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (existingAssessments && existingAssessments.length > 0) {
      // Get most common industry
      const industries = existingAssessments
        .map(a => a.industry)
        .filter(Boolean);
      
      const industryCounts = {};
      industries.forEach(i => {
        industryCounts[i] = (industryCounts[i] || 0) + 1;
      });
      
      const suggestedIndustry = Object.entries(industryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      return {
        suggestedIndustry,
        previousAssessments: existingAssessments.length,
        lastAssessment: existingAssessments[0]?.created_at,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting company profile suggestions:', error);
    return null;
  }
}

export default {
  getAutoFillSuggestion,
  getSectionSuggestions,
  applySuggestions,
  clearSuggestionCache,
  getCompanyProfileSuggestions,
};