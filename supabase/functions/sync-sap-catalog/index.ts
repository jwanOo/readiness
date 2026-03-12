/* ═══════════════════════════════════════════════════════════════
   SYNC SAP CATALOG - Supabase Edge Function
   Fetches SAP AI use cases from Discovery Center
   Scheduled to run daily at 15:00 CET
   
   Can also be triggered manually via POST request
   ═══════════════════════════════════════════════════════════════ */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// SAP Discovery Center API endpoint
const SAP_DISCOVERY_CENTER_URL = 'https://discovery-center.cloud.sap/serviceCatalog/ai-catalog'

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface SAPAIUseCase {
  identifier: string
  name: string
  ai_type: string
  commercial_type: string
  product: string
  description: string
  product_category: string
  package: string
  quick_filters: string
  availability: string
  detail_page: string
}

interface SyncResult {
  success: boolean
  total_fetched: number
  new_records: number
  updated_records: number
  unchanged_records: number
  error?: string
}

/**
 * Parse CSV data from SAP Discovery Center
 * The CSV uses semicolon as delimiter
 */
function parseCSV(csvText: string): SAPAIUseCase[] {
  const lines = csvText.split('\n')
  if (lines.length < 2) return []
  
  // Parse header
  const header = lines[0].split(';').map(h => h.trim().replace(/"/g, ''))
  
  const useCases: SAPAIUseCase[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Parse CSV line (handling quoted values with semicolons)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    // Map to object
    const useCase: Record<string, string> = {}
    header.forEach((h, idx) => {
      useCase[h] = values[idx] || ''
    })
    
    // Convert to our schema
    useCases.push({
      identifier: useCase['Identifier'] || '',
      name: useCase['Name'] || '',
      ai_type: useCase['AI Type'] || '',
      commercial_type: useCase['Commercial Type'] || '',
      product: useCase['Product'] || '',
      description: useCase['Description'] || '',
      product_category: useCase['Product Category'] || '',
      package: useCase['Package'] || '',
      quick_filters: useCase['Quick Filters'] || '',
      availability: useCase['Availability'] || '',
      detail_page: useCase['Detail Page'] || '',
    })
  }
  
  return useCases.filter(uc => uc.identifier && uc.name)
}

/**
 * Fetch SAP AI catalog from Discovery Center
 * Uses web scraping approach since there's no official API
 */
async function fetchSAPAICatalog(): Promise<SAPAIUseCase[]> {
  try {
    // Try to fetch the catalog page
    const response = await fetch(SAP_DISCOVERY_CENTER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; adesso-ai-readiness-check/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch SAP catalog: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Parse the HTML to extract use cases
    // This is a simplified approach - in production, you might need Playwright
    const useCases = parseHTMLCatalog(html)
    
    return useCases
  } catch (error) {
    console.error('Error fetching SAP catalog:', error)
    throw error
  }
}

/**
 * Parse HTML catalog page to extract use cases
 * This is a fallback when CSV export is not available
 */
function parseHTMLCatalog(html: string): SAPAIUseCase[] {
  // This is a simplified parser - in production, use a proper HTML parser
  const useCases: SAPAIUseCase[] = []
  
  // Look for JSON data embedded in the page
  const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      // Extract use cases from the state
      if (data.catalog?.items) {
        for (const item of data.catalog.items) {
          useCases.push({
            identifier: item.id || item.identifier || '',
            name: item.name || item.title || '',
            ai_type: item.aiType || item.type || '',
            commercial_type: item.commercialType || '',
            product: item.product || '',
            description: item.description || item.shortDescription || '',
            product_category: item.productCategory || item.category || '',
            package: item.package || '',
            quick_filters: Array.isArray(item.quickFilters) ? item.quickFilters.join(',') : '',
            availability: item.availability || item.status || '',
            detail_page: item.detailPage || item.url || '',
          })
        }
      }
    } catch (e) {
      console.warn('Failed to parse embedded JSON:', e)
    }
  }
  
  return useCases
}

/**
 * Load use cases from local CSV file (fallback/initial data)
 * This uses the CSV data that was scraped by the Python tool
 */
async function loadFromLocalCSV(supabase: any): Promise<SAPAIUseCase[]> {
  // Check if we have existing data in the database
  const { data: existingData, error } = await supabase
    .from('sap_ai_use_cases')
    .select('identifier')
    .limit(1)
  
  if (!error && existingData && existingData.length > 0) {
    // We have data, fetch all
    const { data: allData } = await supabase
      .from('sap_ai_use_cases')
      .select('*')
    
    return allData || []
  }
  
  return []
}

/**
 * Sync use cases to database
 */
async function syncToDatabase(
  supabase: any,
  useCases: SAPAIUseCase[],
  syncLogId: string
): Promise<SyncResult> {
  let newRecords = 0
  let updatedRecords = 0
  let unchangedRecords = 0
  
  for (const useCase of useCases) {
    // Check if exists
    const { data: existing } = await supabase
      .from('sap_ai_use_cases')
      .select('id, name, description, availability')
      .eq('identifier', useCase.identifier)
      .single()
    
    if (existing) {
      // Check if changed
      const hasChanges = 
        existing.name !== useCase.name ||
        existing.description !== useCase.description ||
        existing.availability !== useCase.availability
      
      if (hasChanges) {
        // Update
        const { error } = await supabase
          .from('sap_ai_use_cases')
          .update({
            name: useCase.name,
            ai_type: useCase.ai_type,
            commercial_type: useCase.commercial_type,
            product: useCase.product,
            description: useCase.description,
            product_category: useCase.product_category,
            package: useCase.package,
            quick_filters: useCase.quick_filters,
            availability: useCase.availability,
            detail_page: useCase.detail_page,
            last_synced_at: new Date().toISOString(),
            status: 'UPDATED',
          })
          .eq('identifier', useCase.identifier)
        
        if (!error) updatedRecords++
      } else {
        // Just update sync timestamp
        await supabase
          .from('sap_ai_use_cases')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('identifier', useCase.identifier)
        
        unchangedRecords++
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('sap_ai_use_cases')
        .insert({
          identifier: useCase.identifier,
          name: useCase.name,
          ai_type: useCase.ai_type,
          commercial_type: useCase.commercial_type,
          product: useCase.product,
          description: useCase.description,
          product_category: useCase.product_category,
          package: useCase.package,
          quick_filters: useCase.quick_filters,
          availability: useCase.availability,
          detail_page: useCase.detail_page,
          last_synced_at: new Date().toISOString(),
          status: 'NEW',
        })
      
      if (!error) newRecords++
    }
  }
  
  return {
    success: true,
    total_fetched: useCases.length,
    new_records: newRecords,
    updated_records: updatedRecords,
    unchanged_records: unchangedRecords,
  }
}

/**
 * Import initial data from CSV content
 * This is used for the initial data load
 */
async function importFromCSVContent(
  supabase: any,
  csvContent: string,
  syncLogId: string
): Promise<SyncResult> {
  const useCases = parseCSV(csvContent)
  
  if (useCases.length === 0) {
    return {
      success: false,
      total_fetched: 0,
      new_records: 0,
      updated_records: 0,
      unchanged_records: 0,
      error: 'No valid use cases found in CSV',
    }
  }
  
  return await syncToDatabase(supabase, useCases, syncLogId)
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    let body: { trigger?: string; csvContent?: string } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    
    const triggeredBy = body.trigger || 'MANUAL'
    
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sap_ai_sync_log')
      .insert({
        triggered_by: triggeredBy,
        status: 'RUNNING',
      })
      .select()
      .single()
    
    if (logError) {
      console.error('Failed to create sync log:', logError)
    }
    
    const syncLogId = syncLog?.id || 'unknown'
    
    let result: SyncResult
    
    // If CSV content is provided, use it directly
    if (body.csvContent) {
      console.log('Importing from provided CSV content...')
      result = await importFromCSVContent(supabase, body.csvContent, syncLogId)
    } else {
      // Try to fetch from SAP Discovery Center
      console.log('Fetching from SAP Discovery Center...')
      try {
        const useCases = await fetchSAPAICatalog()
        
        if (useCases.length > 0) {
          result = await syncToDatabase(supabase, useCases, syncLogId)
        } else {
          // Fallback: check if we have local data
          console.log('No data from Discovery Center, checking local data...')
          result = {
            success: false,
            total_fetched: 0,
            new_records: 0,
            updated_records: 0,
            unchanged_records: 0,
            error: 'No data available from SAP Discovery Center. Please provide CSV content.',
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        result = {
          success: false,
          total_fetched: 0,
          new_records: 0,
          updated_records: 0,
          unchanged_records: 0,
          error: `Failed to fetch from SAP: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        }
      }
    }
    
    // Update sync log
    await supabase
      .from('sap_ai_sync_log')
      .update({
        sync_completed_at: new Date().toISOString(),
        status: result.success ? 'SUCCESS' : 'FAILED',
        total_fetched: result.total_fetched,
        new_records: result.new_records,
        updated_records: result.updated_records,
        unchanged_records: result.unchanged_records,
        error_message: result.error || null,
      })
      .eq('id', syncLogId)
    
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success 
          ? `Sync completed: ${result.new_records} new, ${result.updated_records} updated, ${result.unchanged_records} unchanged`
          : result.error,
        stats: {
          total_fetched: result.total_fetched,
          new_records: result.new_records,
          updated_records: result.updated_records,
          unchanged_records: result.unchanged_records,
        },
        sync_log_id: syncLogId,
      }),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Sync function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})