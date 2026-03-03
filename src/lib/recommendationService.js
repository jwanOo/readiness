/* ═══════════════════════════════════════════════════════════════
   RECOMMENDATION SERVICE - Background AI Recommendation Generation
   Generates recommendations in the background and selects the best 4
   ═══════════════════════════════════════════════════════════════ */

// AI Configuration
const AI_CONFIG = {
  baseUrl: 'https://adesso-ai-hub.3asabc.de/v1',
  apiKey: 'sk-ccwu3ZNJMFCfQG76gRaGjg',
  model: 'gpt-oss-120b-sovereign',
  maxTokens: 1200,
  temperature: 0.7,
};

// Cache for recommendations per section
const recommendationCache = new Map();

// Debounce timers per section
const debounceTimers = new Map();

// Pending generation flags
const pendingGenerations = new Map();

// Subscribers for recommendation updates
const subscribers = new Map();

/**
 * Subscribe to recommendation updates for a section
 * @param {string} sectionId - Section identifier
 * @param {function} callback - Callback function (recommendations, isLoading, error) => void
 * @returns {function} Unsubscribe function
 */
export function subscribeToRecommendations(sectionId, callback) {
  if (!subscribers.has(sectionId)) {
    subscribers.set(sectionId, new Set());
  }
  subscribers.get(sectionId).add(callback);
  
  // Immediately call with cached data if available
  const cached = recommendationCache.get(sectionId);
  if (cached) {
    callback(cached.recommendations, false, null);
  }
  
  return () => {
    const subs = subscribers.get(sectionId);
    if (subs) {
      subs.delete(callback);
    }
  };
}

/**
 * Notify all subscribers of a section
 */
function notifySubscribers(sectionId, recommendations, isLoading, error) {
  const subs = subscribers.get(sectionId);
  if (subs) {
    subs.forEach(callback => {
      try {
        callback(recommendations, isLoading, error);
      } catch (e) {
        console.error('Error in recommendation subscriber:', e);
      }
    });
  }
}

/**
 * Request recommendations for a section (debounced)
 * This will generate recommendations in the background after a delay
 * @param {object} params - Parameters for recommendation generation
 * @param {object} params.section - Section object with id, title, questions
 * @param {object} params.answers - All answers object
 * @param {object} params.industry - Industry object with label
 * @param {string} params.language - Language code ('de' or 'en')
 * @param {string} params.customerName - Customer name
 * @param {number} params.debounceMs - Debounce delay in milliseconds (default: 2000)
 */
export function requestRecommendations({
  section,
  answers,
  industry,
  language = 'de',
  customerName = '',
  debounceMs = 2000,
}) {
  if (!section?.id) return;
  
  const sectionId = section.id;
  
  // Clear existing debounce timer
  if (debounceTimers.has(sectionId)) {
    clearTimeout(debounceTimers.get(sectionId));
  }
  
  // Get section answers
  const sectionAnswers = getSectionAnswers(section, answers);
  const answersHash = JSON.stringify(sectionAnswers);
  
  // Check if we already have cached recommendations for these exact answers
  const cached = recommendationCache.get(sectionId);
  if (cached && cached.answersHash === answersHash) {
    // Already have recommendations for these answers
    return;
  }
  
  // If no answers, clear recommendations
  if (Object.keys(sectionAnswers).length === 0) {
    recommendationCache.set(sectionId, {
      recommendations: [],
      answersHash: '',
      timestamp: Date.now(),
    });
    notifySubscribers(sectionId, [], false, null);
    return;
  }
  
  // Set debounce timer
  const timer = setTimeout(() => {
    generateRecommendationsBackground({
      section,
      sectionAnswers,
      answersHash,
      industry,
      language,
      customerName,
    });
  }, debounceMs);
  
  debounceTimers.set(sectionId, timer);
}

/**
 * Get answers for a specific section
 */
function getSectionAnswers(section, answers) {
  if (!section) return {};
  const sectionAnswers = {};
  section.questions.forEach((q, qi) => {
    const key = `${section.id}_${qi}`;
    if (answers[key]?.trim()) {
      sectionAnswers[q.q] = answers[key];
    }
  });
  return sectionAnswers;
}

/**
 * Generate recommendations in the background
 */
async function generateRecommendationsBackground({
  section,
  sectionAnswers,
  answersHash,
  industry,
  language,
  customerName,
}) {
  const sectionId = section.id;
  
  // Check if already generating
  if (pendingGenerations.get(sectionId)) {
    return;
  }
  
  pendingGenerations.set(sectionId, true);
  
  // Notify subscribers that we're loading (but keep showing old recommendations)
  const cached = recommendationCache.get(sectionId);
  notifySubscribers(sectionId, cached?.recommendations || [], true, null);
  
  try {
    const answersText = Object.entries(sectionAnswers)
      .map(([q, a]) => `- ${q}: ${a}`)
      .join('\n');

    const systemPrompt = language === 'de' 
      ? `Du bist ein SAP KI-Berater. Analysiere die Antworten und generiere 6-8 Empfehlungen mit Bewertung.

Abschnitt: ${section?.title || 'Unbekannt'}
${customerName ? `Kunde: ${customerName}` : ''}
${industry ? `Branche: ${industry.label}` : ''}

ANTWORTEN:
${answersText}

ANWEISUNGEN:
1. Generiere genau 6-8 Empfehlungen
2. Jede Empfehlung muss folgendes Format haben (JSON):
   {
     "text": "Empfehlungstext (1-2 Sätze, beginnt mit Emoji)",
     "category": "quick_win" | "strategic" | "risk" | "next_step",
     "priority": "high" | "medium" | "low",
     "relevance_score": 1-100 (wie relevant für diese spezifischen Antworten)
   }
3. Fokussiere auf SAP-spezifische Verbesserungen
4. Sei prägnant und actionable
5. Mische verschiedene Kategorien

Antworte NUR mit einem JSON-Array der Empfehlungen.`
      : `You are an SAP AI consultant. Analyze the answers and generate 6-8 recommendations with scoring.

Section: ${section?.title || 'Unknown'}
${customerName ? `Customer: ${customerName}` : ''}
${industry ? `Industry: ${industry.label}` : ''}

ANSWERS:
${answersText}

INSTRUCTIONS:
1. Generate exactly 6-8 recommendations
2. Each recommendation must have this format (JSON):
   {
     "text": "Recommendation text (1-2 sentences, starts with emoji)",
     "category": "quick_win" | "strategic" | "risk" | "next_step",
     "priority": "high" | "medium" | "low",
     "relevance_score": 1-100 (how relevant for these specific answers)
   }
3. Focus on SAP-specific improvements
4. Be concise and actionable
5. Mix different categories

Respond ONLY with a JSON array of recommendations.`;

    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: language === 'de' 
            ? 'Generiere bewertete Empfehlungen basierend auf den Antworten.'
            : 'Generate scored recommendations based on the answers.' 
          },
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse recommendations
    const allRecommendations = parseRecommendations(content, language);
    
    // Select best 4 recommendations
    const best4 = selectBest4Recommendations(allRecommendations);
    
    // Cache the results
    recommendationCache.set(sectionId, {
      recommendations: best4,
      allRecommendations: allRecommendations,
      answersHash: answersHash,
      timestamp: Date.now(),
    });
    
    // Notify subscribers
    notifySubscribers(sectionId, best4, false, null);
    
  } catch (err) {
    console.error('Error generating recommendations:', err);
    const errorMsg = language === 'de' 
      ? 'Empfehlungen konnten nicht geladen werden.'
      : 'Could not load recommendations.';
    notifySubscribers(sectionId, cached?.recommendations || [], false, errorMsg);
  } finally {
    pendingGenerations.set(sectionId, false);
  }
}

/**
 * Parse AI response into structured recommendations
 */
function parseRecommendations(content, language) {
  try {
    // Try to extract JSON from the response
    let jsonStr = content;
    
    // Check for markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find array in the content
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const recommendations = JSON.parse(jsonStr);
    
    if (!Array.isArray(recommendations)) {
      throw new Error('Response is not an array');
    }

    return recommendations.map((rec, index) => ({
      id: `rec_${Date.now()}_${index}`,
      text: rec.text || rec.recommendation || rec.empfehlung || '',
      category: normalizeCategory(rec.category || rec.kategorie),
      priority: normalizePriority(rec.priority || rec.priorität || rec.prioritaet),
      relevanceScore: parseInt(rec.relevance_score || rec.relevanceScore || 50, 10),
      language,
    })).filter(rec => rec.text.trim().length > 0);
    
  } catch (error) {
    console.error('Error parsing recommendations:', error);
    // Fallback: try to extract recommendations from plain text
    return createFallbackRecommendations(content, language);
  }
}

/**
 * Normalize category string
 */
function normalizeCategory(category) {
  const normalized = (category || '').toLowerCase().replace(/[^a-z_]/g, '');
  const validCategories = ['quick_win', 'strategic', 'risk', 'next_step'];
  return validCategories.includes(normalized) ? normalized : 'next_step';
}

/**
 * Normalize priority string
 */
function normalizePriority(priority) {
  const normalized = (priority || '').toLowerCase();
  if (normalized.includes('high') || normalized.includes('hoch')) return 'high';
  if (normalized.includes('low') || normalized.includes('niedrig') || normalized.includes('gering')) return 'low';
  return 'medium';
}

/**
 * Create fallback recommendations from plain text
 */
function createFallbackRecommendations(content, language) {
  // Split by newlines and filter lines that look like recommendations (start with emoji)
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 10 && /^[^\w\s]/.test(line));
  
  return lines.slice(0, 6).map((text, index) => ({
    id: `rec_${Date.now()}_${index}`,
    text: text,
    category: index % 4 === 0 ? 'quick_win' : index % 4 === 1 ? 'strategic' : index % 4 === 2 ? 'risk' : 'next_step',
    priority: index < 2 ? 'high' : 'medium',
    relevanceScore: 70 - (index * 5),
    language,
  }));
}

/**
 * Select the best 4 recommendations with category diversity
 */
function selectBest4Recommendations(recommendations) {
  if (recommendations.length <= 4) {
    return recommendations;
  }
  
  // Sort by relevance score (descending) and priority
  const sorted = [...recommendations].sort((a, b) => {
    // Priority weight
    const priorityWeight = { high: 30, medium: 15, low: 0 };
    const aScore = a.relevanceScore + (priorityWeight[a.priority] || 0);
    const bScore = b.relevanceScore + (priorityWeight[b.priority] || 0);
    return bScore - aScore;
  });
  
  const selected = [];
  const usedCategories = new Set();
  
  // First pass: try to get one from each category
  const categories = ['quick_win', 'strategic', 'risk', 'next_step'];
  for (const category of categories) {
    if (selected.length >= 4) break;
    const rec = sorted.find(r => r.category === category && !selected.includes(r));
    if (rec) {
      selected.push(rec);
      usedCategories.add(category);
    }
  }
  
  // Second pass: fill remaining slots with highest scoring
  for (const rec of sorted) {
    if (selected.length >= 4) break;
    if (!selected.includes(rec)) {
      selected.push(rec);
    }
  }
  
  // Sort selected by relevance for display
  return selected.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get cached recommendations for a section (synchronous)
 */
export function getCachedRecommendations(sectionId) {
  const cached = recommendationCache.get(sectionId);
  return cached?.recommendations || [];
}

/**
 * Check if recommendations are being generated for a section
 */
export function isGenerating(sectionId) {
  return pendingGenerations.get(sectionId) || false;
}

/**
 * Force refresh recommendations for a section
 */
export function forceRefresh(section, answers, industry, language, customerName) {
  if (!section?.id) return;
  
  // Clear cache for this section
  recommendationCache.delete(section.id);
  
  // Request new recommendations with no debounce
  requestRecommendations({
    section,
    answers,
    industry,
    language,
    customerName,
    debounceMs: 0,
  });
}

/**
 * Clear all cached recommendations
 */
export function clearAllCache() {
  recommendationCache.clear();
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
}

/**
 * Get category display info
 */
export function getCategoryInfo(category, language = 'de') {
  const categories = {
    quick_win: {
      de: { label: 'Quick Win', icon: '⚡', color: '#27AE60', bgColor: '#EAFAF1' },
      en: { label: 'Quick Win', icon: '⚡', color: '#27AE60', bgColor: '#EAFAF1' },
    },
    strategic: {
      de: { label: 'Strategisch', icon: '🎯', color: '#8E44AD', bgColor: '#F5EEF8' },
      en: { label: 'Strategic', icon: '🎯', color: '#8E44AD', bgColor: '#F5EEF8' },
    },
    risk: {
      de: { label: 'Risiko', icon: '⚠️', color: '#E74C3C', bgColor: '#FDEDEC' },
      en: { label: 'Risk', icon: '⚠️', color: '#E74C3C', bgColor: '#FDEDEC' },
    },
    next_step: {
      de: { label: 'Nächster Schritt', icon: '👉', color: '#2E86C1', bgColor: '#EBF5FB' },
      en: { label: 'Next Step', icon: '👉', color: '#2E86C1', bgColor: '#EBF5FB' },
    },
  };
  return categories[category]?.[language] || categories.next_step[language];
}