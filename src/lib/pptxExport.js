/* ═══════════════════════════════════════════════════════════════════════════
   POWERPOINT EXPORT SERVICE - MCKINSEY/BCG CONSULTING STYLE
   Professional PowerPoint generation with adesso SE branding
   Following McKinsey Pyramid Principle & BCG MECE Framework
   ═══════════════════════════════════════════════════════════════════════════ */

import PptxGenJS from 'pptxgenjs';
import { INDUSTRIES } from './constants';
import { computeReadinessFromAnswers, getReadinessLevel } from './scoring';
import { SAP_AI_PRODUCTS, SAP_AI_USE_CASES, ALL_SOURCES, getRoadmapForScore } from './sapAIKnowledge';

// ADESSO CORPORATE DESIGN CONSTANTS
const ADESSO = {
  colors: {
    primary: '003366', secondary: '0066B3', accent: '00A3E0',
    text: '333333', lightText: '666666', muted: '999999', white: 'FFFFFF',
    lightBg: 'F8F9FA', success: '28A745', warning: 'FFC107', danger: 'DC3545',
    orange: 'FF6600', purple: '9B59B6', teal: '17A2B8',
  },
  fonts: { title: 'Arial', body: 'Arial' },
  margin: 0.47, slideWidth: 10, slideHeight: 5.625,
};

// AI CONFIGURATION
const AI_CONFIG = {
  baseUrl: 'https://adesso-ai-hub.3asabc.de/v1',
  apiKey: 'sk-ccwu3ZNJMFCfQG76gRaGjg',
  model: 'gpt-oss-120b-sovereign',
  maxTokens: 8000, temperature: 0.7,
};

// BILINGUAL TEXT CONSTANTS
const TEXTS = {
  de: {
    agenda: 'Agenda', executiveSummary: 'Executive Summary', keyFindings: 'Zentrale Erkenntnisse',
    situationAnalysis: 'Situationsanalyse', currentState: 'Aktueller Stand', gapAnalysis: 'Gap-Analyse',
    riskAssessment: 'Risikobewertung', sapAIArchitecture: 'SAP AI Architektur',
    industryUseCases: 'Branchenspezifische Use Cases', recommendations: 'Empfehlungen',
    strategicPriorities: 'Strategische Prioritäten', quickWins: 'Quick Wins (0-3 Monate)',
    roadmap: 'Transformations-Roadmap', businessCase: 'Business Case', whyAdesso: 'Warum adesso?',
    nextSteps: 'Nächste Schritte', sources: 'Quellen & Referenzen', meetsAdesso: 'meets adesso',
    aiReadinessContext: 'im AI Readiness Kontext', overallScore: 'Gesamtscore',
    impact: 'Impact', effort: 'Aufwand', high: 'Hoch', medium: 'Mittel', low: 'Niedrig',
    mustHave: 'Must Have', shouldHave: 'Should Have', couldHave: 'Could Have',
    months: 'Monate', investment: 'Investment', roi: 'ROI', timeline: 'Zeitrahmen',
    benchmark: 'Benchmark', industryAvg: 'Branchendurchschnitt', topPerformer: 'Top Performer',
    sapSystem: 'SAP System', btpAI: 'BTP & AI', dataMaturity: 'Datenreife',
    disclaimer: 'Dieses Dokument wurde mit KI-Unterstützung erstellt (adesso AI Hub).',
  },
  en: {
    agenda: 'Agenda', executiveSummary: 'Executive Summary', keyFindings: 'Key Findings',
    situationAnalysis: 'Situation Analysis', currentState: 'Current State', gapAnalysis: 'Gap Analysis',
    riskAssessment: 'Risk Assessment', sapAIArchitecture: 'SAP AI Architecture',
    industryUseCases: 'Industry-Specific Use Cases', recommendations: 'Recommendations',
    strategicPriorities: 'Strategic Priorities', quickWins: 'Quick Wins (0-3 Months)',
    roadmap: 'Transformation Roadmap', businessCase: 'Business Case', whyAdesso: 'Why adesso?',
    nextSteps: 'Next Steps', sources: 'Sources & References', meetsAdesso: 'meets adesso',
    aiReadinessContext: 'in AI Readiness Context', overallScore: 'Overall Score',
    impact: 'Impact', effort: 'Effort', high: 'High', medium: 'Medium', low: 'Low',
    mustHave: 'Must Have', shouldHave: 'Should Have', couldHave: 'Could Have',
    months: 'Months', investment: 'Investment', roi: 'ROI', timeline: 'Timeline',
    benchmark: 'Benchmark', industryAvg: 'Industry Average', topPerformer: 'Top Performer',
    sapSystem: 'SAP System', btpAI: 'BTP & AI', dataMaturity: 'Data Maturity',
    disclaimer: 'This document was created with AI assistance (adesso AI Hub).',
  }
};

// Fetch SAP AI Data
async function fetchSAPAIData(language = 'de') {
  const sapAIContext = { latestTrends: [], useCases: [], products: [], fetchedAt: new Date().toISOString() };
  sapAIContext.latestTrends = language === 'de' ? [
    'SAP Joule als zentraler KI-Copilot für alle SAP-Anwendungen (2024/2025)',
    'Generative AI Hub mit Multi-LLM-Unterstützung (GPT-4, Gemini, Claude, Mistral)',
    'SAP Business Data Cloud als Datengrundlage für KI-Training',
    'Agentic AI: Autonome Joule Agents für Geschäftsprozesse',
    'SAP AI Core mit erweiterter MLOps-Unterstützung',
  ] : [
    'SAP Joule as central AI copilot for all SAP applications (2024/2025)',
    'Generative AI Hub with multi-LLM support (GPT-4, Gemini, Claude, Mistral)',
    'SAP Business Data Cloud as data foundation for AI training',
    'Agentic AI: Autonomous Joule Agents for business processes',
    'SAP AI Core with extended MLOps support',
  ];
  sapAIContext.products = Object.values(SAP_AI_PRODUCTS).map(p => ({ name: p[language]?.title || p.de?.title, description: p[language]?.description || p.de?.description }));
  sapAIContext.useCases = SAP_AI_USE_CASES[language] || SAP_AI_USE_CASES.de;
  return sapAIContext;
}

// McKinsey/BCG AI Content Generation
async function generateAIContent(assessment, answers, scores, industry, language, sapAIData) {
  const industryLabel = industry?.label || assessment?.industry || (language === 'de' ? 'Allgemein' : 'General');
  const customerName = assessment?.customer_name || (language === 'de' ? 'Kunde' : 'Customer');
  const benchmarks = { sap: { industryAvg: 52, topPerformer: 85 }, btp: { industryAvg: 38, topPerformer: 78 }, data: { industryAvg: 45, topPerformer: 82 }, overall: { industryAvg: 45, topPerformer: 80 } };

  const prompt = language === 'de' ? `
Du bist ein Senior Partner bei McKinsey & Company, spezialisiert auf SAP AI Transformation.
Erstelle eine Board-Level Präsentation für ${customerName}.

WICHTIGE CONSULTING-PRINZIPIEN:
1. PYRAMID PRINCIPLE: Beginne JEDE Aussage mit der Kernbotschaft, unterstütze mit 3 Argumenten
2. MECE FRAMEWORK: Mutually Exclusive, Collectively Exhaustive
3. SO-WHAT TEST: Jede Aussage MUSS eine klare Handlungsimplikation haben
4. QUANTIFIZIERUNG: JEDE Erkenntnis braucht konkrete Zahlen (X%, €Y, Z Monate)
5. EXECUTIVE LANGUAGE: Prägnant, direkt, handlungsorientiert

KONTEXT:
- Kunde: ${customerName}, Branche: ${industryLabel}
- SAP Score: ${scores.sap}% (Benchmark: ${benchmarks.sap.industryAvg}%)
- BTP Score: ${scores.btp}% (Benchmark: ${benchmarks.btp.industryAvg}%)
- Data Score: ${scores.data}% (Benchmark: ${benchmarks.data.industryAvg}%)
- Gesamt: ${scores.overall}%

SAP AI TRENDS: ${sapAIData.latestTrends.join(', ')}

Antworte NUR mit validem JSON:
{
  "keyMessage": "Prägnante CEO-Botschaft (max 15 Wörter)",
  "executiveSummary": {
    "headline": "Kernaussage mit Zahl",
    "supportingPoints": ["Punkt 1 mit Quantifizierung", "Punkt 2 mit Quantifizierung", "Punkt 3 mit Quantifizierung"],
    "bottomLine": "ROI-Aussage für ${customerName}"
  },
  "situationAnalysis": {
    "currentState": [
      {"dimension": "SAP-Landschaft", "finding": "Erkenntnis", "score": ${scores.sap}, "benchmark": ${benchmarks.sap.industryAvg}, "gap": ${benchmarks.sap.industryAvg - scores.sap}, "implication": "Impact"},
      {"dimension": "BTP & AI", "finding": "Erkenntnis", "score": ${scores.btp}, "benchmark": ${benchmarks.btp.industryAvg}, "gap": ${benchmarks.btp.industryAvg - scores.btp}, "implication": "Impact"},
      {"dimension": "Datenreife", "finding": "Erkenntnis", "score": ${scores.data}, "benchmark": ${benchmarks.data.industryAvg}, "gap": ${benchmarks.data.industryAvg - scores.data}, "implication": "Impact"}
    ],
    "strengthsWeaknesses": {"strengths": ["Stärke 1", "Stärke 2"], "weaknesses": ["Schwäche 1", "Schwäche 2"]}
  },
  "gapAnalysis": {
    "matrix": [
      {"gap": "Gap 1", "impact": "high", "effort": "low", "priority": 1, "action": "Aktion", "timeline": "X Wochen"},
      {"gap": "Gap 2", "impact": "high", "effort": "medium", "priority": 2, "action": "Aktion", "timeline": "X Monate"},
      {"gap": "Gap 3", "impact": "high", "effort": "high", "priority": 3, "action": "Aktion", "timeline": "X Monate"},
      {"gap": "Gap 4", "impact": "medium", "effort": "low", "priority": 4, "action": "Aktion", "timeline": "X Wochen"}
    ],
    "riskAssessment": [
      {"risk": "Risiko 1", "probability": "high", "impact": "high", "mitigation": "Maßnahme"},
      {"risk": "Risiko 2", "probability": "medium", "impact": "high", "mitigation": "Maßnahme"}
    ],
    "opportunityCost": "€-Schätzung der Kosten des Nicht-Handelns"
  },
  "industryUseCases": [
    {"useCase": "Use Case 1", "description": "Beschreibung", "sapProduct": "SAP Produkt", "benefit": "30% Effizienz", "complexity": "low", "timeline": "2 Monate"},
    {"useCase": "Use Case 2", "description": "Beschreibung", "sapProduct": "SAP Produkt", "benefit": "25% Einsparung", "complexity": "medium", "timeline": "4 Monate"}
  ],
  "recommendations": {
    "mustHave": [{"action": "Aktion 1", "rationale": "Begründung", "investment": "€30-50k", "roi": "200%", "timeline": "6 Wochen", "owner": "IT"}],
    "shouldHave": [{"action": "Aktion 2", "rationale": "Begründung", "investment": "€50-80k", "roi": "150%", "timeline": "3 Monate", "owner": "Business"}],
    "couldHave": [{"action": "Aktion 3", "rationale": "Begründung", "investment": "€100k", "roi": "250%", "timeline": "12 Monate", "owner": "CTO"}]
  },
  "roadmap": {
    "phases": [
      {"name": "Foundation", "duration": "0-3 Monate", "focus": "Grundlagen", "milestones": ["M1", "M2"], "investment": "€50k"},
      {"name": "Acceleration", "duration": "3-9 Monate", "focus": "Skalierung", "milestones": ["M1", "M2"], "investment": "€100k"},
      {"name": "Scale", "duration": "9-18 Monate", "focus": "Enterprise", "milestones": ["M1", "M2"], "investment": "€200k"}
    ]
  },
  "businessCase": {
    "totalInvestment": "€150-300k", "expectedBenefits": "€300-600k/Jahr", "roi": "150-200%",
    "paybackPeriod": "8-12 Monate", "riskOfInaction": "€500k-1M Opportunitätskosten",
    "competitiveImplication": "Wettbewerber mit AI-Vorsprung operieren 30% effizienter"
  },
  "valueProposition": ["adesso SAP Gold Partner mit 25+ Jahren", "Eigener AI Hub mit 50+ Projekten", "Branchenspezifisches Know-how"],
  "nextSteps": [
    {"step": "Kick-off Workshop", "timeline": "Woche 1", "owner": "adesso + Kunde", "deliverable": "Use Case Priorisierung"},
    {"step": "Technische Evaluierung", "timeline": "Woche 2-3", "owner": "adesso", "deliverable": "Architektur-Blueprint"}
  ]
}` : `You are a Senior Partner at McKinsey & Company, specialized in SAP AI Transformation.
Create a Board-Level presentation for ${customerName}.

CONSULTING PRINCIPLES:
1. PYRAMID PRINCIPLE: Start with key message, support with 3 arguments
2. MECE FRAMEWORK: Mutually Exclusive, Collectively Exhaustive
3. SO-WHAT TEST: Every statement needs clear action implication
4. QUANTIFICATION: Every insight needs numbers (X%, €Y, Z months)
5. EXECUTIVE LANGUAGE: Concise, direct, action-oriented

CONTEXT:
- Customer: ${customerName}, Industry: ${industryLabel}
- SAP Score: ${scores.sap}% (Benchmark: ${benchmarks.sap.industryAvg}%)
- BTP Score: ${scores.btp}% (Benchmark: ${benchmarks.btp.industryAvg}%)
- Data Score: ${scores.data}% (Benchmark: ${benchmarks.data.industryAvg}%)
- Overall: ${scores.overall}%

Output ONLY valid JSON with same structure as German version.`;

  try {
    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: language === 'de' ? 'Du bist McKinsey Partner. Nur valides JSON ausgeben.' : 'You are McKinsey Partner. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI_CONFIG.maxTokens, temperature: AI_CONFIG.temperature,
      }),
    });
    if (!response.ok) throw new Error(`AI API Error: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('No JSON found');
  } catch (error) {
    console.error('AI error:', error);
    return getFallbackContent(scores, industry, language, customerName);
  }
}

// Fallback Content
function getFallbackContent(scores, industry, language, customerName) {
  const isDE = language === 'de';
  return {
    keyMessage: isDE ? `${customerName} kann AI-Readiness in 12 Monaten um 40% steigern` : `${customerName} can increase AI readiness by 40% in 12 months`,
    executiveSummary: {
      headline: isDE ? `AI Readiness bei ${scores.overall}% – ${scores.overall >= 66 ? 'Solide Basis' : 'Handlungsbedarf'}` : `AI Readiness at ${scores.overall}% – ${scores.overall >= 66 ? 'Solid foundation' : 'Action required'}`,
      supportingPoints: isDE ? [`SAP: ${scores.sap}% (Benchmark: 52%)`, `BTP: ${scores.btp}% (Benchmark: 38%)`, `Daten: ${scores.data}% (Benchmark: 45%)`] : [`SAP: ${scores.sap}% (Benchmark: 52%)`, `BTP: ${scores.btp}% (Benchmark: 38%)`, `Data: ${scores.data}% (Benchmark: 45%)`],
      bottomLine: isDE ? `ROI von 150-200% in 12 Monaten möglich` : `ROI of 150-200% possible in 12 months`,
    },
    situationAnalysis: {
      currentState: [
        { dimension: isDE ? 'SAP-Landschaft' : 'SAP Landscape', finding: isDE ? 'Modernisierungspotenzial' : 'Modernization potential', score: scores.sap, benchmark: 52, gap: 52 - scores.sap, implication: isDE ? 'AI-Basis vorhanden' : 'AI foundation exists' },
        { dimension: 'BTP & AI', finding: isDE ? 'Nicht voll ausgeschöpft' : 'Not fully leveraged', score: scores.btp, benchmark: 38, gap: 38 - scores.btp, implication: isDE ? 'Schnelle Aktivierung möglich' : 'Quick activation possible' },
        { dimension: isDE ? 'Datenreife' : 'Data Maturity', finding: isDE ? 'Governance ausbaufähig' : 'Governance improvable', score: scores.data, benchmark: 45, gap: 45 - scores.data, implication: isDE ? 'Kritisch für AI' : 'Critical for AI' },
      ],
      strengthsWeaknesses: { strengths: isDE ? ['SAP-Investitionen', 'AI-Bewusstsein'] : ['SAP investments', 'AI awareness'], weaknesses: isDE ? ['Fragmentierte Daten', 'Fehlende Governance'] : ['Fragmented data', 'Missing governance'] },
    },
    gapAnalysis: {
      matrix: [
        { gap: isDE ? 'AI Governance fehlt' : 'AI Governance missing', impact: 'high', effort: 'low', priority: 1, action: isDE ? 'AI Policy erstellen' : 'Create AI policy', timeline: isDE ? '4 Wochen' : '4 weeks' },
        { gap: isDE ? 'BTP nicht aktiviert' : 'BTP not activated', impact: 'high', effort: 'medium', priority: 2, action: isDE ? 'AI Core einrichten' : 'Set up AI Core', timeline: isDE ? '6 Wochen' : '6 weeks' },
        { gap: isDE ? 'Datenqualität' : 'Data quality', impact: 'high', effort: 'high', priority: 3, action: isDE ? 'Data Initiative' : 'Data Initiative', timeline: isDE ? '3-6 Monate' : '3-6 months' },
        { gap: isDE ? 'AI-Kompetenz' : 'AI competence', impact: 'medium', effort: 'low', priority: 4, action: isDE ? 'Schulung' : 'Training', timeline: isDE ? '2 Wochen' : '2 weeks' },
      ],
      riskAssessment: [
        { risk: isDE ? 'Wettbewerber schneller' : 'Competitors faster', probability: 'high', impact: 'high', mitigation: isDE ? 'Quick Wins' : 'Quick wins' },
        { risk: isDE ? 'Datenqualität blockiert' : 'Data quality blocks', probability: 'medium', impact: 'high', mitigation: isDE ? 'Parallele Initiative' : 'Parallel initiative' },
      ],
      opportunityCost: isDE ? '€500k-1M durch Verzögerung' : '€500k-1M from delay',
    },
    industryUseCases: [
      { useCase: isDE ? 'Dokumentenverarbeitung' : 'Document Processing', description: isDE ? 'Automatische Extraktion' : 'Automatic extraction', sapProduct: 'SAP Document AI', benefit: '70%', complexity: 'low', timeline: isDE ? '2 Monate' : '2 months' },
      { useCase: 'SAP Joule', description: isDE ? 'KI-Assistent' : 'AI assistant', sapProduct: 'SAP Joule', benefit: '30%', complexity: 'low', timeline: isDE ? '1 Monat' : '1 month' },
    ],
    recommendations: {
      mustHave: [{ action: isDE ? 'AI Core aktivieren' : 'Activate AI Core', rationale: isDE ? 'Grundlage' : 'Foundation', investment: '€30-50k', roi: '200%', timeline: isDE ? '6 Wochen' : '6 weeks', owner: 'IT' }],
      shouldHave: [{ action: isDE ? 'Pilot implementieren' : 'Implement pilot', rationale: isDE ? 'Wertnachweis' : 'Value proof', investment: '€50-80k', roi: '180%', timeline: isDE ? '3 Monate' : '3 months', owner: 'Business' }],
      couldHave: [{ action: isDE ? 'CoE aufbauen' : 'Build CoE', rationale: isDE ? 'Skalierung' : 'Scaling', investment: '€100-150k', roi: '250%', timeline: isDE ? '12 Monate' : '12 months', owner: 'CTO' }],
    },
    roadmap: {
      phases: [
        { name: 'Foundation', duration: isDE ? '0-3 Monate' : '0-3 months', focus: isDE ? 'Grundlagen' : 'Foundation', milestones: [isDE ? 'AI Core live' : 'AI Core live', isDE ? 'Governance' : 'Governance'], investment: '€50-80k' },
        { name: 'Acceleration', duration: isDE ? '3-9 Monate' : '3-9 months', focus: isDE ? 'Use Cases' : 'Use cases', milestones: [isDE ? 'Pilot produktiv' : 'Pilot productive', isDE ? 'ROI nachgewiesen' : 'ROI proven'], investment: '€80-120k' },
        { name: 'Scale', duration: isDE ? '9-18 Monate' : '9-18 months', focus: isDE ? 'Enterprise' : 'Enterprise', milestones: [isDE ? '5+ Use Cases' : '5+ use cases', isDE ? 'CoE etabliert' : 'CoE established'], investment: '€150-250k' },
      ],
    },
    businessCase: {
      totalInvestment: '€150-300k', expectedBenefits: isDE ? '€300-600k/Jahr' : '€300-600k/year', roi: '150-200%',
      paybackPeriod: isDE ? '8-12 Monate' : '8-12 months', riskOfInaction: isDE ? '15-20% Wettbewerbsverlust' : '15-20% competitive loss',
      competitiveImplication: isDE ? 'Wettbewerber 30% effizienter' : 'Competitors 30% more efficient',
    },
    valueProposition: isDE ? ['SAP Gold Partner, 25+ Jahre', 'AI Hub mit 50+ Projekten', 'Branchenexpertise'] : ['SAP Gold Partner, 25+ years', 'AI Hub with 50+ projects', 'Industry expertise'],
    nextSteps: [
      { step: 'Kick-off Workshop', timeline: isDE ? 'Woche 1' : 'Week 1', owner: isDE ? 'adesso + Kunde' : 'adesso + Customer', deliverable: isDE ? 'Use Case Priorisierung' : 'Use case prioritization' },
      { step: isDE ? 'Technische Evaluierung' : 'Technical Evaluation', timeline: isDE ? 'Woche 2-3' : 'Week 2-3', owner: 'adesso', deliverable: isDE ? 'Architektur-Blueprint' : 'Architecture blueprint' },
    ],
  };
}

// VISUAL HELPER FUNCTIONS
function addFooter(slide, pptx, date, customerName) {
  const pageNum = pptx.slides.length;
  slide.addText(date, { x: ADESSO.margin, y: ADESSO.slideHeight - 0.35, w: 1.2, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  slide.addText(`${customerName} meets adesso`, { x: 1.7, y: ADESSO.slideHeight - 0.35, w: 4, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  slide.addText(String(pageNum), { x: ADESSO.slideWidth - ADESSO.margin - 0.3, y: ADESSO.slideHeight - 0.35, w: 0.3, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted, align: 'right' });
}

function addSectionNumber(slide, number, x, y, size = 0.5) {
  slide.addShape('ellipse', { x, y, w: size, h: size, fill: { color: ADESSO.colors.primary } });
  slide.addText(String(number).padStart(2, '0'), { x, y: y + (size * 0.18), w: size, h: size * 0.65, fontSize: Math.round(size * 18), fontFace: ADESSO.fonts.title, color: ADESSO.colors.white, bold: true, align: 'center' });
}

function createTitleSlide(pptx, customerName, date, industry, t) {
  const slide = pptx.addSlide();
  slide.addText(customerName, { x: ADESSO.margin, y: 1.8, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.7, fontSize: 32, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  slide.addText(t.meetsAdesso, { x: ADESSO.margin, y: 2.5, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.5, fontSize: 24, fontFace: ADESSO.fonts.title, color: ADESSO.colors.secondary });
  slide.addText(t.aiReadinessContext, { x: ADESSO.margin, y: 3.0, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.4, fontSize: 16, fontFace: ADESSO.fonts.body, color: ADESSO.colors.lightText });
  if (industry) slide.addText(`${industry.icon} ${industry.label}`, { x: ADESSO.margin, y: 3.6, w: 4, h: 0.3, fontSize: 11, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  slide.addText(date, { x: ADESSO.margin, y: ADESSO.slideHeight - 0.5, w: 2, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  return slide;
}

function createAgendaSlide(pptx, date, customerName, agendaItems, t) {
  const slide = pptx.addSlide();
  slide.addText(t.agenda, { x: ADESSO.margin, y: ADESSO.margin, w: 4, h: 0.5, fontSize: 24, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  agendaItems.forEach((item, i) => {
    const y = 1.0 + (i * 0.55);
    addSectionNumber(slide, i + 1, ADESSO.margin, y, 0.35);
    slide.addText(item.title, { x: ADESSO.margin + 0.5, y: y + 0.02, w: 6.5, h: 0.35, fontSize: 12, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
    slide.addText(item.time, { x: ADESSO.slideWidth - ADESSO.margin - 1.2, y: y + 0.02, w: 1.2, h: 0.35, fontSize: 11, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted, align: 'right' });
  });
  addFooter(slide, pptx, date, customerName);
  return slide;
}

function createSectionDivider(pptx, sectionNumber, title, subtitle, date, customerName) {
  const slide = pptx.addSlide();
  addSectionNumber(slide, sectionNumber, ADESSO.margin, 1.8, 0.7);
  slide.addText(title, { x: ADESSO.margin + 1.0, y: 1.85, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 1.0, h: 0.6, fontSize: 24, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  if (subtitle) slide.addText(subtitle, { x: ADESSO.margin + 1.0, y: 2.5, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 1.0, h: 0.4, fontSize: 14, fontFace: ADESSO.fonts.body, color: ADESSO.colors.lightText });
  addFooter(slide, pptx, date, customerName);
  return slide;
}

function createContentSlide(pptx, title, date, customerName) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: ADESSO.margin, y: ADESSO.margin, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.45, fontSize: 18, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  addFooter(slide, pptx, date, customerName);
  return slide;
}

function addBulletList(slide, items, x, y, width, options = {}) {
  const { fontSize = 11, lineSpacing = 0.45, bulletColor = ADESSO.colors.secondary } = options;
  items.forEach((item, i) => {
    slide.addText('•', { x, y: y + (i * lineSpacing), w: 0.2, h: lineSpacing, fontSize, fontFace: ADESSO.fonts.body, color: bulletColor, bold: true });
    slide.addText(item, { x: x + 0.25, y: y + (i * lineSpacing), w: width - 0.25, h: lineSpacing, fontSize, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, valign: 'top' });
  });
}

function addScoreGauge(slide, x, y, score, label, sublabel) {
  const level = getReadinessLevel(score);
  const color = level.color.replace('#', '');
  slide.addShape('ellipse', { x, y, w: 1.2, h: 1.2, fill: { color: ADESSO.colors.lightBg }, line: { color, width: 3 } });
  slide.addText(`${score}%`, { x, y: y + 0.3, w: 1.2, h: 0.6, fontSize: 22, fontFace: ADESSO.fonts.title, color, bold: true, align: 'center' });
  slide.addText(label, { x: x - 0.15, y: y + 1.3, w: 1.5, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, bold: true, align: 'center' });
  if (sublabel) slide.addText(sublabel, { x: x - 0.15, y: y + 1.5, w: 1.5, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted, align: 'center' });
}

function addTrafficLight(slide, status, x, y) {
  const colors = { high: ADESSO.colors.danger, medium: ADESSO.colors.warning, low: ADESSO.colors.success };
  slide.addShape('ellipse', { x, y, w: 0.25, h: 0.25, fill: { color: colors[status] || ADESSO.colors.muted } });
}

function addGanttTimeline(slide, phases, x, y, width, height, t) {
  const phaseHeight = height / phases.length;
  const labelWidth = 1.5;
  const barWidth = width - labelWidth;
  const barColors = [ADESSO.colors.success, ADESSO.colors.warning, ADESSO.colors.secondary];
  phases.forEach((phase, i) => {
    const phaseY = y + (i * phaseHeight);
    slide.addText(phase.name, { x, y: phaseY + 0.05, w: labelWidth - 0.1, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
    slide.addText(phase.duration, { x, y: phaseY + 0.28, w: labelWidth - 0.1, h: 0.2, fontSize: 7, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
    const barStart = x + labelWidth + (i * barWidth / 3);
    const barLen = barWidth / 3 - 0.1;
    slide.addShape('rect', { x: barStart, y: phaseY + 0.1, w: barLen, h: phaseHeight - 0.25, fill: { color: barColors[i] } });
    phase.milestones.slice(0, 2).forEach((milestone, j) => {
      slide.addText(`• ${milestone}`, { x: barStart + 0.1, y: phaseY + 0.15 + (j * 0.2), w: barLen - 0.2, h: 0.18, fontSize: 6, fontFace: ADESSO.fonts.body, color: ADESSO.colors.white });
    });
  });
  ['0', '3', '6', '9', '12', '15', '18'].forEach((m, i) => {
    slide.addText(m, { x: x + labelWidth + (i * barWidth / 6) - 0.1, y: y + height + 0.05, w: 0.2, h: 0.15, fontSize: 7, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted, align: 'center' });
  });
}

// MAIN EXPORT FUNCTION
export async function generatePowerPoint(assessment, answers, language = 'de', onProgress = null) {
  const pptx = new PptxGenJS();
  const t = TEXTS[language] || TEXTS.de;
  
  pptx.author = 'adesso SE';
  pptx.title = `AI Readiness Check - ${assessment?.customer_name || 'Customer'}`;
  pptx.subject = 'SAP AI Readiness Assessment - McKinsey/BCG Style';
  pptx.company = 'adesso SE';
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: ADESSO.slideWidth, height: ADESSO.slideHeight });
  pptx.layout = 'LAYOUT_16x9';
  
  const industry = INDUSTRIES[assessment?.industry];
  const scores = computeReadinessFromAnswers(answers || {});
  scores.overall = Math.round((scores.sap + scores.btp + scores.data) / 3);
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const customerName = assessment?.customer_name || (language === 'de' ? 'Kunde' : 'Customer');
  
  const updateProgress = (step, total) => onProgress && onProgress(Math.round((step / total) * 100));
  updateProgress(1, 23);
  
  const sapAIData = await fetchSAPAIData(language);
  updateProgress(2, 23);
  
  const ai = await generateAIContent(assessment, answers, scores, industry, language, sapAIData);
  updateProgress(3, 23);
  
  // SLIDE 1: TITLE
  createTitleSlide(pptx, customerName, date, industry, t);
  updateProgress(4, 23);
  
  // SLIDE 2: AGENDA
  const agendaItems = language === 'de' ? [
    { title: 'Executive Summary & AI Readiness Dashboard', time: '10 Min' },
    { title: 'Situationsanalyse & Benchmark', time: '15 Min' },
    { title: 'Gap-Analyse & Risikobewertung', time: '10 Min' },
    { title: 'SAP AI Architektur & Use Cases', time: '15 Min' },
    { title: 'Empfehlungen & Roadmap', time: '15 Min' },
    { title: 'Business Case & Nächste Schritte', time: '10 Min' },
  ] : [
    { title: 'Executive Summary & AI Readiness Dashboard', time: '10 Min' },
    { title: 'Situation Analysis & Benchmark', time: '15 Min' },
    { title: 'Gap Analysis & Risk Assessment', time: '10 Min' },
    { title: 'SAP AI Architecture & Use Cases', time: '15 Min' },
    { title: 'Recommendations & Roadmap', time: '15 Min' },
    { title: 'Business Case & Next Steps', time: '10 Min' },
  ];
  createAgendaSlide(pptx, date, customerName, agendaItems, t);
  updateProgress(5, 23);
  
  // SLIDE 3: SECTION - EXECUTIVE SUMMARY
  createSectionDivider(pptx, 1, t.executiveSummary, language === 'de' ? 'Zentrale Erkenntnisse und Handlungsempfehlungen' : 'Key findings and recommendations', date, customerName);
  updateProgress(6, 23);
  
  // SLIDE 4: KEY MESSAGE
  const keyMsgSlide = createContentSlide(pptx, t.executiveSummary, date, customerName);
  keyMsgSlide.addShape('rect', { x: ADESSO.margin, y: 1.0, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.7, fill: { color: ADESSO.colors.primary } });
  keyMsgSlide.addText(ai.keyMessage, { x: ADESSO.margin + 0.2, y: 1.1, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 0.4, h: 0.5, fontSize: 14, fontFace: ADESSO.fonts.title, color: ADESSO.colors.white, bold: true, align: 'center' });
  keyMsgSlide.addText(ai.executiveSummary.headline, { x: ADESSO.margin, y: 1.85, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.4, fontSize: 12, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, bold: true });
  addBulletList(keyMsgSlide, ai.executiveSummary.supportingPoints, ADESSO.margin, 2.35, ADESSO.slideWidth - (ADESSO.margin * 2), { fontSize: 10, lineSpacing: 0.5 });
  keyMsgSlide.addShape('rect', { x: ADESSO.margin, y: 4.0, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.6, fill: { color: ADESSO.colors.lightBg }, line: { color: ADESSO.colors.success, width: 2 } });
  keyMsgSlide.addText(ai.executiveSummary.bottomLine, { x: ADESSO.margin + 0.15, y: 4.1, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 0.3, h: 0.4, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
  updateProgress(7, 23);
  
  // SLIDE 5: AI READINESS DASHBOARD
  const dashSlide = createContentSlide(pptx, 'AI Readiness Dashboard', date, customerName);
  addScoreGauge(dashSlide, 1.3, 1.1, scores.sap, t.sapSystem, 'S/4HANA, Clean Core');
  addScoreGauge(dashSlide, 4.15, 1.1, scores.btp, t.btpAI, 'AI Core, Gen AI Hub');
  addScoreGauge(dashSlide, 7.0, 1.1, scores.data, t.dataMaturity, 'Governance, DWH');
  const overallLevel = getReadinessLevel(scores.overall);
  dashSlide.addShape('rect', { x: ADESSO.margin, y: 3.4, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 1.1, fill: { color: ADESSO.colors.lightBg }, line: { color: overallLevel.color.replace('#', ''), width: 2 } });
  dashSlide.addText(t.overallScore, { x: ADESSO.margin + 0.3, y: 3.55, w: 2, h: 0.25, fontSize: 11, fontFace: ADESSO.fonts.body, color: ADESSO.colors.lightText });
  dashSlide.addText(`${scores.overall}%`, { x: ADESSO.margin + 0.3, y: 3.75, w: 1.5, h: 0.5, fontSize: 32, fontFace: ADESSO.fonts.title, color: overallLevel.color.replace('#', ''), bold: true });
  dashSlide.addText(overallLevel.label, { x: ADESSO.margin + 2.0, y: 3.9, w: 5, h: 0.35, fontSize: 14, fontFace: ADESSO.fonts.body, color: overallLevel.color.replace('#', ''), bold: true });
  dashSlide.addText(`${t.industryAvg}: 45% | ${t.topPerformer}: 80%`, { x: ADESSO.margin + 2.0, y: 4.2, w: 5, h: 0.2, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  updateProgress(8, 23);
  
  // SLIDE 6: SECTION - SITUATION ANALYSIS
  createSectionDivider(pptx, 2, t.situationAnalysis, language === 'de' ? 'Aktueller Stand im Branchenvergleich' : 'Current state vs. industry benchmark', date, customerName);
  updateProgress(9, 23);
  
  // SLIDE 7: CURRENT STATE VS BENCHMARK
  const benchSlide = createContentSlide(pptx, language === 'de' ? 'Aktueller Stand vs. Benchmark' : 'Current State vs. Benchmark', date, customerName);
  ai.situationAnalysis.currentState.forEach((dim, i) => {
    const rowY = 1.1 + (i * 0.9);
    benchSlide.addText(dim.dimension, { x: ADESSO.margin, y: rowY, w: 1.8, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
    benchSlide.addShape('rect', { x: ADESSO.margin + 2, y: rowY, w: 4, h: 0.3, fill: { color: 'E0E0E0' } });
    const scoreWidth = (dim.score / 100) * 4;
    const scoreColor = dim.score >= 66 ? ADESSO.colors.success : dim.score >= 33 ? ADESSO.colors.warning : ADESSO.colors.danger;
    benchSlide.addShape('rect', { x: ADESSO.margin + 2, y: rowY, w: scoreWidth, h: 0.3, fill: { color: scoreColor } });
    benchSlide.addText(`${dim.score}%`, { x: ADESSO.margin + 6.1, y: rowY, w: 0.6, h: 0.3, fontSize: 10, fontFace: ADESSO.fonts.title, color: scoreColor, bold: true });
    benchSlide.addText(dim.finding, { x: ADESSO.margin, y: rowY + 0.35, w: 4.5, h: 0.25, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
    benchSlide.addText(`→ ${dim.implication}`, { x: ADESSO.margin + 4.5, y: rowY + 0.35, w: 4, h: 0.25, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.secondary, italic: true });
  });
  updateProgress(10, 23);
  
  // SLIDE 8: STRENGTHS & WEAKNESSES
  const swSlide = createContentSlide(pptx, language === 'de' ? 'Stärken & Schwächen' : 'Strengths & Weaknesses', date, customerName);
  swSlide.addShape('rect', { x: ADESSO.margin, y: 1.0, w: 4.3, h: 0.35, fill: { color: ADESSO.colors.success } });
  swSlide.addText(language === 'de' ? 'Stärken' : 'Strengths', { x: ADESSO.margin + 0.1, y: 1.05, w: 4, h: 0.25, fontSize: 11, fontFace: ADESSO.fonts.title, color: ADESSO.colors.white, bold: true });
  addBulletList(swSlide, ai.situationAnalysis.strengthsWeaknesses.strengths, ADESSO.margin, 1.5, 4.3, { fontSize: 10, lineSpacing: 0.5, bulletColor: ADESSO.colors.success });
  swSlide.addShape('rect', { x: ADESSO.margin + 4.6, y: 1.0, w: 4.3, h: 0.35, fill: { color: ADESSO.colors.danger } });
  swSlide.addText(language === 'de' ? 'Schwächen' : 'Weaknesses', { x: ADESSO.margin + 4.7, y: 1.05, w: 4, h: 0.25, fontSize: 11, fontFace: ADESSO.fonts.title, color: ADESSO.colors.white, bold: true });
  addBulletList(swSlide, ai.situationAnalysis.strengthsWeaknesses.weaknesses, ADESSO.margin + 4.6, 1.5, 4.3, { fontSize: 10, lineSpacing: 0.5, bulletColor: ADESSO.colors.danger });
  updateProgress(11, 23);
  
  // SLIDE 9: SECTION - GAP ANALYSIS
  createSectionDivider(pptx, 3, t.gapAnalysis, language === 'de' ? 'Identifizierte Lücken und Handlungsbedarf' : 'Identified gaps and action required', date, customerName);
  updateProgress(12, 23);
  
  // SLIDE 10: GAP ANALYSIS
  const gapSlide = createContentSlide(pptx, t.gapAnalysis, date, customerName);
  ai.gapAnalysis.matrix.forEach((gap, i) => {
    const y = 1.0 + (i * 0.7);
    const impactColor = gap.impact === 'high' ? ADESSO.colors.danger : gap.impact === 'medium' ? ADESSO.colors.warning : ADESSO.colors.success;
    gapSlide.addShape('rect', { x: ADESSO.margin, y, w: 0.08, h: 0.5, fill: { color: impactColor } });
    gapSlide.addText(`${gap.priority}. ${gap.gap}`, { x: ADESSO.margin + 0.2, y: y + 0.05, w: 5, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, bold: true });
    gapSlide.addText(`→ ${gap.action} (${gap.timeline})`, { x: ADESSO.margin + 0.2, y: y + 0.3, w: 5, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.secondary });
    gapSlide.addText(`${t.impact}: ${gap.impact} | ${t.effort}: ${gap.effort}`, { x: 6, y: y + 0.15, w: 3.5, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  });
  gapSlide.addShape('rect', { x: ADESSO.margin, y: 3.9, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.5, fill: { color: ADESSO.colors.danger, transparency: 90 }, line: { color: ADESSO.colors.danger, width: 1 } });
  gapSlide.addText(`⚠️ ${ai.gapAnalysis.opportunityCost}`, { x: ADESSO.margin + 0.1, y: 4.0, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 0.2, h: 0.3, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.danger });
  updateProgress(13, 23);
  
  // SLIDE 11: RISK ASSESSMENT
  const riskSlide = createContentSlide(pptx, t.riskAssessment, date, customerName);
  ai.gapAnalysis.riskAssessment.forEach((risk, i) => {
    const y = 1.0 + (i * 0.8);
    riskSlide.addText(risk.risk, { x: ADESSO.margin, y, w: 4, h: 0.3, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, bold: true });
    addTrafficLight(riskSlide, risk.probability, ADESSO.margin + 4.2, y + 0.02);
    addTrafficLight(riskSlide, risk.impact, ADESSO.margin + 4.6, y + 0.02);
    riskSlide.addText(`→ ${risk.mitigation}`, { x: ADESSO.margin, y: y + 0.35, w: 8, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.secondary });
  });
  updateProgress(14, 23);
  
  // SLIDE 12: SECTION - SAP AI ARCHITECTURE
  createSectionDivider(pptx, 4, t.sapAIArchitecture, language === 'de' ? 'Technische Grundlage für KI-Initiativen' : 'Technical foundation for AI initiatives', date, customerName);
  updateProgress(15, 23);
  
  // SLIDE 13: SAP AI STACK
  const archSlide = createContentSlide(pptx, 'SAP Business AI Architecture', date, customerName);
  const layers = [
    { name: 'Application Layer', desc: 'Joule Copilot: Agentic orchestration + SAP apps', color: ADESSO.colors.purple },
    { name: 'Gateway Layer', desc: 'Generative AI Hub: APIs, security, LLM connectors', color: ADESSO.colors.accent },
    { name: 'Orchestration Layer', desc: 'SAP AI Core: MLOps, model lifecycle', color: ADESSO.colors.success },
    { name: 'Foundation Layer', desc: 'SAP BTP: Cloud Foundry + Vector DB', color: ADESSO.colors.primary },
  ];
  layers.forEach((layer, i) => {
    const y = 1.0 + (i * 0.85);
    const w = ADESSO.slideWidth - (ADESSO.margin * 2) - (i * 0.3);
    const x = ADESSO.margin + (i * 0.15);
    archSlide.addShape('rect', { x, y, w, h: 0.7, fill: { color: layer.color } });
    archSlide.addText(layer.name, { x: x + 0.2, y: y + 0.1, w: 3, h: 0.25, fontSize: 11, fontFace: ADESSO.fonts.title, color: ADESSO.colors.white, bold: true });
    archSlide.addText(layer.desc, { x: x + 0.2, y: y + 0.38, w: w - 0.4, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.white });
  });
  updateProgress(16, 23);
  
  // SLIDE 14: USE CASES
  const ucSlide = createContentSlide(pptx, `${t.industryUseCases}`, date, customerName);
  ai.industryUseCases.forEach((uc, i) => {
    const y = 1.0 + (i * 0.7);
    ucSlide.addText(`${i + 1}. ${uc.useCase}`, { x: ADESSO.margin, y, w: 4, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
    ucSlide.addText(uc.description, { x: ADESSO.margin, y: y + 0.25, w: 4, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
    ucSlide.addText(`${uc.sapProduct} | ${uc.benefit} | ${uc.timeline}`, { x: 5, y: y + 0.1, w: 4.5, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  });
  updateProgress(17, 23);
  
  // SLIDE 15: SECTION - RECOMMENDATIONS
  createSectionDivider(pptx, 5, t.recommendations, language === 'de' ? 'Priorisierte Handlungsempfehlungen' : 'Prioritized recommendations', date, customerName);
  updateProgress(18, 23);
  
  // SLIDE 16: RECOMMENDATIONS
  const recSlide = createContentSlide(pptx, t.strategicPriorities, date, customerName);
  const allRecs = [...(ai.recommendations.mustHave || []).map(r => ({ ...r, type: t.mustHave, color: ADESSO.colors.danger })), ...(ai.recommendations.shouldHave || []).map(r => ({ ...r, type: t.shouldHave, color: ADESSO.colors.warning })), ...(ai.recommendations.couldHave || []).map(r => ({ ...r, type: t.couldHave, color: ADESSO.colors.success }))];
  allRecs.slice(0, 4).forEach((rec, i) => {
    const y = 1.0 + (i * 0.8);
    recSlide.addShape('rect', { x: ADESSO.margin, y, w: 0.08, h: 0.6, fill: { color: rec.color } });
    recSlide.addText(`${rec.type}: ${rec.action}`, { x: ADESSO.margin + 0.2, y: y + 0.05, w: 6, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text, bold: true });
    recSlide.addText(`${t.investment}: ${rec.investment} | ${t.roi}: ${rec.roi} | ${t.timeline}: ${rec.timeline}`, { x: ADESSO.margin + 0.2, y: y + 0.3, w: 6, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
    recSlide.addText(rec.rationale, { x: ADESSO.margin + 0.2, y: y + 0.5, w: 6, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.secondary });
  });
  updateProgress(19, 23);
  
  // SLIDE 17: ROADMAP
  const rmSlide = createContentSlide(pptx, t.roadmap, date, customerName);
  addGanttTimeline(rmSlide, ai.roadmap.phases, ADESSO.margin, 1.0, ADESSO.slideWidth - (ADESSO.margin * 2), 2.8, t);
  ai.roadmap.phases.forEach((phase, i) => {
    const x = ADESSO.margin + (i * 3);
    rmSlide.addText(`${phase.name}: ${phase.focus}`, { x, y: 4.0, w: 2.8, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
    rmSlide.addText(`${t.investment}: ${phase.investment}`, { x, y: 4.2, w: 2.8, h: 0.15, fontSize: 7, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
  });
  updateProgress(20, 23);
  
  // SLIDE 18: BUSINESS CASE
  const bcSlide = createContentSlide(pptx, t.businessCase, date, customerName);
  const bcMetrics = [{ label: t.investment, value: ai.businessCase.totalInvestment }, { label: t.roi, value: ai.businessCase.roi }, { label: 'Payback', value: ai.businessCase.paybackPeriod }];
  bcMetrics.forEach((m, i) => {
    bcSlide.addText(m.label, { x: ADESSO.margin + (i * 3), y: 1.0, w: 2.8, h: 0.2, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
    bcSlide.addText(m.value, { x: ADESSO.margin + (i * 3), y: 1.25, w: 2.8, h: 0.4, fontSize: 16, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  });
  bcSlide.addShape('rect', { x: ADESSO.margin, y: 2.0, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.6, fill: { color: ADESSO.colors.danger, transparency: 90 }, line: { color: ADESSO.colors.danger, width: 1 } });
  bcSlide.addText(`⚠️ ${ai.businessCase.riskOfInaction}`, { x: ADESSO.margin + 0.1, y: 2.1, w: ADESSO.slideWidth - (ADESSO.margin * 2) - 0.2, h: 0.4, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.danger });
  bcSlide.addText(ai.businessCase.competitiveImplication, { x: ADESSO.margin, y: 2.8, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.4, fontSize: 10, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
  updateProgress(21, 23);
  
  // SLIDE 19: NEXT STEPS
  const nsSlide = createContentSlide(pptx, t.nextSteps, date, customerName);
  ai.nextSteps.forEach((step, i) => {
    const y = 1.0 + (i * 0.7);
    addSectionNumber(nsSlide, i + 1, ADESSO.margin, y, 0.4);
    nsSlide.addText(step.step, { x: ADESSO.margin + 0.55, y: y + 0.02, w: 4, h: 0.25, fontSize: 11, fontFace: ADESSO.fonts.title, color: ADESSO.colors.text, bold: true });
    nsSlide.addText(`${t.timeline}: ${step.timeline} | Owner: ${step.owner}`, { x: ADESSO.margin + 0.55, y: y + 0.28, w: 4, h: 0.2, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted });
    nsSlide.addText(`→ ${step.deliverable}`, { x: 5.5, y: y + 0.1, w: 4, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.secondary });
  });
  updateProgress(22, 23);
  
  // SLIDE 20: WHY ADESSO
  const whySlide = createContentSlide(pptx, t.whyAdesso, date, customerName);
  addBulletList(whySlide, ai.valueProposition, ADESSO.margin, 1.0, ADESSO.slideWidth - (ADESSO.margin * 2), { fontSize: 11, lineSpacing: 0.65 });
  whySlide.addShape('rect', { x: ADESSO.margin, y: 3.0, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 1.0, fill: { color: ADESSO.colors.lightBg } });
  const stats = [{ value: '1997', label: language === 'de' ? 'Gründung' : 'Founded' }, { value: '11.000+', label: language === 'de' ? 'Mitarbeitende' : 'Employees' }, { value: '1,3 Mrd. €', label: language === 'de' ? 'Umsatz' : 'Revenue' }, { value: '60+', label: language === 'de' ? 'Standorte' : 'Locations' }];
  stats.forEach((stat, i) => {
    const x = ADESSO.margin + 0.3 + (i * 2.2);
    whySlide.addText(stat.value, { x, y: 3.15, w: 2, h: 0.35, fontSize: 16, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
    whySlide.addText(stat.label, { x, y: 3.5, w: 2, h: 0.25, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.lightText });
  });
  
  // SLIDE 21: SOURCES
  const srcSlide = createContentSlide(pptx, t.sources, date, customerName);
  srcSlide.addText(language === 'de' ? 'SAP Offizielle Quellen:' : 'SAP Official Sources:', { x: ADESSO.margin, y: 0.95, w: 4, h: 0.25, fontSize: 10, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  ALL_SOURCES.slice(0, 4).forEach((source, i) => {
    srcSlide.addText(`• ${source.name}`, { x: ADESSO.margin, y: 1.25 + (i * 0.35), w: 5, h: 0.2, fontSize: 9, fontFace: ADESSO.fonts.body, color: ADESSO.colors.text });
    srcSlide.addText(source.url, { x: ADESSO.margin + 0.15, y: 1.45 + (i * 0.35), w: 5, h: 0.15, fontSize: 7, fontFace: ADESSO.fonts.body, color: ADESSO.colors.accent });
  });
  srcSlide.addText(t.disclaimer + ' © adesso SE 2025', { x: ADESSO.margin, y: 4.1, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.4, fontSize: 8, fontFace: ADESSO.fonts.body, color: ADESSO.colors.muted, italic: true });
  
  // SLIDE 22: CLOSING
  const closeSlide = pptx.addSlide();
  closeSlide.addText('#GROWTOGETHER', { x: ADESSO.margin, y: 1.8, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.6, fontSize: 28, fontFace: ADESSO.fonts.title, color: ADESSO.colors.primary, bold: true });
  closeSlide.addText(language === 'de' ? 'Wie arbeiten WIR zusammen?' : 'How do WE work together?', { x: ADESSO.margin, y: 2.5, w: ADESSO.slideWidth - (ADESSO.margin * 2), h: 0.5, fontSize: 18, fontFace: ADESSO.fonts.body, color: ADESSO.colors.lightText });
  closeSlide.addText('adesso SE | www.adesso.de', { x: ADESSO.margin, y: 3.5, w: 4, h: 0.3, fontSize: 12, fontFace: ADESSO.fonts.body, color: ADESSO.colors.accent });
  addFooter(closeSlide, pptx, date, customerName);
  updateProgress(23, 23);
  
  // Save file
  const cleanName = customerName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').substring(0, 30);
  const filename = `AI_Readiness_${cleanName}_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: filename });
  
  return filename;
}