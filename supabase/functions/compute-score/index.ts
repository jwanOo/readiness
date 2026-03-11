/* ═══════════════════════════════════════════════════════════════
   COMPUTE-SCORE - Supabase Edge Function
   Server-side AI Readiness Score Computation
   
   SECURITY: This ensures score integrity by computing scores
   on the server, preventing client-side manipulation.
   
   Issue: F6 - Business Logic (Scoring) Entirely Client-Side
   ═══════════════════════════════════════════════════════════════ */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS configuration
const ALLOWED_ORIGINS = [
  'https://jwanoo.github.io',
  'https://JwanOo.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => 
    o.toLowerCase() === origin.toLowerCase()
  ) ? origin : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Access-Control-Max-Age': '86400',
  }
}

// ═══════════════════════════════════════════════════════════════
// SCORING ALGORITHM (v1)
// ═══════════════════════════════════════════════════════════════

const SCORE_VERSION = 'v1'

interface Answers {
  [key: string]: string
}

interface SectionScores {
  sap: number
  btp: number
  data: number
}

interface ScoreResult {
  overall: number
  sap: number
  btp: number
  data: number
  recommendations: Recommendation[]
  version: string
  computedAt: string
}

interface Recommendation {
  type: 'critical' | 'warning' | 'success'
  category: string
  message: string
  icon: string
}

/**
 * Get answer value for a section and question index
 */
function getAnswerValue(answers: Answers, sectionId: string, questionIndex: number): string {
  return (answers[`${sectionId}_${questionIndex}`] || '').toLowerCase().trim()
}

/**
 * Compute SAP System Score (0-100)
 */
function computeSapScore(answers: Answers): number {
  let score = 20 // Base score
  
  const ls = (qi: number) => getAnswerValue(answers, 'landscape', qi)
  
  // Check for S/4HANA, RISE, GROW
  if (/s\/4|s4|hana|rise|grow/i.test(ls(0) + ls(1) + ls(2))) score += 18
  
  // Check for Cloud deployment
  if (/cloud|rise|grow|public/i.test(ls(2))) score += 14
  
  // Check for HANA database
  if (/hana/i.test(ls(3))) score += 8
  
  // Check for migration plans
  if (/ja|yes|plan/i.test(ls(4))) score += 5
  
  // Check for Clean Core strategy
  if (/clean.?core|ja|yes/i.test(ls(5))) score += 15
  
  // Check for SAP AI usage
  if (/ja|yes|aktiv|nutz/i.test(getAnswerValue(answers, 'aiSap', 0))) score += 10
  if (/ja|yes|aktiv|plan/i.test(getAnswerValue(answers, 'aiSap', 1))) score += 10
  
  return Math.min(100, score)
}

/**
 * Compute BTP & AI Platform Score (0-100)
 */
function computeBtpScore(answers: Answers): number {
  let score = 10 // Base score
  
  const btp = (qi: number) => getAnswerValue(answers, 'btp', qi)
  
  // Check for BTP usage
  if (/ja|yes|nutz/i.test(btp(0))) score += 22
  
  // Check for AI Core, Integration, Datasphere
  if (/ai.?core|integration|datasphere|build/i.test(btp(1))) score += 15
  
  // Check for CPEA/BTPEA licensing
  if (/cpea|btpea|subscription/i.test(btp(2))) score += 10
  
  // Check for additional BTP services
  if (/ja|yes|nutz|plan/i.test(btp(3))) score += 10
  if (/ja|yes|nutz|plan/i.test(btp(4))) score += 10
  
  // Check for AI licensing
  if (/ja|yes|ai|joule|core/i.test(getAnswerValue(answers, 'licensing', 1))) score += 13
  if (/ja|yes/i.test(getAnswerValue(answers, 'licensing', 2))) score += 10
  
  return Math.min(100, score)
}

/**
 * Compute Data Maturity Score (0-100)
 */
function computeDataScore(answers: Answers): number {
  let score = 10 // Base score
  
  const data = (qi: number) => getAnswerValue(answers, 'data', qi)
  
  // Check data quality
  if (/sehr gut|excellent/i.test(data(0))) score += 30
  else if (/gut|good/i.test(data(0))) score += 20
  else if (/ausbau|moderate/i.test(data(0))) score += 10
  
  // Check for data governance
  if (/ja|yes|vorhanden/i.test(data(1))) score += 25
  
  // Check for DWH/Data platform
  if (/ja|yes|bw|datasphere|lake|warehouse|snowflake/i.test(data(2))) score += 20
  
  // Check for non-SAP AI experience
  if (getAnswerValue(answers, 'aiNonSap', 0).length > 5) score += 8
  if (getAnswerValue(answers, 'aiNonSap', 1).length > 5) score += 7
  
  return Math.min(100, score)
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(sap: number, btp: number, data: number): Recommendation[] {
  const recommendations: Recommendation[] = []

  // SAP recommendations
  if (sap < 33) {
    recommendations.push({
      type: 'critical',
      category: 'SAP System',
      message: 'Migration auf S/4HANA und Clean-Core-Strategie empfohlen',
      icon: '⚠️'
    })
  } else if (sap < 66) {
    recommendations.push({
      type: 'warning',
      category: 'SAP System',
      message: 'Joule aktivieren und Clean-Core-Strategie vorantreiben',
      icon: '💡'
    })
  } else {
    recommendations.push({
      type: 'success',
      category: 'SAP System',
      message: 'SAP-System ist AI-ready',
      icon: '✅'
    })
  }

  // BTP recommendations
  if (btp < 33) {
    recommendations.push({
      type: 'critical',
      category: 'BTP & AI Platform',
      message: 'SAP BTP mit AI Core und CPEA/BTPEA-Lizenzierung erforderlich',
      icon: '⚠️'
    })
  } else if (btp < 66) {
    recommendations.push({
      type: 'warning',
      category: 'BTP & AI Platform',
      message: 'SAP AI Core und SAP Business Data Cloud evaluieren',
      icon: '💡'
    })
  } else {
    recommendations.push({
      type: 'success',
      category: 'BTP & AI Platform',
      message: 'BTP & AI Platform sind einsatzbereit',
      icon: '✅'
    })
  }

  // Data recommendations
  if (data < 33) {
    recommendations.push({
      type: 'critical',
      category: 'Datenreife',
      message: 'Datenstrategie, Data Governance und zentrales DWH aufbauen',
      icon: '⚠️'
    })
  } else if (data < 66) {
    recommendations.push({
      type: 'warning',
      category: 'Datenreife',
      message: 'Data Governance stärken und SAP Datasphere einführen',
      icon: '💡'
    })
  } else {
    recommendations.push({
      type: 'success',
      category: 'Datenreife',
      message: 'Datenreife unterstützt KI-Initiativen',
      icon: '✅'
    })
  }

  return recommendations
}

/**
 * Compute all scores from answers
 */
function computeScores(answers: Answers): ScoreResult {
  const sap = computeSapScore(answers)
  const btp = computeBtpScore(answers)
  const data = computeDataScore(answers)
  const overall = Math.round((sap + btp + data) / 3)
  const recommendations = generateRecommendations(sap, btp, data)
  
  return {
    overall,
    sap,
    btp,
    data,
    recommendations,
    version: SCORE_VERSION,
    computedAt: new Date().toISOString()
  }
}

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    let body: { assessment_id: string }
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { assessment_id } = body

    if (!assessment_id) {
      return new Response(
        JSON.stringify({ error: 'assessment_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assessment_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid assessment_id format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch all answers for this assessment
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('section_id, question_index, answer')
      .eq('assessment_id', assessment_id)

    if (answersError) {
      console.error('Error fetching answers:', answersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch answers', details: answersError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Convert answers array to object format
    const answers: Answers = {}
    for (const row of answersData || []) {
      answers[`${row.section_id}_${row.question_index}`] = row.answer || ''
    }

    // Compute scores
    const scores = computeScores(answers)

    // Store computed scores in the assessment
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        computed_score: scores.overall,
        section_scores: {
          sap: scores.sap,
          btp: scores.btp,
          data: scores.data
        },
        score_computed_at: scores.computedAt,
        score_version: scores.version
      })
      .eq('id', assessment_id)

    if (updateError) {
      console.error('Error updating assessment:', updateError)
      // Don't fail the request, just log the error
      // The scores are still computed and returned
    }

    // Return computed scores
    return new Response(
      JSON.stringify({
        success: true,
        assessment_id,
        scores: {
          overall: scores.overall,
          sap: scores.sap,
          btp: scores.btp,
          data: scores.data
        },
        recommendations: scores.recommendations,
        version: scores.version,
        computed_at: scores.computedAt,
        stored: !updateError
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})