/* ═══════════════════════════════════════════════════════════════
   AI SERVICE - adesso AI Hub Integration (via Supabase Edge Function)
   Secure proxy - API key is stored server-side, not exposed to frontend
   ═══════════════════════════════════════════════════════════════ */

import { supabase } from './supabase';

// Configuration - API calls go through Supabase Edge Function
const AI_CONFIG = {
  // Edge Function URL - API key is stored securely in Supabase secrets
  edgeFunctionUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
  model: 'gpt-oss-120b-sovereign',
  maxTokens: 2000,
  temperature: 0.7,
};

/**
 * Section-specific AI hints for AI Readiness
 * These are static hints that explain what's needed in each section
 */
export const SECTION_AI_HINTS = {
  de: {
    general: {
      title: '📋 Allgemeine Informationen',
      hint: '',
      tips: [
        'Geben Sie den vollständigen Firmennamen an',
        'Nennen Sie den Hauptansprechpartner für KI-Initiativen',
        'Der interne Berater sollte SAP- und KI-Expertise haben',
      ],
    },
    landscape: {
      title: '💻 SAP-Systemlandschaft für AI Readiness',
      hint: 'Die SAP-Systemlandschaft ist die Grundlage für SAP Business AI. S/4HANA und Clean Core sind Voraussetzungen für Joule und AI Core.',
      tips: [
        'S/4HANA ist Voraussetzung für SAP Business AI und Joule',
        'Clean-Core-Strategie ermöglicht einfachere KI-Integration',
        'HANA-Datenbank ist erforderlich für Echtzeit-KI-Analysen',
        'RISE/GROW with SAP bietet integrierte KI-Services',
      ],
    },
    licensing: {
      title: '📝 Lizenzierung für KI-Funktionen',
      hint: 'Die richtigen Lizenzen sind entscheidend für den Zugang zu SAP Business AI, Joule und AI Core.',
      tips: [
        'SAP Business AI ist in vielen Cloud-Lizenzen enthalten',
        'AI Core und AI Launchpad benötigen BTP-Lizenzen',
        'SAC Planning enthält Predictive-Funktionen',
        'Prüfen Sie Ihre CPEA/BTPEA-Credits für AI-Services',
      ],
    },
    btp: {
      title: '☁️ SAP BTP als KI-Plattform',
      hint: 'SAP BTP ist die zentrale Plattform für KI-Entwicklung und -Deployment. AI Core, Datasphere und Business Data Cloud sind Schlüsselkomponenten.',
      tips: [
        'SAP AI Core ist die Basis für Custom-ML-Modelle',
        'Datasphere vereinheitlicht Daten für KI-Training',
        'Business Data Cloud (BDC) standardisiert SAP-Daten für AI',
        'Integration Suite verbindet KI-Services mit Geschäftsprozessen',
      ],
    },
    cloud: {
      title: '🌐 Cloud-Strategie für KI',
      hint: 'Eine durchdachte Cloud-Strategie ist wichtig für skalierbare KI-Lösungen und den Zugang zu modernen AI-Services.',
      tips: [
        'Hyperscaler (AWS, Azure, GCP) bieten zusätzliche KI-Services',
        'Multi-Cloud ermöglicht Best-of-Breed KI-Lösungen',
        'Cloud-first beschleunigt KI-Adoption',
        'Hybrid-Szenarien erfordern sorgfältige Datenintegration',
      ],
    },
    aiSap: {
      title: '🤖 KI im SAP-Umfeld',
      hint: 'SAP bietet bereits viele eingebettete KI-Funktionen. Joule ist der neue KI-Copilot für alle SAP-Anwendungen.',
      tips: [
        'Joule ist der zentrale KI-Assistent für SAP',
        'Intelligent RPA automatisiert repetitive Aufgaben',
        'Predictive Analytics in SAC für Forecasting',
        'Cash Application und Invoice Matching nutzen ML',
      ],
    },
    aiNonSap: {
      title: '🧠 Non-SAP KI-Integration',
      hint: 'Die Integration von Non-SAP KI-Tools erweitert die Möglichkeiten und ermöglicht spezialisierte Use Cases.',
      tips: [
        'Microsoft Copilot integriert sich mit SAP über BTP',
        'Azure OpenAI kann über AI Core eingebunden werden',
        'Eigene ML-Modelle können in AI Core deployed werden',
        'Low-Code-Tools beschleunigen KI-Prototyping',
      ],
    },
    data: {
      title: '📊 Datengrundlage für KI',
      hint: 'Hochwertige Daten sind die Grundlage für erfolgreiche KI. Ohne gute Datenqualität und Governance scheitern KI-Projekte.',
      tips: [
        'Datenqualität ist der wichtigste Erfolgsfaktor für KI',
        'Data Governance sichert konsistente, vertrauenswürdige Daten',
        'Ein zentrales DWH/Data Lake vereinfacht KI-Training',
        'SAP Datasphere ist die empfohlene Datenplattform',
      ],
    },
    security: {
      title: '🔐 Compliance & Governance für KI',
      hint: 'KI-Governance ist entscheidend für verantwortungsvolle KI-Nutzung und Compliance mit EU AI Act und DSGVO.',
      tips: [
        'Eine KI-Richtlinie definiert erlaubte Nutzung',
        'EU AI Act klassifiziert KI-Systeme nach Risiko',
        'DSGVO gilt auch für KI-verarbeitete Daten',
        'Dokumentation und Erklärbarkeit sind Pflicht',
      ],
    },
    org: {
      title: '👥 Organisation & Kompetenzen',
      hint: 'Erfolgreiche KI-Adoption erfordert die richtigen Skills und eine klare organisatorische Verankerung.',
      tips: [
        'Ein dediziertes KI-Team beschleunigt Projekte',
        'Executive Sponsorship (CIO/CDO) ist entscheidend',
        'Schulungen erhöhen die KI-Kompetenz im Unternehmen',
        'Change Management begleitet die KI-Transformation',
      ],
    },
    useCases: {
      title: '🎯 Use Cases & Priorisierung',
      hint: 'Konkrete Use Cases mit klarem Business Value sind der Schlüssel zum KI-Erfolg. Starten Sie mit Quick Wins.',
      tips: [
        'Identifizieren Sie Use Cases mit hohem ROI',
        'Starten Sie mit Quick Wins für schnelle Erfolge',
        'Priorisieren Sie nach Business Impact und Machbarkeit',
        'Planen Sie Budget für Pilotprojekte ein',
      ],
    },
  },
  en: {
    general: {
      title: '📋 General Information',
      hint: '',
      tips: [
        'Provide the complete company name',
        'Name the main contact for AI initiatives',
        'The internal consultant should have SAP and AI expertise',
      ],
    },
    landscape: {
      title: '💻 SAP System Landscape for AI Readiness',
      hint: 'The SAP system landscape is the foundation for SAP Business AI. S/4HANA and Clean Core are prerequisites for Joule and AI Core.',
      tips: [
        'S/4HANA is required for SAP Business AI and Joule',
        'Clean Core strategy enables easier AI integration',
        'HANA database is required for real-time AI analytics',
        'RISE/GROW with SAP offers integrated AI services',
      ],
    },
    licensing: {
      title: '📝 Licensing for AI Features',
      hint: 'The right licenses are crucial for access to SAP Business AI, Joule, and AI Core.',
      tips: [
        'SAP Business AI is included in many cloud licenses',
        'AI Core and AI Launchpad require BTP licenses',
        'SAC Planning includes predictive features',
        'Check your CPEA/BTPEA credits for AI services',
      ],
    },
    btp: {
      title: '☁️ SAP BTP as AI Platform',
      hint: 'SAP BTP is the central platform for AI development and deployment. AI Core, Datasphere, and Business Data Cloud are key components.',
      tips: [
        'SAP AI Core is the foundation for custom ML models',
        'Datasphere unifies data for AI training',
        'Business Data Cloud (BDC) standardizes SAP data for AI',
        'Integration Suite connects AI services with business processes',
      ],
    },
    cloud: {
      title: '🌐 Cloud Strategy for AI',
      hint: 'A well-thought-out cloud strategy is important for scalable AI solutions and access to modern AI services.',
      tips: [
        'Hyperscalers (AWS, Azure, GCP) offer additional AI services',
        'Multi-cloud enables best-of-breed AI solutions',
        'Cloud-first accelerates AI adoption',
        'Hybrid scenarios require careful data integration',
      ],
    },
    aiSap: {
      title: '🤖 AI in SAP Environment',
      hint: 'SAP already offers many embedded AI features. Joule is the new AI copilot for all SAP applications.',
      tips: [
        'Joule is the central AI assistant for SAP',
        'Intelligent RPA automates repetitive tasks',
        'Predictive Analytics in SAC for forecasting',
        'Cash Application and Invoice Matching use ML',
      ],
    },
    aiNonSap: {
      title: '🧠 Non-SAP AI Integration',
      hint: 'Integration of non-SAP AI tools expands capabilities and enables specialized use cases.',
      tips: [
        'Microsoft Copilot integrates with SAP via BTP',
        'Azure OpenAI can be integrated via AI Core',
        'Custom ML models can be deployed in AI Core',
        'Low-code tools accelerate AI prototyping',
      ],
    },
    data: {
      title: '📊 Data Foundation for AI',
      hint: 'High-quality data is the foundation for successful AI. Without good data quality and governance, AI projects fail.',
      tips: [
        'Data quality is the most important success factor for AI',
        'Data governance ensures consistent, trustworthy data',
        'A central DWH/Data Lake simplifies AI training',
        'SAP Datasphere is the recommended data platform',
      ],
    },
    security: {
      title: '🔐 Compliance & Governance for AI',
      hint: 'AI governance is crucial for responsible AI use and compliance with EU AI Act and GDPR.',
      tips: [
        'An AI policy defines permitted usage',
        'EU AI Act classifies AI systems by risk',
        'GDPR also applies to AI-processed data',
        'Documentation and explainability are mandatory',
      ],
    },
    org: {
      title: '👥 Organization & Skills',
      hint: 'Successful AI adoption requires the right skills and clear organizational anchoring.',
      tips: [
        'A dedicated AI team accelerates projects',
        'Executive sponsorship (CIO/CDO) is crucial',
        'Training increases AI competence in the company',
        'Change management accompanies AI transformation',
      ],
    },
    useCases: {
      title: '🎯 Use Cases & Prioritization',
      hint: 'Concrete use cases with clear business value are the key to AI success. Start with quick wins.',
      tips: [
        'Identify use cases with high ROI',
        'Start with quick wins for fast results',
        'Prioritize by business impact and feasibility',
        'Plan budget for pilot projects',
      ],
    },
  },
};

/**
 * Get section hint by section ID
 */
export function getSectionHint(sectionId, language = 'de') {
  // Handle industry-specific sections
  if (sectionId.startsWith('ind_')) {
    return {
      title: language === 'de' ? '🏭 Branchenspezifische Anforderungen' : '🏭 Industry-Specific Requirements',
      hint: language === 'de' 
        ? 'Diese Fragen sind speziell auf Ihre Branche zugeschnitten und helfen, branchenspezifische KI-Potenziale zu identifizieren.'
        : 'These questions are tailored to your industry and help identify industry-specific AI potential.',
      tips: language === 'de' 
        ? [
            'Branchenspezifische KI-Use-Cases haben oft den höchsten ROI',
            'Regulatorische Anforderungen variieren je nach Branche',
            'Nutzen Sie Branchenwissen für KI-Differenzierung',
          ]
        : [
            'Industry-specific AI use cases often have the highest ROI',
            'Regulatory requirements vary by industry',
            'Use industry knowledge for AI differentiation',
          ],
    };
  }
  
  return SECTION_AI_HINTS[language]?.[sectionId] || SECTION_AI_HINTS.de[sectionId] || null;
}

/**
 * Generate AI-powered recommendations based on assessment data
 * Uses Supabase Edge Function as secure proxy to adesso AI Hub
 */
export async function generateRecommendations(assessment, answers, scores, industry, language = 'de') {
  try {
    const prompt = buildPrompt(assessment, answers, scores, industry, language);
    
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Call the Edge Function (secure proxy to AI Hub)
    const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include Supabase auth headers for the Edge Function
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`,
        }),
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI Service Error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from AI');
    }

    return parseRecommendations(content, language);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Get system prompt based on language
 */
function getSystemPrompt(language) {
  if (language === 'en') {
    return `You are an expert SAP and AI consultant at adesso. Your task is to analyze AI readiness assessments and provide actionable, specific recommendations.

You must respond ONLY with a valid JSON array of recommendations. Each recommendation must have:
- "text": The recommendation text (clear, actionable, specific)
- "category": One of "quick_win", "strategic", "risk", "next_step"
- "priority": One of "high", "medium", "low"

Focus on:
1. SAP S/4HANA and Clean Core strategy
2. SAP BTP and AI Core adoption
3. Data quality and governance
4. Industry-specific AI use cases
5. Compliance and security (EU AI Act, GDPR)

Provide 5-8 recommendations. Be specific and actionable.`;
  }

  return `Du bist ein erfahrener SAP- und KI-Berater bei adesso. Deine Aufgabe ist es, AI Readiness Assessments zu analysieren und konkrete, umsetzbare Empfehlungen zu geben.

Du musst NUR mit einem gültigen JSON-Array von Empfehlungen antworten. Jede Empfehlung muss haben:
- "text": Der Empfehlungstext (klar, umsetzbar, spezifisch)
- "category": Eine von "quick_win", "strategic", "risk", "next_step"
- "priority": Eine von "high", "medium", "low"

Fokussiere auf:
1. SAP S/4HANA und Clean-Core-Strategie
2. SAP BTP und AI Core Adoption
3. Datenqualität und Data Governance
4. Branchenspezifische KI-Use-Cases
5. Compliance und Sicherheit (EU AI Act, DSGVO)

Gib 5-8 Empfehlungen. Sei spezifisch und umsetzbar.`;
}

/**
 * Build the user prompt with assessment context
 */
function buildPrompt(assessment, answers, scores, industry, language) {
  const answersText = Object.entries(answers || {})
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  if (language === 'en') {
    return `Analyze this AI Readiness Assessment and provide recommendations:

**Customer:** ${assessment.customer_name}
**Industry:** ${industry?.label || assessment.industry} (${industry?.desc || ''})

**AI Readiness Scores:**
- SAP System Score: ${scores?.sap || 0}% ${getScoreLabelInternal(scores?.sap, 'en')}
- BTP & AI Platform Score: ${scores?.btp || 0}% ${getScoreLabelInternal(scores?.btp, 'en')}
- Data Maturity Score: ${scores?.data || 0}% ${getScoreLabelInternal(scores?.data, 'en')}
- Overall Score: ${scores?.overall || 0}%

**Assessment Answers:**
${answersText || 'No detailed answers provided yet.'}

Based on this assessment, provide specific recommendations as a JSON array.`;
  }

  return `Analysiere dieses AI Readiness Assessment und gib Empfehlungen:

**Kunde:** ${assessment.customer_name}
**Branche:** ${industry?.label || assessment.industry} (${industry?.desc || ''})

**AI Readiness Scores:**
- SAP System Score: ${scores?.sap || 0}% ${getScoreLabelInternal(scores?.sap, 'de')}
- BTP & AI Platform Score: ${scores?.btp || 0}% ${getScoreLabelInternal(scores?.btp, 'de')}
- Datenreife Score: ${scores?.data || 0}% ${getScoreLabelInternal(scores?.data, 'de')}
- Gesamtscore: ${scores?.overall || 0}%

**Assessment-Antworten:**
${answersText || 'Noch keine detaillierten Antworten erfasst.'}

Basierend auf diesem Assessment, gib spezifische Empfehlungen als JSON-Array.`;
}

function getScoreLabelInternal(score, language) {
  if (score >= 66) return language === 'en' ? '(AI-Ready)' : '(AI-Ready)';
  if (score >= 33) return language === 'en' ? '(Partially Ready)' : '(Teilweise bereit)';
  return language === 'en' ? '(Not Ready)' : '(Nicht bereit)';
}

/**
 * Parse AI response into structured recommendations
 */
function parseRecommendations(content, language) {
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
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
      language,
    })).filter(rec => rec.text.trim().length > 0);
  } catch (error) {
    console.error('Error parsing recommendations:', error);
    return createFallbackRecommendations(content, language);
  }
}

function normalizeCategory(category) {
  const normalized = (category || '').toLowerCase().replace(/[^a-z_]/g, '');
  const validCategories = ['quick_win', 'strategic', 'risk', 'next_step'];
  return validCategories.includes(normalized) ? normalized : 'next_step';
}

function normalizePriority(priority) {
  const normalized = (priority || '').toLowerCase();
  if (normalized.includes('high') || normalized.includes('hoch')) return 'high';
  if (normalized.includes('low') || normalized.includes('niedrig') || normalized.includes('gering')) return 'low';
  return 'medium';
}

function createFallbackRecommendations(content, language) {
  const sentences = content.split(/[.!?]\s+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 5).map((text, index) => ({
    id: `rec_${Date.now()}_${index}`,
    text: text.trim() + (text.endsWith('.') ? '' : '.'),
    category: 'next_step',
    priority: index < 2 ? 'high' : 'medium',
    language,
  }));
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

/**
 * Get priority display info
 */
export function getPriorityInfo(priority, language = 'de') {
  const priorities = {
    high: {
      de: { label: 'Hoch', icon: '🔴', color: '#E74C3C' },
      en: { label: 'High', icon: '🔴', color: '#E74C3C' },
    },
    medium: {
      de: { label: 'Mittel', icon: '🟡', color: '#F39C12' },
      en: { label: 'Medium', icon: '🟡', color: '#F39C12' },
    },
    low: {
      de: { label: 'Niedrig', icon: '🟢', color: '#27AE60' },
      en: { label: 'Low', icon: '🟢', color: '#27AE60' },
    },
  };
  return priorities[priority]?.[language] || priorities.medium[language];
}