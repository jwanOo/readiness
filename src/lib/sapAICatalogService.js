/* ═══════════════════════════════════════════════════════════════
   SAP AI CATALOG SERVICE
   Manages SAP AI use cases from Discovery Center
   Data is fetched daily at 15:00 CET from:
   https://discovery-center.cloud.sap/ai-catalog/
   ═══════════════════════════════════════════════════════════════ */

import { supabase } from './supabase';

/**
 * CSV Data path - this file is updated daily by the Python downloader
 * The file is served from the public folder
 * Uses import.meta.env.BASE_URL to work with GitHub Pages deployment
 */
const CSV_FILE_PATH = `${import.meta.env.BASE_URL || '/'}sap_ai_data.csv`;

/**
 * Industry to SAP Product Category mapping
 * Maps AI Readiness Check industries to SAP Discovery Center categories
 */
export const INDUSTRY_CATEGORY_MAP = {
  insurance: ['Financial Management', 'Customer Relationship Management'],
  banking: ['Financial Management', 'Cloud ERP applications'],
  healthcare: ['Human Capital Management', 'Supply Chain Management', 'Product Lifecycle Management'],
  automotive: ['Supply Chain Management', 'Product Lifecycle Management', 'Cloud ERP applications'],
  manufacturing: ['Supply Chain Management', 'Technology Platform', 'Cloud ERP applications'],
  retail: ['Customer Relationship Management', 'Supply Chain Management'],
  energy: ['Supply Chain Management', 'Technology Platform', 'Cloud ERP applications'],
  publicSector: ['Cloud ERP applications', 'Financial Management', 'Technology Platform'],
  lifeSciences: ['Product Lifecycle Management', 'Supply Chain Management', 'Technology Platform'],
  lottery: ['Technology Platform', 'Customer Relationship Management'],
  transport: ['Supply Chain Management', 'Technology Platform'],
  media: ['Customer Relationship Management', 'Technology Platform'],
  defense: ['Cloud ERP applications', 'Supply Chain Management'],
  foodBeverage: ['Supply Chain Management', 'Product Lifecycle Management'],
  construction: ['Cloud ERP applications', 'Technology Platform'],
  tradeFairsSports: ['Customer Relationship Management', 'Technology Platform'],
  telecom: ['Technology Platform', 'Customer Relationship Management'],
  professionalServices: ['Cloud ERP applications', 'Human Capital Management', 'Technology Platform'],
  chemical: ['Supply Chain Management', 'Product Lifecycle Management', 'Cloud ERP applications'],
};

/**
 * All available product categories from SAP
 */
export const PRODUCT_CATEGORIES = [
  'Financial Management',
  'Customer Relationship Management',
  'Supply Chain Management',
  'Human Capital Management',
  'Technology Platform',
  'Cloud ERP applications',
  'Product Lifecycle Management',
  'Spend Management',
  'Business Transformation Management',
  'Sustainability Management',
  'Supplier Management',
];

/**
 * AI Types
 */
export const AI_TYPES = ['AI Feature', 'AI Agent'];

/**
 * Commercial Types
 */
export const COMMERCIAL_TYPES = ['Base', 'Premium', ''];

/**
 * Availability statuses
 */
export const AVAILABILITY_STATUSES = [
  'Generally Available',
  'Beta',
  'Early Adopter Care (EAC)',
];

/**
 * Parse CSV content into array of use case objects
 * CSV format: Name,AI Type,Commercial Type,Product,Description,Product Category,Package,Quick Filters,Availability,Identifier,Detail Page
 */
function parseCSV(csvContent) {
  // Remove BOM if present
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  
  // Parse header - CSV uses comma as delimiter
  const headers = parseCSVLine(lines[0], ',');
  console.log('CSV Headers:', headers);
  
  const useCases = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quoted values with commas
    const values = parseCSVLine(line, ',');
    
    if (values.length < 5) continue; // Need at least name, type, etc.
    
    // Column mapping based on header:
    // 0: Name, 1: AI Type, 2: Commercial Type, 3: Product, 4: Description
    // 5: Product Category, 6: Package, 7: Quick Filters, 8: Availability, 9: Identifier, 10: Detail Page
    const useCase = {
      id: values[9] || `uc-${i}`, // Identifier column
      identifier: values[9] || '',
      name: values[0] || '',
      ai_type: values[1] || '',
      commercial_type: values[2] || '',
      product: values[3] || '',
      description: values[4] || '',
      product_category: values[5] || '',
      package: values[6] || '',
      quick_filters: values[7] || '',
      availability: values[8] || '',
      url: values[10] || '',
    };
    
    // Only add if has a name
    if (useCase.name) {
      useCases.push(useCase);
    }
  }
  
  console.log(`Parsed ${useCases.length} use cases from CSV`);
  return useCases;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line, delimiter = ';') {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last value
  values.push(current.trim());
  
  return values;
}

// Cache for CSV data
let cachedUseCases = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load use cases from the local CSV file
 * This file is updated daily at 15:00 by the Python downloader
 */
async function loadFromCSV() {
  try {
    // Check cache
    if (cachedUseCases && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return cachedUseCases;
    }
    
    // Try to fetch the CSV file
    const response = await fetch(CSV_FILE_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }
    
    const csvContent = await response.text();
    cachedUseCases = parseCSV(csvContent);
    cacheTimestamp = Date.now();
    
    console.log(`Loaded ${cachedUseCases.length} SAP AI use cases from CSV`);
    return cachedUseCases;
  } catch (err) {
    console.warn('Could not load CSV file, trying database:', err.message);
    return null;
  }
}

/**
 * Fetch all SAP AI use cases with optional filters
 * Priority: 1. Database, 2. Local CSV file
 */
export async function fetchUseCases(filters = {}) {
  try {
    // First try database
    let query = supabase
      .from('sap_ai_use_cases')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (filters.productCategory) {
      query = query.eq('product_category', filters.productCategory);
    }
    
    if (filters.productCategories && filters.productCategories.length > 0) {
      query = query.in('product_category', filters.productCategories);
    }

    if (filters.aiType) {
      query = query.eq('ai_type', filters.aiType);
    }

    if (filters.commercialType !== undefined && filters.commercialType !== '') {
      query = query.eq('commercial_type', filters.commercialType);
    }

    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Database not available, loading from CSV:', error.message);
      return loadAndFilterCSV(filters);
    }

    // If no data from database, try CSV
    if (!data || data.length === 0) {
      console.info('No data in database, loading from CSV');
      return loadAndFilterCSV(filters);
    }

    return data;
  } catch (err) {
    console.warn('Error in fetchUseCases, loading from CSV:', err.message);
    return loadAndFilterCSV(filters);
  }
}

/**
 * Load from CSV and apply filters
 */
async function loadAndFilterCSV(filters = {}) {
  const useCases = await loadFromCSV();
  if (!useCases) return [];
  
  let data = [...useCases];
  
  if (filters.productCategory) {
    data = data.filter(uc => uc.product_category === filters.productCategory);
  }
  
  if (filters.productCategories && filters.productCategories.length > 0) {
    data = data.filter(uc => filters.productCategories.includes(uc.product_category));
  }
  
  if (filters.aiType) {
    data = data.filter(uc => uc.ai_type === filters.aiType);
  }
  
  if (filters.commercialType !== undefined && filters.commercialType !== '') {
    data = data.filter(uc => uc.commercial_type === filters.commercialType);
  }
  
  if (filters.availability) {
    data = data.filter(uc => uc.availability === filters.availability);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    data = data.filter(uc => 
      uc.name?.toLowerCase().includes(search) ||
      uc.description?.toLowerCase().includes(search) ||
      uc.product?.toLowerCase().includes(search)
    );
  }
  
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch a single use case by ID
 */
export async function fetchUseCaseById(id) {
  try {
    const { data, error } = await supabase
      .from('sap_ai_use_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Try from CSV
      const useCases = await loadFromCSV();
      return useCases?.find(uc => uc.id === id || uc.identifier === id) || null;
    }

    return data;
  } catch (err) {
    console.error('Error in fetchUseCaseById:', err);
    return null;
  }
}

/**
 * Fetch use cases by industry
 * Maps industry to relevant product categories
 */
export async function fetchUseCasesByIndustry(industryKey) {
  const categories = INDUSTRY_CATEGORY_MAP[industryKey];
  
  if (!categories || categories.length === 0) {
    return fetchUseCases();
  }

  return fetchUseCases({ productCategories: categories });
}

/**
 * Search use cases with full-text search
 */
export async function searchUseCases(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  return fetchUseCases({ search: query });
}

/**
 * Get use case statistics
 */
export async function getUseCaseStats() {
  try {
    // Try database first
    const { data, error } = await supabase
      .from('sap_ai_use_cases')
      .select('ai_type, commercial_type, availability, product_category');

    let sourceData = data;
    
    // If database fails, use CSV
    if (error || !data || data.length === 0) {
      sourceData = await loadFromCSV();
    }
    
    if (!sourceData || sourceData.length === 0) {
      return null;
    }

    const stats = {
      total: sourceData.length,
      byAiType: {},
      byCommercialType: {},
      byAvailability: {},
      byCategory: {},
    };

    sourceData.forEach(uc => {
      // By AI Type
      stats.byAiType[uc.ai_type || 'Unknown'] = (stats.byAiType[uc.ai_type || 'Unknown'] || 0) + 1;
      
      // By Commercial Type
      const commType = uc.commercial_type || 'Not specified';
      stats.byCommercialType[commType] = (stats.byCommercialType[commType] || 0) + 1;
      
      // By Availability
      stats.byAvailability[uc.availability || 'Unknown'] = (stats.byAvailability[uc.availability || 'Unknown'] || 0) + 1;
      
      // By Category
      stats.byCategory[uc.product_category || 'Unknown'] = (stats.byCategory[uc.product_category || 'Unknown'] || 0) + 1;
    });

    return stats;
  } catch (err) {
    console.error('Error in getUseCaseStats:', err);
    return null;
  }
}

/**
 * Get latest sync status
 */
export async function getLatestSyncStatus() {
  try {
    const { data, error } = await supabase
      .from('sap_ai_sync_log')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getLatestSyncStatus:', err);
    return null;
  }
}

/**
 * Sync API server URL (local development)
 * In dev mode, this points to the Vite dev server itself (with sync plugin)
 * In production, this falls back to GitHub fetch
 */
const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || '';

/**
 * GitHub repository info for fetching latest CSV
 */
const GITHUB_REPO_OWNER = import.meta.env.VITE_GITHUB_REPO_OWNER || 'jwanOo';
const GITHUB_REPO_NAME = import.meta.env.VITE_GITHUB_REPO_NAME || 'ai-readiness-check';
const GITHUB_CSV_PATH = 'public/sap_ai_data.csv';
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${GITHUB_CSV_PATH}`;

/**
 * Fetch fresh data directly from GitHub repository
 * This is a fallback when the local sync server is not running
 */
async function fetchFromGitHub() {
  try {
    console.log('Fetching fresh data from GitHub:', GITHUB_RAW_URL);
    
    // Add cache-busting parameter to get fresh data
    const url = `${GITHUB_RAW_URL}?t=${Date.now()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }
    
    const csvContent = await response.text();
    const useCases = parseCSV(csvContent);
    
    // Update cache with fresh data
    cachedUseCases = useCases;
    cacheTimestamp = Date.now();
    
    console.log(`Fetched ${useCases.length} use cases from GitHub`);
    
    return {
      success: true,
      rowCount: useCases.length,
      source: 'github',
    };
  } catch (err) {
    console.error('Error fetching from GitHub:', err);
    return {
      success: false,
      error: err.message,
      source: 'github',
    };
  }
}

/**
 * Trigger GitHub Actions workflow to sync data
 * Requires VITE_GITHUB_TOKEN environment variable
 */
async function triggerGitHubWorkflow() {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  
  if (!token) {
    return {
      success: false,
      error: 'GitHub token not configured',
      status: 'NO_TOKEN',
    };
  }
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/sync-sap-catalog.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
        }),
      }
    );
    
    if (response.status === 204) {
      return {
        success: true,
        status: 'WORKFLOW_TRIGGERED',
        message: 'GitHub Actions workflow triggered. Data will be updated in a few minutes.',
      };
    }
    
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.message || `HTTP ${response.status}`,
      status: 'WORKFLOW_ERROR',
    };
  } catch (err) {
    console.error('Error triggering GitHub workflow:', err);
    return {
      success: false,
      error: err.message,
      status: 'WORKFLOW_ERROR',
    };
  }
}

/**
 * Trigger manual sync - tries multiple methods:
 * 1. Local API server (for development with Playwright)
 * 2. Fetch fresh data from GitHub (fallback for production)
 * 3. Trigger GitHub Actions workflow (if token configured)
 */
export async function triggerSync() {
  // First, try the local sync server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${SYNC_API_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      
      // Clear cache to force reload after sync completes
      cachedUseCases = null;
      cacheTimestamp = null;
      
      return result;
    }
    
    const errorData = await response.json().catch(() => ({}));
    return { 
      success: false, 
      error: errorData.error || `HTTP ${response.status}`,
      status: errorData.status || 'ERROR',
    };
  } catch (err) {
    console.log('Local sync server not available, trying fallback methods...');
    
    // Fallback 1: Fetch fresh data from GitHub
    const githubResult = await fetchFromGitHub();
    
    if (githubResult.success) {
      return {
        success: true,
        status: 'GITHUB_FETCH',
        rowCount: githubResult.rowCount,
        message: `Loaded ${githubResult.rowCount} use cases from GitHub repository`,
      };
    }
    
    // Fallback 2: Try to trigger GitHub Actions workflow
    const workflowResult = await triggerGitHubWorkflow();
    
    if (workflowResult.success) {
      return workflowResult;
    }
    
    // All methods failed
    return { 
      success: false, 
      error: 'Could not sync data. Try running: npm run dev:all',
      status: 'ALL_METHODS_FAILED',
    };
  }
}

/**
 * Refresh data from GitHub without triggering full sync
 * This just fetches the latest CSV from the repository
 */
export async function refreshFromGitHub() {
  return fetchFromGitHub();
}

/**
 * Get sync status from the API server
 */
export async function getSyncStatus() {
  try {
    const response = await fetch(`${SYNC_API_URL}/api/sync/status`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.warn('Could not get sync status:', err.message);
    return null;
  }
}

/**
 * Poll for sync completion
 * @param {Function} onProgress - Callback for progress updates
 * @param {number} maxWaitMs - Maximum time to wait (default 2 minutes)
 */
export async function waitForSyncCompletion(onProgress, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getSyncStatus();
    
    if (status) {
      if (onProgress) {
        onProgress(status);
      }
      
      // If not syncing anymore, return the result
      if (!status.syncing && status.lastSync) {
        return status.lastSync;
      }
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  return { success: false, error: 'Sync timeout' };
}

/**
 * Format use case for display
 */
export function formatUseCase(useCase) {
  return {
    ...useCase,
    displayName: useCase.name,
    typeIcon: useCase.ai_type === 'AI Agent' ? '🤖' : '✨',
    commercialIcon: useCase.commercial_type === 'Premium' ? '💎' : useCase.commercial_type === 'Base' ? '📦' : '❓',
    availabilityColor: getAvailabilityColor(useCase.availability),
  };
}

/**
 * Get color for availability status
 */
export function getAvailabilityColor(availability) {
  switch (availability) {
    case 'Generally Available':
      return '#27AE60';
    case 'Beta':
      return '#F39C12';
    case 'Early Adopter Care (EAC)':
      return '#3498DB';
    default:
      return '#7F8C8D';
  }
}

/**
 * Get icon for AI type
 */
export function getAITypeIcon(aiType) {
  return aiType === 'AI Agent' ? '🤖' : '✨';
}

/**
 * Get icon for commercial type
 */
export function getCommercialTypeIcon(commercialType) {
  switch (commercialType) {
    case 'Premium':
      return '💎';
    case 'Base':
      return '📦';
    default:
      return '❓';
  }
}

/**
 * Update use case evaluation (customer fit, notes, etc.)
 * This stores evaluation data in the database
 */
export async function updateUseCaseEvaluation(useCaseId, evaluation) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('Not authenticated, evaluation not saved');
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('sap_ai_use_case_evaluations')
      .upsert({
        use_case_id: useCaseId,
        user_id: session.user.id,
        customer_fit: evaluation.customerFit,
        notes: evaluation.notes,
        priority: evaluation.priority,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'use_case_id,user_id'
      });

    if (error) {
      console.warn('Could not save evaluation:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in updateUseCaseEvaluation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get use case evaluation for current user
 */
export async function getUseCaseEvaluation(useCaseId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }

    const { data, error } = await supabase
      .from('sap_ai_use_case_evaluations')
      .select('*')
      .eq('use_case_id', useCaseId)
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Could not load evaluation:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getUseCaseEvaluation:', err);
    return null;
  }
}
