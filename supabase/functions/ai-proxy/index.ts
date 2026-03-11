/* ═══════════════════════════════════════════════════════════════
   AI PROXY - Supabase Edge Function
   Securely proxies requests to adesso AI Hub
   API key is stored in Supabase secrets, not exposed to frontend
   
   SECURITY FEATURES:
   - API key stored in Supabase secrets
   - Input validation and sanitization
   - Prompt injection detection
   - Rate limiting ready (can be added)
   - CORS protection
   ═══════════════════════════════════════════════════════════════ */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuration
const AI_HUB_BASE_URL = 'https://adesso-ai-hub.3asabc.de/v1'

// Validation limits
const MAX_MESSAGE_LENGTH = 50000  // Max total message content length
const MAX_SINGLE_MESSAGE = 10000  // Max single message content length
const MAX_MESSAGES = 50           // Max number of messages in conversation

// CORS configuration - allow requests from gh-pages and localhost
const ALLOWED_ORIGINS = [
  'https://jwanoo.github.io',
  'https://JwanOo.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]

// Prompt injection patterns to detect and log
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+instructions?:/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /```\s*(system|assistant|user)\s*/i,
  /\bDAN\b.*\bmode\b/i,
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction)/i,
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

/**
 * Sanitize text content - strip HTML tags and dangerous characters
 */
function sanitizeText(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized.trim()
}

/**
 * Escape user content for safe inclusion in prompts
 */
function escapeForPrompt(content: string): string {
  if (typeof content !== 'string') return ''
  
  let escaped = sanitizeText(content)
  
  // Escape characters that could be interpreted as prompt delimiters
  escaped = escaped
    .replace(/```/g, '` ` `')
    .replace(/\[INST\]/gi, '[I N S T]')
    .replace(/\[\/INST\]/gi, '[/ I N S T]')
    .replace(/<\|/g, '< |')
    .replace(/\|>/g, '| >')
    .replace(/system:/gi, 'system :')
    .replace(/assistant:/gi, 'assistant :')
    .replace(/user:/gi, 'user :')
  
  return escaped
}

/**
 * Check for potential prompt injection attempts
 */
function detectPromptInjection(content: string): { detected: boolean; patterns: string[] } {
  if (typeof content !== 'string') {
    return { detected: false, patterns: [] }
  }
  
  const detectedPatterns: string[] = []
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      detectedPatterns.push(pattern.source)
    }
  }
  
  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  }
}

/**
 * Validate and sanitize messages array
 */
function validateAndSanitizeMessages(messages: any[]): { 
  valid: boolean; 
  sanitized: any[]; 
  error?: string;
  warnings: string[];
} {
  const warnings: string[] = []
  
  if (!Array.isArray(messages)) {
    return { valid: false, sanitized: [], error: 'Messages must be an array', warnings }
  }
  
  if (messages.length === 0) {
    return { valid: false, sanitized: [], error: 'Messages array cannot be empty', warnings }
  }
  
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, sanitized: [], error: `Too many messages (max ${MAX_MESSAGES})`, warnings }
  }
  
  let totalLength = 0
  const sanitized: any[] = []
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    
    // Validate message structure
    if (!msg || typeof msg !== 'object') {
      return { valid: false, sanitized: [], error: `Invalid message at index ${i}`, warnings }
    }
    
    if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
      return { valid: false, sanitized: [], error: `Invalid role at index ${i}`, warnings }
    }
    
    if (typeof msg.content !== 'string') {
      return { valid: false, sanitized: [], error: `Invalid content at index ${i}`, warnings }
    }
    
    // Check single message length
    if (msg.content.length > MAX_SINGLE_MESSAGE) {
      return { valid: false, sanitized: [], error: `Message at index ${i} exceeds max length`, warnings }
    }
    
    totalLength += msg.content.length
    
    // Check total length
    if (totalLength > MAX_MESSAGE_LENGTH) {
      return { valid: false, sanitized: [], error: 'Total message content exceeds max length', warnings }
    }
    
    // Check for prompt injection in user messages
    if (msg.role === 'user') {
      const injectionCheck = detectPromptInjection(msg.content)
      if (injectionCheck.detected) {
        warnings.push(`Potential prompt injection detected in message ${i}`)
        console.warn('[SECURITY] Prompt injection detected:', {
          messageIndex: i,
          patterns: injectionCheck.patterns,
          contentPreview: msg.content.substring(0, 100),
        })
      }
    }
    
    // Sanitize user messages (system messages are trusted)
    const sanitizedContent = msg.role === 'user' 
      ? escapeForPrompt(msg.content)
      : msg.content
    
    sanitized.push({
      role: msg.role,
      content: sanitizedContent,
    })
  }
  
  return { valid: true, sanitized, warnings }
}

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
    // Get API key from environment (stored in Supabase secrets)
    const apiKey = Deno.env.get('ADESSO_AI_HUB_API_KEY')
    
    if (!apiKey) {
      console.error('ADESSO_AI_HUB_API_KEY not configured in Supabase secrets')
      return new Response(
        JSON.stringify({ 
          error: 'AI service not configured',
          message: 'Please contact administrator to configure AI Hub API key'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    let body: any
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
    
    // Validate and sanitize messages
    const validation = validateAndSanitizeMessages(body.messages)
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Log warnings (but don't block the request)
    if (validation.warnings.length > 0) {
      console.warn('[SECURITY] Request warnings:', validation.warnings)
    }

    // Validate other parameters
    const maxTokens = typeof body.max_tokens === 'number' 
      ? Math.min(Math.max(body.max_tokens, 1), 4000) 
      : 2000
    
    const temperature = typeof body.temperature === 'number'
      ? Math.min(Math.max(body.temperature, 0), 2)
      : 0.7

    // Forward request to adesso AI Hub with sanitized messages
    const aiResponse = await fetch(`${AI_HUB_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || 'gpt-oss-120b-sovereign',
        messages: validation.sanitized,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    })

    // Handle AI Hub errors
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error(`AI Hub error: ${aiResponse.status} - ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          status: aiResponse.status,
          message: 'Failed to get response from AI service'
        }),
        { 
          status: aiResponse.status >= 500 ? 502 : aiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return successful response
    const data = await aiResponse.json()
    
    return new Response(
      JSON.stringify(data),
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