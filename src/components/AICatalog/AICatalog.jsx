/* ═══════════════════════════════════════════════════════════════
   AI CATALOG COMPONENT
   Browse and manage SAP AI use cases from Discovery Center
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  fetchUseCases,
  searchUseCases,
  getUseCaseStats,
  getLatestSyncStatus,
  triggerSync,
  getSyncStatus,
  waitForSyncCompletion,
  PRODUCT_CATEGORIES,
  AI_TYPES,
  COMMERCIAL_TYPES,
  AVAILABILITY_STATUSES,
  getAvailabilityColor,
  getAITypeIcon,
  getCommercialTypeIcon,
} from '../../lib/sapAICatalogService';
import UseCaseCard from './UseCaseCard';
import UseCaseDetail from './UseCaseDetail';
import './AICatalog.css';

export default function AICatalog() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  // State
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [syncServerOnline, setSyncServerOnline] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    productCategory: '',
    aiType: '',
    commercialType: '',
    availability: '',
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Load data on mount
  useEffect(() => {
    loadData();
    loadStats();
    loadSyncStatus();
  }, []);
  
  // Reload when filters change
  useEffect(() => {
    loadData();
  }, [filters]);
  
  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUseCases(filters);
      setUseCases(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadStats() {
    const statsData = await getUseCaseStats();
    setStats(statsData);
  }
  
  async function loadSyncStatus() {
    const status = await getLatestSyncStatus();
    setSyncStatus(status);

    // Also check if sync server is online
    const serverStatus = await getSyncStatus();
    setSyncServerOnline(serverStatus !== null);

    // If server has CSV info, use that for display
    if (serverStatus?.csvFile?.exists) {
      setSyncStatus(prev => ({
        ...prev,
        csvInfo: serverStatus.csvFile,
      }));
    }
  }

  // Check if running in production (GitHub Pages)
  const isProduction = import.meta.env.PROD;
  
  async function handleSync() {
    setSyncing(true);
    setSyncProgress(null);
    setError(null);
    
    try {
      // Trigger the sync
      setSyncProgress(language === 'de' ? 'Sync gestartet...' : 'Sync started...');
      const result = await triggerSync();
      
      // Handle different sync result types
      if (result.status === 'GITHUB_FETCH') {
        // Successfully fetched from GitHub
        setSyncProgress(language === 'de' 
          ? `✅ ${result.rowCount} Use Cases von GitHub geladen`
          : `✅ ${result.rowCount} use cases loaded from GitHub`);
        
        // Reload data
        await loadData();
        await loadStats();
        
        // Clear progress after a delay
        setTimeout(() => setSyncProgress(null), 3000);
        setSyncing(false);
        return;
      }
      
      if (result.status === 'WORKFLOW_TRIGGERED') {
        // GitHub Actions workflow was triggered
        setSyncProgress(language === 'de' 
          ? '🚀 GitHub Workflow gestartet. Daten werden in wenigen Minuten aktualisiert.'
          : '🚀 GitHub workflow triggered. Data will be updated in a few minutes.');
        
        // Clear progress after a longer delay
        setTimeout(() => setSyncProgress(null), 10000);
        setSyncing(false);
        return;
      }
      
      if (result.status === 'ALL_METHODS_FAILED') {
        setError(language === 'de' 
          ? 'Sync fehlgeschlagen. Starten Sie den Server mit: npm run dev:all'
          : 'Sync failed. Start the server with: npm run dev:all');
        setSyncing(false);
        return;
      }
      
      if (!result.success && result.status !== 'SYNCING') {
        setError(result.error || 'Sync failed');
        setSyncing(false);
        return;
      }
      
      // Local server sync - poll for completion
      setSyncProgress(language === 'de' 
        ? 'Lade Daten von SAP Discovery Center...' 
        : 'Downloading data from SAP Discovery Center...');
      
      const finalResult = await waitForSyncCompletion((status) => {
        if (status.syncing) {
          setSyncProgress(language === 'de' 
            ? 'Lade Daten von SAP Discovery Center...' 
            : 'Downloading data from SAP Discovery Center...');
        } else if (status.csvFile) {
          setSyncProgress(language === 'de'
            ? `${status.csvFile.rowCount} Use Cases geladen`
            : `${status.csvFile.rowCount} use cases loaded`);
        }
      });
      
      if (finalResult.success) {
        setSyncProgress(language === 'de' ? '✅ Sync erfolgreich!' : '✅ Sync successful!');
        // Reload data after successful sync
        await loadData();
        await loadStats();
        await loadSyncStatus();
        
        // Clear progress after a delay
        setTimeout(() => setSyncProgress(null), 3000);
      } else {
        setError(finalResult.error || 'Sync failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }
  
  // Filter use cases by search query
  const filteredUseCases = useMemo(() => {
    if (!searchQuery.trim()) return useCases;
    
    const query = searchQuery.toLowerCase();
    return useCases.filter(uc =>
      uc.name?.toLowerCase().includes(query) ||
      uc.description?.toLowerCase().includes(query) ||
      uc.product?.toLowerCase().includes(query) ||
      uc.identifier?.toLowerCase().includes(query)
    );
  }, [useCases, searchQuery]);
  
  // Clear all filters
  function clearFilters() {
    setFilters({
      productCategory: '',
      aiType: '',
      commercialType: '',
      availability: '',
    });
    setSearchQuery('');
  }
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(v => v !== '') || searchQuery !== '';
  
  return (
    <div className="ai-catalog">
      {/* Header */}
      <div className="ai-catalog-header">
        <div className="ai-catalog-title">
          <button 
            className="back-to-dashboard"
            onClick={() => navigate('/')}
          >
            ← {language === 'de' ? 'Zurück zum Dashboard' : 'Back to Dashboard'}
          </button>
          <h1>🤖 {language === 'de' ? 'SAP Agents Katalog' : 'SAP Agents Catalog'}</h1>
          <p className="ai-catalog-subtitle">
            {language === 'de' 
              ? 'Entdecken Sie SAP AI Use Cases aus dem Discovery Center'
              : 'Discover SAP AI use cases from the Discovery Center'}
          </p>
        </div>
        
        <div className="ai-catalog-actions">
          {/* Show sync button only in development OR if server is online */}
          {!isProduction && (
            <>
              <button
                className={`sync-button ${syncing ? 'syncing' : ''}`}
                onClick={handleSync}
                disabled={syncing}
                title={syncServerOnline === false
                  ? (language === 'de' ? 'Sync-Server offline' : 'Sync server offline')
                  : (language === 'de' ? 'Daten von SAP aktualisieren' : 'Update data from SAP')}
              >
                {syncing ? (
                  <>
                    <span className="sync-spinner">🔄</span>
                    {language === 'de' ? ' Synchronisiere...' : ' Syncing...'}
                  </>
                ) : (
                  <>🔄 {language === 'de' ? 'Sync von SAP' : 'Sync from SAP'}</>
                )}
              </button>

              {syncServerOnline === false && (
                <span className="sync-server-warning" title="npm run dev">
                  ⚠️ {language === 'de' ? 'Server offline' : 'Server offline'}
                </span>
              )}
            </>
          )}

          {/* Production: Show GitHub Actions sync info */}
          {isProduction && (
            <div className="production-sync-info">
              <span className="sync-info-badge">
                🤖 {language === 'de' ? 'Automatischer Sync' : 'Automatic Sync'}
              </span>
              <span className="sync-info-text">
                {language === 'de'
                  ? 'Daten werden täglich um 15:00 UTC aktualisiert'
                  : 'Data updated daily at 15:00 UTC'}
              </span>
              <a
                href="https://github.com/jwanOo/ai-readiness-check/actions/workflows/sync-sap-catalog.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="manual-sync-link"
                title={language === 'de' ? 'Manuellen Sync auslösen' : 'Trigger manual sync'}
              >
                {language === 'de' ? '▶ Jetzt synchronisieren' : '▶ Sync now'}
              </a>
            </div>
          )}

          {syncProgress && (
            <span className="sync-progress">
              {syncProgress}
            </span>
          )}

          {!syncProgress && syncStatus?.csvInfo && (
            <span className="sync-status">
              {language === 'de' ? 'CSV: ' : 'CSV: '}
              {syncStatus.csvInfo.rowCount} {language === 'de' ? 'Einträge' : 'entries'}
              {syncStatus.csvInfo.lastModified && (
                <> • {new Date(syncStatus.csvInfo.lastModified).toLocaleDateString(language)}</>
              )}
            </span>
          )}

          {!syncProgress && !syncStatus?.csvInfo && syncStatus?.sync_completed_at && (
            <span className="sync-status">
              {language === 'de' ? 'Letzter Sync: ' : 'Last sync: '}
              {new Date(syncStatus.sync_completed_at).toLocaleString(language)}
            </span>
          )}
        </div>
      </div>
      
      {/* Stats Bar */}
      {stats && (
        <div className="ai-catalog-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">{language === 'de' ? 'Use Cases' : 'Use Cases'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.byAiType['AI Feature'] || 0}</span>
            <span className="stat-label">✨ AI Features</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.byAiType['AI Agent'] || 0}</span>
            <span className="stat-label">🤖 AI Agents</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.byAvailability['Generally Available'] || 0}</span>
            <span className="stat-label">🟢 GA</span>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="ai-catalog-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={language === 'de' ? '🔍 Suchen...' : '🔍 Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filters.productCategory}
            onChange={(e) => setFilters({ ...filters, productCategory: e.target.value })}
          >
            <option value="">{language === 'de' ? 'Alle Kategorien' : 'All Categories'}</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={filters.aiType}
            onChange={(e) => setFilters({ ...filters, aiType: e.target.value })}
          >
            <option value="">{language === 'de' ? 'Alle Typen' : 'All Types'}</option>
            {AI_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filters.commercialType}
            onChange={(e) => setFilters({ ...filters, commercialType: e.target.value })}
          >
            <option value="">{language === 'de' ? 'Alle Lizenzen' : 'All Licenses'}</option>
            <option value="Base">Base (Included)</option>
            <option value="Premium">Premium</option>
          </select>
          
          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
          >
            <option value="">{language === 'de' ? 'Alle Status' : 'All Status'}</option>
            {AVAILABILITY_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-actions">
          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              ✕ {language === 'de' ? 'Filter zurücksetzen' : 'Clear filters'}
            </button>
          )}
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ▦
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="ai-catalog-error">
          ⚠️ {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="ai-catalog-loading">
          <div className="spinner"></div>
          <p>{language === 'de' ? 'Lade Use Cases...' : 'Loading use cases...'}</p>
        </div>
      )}
      
      {/* Results Count */}
      {!loading && (
        <div className="ai-catalog-results-count">
          {filteredUseCases.length} {language === 'de' ? 'Ergebnisse' : 'results'}
          {hasActiveFilters && ` (${language === 'de' ? 'gefiltert' : 'filtered'})`}
        </div>
      )}
      
      {/* Use Cases Grid/List */}
      {!loading && filteredUseCases.length > 0 && (
        <div className={`ai-catalog-grid ${viewMode}`}>
          {filteredUseCases.map(useCase => (
            <UseCaseCard
              key={useCase.id}
              useCase={useCase}
              onClick={() => setSelectedUseCase(useCase)}
              viewMode={viewMode}
              language={language}
            />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredUseCases.length === 0 && (
        <div className="ai-catalog-empty">
          <p>
            {language === 'de' 
              ? 'Keine Use Cases gefunden. Versuchen Sie andere Filter.'
              : 'No use cases found. Try different filters.'}
          </p>
        </div>
      )}
      
      {/* Detail Panel */}
      {selectedUseCase && (
        <UseCaseDetail
          useCase={selectedUseCase}
          onClose={() => setSelectedUseCase(null)}
          language={language}
        />
      )}
    </div>
  );
}