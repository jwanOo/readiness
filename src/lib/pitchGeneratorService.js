/* ═══════════════════════════════════════════════════════════════
   PITCH GENERATOR SERVICE
   AI-powered generation of sales pitches and cold emails
   Uses the existing AI proxy (adesso AI Hub)
   ═══════════════════════════════════════════════════════════════ */

import { callAI } from './aiService';
import { supabase } from './supabase';

/**
 * Generate a sales pitch for a use case
 */
export async function generateSalesPitch(useCase, customerProfile, language = 'de') {
  const prompt = language === 'de'
    ? `Du bist ein Top-Vertriebler bei adesso mit Expertise in SAP AI Lösungen. Erstelle einen überzeugenden Sales Pitch.

USE CASE:
- Name: ${useCase.name}
- Produkt: ${useCase.product}
- Kategorie: ${useCase.product_category}
- Typ: ${useCase.ai_type}
- Lizenz: ${useCase.commercial_type || 'Standard'}
- Verfügbarkeit: ${useCase.availability}
- Beschreibung: ${useCase.description || 'Keine Beschreibung verfügbar'}

KUNDE:
- Unternehmen: ${customerProfile?.companyName || 'Zielunternehmen'}
- Branche: ${customerProfile?.industryLabel || 'Nicht spezifiziert'}
- SAP-Systeme: ${customerProfile?.sapSystems?.join(', ') || 'Nicht bekannt'}
- Herausforderungen: ${customerProfile?.challenges?.join(', ') || 'Nicht spezifiziert'}

AUFGABE:
Erstelle einen strukturierten Sales Pitch mit folgenden Elementen:

1. **Aufmerksamkeitsstarke Überschrift** (max. 10 Wörter)
2. **Pain Point** - Welches Problem hat der Kunde? (2-3 Sätze)
3. **Lösung** - Wie löst der Use Case das Problem? (3-4 Sätze)
4. **Business Value** - Konkreter Nutzen mit Zahlen wenn möglich (2-3 Punkte)
5. **Differenzierung** - Warum adesso + SAP? (2 Sätze)
6. **Call-to-Action** - Nächster Schritt (1 Satz)

Formatiere den Output in Markdown.`
    : `You are a top sales professional at adesso with expertise in SAP AI solutions. Create a compelling sales pitch.

USE CASE:
- Name: ${useCase.name}
- Product: ${useCase.product}
- Category: ${useCase.product_category}
- Type: ${useCase.ai_type}
- License: ${useCase.commercial_type || 'Standard'}
- Availability: ${useCase.availability}
- Description: ${useCase.description || 'No description available'}

CUSTOMER:
- Company: ${customerProfile?.companyName || 'Target Company'}
- Industry: ${customerProfile?.industryLabel || 'Not specified'}
- SAP Systems: ${customerProfile?.sapSystems?.join(', ') || 'Unknown'}
- Challenges: ${customerProfile?.challenges?.join(', ') || 'Not specified'}

TASK:
Create a structured sales pitch with the following elements:

1. **Attention-grabbing headline** (max. 10 words)
2. **Pain Point** - What problem does the customer have? (2-3 sentences)
3. **Solution** - How does the use case solve the problem? (3-4 sentences)
4. **Business Value** - Concrete benefits with numbers if possible (2-3 points)
5. **Differentiation** - Why adesso + SAP? (2 sentences)
6. **Call-to-Action** - Next step (1 sentence)

Format the output in Markdown.`;

  try {
    const response = await callAI([
      {
        role: 'system',
        content: language === 'de' 
          ? 'Du bist ein erfahrener SAP-Vertriebsberater bei adesso. Dein Ziel ist es, überzeugende und professionelle Verkaufspräsentationen zu erstellen.'
          : 'You are an experienced SAP sales consultant at adesso. Your goal is to create compelling and professional sales presentations.',
      },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.7,
      max_tokens: 1500,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    // Cache the pitch if we have a use case ID
    if (useCase.id) {
      const cacheField = language === 'de' ? 'cached_pitch_de' : 'cached_pitch_en';
      await supabase
        .from('sap_ai_use_cases')
        .update({ [cacheField]: response.content })
        .eq('id', useCase.id);
    }

    return {
      success: true,
      pitch: response.content,
      language,
    };
  } catch (err) {
    console.error('Error generating sales pitch:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a cold email for a use case
 */
export async function generateColdEmail(useCase, customerProfile, language = 'de') {
  const prompt = language === 'de'
    ? `Du bist ein erfahrener B2B-Vertriebsexperte bei adesso. Erstelle eine professionelle Cold Email.

USE CASE:
- Name: ${useCase.name}
- Produkt: ${useCase.product}
- Beschreibung: ${useCase.description || 'Keine Beschreibung'}

EMPFÄNGER:
- Unternehmen: ${customerProfile?.companyName || '[Firmenname]'}
- Branche: ${customerProfile?.industryLabel || 'Nicht spezifiziert'}
- Position: IT-Leiter / CIO / CDO (typischer Entscheider)

AUFGABE:
Erstelle eine Cold Email mit folgender Struktur:

**Betreff:** (max. 50 Zeichen, neugierig machend)

**Email-Text:**
1. Persönliche Anrede
2. Hook - Relevante Branchenherausforderung (1 Satz)
3. Wertversprechen - Was bieten wir? (2 Sätze)
4. Social Proof - Kurzer Hinweis auf Expertise (1 Satz)
5. Call-to-Action - Konkreter nächster Schritt (1 Satz)
6. Professionelle Signatur

Die Email sollte:
- Maximal 150 Wörter lang sein
- Professionell aber nicht steif klingen
- Einen klaren Mehrwert kommunizieren
- Zum Handeln auffordern`
    : `You are an experienced B2B sales expert at adesso. Create a professional cold email.

USE CASE:
- Name: ${useCase.name}
- Product: ${useCase.product}
- Description: ${useCase.description || 'No description'}

RECIPIENT:
- Company: ${customerProfile?.companyName || '[Company Name]'}
- Industry: ${customerProfile?.industryLabel || 'Not specified'}
- Position: IT Director / CIO / CDO (typical decision maker)

TASK:
Create a cold email with the following structure:

**Subject:** (max. 50 characters, curiosity-inducing)

**Email body:**
1. Personal greeting
2. Hook - Relevant industry challenge (1 sentence)
3. Value proposition - What do we offer? (2 sentences)
4. Social proof - Brief mention of expertise (1 sentence)
5. Call-to-Action - Concrete next step (1 sentence)
6. Professional signature

The email should:
- Be maximum 150 words
- Sound professional but not stiff
- Communicate clear value
- Call for action`;

  try {
    const response = await callAI([
      {
        role: 'system',
        content: language === 'de'
          ? 'Du bist ein B2B-Vertriebsexperte. Schreibe prägnante, wirkungsvolle Emails.'
          : 'You are a B2B sales expert. Write concise, impactful emails.',
      },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.7,
      max_tokens: 800,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    // Cache the email if we have a use case ID
    if (useCase.id) {
      const cacheField = language === 'de' ? 'cached_email_de' : 'cached_email_en';
      await supabase
        .from('sap_ai_use_cases')
        .update({ [cacheField]: response.content })
        .eq('id', useCase.id);
    }

    return {
      success: true,
      email: response.content,
      language,
    };
  } catch (err) {
    console.error('Error generating cold email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate objection handling Q&A
 */
export async function generateObjectionHandling(useCase, language = 'de') {
  const prompt = language === 'de'
    ? `Du bist ein erfahrener SAP-Vertriebsberater. Erstelle eine Einwandbehandlung für den folgenden Use Case.

USE CASE:
- Name: ${useCase.name}
- Produkt: ${useCase.product}
- Typ: ${useCase.ai_type}
- Lizenz: ${useCase.commercial_type || 'Standard'}
- Verfügbarkeit: ${useCase.availability}
- Beschreibung: ${useCase.description || 'Keine Beschreibung'}

AUFGABE:
Erstelle 5 typische Kundeneinwände mit professionellen Antworten:

Format für jeden Einwand:
**Einwand:** [Typischer Kundeneinwand]
**Antwort:** [Professionelle, überzeugende Antwort in 2-3 Sätzen]

Typische Einwände könnten sein:
- Kosten/ROI
- Implementierungsaufwand
- Datenschutz/Sicherheit
- Reifegrad der Technologie
- Integration mit bestehenden Systemen`
    : `You are an experienced SAP sales consultant. Create objection handling for the following use case.

USE CASE:
- Name: ${useCase.name}
- Product: ${useCase.product}
- Type: ${useCase.ai_type}
- License: ${useCase.commercial_type || 'Standard'}
- Availability: ${useCase.availability}
- Description: ${useCase.description || 'No description'}

TASK:
Create 5 typical customer objections with professional responses:

Format for each objection:
**Objection:** [Typical customer objection]
**Response:** [Professional, convincing answer in 2-3 sentences]

Typical objections might include:
- Cost/ROI
- Implementation effort
- Data privacy/security
- Technology maturity
- Integration with existing systems`;

  try {
    const response = await callAI([
      { role: 'user', content: prompt },
    ], {
      temperature: 0.6,
      max_tokens: 1200,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      objectionHandling: response.content,
      language,
    };
  } catch (err) {
    console.error('Error generating objection handling:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate executive summary for a use case
 */
export async function generateExecutiveSummary(useCase, customerProfile, language = 'de') {
  const prompt = language === 'de'
    ? `Erstelle eine Executive Summary (max. 100 Wörter) für den SAP AI Use Case "${useCase.name}" für ein Unternehmen in der Branche "${customerProfile?.industryLabel || 'Allgemein'}".

Fokussiere auf:
1. Geschäftsproblem das gelöst wird
2. Kernfunktionalität der Lösung
3. Erwarteter Business Value

Schreibe prägnant und für C-Level verständlich.`
    : `Create an Executive Summary (max. 100 words) for the SAP AI use case "${useCase.name}" for a company in the "${customerProfile?.industryLabel || 'General'}" industry.

Focus on:
1. Business problem being solved
2. Core functionality of the solution
3. Expected business value

Write concisely and understandable for C-Level.`;

  try {
    const response = await callAI([
      { role: 'user', content: prompt },
    ], {
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.success ? response.content : null;
  } catch (err) {
    console.error('Error generating executive summary:', err);
    return null;
  }
}

/**
 * Generate implementation roadmap
 */
export async function generateImplementationRoadmap(useCase, language = 'de') {
  const prompt = language === 'de'
    ? `Erstelle einen groben Implementierungs-Fahrplan für den SAP AI Use Case "${useCase.name}" (${useCase.product}).

Format:
**Phase 1: Vorbereitung** (Woche 1-2)
- [Aktivitäten]

**Phase 2: Implementierung** (Woche 3-6)
- [Aktivitäten]

**Phase 3: Go-Live & Optimierung** (Woche 7-8)
- [Aktivitäten]

Halte es realistisch und praxisnah.`
    : `Create a rough implementation roadmap for the SAP AI use case "${useCase.name}" (${useCase.product}).

Format:
**Phase 1: Preparation** (Week 1-2)
- [Activities]

**Phase 2: Implementation** (Week 3-6)
- [Activities]

**Phase 3: Go-Live & Optimization** (Week 7-8)
- [Activities]

Keep it realistic and practical.`;

  try {
    const response = await callAI([
      { role: 'user', content: prompt },
    ], {
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.success ? response.content : null;
  } catch (err) {
    console.error('Error generating roadmap:', err);
    return null;
  }
}

/**
 * Get cached pitch or generate new one
 */
export async function getPitchWithCache(useCase, customerProfile, language = 'de') {
  // Check cache first
  const cacheField = language === 'de' ? 'cached_pitch_de' : 'cached_pitch_en';
  
  if (useCase[cacheField]) {
    return {
      success: true,
      pitch: useCase[cacheField],
      language,
      fromCache: true,
    };
  }
  
  // Generate new pitch
  return generateSalesPitch(useCase, customerProfile, language);
}

/**
 * Get cached email or generate new one
 */
export async function getEmailWithCache(useCase, customerProfile, language = 'de') {
  // Check cache first
  const cacheField = language === 'de' ? 'cached_email_de' : 'cached_email_en';
  
  if (useCase[cacheField]) {
    return {
      success: true,
      email: useCase[cacheField],
      language,
      fromCache: true,
    };
  }
  
  // Generate new email
  return generateColdEmail(useCase, customerProfile, language);
}

/**
 * Clear cached content for a use case
 */
export async function clearCache(useCaseId) {
  try {
    await supabase
      .from('sap_ai_use_cases')
      .update({
        cached_pitch_de: null,
        cached_pitch_en: null,
        cached_email_de: null,
        cached_email_en: null,
      })
      .eq('id', useCaseId);
    
    return { success: true };
  } catch (err) {
    console.error('Error clearing cache:', err);
    return { success: false, error: err.message };
  }
}