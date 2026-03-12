/* ═══════════════════════════════════════════════════════════════
   CUSTOMER MATCHING SERVICE
   AI-powered matching of SAP AI use cases to customer assessments
   Uses the existing AI proxy (adesso AI Hub)
   ═══════════════════════════════════════════════════════════════ */

import { callAI } from './aiService';
import { fetchUseCases, saveUseCaseMatch, INDUSTRY_CATEGORY_MAP } from './sapAICatalogService';
import { INDUSTRIES, SAP_SYSTEMS } from './constants';

/**
 * Build customer profile from assessment data
 */
export function buildCustomerProfile(assessment, answers) {
  const profile = {
    companyName: assessment?.company_name || 'Unknown Company',
    industry: assessment?.industry || null,
    industryLabel: assessment?.industry ? INDUSTRIES[assessment.industry]?.de || assessment.industry : 'Nicht angegeben',
    sapSystems: [],
    aiMaturity: 'unknown',
    priorities: [],
    challenges: [],
    dataQuality: 'unknown',
    budget: 'unknown',
  };

  // Extract SAP systems from answers
  if (answers) {
    // Look for SAP system answers
    const sapSystemAnswer = answers['sap_systems'] || answers['current_sap_systems'];
    if (sapSystemAnswer) {
      if (Array.isArray(sapSystemAnswer)) {
        profile.sapSystems = sapSystemAnswer;
      } else if (typeof sapSystemAnswer === 'string') {
        profile.sapSystems = sapSystemAnswer.split(',').map(s => s.trim());
      }
    }

    // AI Maturity
    const aiMaturityAnswer = answers['ai_maturity'] || answers['ai_experience'];
    if (aiMaturityAnswer) {
      profile.aiMaturity = aiMaturityAnswer;
    }

    // Priorities
    const prioritiesAnswer = answers['ai_priorities'] || answers['business_priorities'];
    if (prioritiesAnswer) {
      if (Array.isArray(prioritiesAnswer)) {
        profile.priorities = prioritiesAnswer;
      } else if (typeof prioritiesAnswer === 'string') {
        profile.priorities = prioritiesAnswer.split(',').map(s => s.trim());
      }
    }

    // Challenges
    const challengesAnswer = answers['challenges'] || answers['pain_points'];
    if (challengesAnswer) {
      if (Array.isArray(challengesAnswer)) {
        profile.challenges = challengesAnswer;
      } else if (typeof challengesAnswer === 'string') {
        profile.challenges = challengesAnswer.split(',').map(s => s.trim());
      }
    }

    // Data Quality
    const dataQualityAnswer = answers['data_quality'] || answers['data_readiness'];
    if (dataQualityAnswer) {
      profile.dataQuality = dataQualityAnswer;
    }

    // Budget
    const budgetAnswer = answers['budget'] || answers['investment_readiness'];
    if (budgetAnswer) {
      profile.budget = budgetAnswer;
    }
  }

  return profile;
}

/**
 * Generate AI prompt for customer matching
 */
function generateMatchingPrompt(customerProfile, useCases, language = 'de') {
  const useCasesList = useCases.slice(0, 30).map((uc, idx) => 
    `${idx + 1}. [${uc.identifier}] ${uc.name}
   Produkt: ${uc.product}
   Kategorie: ${uc.product_category}
   Typ: ${uc.ai_type} | Lizenz: ${uc.commercial_type || 'Standard'}
   Verfügbarkeit: ${uc.availability}
   Beschreibung: ${uc.description?.substring(0, 200) || 'Keine Beschreibung'}...`
  ).join('\n\n');

  if (language === 'de') {
    return `Du bist ein erfahrener SAP AI Berater bei adesso. Analysiere das folgende Kundenprofil und finde die passendsten SAP AI Use Cases.

KUNDENPROFIL:
- Unternehmen: ${customerProfile.companyName}
- Branche: ${customerProfile.industryLabel}
- SAP-Systeme: ${customerProfile.sapSystems.length > 0 ? customerProfile.sapSystems.join(', ') : 'Nicht angegeben'}
- KI-Reifegrad: ${customerProfile.aiMaturity}
- Prioritäten: ${customerProfile.priorities.length > 0 ? customerProfile.priorities.join(', ') : 'Nicht angegeben'}
- Herausforderungen: ${customerProfile.challenges.length > 0 ? customerProfile.challenges.join(', ') : 'Nicht angegeben'}
- Datenqualität: ${customerProfile.dataQuality}
- Budget: ${customerProfile.budget}

VERFÜGBARE SAP AI USE CASES:
${useCasesList}

AUFGABE:
Bewerte jeden Use Case mit einem Relevanz-Score von 1-100 basierend auf:
1. Passung zur Branche des Kunden
2. Kompatibilität mit vorhandenen SAP-Systemen
3. Übereinstimmung mit Prioritäten und Herausforderungen
4. Angemessenheit für den KI-Reifegrad
5. Verfügbarkeit (GA bevorzugt)

Wähle die TOP 10 passendsten Use Cases aus.

Antworte NUR im folgenden JSON-Format (keine zusätzlichen Erklärungen):
[
  {
    "identifier": "J123",
    "score": 85,
    "reason": "Kurze Begründung auf Deutsch (max 100 Zeichen)"
  }
]`;
  }

  // English version
  return `You are an experienced SAP AI consultant at adesso. Analyze the following customer profile and find the most suitable SAP AI use cases.

CUSTOMER PROFILE:
- Company: ${customerProfile.companyName}
- Industry: ${customerProfile.industryLabel}
- SAP Systems: ${customerProfile.sapSystems.length > 0 ? customerProfile.sapSystems.join(', ') : 'Not specified'}
- AI Maturity: ${customerProfile.aiMaturity}
- Priorities: ${customerProfile.priorities.length > 0 ? customerProfile.priorities.join(', ') : 'Not specified'}
- Challenges: ${customerProfile.challenges.length > 0 ? customerProfile.challenges.join(', ') : 'Not specified'}
- Data Quality: ${customerProfile.dataQuality}
- Budget: ${customerProfile.budget}

AVAILABLE SAP AI USE CASES:
${useCasesList}

TASK:
Rate each use case with a relevance score from 1-100 based on:
1. Fit with customer's industry
2. Compatibility with existing SAP systems
3. Alignment with priorities and challenges
4. Appropriateness for AI maturity level
5. Availability (GA preferred)

Select the TOP 10 most suitable use cases.

Respond ONLY in the following JSON format (no additional explanations):
[
  {
    "identifier": "J123",
    "score": 85,
    "reason": "Brief explanation in English (max 100 characters)"
  }
]`;
}

/**
 * Parse AI response to extract matches
 */
function parseMatchingResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const matches = JSON.parse(jsonMatch[0]);
      return matches.filter(m => 
        m.identifier && 
        typeof m.score === 'number' && 
        m.score >= 1 && 
        m.score <= 100
      );
    }
    return [];
  } catch (err) {
    console.error('Error parsing matching response:', err);
    return [];
  }
}

/**
 * Match use cases to customer assessment using AI
 */
export async function matchUseCasesToAssessment(assessment, answers, language = 'de') {
  try {
    // Build customer profile
    const customerProfile = buildCustomerProfile(assessment, answers);
    
    // Get relevant use cases based on industry
    let useCases = [];
    if (customerProfile.industry && INDUSTRY_CATEGORY_MAP[customerProfile.industry]) {
      useCases = await fetchUseCases({
        productCategories: INDUSTRY_CATEGORY_MAP[customerProfile.industry],
      });
    }
    
    // If no industry-specific cases, get all
    if (useCases.length === 0) {
      useCases = await fetchUseCases();
    }
    
    // Limit to reasonable number for AI processing
    const useCasesForMatching = useCases.slice(0, 50);
    
    if (useCasesForMatching.length === 0) {
      return {
        success: false,
        error: 'No use cases available for matching',
        matches: [],
      };
    }
    
    // Generate prompt and call AI
    const prompt = generateMatchingPrompt(customerProfile, useCasesForMatching, language);
    
    const aiResponse = await callAI([
      {
        role: 'system',
        content: 'Du bist ein SAP AI Experte. Antworte immer im angeforderten JSON-Format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 2000,
    });
    
    if (!aiResponse.success) {
      return {
        success: false,
        error: aiResponse.error || 'AI matching failed',
        matches: [],
      };
    }
    
    // Parse response
    const matches = parseMatchingResponse(aiResponse.content);
    
    if (matches.length === 0) {
      return {
        success: false,
        error: 'Could not parse AI response',
        matches: [],
      };
    }
    
    // Enrich matches with full use case data
    const enrichedMatches = matches.map(match => {
      const useCase = useCasesForMatching.find(uc => uc.identifier === match.identifier);
      return {
        ...match,
        useCase: useCase || null,
      };
    }).filter(m => m.useCase !== null);
    
    // Save matches to database if assessment has an ID
    if (assessment?.id) {
      for (const match of enrichedMatches) {
        await saveUseCaseMatch(assessment.id, match.useCase.id, {
          relevance_score: match.score,
          match_reason: match.reason,
          matched_by: 'AI',
        });
      }
    }
    
    return {
      success: true,
      matches: enrichedMatches,
      customerProfile,
    };
  } catch (err) {
    console.error('Error in matchUseCasesToAssessment:', err);
    return {
      success: false,
      error: err.message,
      matches: [],
    };
  }
}

/**
 * Quick match without AI (rule-based)
 * Useful as fallback or for initial filtering
 */
export async function quickMatchUseCases(assessment, answers) {
  try {
    const customerProfile = buildCustomerProfile(assessment, answers);
    
    // Get use cases for industry
    let useCases = [];
    if (customerProfile.industry && INDUSTRY_CATEGORY_MAP[customerProfile.industry]) {
      useCases = await fetchUseCases({
        productCategories: INDUSTRY_CATEGORY_MAP[customerProfile.industry],
      });
    } else {
      useCases = await fetchUseCases();
    }
    
    // Score based on simple rules
    const scoredUseCases = useCases.map(uc => {
      let score = 50; // Base score
      
      // Boost for GA availability
      if (uc.availability === 'Generally Available') {
        score += 20;
      } else if (uc.availability === 'Beta') {
        score += 10;
      }
      
      // Boost for Base (included) license
      if (uc.commercial_type === 'Base') {
        score += 10;
      }
      
      // Boost for AI Features (more mature than Agents)
      if (uc.ai_type === 'AI Feature') {
        score += 5;
      }
      
      // Boost if adesso has evaluated it positively
      if (uc.business_value_adesso >= 4) {
        score += 15;
      } else if (uc.business_value_adesso >= 3) {
        score += 10;
      }
      
      // Boost for high priority
      if (uc.priority >= 4) {
        score += 10;
      }
      
      // Cap at 100
      score = Math.min(score, 100);
      
      return {
        identifier: uc.identifier,
        score,
        reason: `${uc.availability} | ${uc.commercial_type || 'Standard'} | ${uc.ai_type}`,
        useCase: uc,
      };
    });
    
    // Sort by score and take top 10
    const topMatches = scoredUseCases
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return {
      success: true,
      matches: topMatches,
      customerProfile,
      method: 'rule-based',
    };
  } catch (err) {
    console.error('Error in quickMatchUseCases:', err);
    return {
      success: false,
      error: err.message,
      matches: [],
    };
  }
}

/**
 * Get match explanation for a specific use case
 */
export async function explainMatch(useCase, customerProfile, language = 'de') {
  const prompt = language === 'de'
    ? `Erkläre in 2-3 Sätzen, warum der SAP AI Use Case "${useCase.name}" (${useCase.product}) für ein Unternehmen in der Branche "${customerProfile.industryLabel}" relevant ist. Fokussiere auf den konkreten Geschäftsnutzen.`
    : `Explain in 2-3 sentences why the SAP AI use case "${useCase.name}" (${useCase.product}) is relevant for a company in the "${customerProfile.industryLabel}" industry. Focus on the concrete business value.`;

  try {
    const response = await callAI([
      { role: 'user', content: prompt },
    ], {
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.success ? response.content : null;
  } catch (err) {
    console.error('Error explaining match:', err);
    return null;
  }
}