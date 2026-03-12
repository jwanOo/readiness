/* ═══════════════════════════════════════════════════════════════
   USE CASE CARD COMPONENT
   Displays a single SAP AI use case in grid or list view
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import {
  getAvailabilityColor,
  getAITypeIcon,
  getCommercialTypeIcon,
} from '../../lib/sapAICatalogService';

export default function UseCaseCard({ useCase, onClick, viewMode, language }) {
  const availabilityColor = getAvailabilityColor(useCase.availability);
  const typeIcon = getAITypeIcon(useCase.ai_type);
  const commercialIcon = getCommercialTypeIcon(useCase.commercial_type);
  
  // Truncate description
  const truncatedDescription = useCase.description
    ? useCase.description.length > 150
      ? useCase.description.substring(0, 150) + '...'
      : useCase.description
    : language === 'de' ? 'Keine Beschreibung verfügbar' : 'No description available';
  
  if (viewMode === 'list') {
    return (
      <div className="use-case-card list" onClick={onClick}>
        <div className="use-case-card-main">
          <div className="use-case-card-icon">
            {typeIcon}
          </div>
          
          <div className="use-case-card-content">
            <div className="use-case-card-header">
              <span className="use-case-identifier">{useCase.identifier}</span>
              <h3 className="use-case-name">{useCase.name}</h3>
            </div>
            
            <div className="use-case-card-meta">
              <span className="use-case-product">{useCase.product}</span>
              <span className="use-case-category">{useCase.product_category}</span>
            </div>
          </div>
          
          <div className="use-case-card-badges">
            <span 
              className="badge availability"
              style={{ backgroundColor: availabilityColor }}
            >
              {useCase.availability}
            </span>
            <span className="badge commercial">
              {commercialIcon} {useCase.commercial_type || 'Standard'}
            </span>
            {useCase.priority && (
              <span className="badge priority">
                {'⭐'.repeat(useCase.priority)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Grid view (default)
  return (
    <div className="use-case-card grid" onClick={onClick}>
      <div className="use-case-card-header">
        <span className="use-case-type-icon">{typeIcon}</span>
        <span className="use-case-identifier">{useCase.identifier}</span>
        <span 
          className="use-case-availability-dot"
          style={{ backgroundColor: availabilityColor }}
          title={useCase.availability}
        />
      </div>
      
      <h3 className="use-case-name">{useCase.name}</h3>
      
      <p className="use-case-description">{truncatedDescription}</p>
      
      <div className="use-case-card-footer">
        <div className="use-case-product-info">
          <span className="use-case-product">{useCase.product}</span>
        </div>
        
        <div className="use-case-badges">
          <span 
            className="badge availability-small"
            style={{ borderColor: availabilityColor, color: availabilityColor }}
          >
            {useCase.availability === 'Generally Available' ? 'GA' : 
             useCase.availability === 'Beta' ? 'Beta' : 'EAC'}
          </span>
          <span className="badge commercial-small">
            {commercialIcon}
          </span>
        </div>
      </div>
      
      {/* adesso evaluation indicators */}
      {(useCase.business_value_adesso || useCase.priority) && (
        <div className="use-case-evaluation">
          {useCase.business_value_adesso && (
            <span className="evaluation-item" title={language === 'de' ? 'Business Value' : 'Business Value'}>
              💼 {useCase.business_value_adesso}/5
            </span>
          )}
          {useCase.priority && (
            <span className="evaluation-item" title={language === 'de' ? 'Priorität' : 'Priority'}>
              🎯 {useCase.priority}/5
            </span>
          )}
        </div>
      )}
      
      {/* Status indicator */}
      {useCase.status && useCase.status !== 'NEW' && (
        <div className={`use-case-status ${useCase.status.toLowerCase()}`}>
          {useCase.status === 'REVIEWED' && '✓'}
          {useCase.status === 'UPDATED' && '↻'}
        </div>
      )}
    </div>
  );
}