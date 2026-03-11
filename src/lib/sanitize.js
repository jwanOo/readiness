/**
 * ═══════════════════════════════════════════════════════════════
 * SECURITY: Input Sanitization & Validation Utilities
 * ═══════════════════════════════════════════════════════════════
 * 
 * This module provides comprehensive input sanitization to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - AI Prompt Injection attacks
 * - SQL Injection (additional layer beyond Supabase's parameterized queries)
 * 
 * OWASP References:
 * - A03:2021 – Injection
 * - A07:2021 – Cross-Site Scripting (XSS)
 */

import DOMPurify from 'dompurify';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * DOMPurify configuration for strict sanitization
 * Only allows basic text formatting, no scripts or dangerous elements
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Maximum allowed lengths for different input types
 */
const MAX_LENGTHS = {
  answer: 10000,        // Max length for assessment answers
  customerName: 200,    // Max length for customer names
  chatMessage: 5000,    // Max length for chat messages
  searchQuery: 500,     // Max length for search queries
  default: 10000,       // Default max length
};

/**
 * Patterns that indicate potential prompt injection attempts
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /```\s*(system|assistant|user)\s*/i,
  /\bDAN\b.*\bmode\b/i,
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction)/i,
];

// ═══════════════════════════════════════════════════════════════
// XSS SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with strict configuration
 * 
 * @param {string} input - The input string to sanitize
 * @param {object} options - Optional DOMPurify configuration overrides
 * @returns {string} - Sanitized string safe for rendering
 */
export function sanitizeHtml(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }
  
  const config = { ...DOMPURIFY_CONFIG, ...options };
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitize plain text - strips ALL HTML tags
 * Use this for inputs that should never contain HTML
 * 
 * @param {string} input - The input string to sanitize
 * @returns {string} - Plain text with all HTML removed
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // First pass: DOMPurify with no allowed tags
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Second pass: decode HTML entities and trim
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  return textarea.value.trim();
}

/**
 * Sanitize user input for storage in database
 * Combines HTML sanitization with length validation
 * 
 * @param {string} input - The input string to sanitize
 * @param {string} type - The type of input (answer, customerName, etc.)
 * @returns {string} - Sanitized and validated string
 */
export function sanitizeForStorage(input, type = 'default') {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Sanitize HTML
  let sanitized = sanitizeText(input);
  
  // Enforce max length
  const maxLength = MAX_LENGTHS[type] || MAX_LENGTHS.default;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════
// AI PROMPT INJECTION PROTECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Escape user content for safe inclusion in AI prompts
 * Wraps content in delimiters and escapes special characters
 * 
 * @param {string} content - User-provided content to escape
 * @returns {string} - Escaped content safe for AI prompts
 */
export function escapeForPrompt(content) {
  if (typeof content !== 'string') {
    return '';
  }
  
  // Sanitize HTML first
  let escaped = sanitizeText(content);
  
  // Escape characters that could be interpreted as prompt delimiters
  escaped = escaped
    .replace(/```/g, '` ` `')  // Break code blocks
    .replace(/\[INST\]/gi, '[I N S T]')
    .replace(/\[\/INST\]/gi, '[/ I N S T]')
    .replace(/<\|/g, '< |')
    .replace(/\|>/g, '| >')
    .replace(/system:/gi, 'system :')
    .replace(/assistant:/gi, 'assistant :')
    .replace(/user:/gi, 'user :');
  
  return escaped;
}

/**
 * Wrap user content with clear delimiters for AI prompts
 * This helps the AI distinguish between instructions and user content
 * 
 * @param {string} content - User-provided content
 * @param {string} label - Label for the content (e.g., "User Answer")
 * @returns {string} - Delimited content
 */
export function wrapUserContent(content, label = 'User Input') {
  const escaped = escapeForPrompt(content);
  return `
<${label.toUpperCase().replace(/\s+/g, '_')}>
${escaped}
</${label.toUpperCase().replace(/\s+/g, '_')}>
`.trim();
}

/**
 * Check if content contains potential prompt injection patterns
 * 
 * @param {string} content - Content to check
 * @returns {object} - { isInjection: boolean, patterns: string[] }
 */
export function detectPromptInjection(content) {
  if (typeof content !== 'string') {
    return { isInjection: false, patterns: [] };
  }
  
  const detectedPatterns = [];
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      detectedPatterns.push(pattern.source);
    }
  }
  
  return {
    isInjection: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  };
}

/**
 * Sanitize and prepare user answers for AI context
 * Combines all protections: XSS, length, and prompt injection
 * 
 * @param {object} answers - Object with question keys and answer values
 * @returns {string} - Safe formatted string for AI context
 */
export function prepareAnswersForAI(answers) {
  if (!answers || typeof answers !== 'object') {
    return 'No answers provided.';
  }
  
  const safeAnswers = [];
  
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'string' && value.trim()) {
      const sanitized = escapeForPrompt(value);
      // Truncate very long answers for AI context
      const truncated = sanitized.length > 500 
        ? sanitized.substring(0, 500) + '...' 
        : sanitized;
      safeAnswers.push(`- ${key}: ${truncated}`);
    }
  }
  
  return safeAnswers.length > 0 
    ? safeAnswers.join('\n')
    : 'No answers provided.';
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Validate input length
 * 
 * @param {string} input - Input to validate
 * @param {string} type - Type of input for max length lookup
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateLength(input, type = 'default') {
  if (typeof input !== 'string') {
    return { valid: false, message: 'Input must be a string' };
  }
  
  const maxLength = MAX_LENGTHS[type] || MAX_LENGTHS.default;
  
  if (input.length > maxLength) {
    return { 
      valid: false, 
      message: `Input exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate and sanitize a complete answer object
 * 
 * @param {string} answer - The answer text
 * @returns {object} - { valid: boolean, sanitized: string, warnings: string[] }
 */
export function validateAnswer(answer) {
  const warnings = [];
  
  // Check type
  if (typeof answer !== 'string') {
    return { valid: false, sanitized: '', warnings: ['Answer must be a string'] };
  }
  
  // Check length
  const lengthCheck = validateLength(answer, 'answer');
  if (!lengthCheck.valid) {
    warnings.push(lengthCheck.message);
  }
  
  // Check for prompt injection
  const injectionCheck = detectPromptInjection(answer);
  if (injectionCheck.isInjection) {
    warnings.push('Potential prompt injection detected');
    // Log for security monitoring (in production, send to logging service)
    console.warn('[SECURITY] Potential prompt injection detected:', {
      patterns: injectionCheck.patterns,
      contentPreview: answer.substring(0, 100),
    });
  }
  
  // Sanitize
  const sanitized = sanitizeForStorage(answer, 'answer');
  
  return {
    valid: true,
    sanitized,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize content for PDF/Word export
 * Allows basic formatting but removes dangerous elements
 * 
 * @param {string} content - Content to sanitize for export
 * @returns {string} - Safe content for export
 */
export function sanitizeForExport(content) {
  if (typeof content !== 'string') {
    return '';
  }
  
  // Allow basic formatting tags for exports
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: [],
  });
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeForStorage,
  escapeForPrompt,
  wrapUserContent,
  detectPromptInjection,
  prepareAnswersForAI,
  validateLength,
  validateAnswer,
  sanitizeForExport,
  MAX_LENGTHS,
};