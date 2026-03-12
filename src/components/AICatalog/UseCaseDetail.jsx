/* ═══════════════════════════════════════════════════════════════
   USE CASE DETAIL COMPONENT
   Detailed view of a SAP AI use case with evaluation and pitch generation
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { updateUseCaseEvaluation, getAvailabilityColor } from '../../lib/sapAICatalogService';
import {
  generateSalesPitch,
  generateColdEmail,
  generateObjectionHandling,
  generateImplementationRoadmap,
} from '../../lib/pitchGeneratorService';

export default function UseCaseDetail({ useCase, onClose, language, customerProfile }) {
  // State for evaluation form
  const [evaluation, setEvaluation] = useState({
    business_value_adesso: useCase.business_value_adesso || null,
    priority: useCase.priority || null,
    sales_pitch_usability: useCase.sales_pitch_usability || null,
    restrictions: useCase.restrictions || '',
    contact_person: useCase.contact_person || '',
    tags: useCase.tags || '',
    status: useCase.status || 'NEW',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // State for generated content
  const [generatedPitch, setGeneratedPitch] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [generatedObjections, setGeneratedObjections] = useState(null);
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [generating, setGenerating] = useState(null); // 'pitch', 'email', 'objections', 'roadmap'
  
  // Active tab
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'evaluation', 'pitch', 'email'
  
  const availabilityColor = getAvailabilityColor(useCase.availability);
  
  // Save evaluation
  async function handleSaveEvaluation() {
    setSaving(true);
    setSaveMessage(null);
    
    const result = await updateUseCaseEvaluation(useCase.id, evaluation);
    
    if (result.success) {
      setSaveMessage({ type: 'success', text: language === 'de' ? 'Gespeichert!' : 'Saved!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error });
    }
    
    setSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  }
  
  // Generate pitch
  async function handleGeneratePitch() {
    setGenerating('pitch');
    const result = await generateSalesPitch(useCase, customerProfile, language);
    if (result.success) {
      setGeneratedPitch(result.pitch);
      setActiveTab('pitch');
    }
    setGenerating(null);
  }
  
  // Generate email
  async function handleGenerateEmail() {
    setGenerating('email');
    const result = await generateColdEmail(useCase, customerProfile, language);
    if (result.success) {
      setGeneratedEmail(result.email);
      setActiveTab('email');
    }
    setGenerating(null);
  }
  
  // Generate objection handling
  async function handleGenerateObjections() {
    setGenerating('objections');
    const result = await generateObjectionHandling(useCase, language);
    if (result.success) {
      setGeneratedObjections(result.objectionHandling);
    }
    setGenerating(null);
  }
  
  // Generate roadmap
  async function handleGenerateRoadmap() {
    setGenerating('roadmap');
    const result = await generateImplementationRoadmap(useCase, language);
    if (result) {
      setGeneratedRoadmap(result);
    }
    setGenerating(null);
  }
  
  // Copy to clipboard
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  }
  
  return (
    <div className="use-case-detail-overlay" onClick={onClose}>
      <div className="use-case-detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="use-case-detail-header">
          <div className="use-case-detail-title">
            <span className="use-case-type-badge">
              {useCase.ai_type === 'AI Agent' ? '🤖' : '✨'} {useCase.ai_type}
            </span>
            <h2>{useCase.name}</h2>
            <span className="use-case-identifier-large">{useCase.identifier}</span>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        {/* Tabs */}
        <div className="use-case-detail-tabs">
          <button 
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            📋 {language === 'de' ? 'Details' : 'Details'}
          </button>
          <button 
            className={activeTab === 'evaluation' ? 'active' : ''}
            onClick={() => setActiveTab('evaluation')}
          >
            ⭐ {language === 'de' ? 'Bewertung' : 'Evaluation'}
          </button>
          <button 
            className={activeTab === 'pitch' ? 'active' : ''}
            onClick={() => setActiveTab('pitch')}
          >
            🎯 {language === 'de' ? 'Sales Pitch' : 'Sales Pitch'}
          </button>
          <button 
            className={activeTab === 'email' ? 'active' : ''}
            onClick={() => setActiveTab('email')}
          >
            ✉️ {language === 'de' ? 'Cold Email' : 'Cold Email'}
          </button>
        </div>
        
        {/* Content */}
        <div className="use-case-detail-content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="tab-content details-tab">
              {/* Meta info */}
              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-label">{language === 'de' ? 'Produkt' : 'Product'}</span>
                  <span className="meta-value">{useCase.product}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{language === 'de' ? 'Kategorie' : 'Category'}</span>
                  <span className="meta-value">{useCase.product_category}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{language === 'de' ? 'Verfügbarkeit' : 'Availability'}</span>
                  <span className="meta-value" style={{ color: availabilityColor }}>
                    {useCase.availability}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{language === 'de' ? 'Lizenz' : 'License'}</span>
                  <span className="meta-value">
                    {useCase.commercial_type === 'Premium' ? '💎 Premium' : 
                     useCase.commercial_type === 'Base' ? '📦 Base (Included)' : '❓ Not specified'}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <div className="detail-section">
                <h3>{language === 'de' ? 'Beschreibung' : 'Description'}</h3>
                <p>{useCase.description || (language === 'de' ? 'Keine Beschreibung verfügbar' : 'No description available')}</p>
              </div>
              
              {/* Quick Filters */}
              {useCase.quick_filters && (
                <div className="detail-section">
                  <h3>{language === 'de' ? 'Tags' : 'Tags'}</h3>
                  <div className="tag-list">
                    {useCase.quick_filters.split(',').map((tag, idx) => (
                      <span key={idx} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Detail Page Link */}
              {useCase.detail_page && (
                <div className="detail-section">
                  <a 
                    href={useCase.detail_page} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    🔗 {language === 'de' ? 'SAP Discovery Center öffnen' : 'Open SAP Discovery Center'}
                  </a>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="detail-actions">
                <button 
                  onClick={handleGeneratePitch}
                  disabled={generating === 'pitch'}
                  className="action-button primary"
                >
                  {generating === 'pitch' ? '⏳' : '🎯'} 
                  {language === 'de' ? 'Sales Pitch generieren' : 'Generate Sales Pitch'}
                </button>
                <button 
                  onClick={handleGenerateEmail}
                  disabled={generating === 'email'}
                  className="action-button"
                >
                  {generating === 'email' ? '⏳' : '✉️'} 
                  {language === 'de' ? 'Cold Email generieren' : 'Generate Cold Email'}
                </button>
              </div>
            </div>
          )}
          
          {/* Evaluation Tab */}
          {activeTab === 'evaluation' && (
            <div className="tab-content evaluation-tab">
              <div className="evaluation-form">
                {/* Business Value */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Business Value (adesso)' : 'Business Value (adesso)'}</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        className={evaluation.business_value_adesso === val ? 'active' : ''}
                        onClick={() => setEvaluation({ ...evaluation, business_value_adesso: val })}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Priority */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Priorität' : 'Priority'}</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        className={evaluation.priority === val ? 'active' : ''}
                        onClick={() => setEvaluation({ ...evaluation, priority: val })}
                      >
                        {'⭐'.repeat(val)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sales Pitch Usability */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Sales Pitch Eignung' : 'Sales Pitch Usability'}</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        className={evaluation.sales_pitch_usability === val ? 'active' : ''}
                        onClick={() => setEvaluation({ ...evaluation, sales_pitch_usability: val })}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Restrictions */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Einschränkungen' : 'Restrictions'}</label>
                  <textarea
                    value={evaluation.restrictions}
                    onChange={(e) => setEvaluation({ ...evaluation, restrictions: e.target.value })}
                    placeholder={language === 'de' ? 'Bekannte Einschränkungen...' : 'Known restrictions...'}
                  />
                </div>
                
                {/* Contact Person */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Ansprechpartner' : 'Contact Person'}</label>
                  <input
                    type="text"
                    value={evaluation.contact_person}
                    onChange={(e) => setEvaluation({ ...evaluation, contact_person: e.target.value })}
                    placeholder={language === 'de' ? 'Name des Experten...' : 'Expert name...'}
                  />
                </div>
                
                {/* Tags */}
                <div className="form-group">
                  <label>{language === 'de' ? 'Tags (kommagetrennt)' : 'Tags (comma-separated)'}</label>
                  <input
                    type="text"
                    value={evaluation.tags}
                    onChange={(e) => setEvaluation({ ...evaluation, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                {/* Status */}
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={evaluation.status}
                    onChange={(e) => setEvaluation({ ...evaluation, status: e.target.value })}
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                
                {/* Save Button */}
                <div className="form-actions">
                  <button 
                    onClick={handleSaveEvaluation}
                    disabled={saving}
                    className="save-button"
                  >
                    {saving ? '⏳' : '💾'} {language === 'de' ? 'Speichern' : 'Save'}
                  </button>
                  {saveMessage && (
                    <span className={`save-message ${saveMessage.type}`}>
                      {saveMessage.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Pitch Tab */}
          {activeTab === 'pitch' && (
            <div className="tab-content pitch-tab">
              {!generatedPitch ? (
                <div className="generate-prompt">
                  <p>
                    {language === 'de' 
                      ? 'Generieren Sie einen überzeugenden Sales Pitch für diesen Use Case.'
                      : 'Generate a compelling sales pitch for this use case.'}
                  </p>
                  <button 
                    onClick={handleGeneratePitch}
                    disabled={generating === 'pitch'}
                    className="generate-button"
                  >
                    {generating === 'pitch' ? '⏳ Generiere...' : '🎯 Sales Pitch generieren'}
                  </button>
                </div>
              ) : (
                <div className="generated-content">
                  <div className="content-actions">
                    <button onClick={() => copyToClipboard(generatedPitch)}>
                      📋 {language === 'de' ? 'Kopieren' : 'Copy'}
                    </button>
                    <button onClick={handleGeneratePitch} disabled={generating === 'pitch'}>
                      🔄 {language === 'de' ? 'Neu generieren' : 'Regenerate'}
                    </button>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown>{generatedPitch}</ReactMarkdown>
                  </div>
                  
                  {/* Additional content */}
                  <div className="additional-content">
                    <h4>{language === 'de' ? 'Zusätzliche Materialien' : 'Additional Materials'}</h4>
                    <div className="additional-buttons">
                      <button 
                        onClick={handleGenerateObjections}
                        disabled={generating === 'objections'}
                      >
                        {generating === 'objections' ? '⏳' : '🛡️'} 
                        {language === 'de' ? 'Einwandbehandlung' : 'Objection Handling'}
                      </button>
                      <button 
                        onClick={handleGenerateRoadmap}
                        disabled={generating === 'roadmap'}
                      >
                        {generating === 'roadmap' ? '⏳' : '🗺️'} 
                        {language === 'de' ? 'Implementierungs-Roadmap' : 'Implementation Roadmap'}
                      </button>
                    </div>
                    
                    {generatedObjections && (
                      <div className="additional-section">
                        <h5>{language === 'de' ? 'Einwandbehandlung' : 'Objection Handling'}</h5>
                        <ReactMarkdown>{generatedObjections}</ReactMarkdown>
                      </div>
                    )}
                    
                    {generatedRoadmap && (
                      <div className="additional-section">
                        <h5>{language === 'de' ? 'Implementierungs-Roadmap' : 'Implementation Roadmap'}</h5>
                        <ReactMarkdown>{generatedRoadmap}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="tab-content email-tab">
              {!generatedEmail ? (
                <div className="generate-prompt">
                  <p>
                    {language === 'de' 
                      ? 'Generieren Sie eine professionelle Cold Email für diesen Use Case.'
                      : 'Generate a professional cold email for this use case.'}
                  </p>
                  <button 
                    onClick={handleGenerateEmail}
                    disabled={generating === 'email'}
                    className="generate-button"
                  >
                    {generating === 'email' ? '⏳ Generiere...' : '✉️ Cold Email generieren'}
                  </button>
                </div>
              ) : (
                <div className="generated-content">
                  <div className="content-actions">
                    <button onClick={() => copyToClipboard(generatedEmail)}>
                      📋 {language === 'de' ? 'Kopieren' : 'Copy'}
                    </button>
                    <button onClick={handleGenerateEmail} disabled={generating === 'email'}>
                      🔄 {language === 'de' ? 'Neu generieren' : 'Regenerate'}
                    </button>
                  </div>
                  <div className="markdown-content email-preview">
                    <ReactMarkdown>{generatedEmail}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}