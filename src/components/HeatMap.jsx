import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../i18n';

/**
 * Heat Map Visualization Component
 * 
 * Displays a visual heat map of AI readiness scores across different categories
 * with color gradients from red (low) to green (high).
 */

// Color utility functions
const getHeatColor = (score) => {
  if (score >= 66) return { bg: '#EAFAF1', border: '#27AE60', text: '#1E8449', gradient: 'linear-gradient(135deg, #27AE60, #2ECC71)' };
  if (score >= 33) return { bg: '#FEF9E7', border: '#F39C12', text: '#B7950B', gradient: 'linear-gradient(135deg, #F39C12, #F1C40F)' };
  return { bg: '#FDEDEC', border: '#E74C3C', text: '#C0392B', gradient: 'linear-gradient(135deg, #E74C3C, #EC7063)' };
};

const getScoreLabel = (score, language) => {
  if (score >= 66) return language === 'de' ? 'Gut' : 'Good';
  if (score >= 33) return language === 'de' ? 'Mittel' : 'Medium';
  return language === 'de' ? 'Kritisch' : 'Critical';
};

// Heat Map Cell Component
const HeatMapCell = ({ category, score, subcategories, onClick, isExpanded, language }) => {
  const colors = getHeatColor(score);
  const label = getScoreLabel(score, language);
  
  return (
    <div
      onClick={() => onClick(category.id)}
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}40`,
        borderRadius: 12,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${colors.border}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Score indicator bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${score}%`,
        height: 4,
        background: colors.gradient,
        borderRadius: '12px 0 0 0',
      }} />
      
      {/* Category header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{category.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C' }}>{category.label}</div>
        </div>
        <div style={{
          background: colors.gradient,
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 700,
        }}>
          {score}%
        </div>
      </div>
      
      {/* Status label */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: `${colors.border}15`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color: colors.text,
        marginBottom: 12,
      }}>
        {score >= 66 ? '✓' : score >= 33 ? '!' : '⚠'} {label}
      </div>
      
      {/* Subcategories preview */}
      {subcategories && subcategories.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {language === 'de' ? 'Unterkategorien' : 'Subcategories'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {subcategories.slice(0, 3).map((sub, idx) => {
              const subColors = getHeatColor(sub.score);
              return (
                <div key={idx} style={{
                  padding: '3px 8px',
                  background: subColors.bg,
                  border: `1px solid ${subColors.border}40`,
                  borderRadius: 4,
                  fontSize: 10,
                  color: subColors.text,
                  fontWeight: 500,
                }}>
                  {sub.label}: {sub.score}%
                </div>
              );
            })}
            {subcategories.length > 3 && (
              <div style={{
                padding: '3px 8px',
                background: '#F7F9FC',
                borderRadius: 4,
                fontSize: 10,
                color: '#7F8C8D',
              }}>
                +{subcategories.length - 3} {language === 'de' ? 'mehr' : 'more'}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Expand indicator */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 12,
        fontSize: 12,
        color: '#95A5A6',
        transition: 'transform 0.3s',
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      }}>
        ▼
      </div>
    </div>
  );
};

// Expanded Detail Panel
const DetailPanel = ({ category, subcategories, onClose, language }) => {
  const colors = getHeatColor(category.score);
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `2px solid ${colors.border}40`,
      padding: 24,
      marginTop: 16,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {category.icon}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C' }}>{category.label}</div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>{category.description}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            color: '#95A5A6',
            cursor: 'pointer',
            padding: 8,
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Overall Score */}
      <div style={{
        background: colors.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#7F8C8D', marginBottom: 4 }}>
            {language === 'de' ? 'Gesamtbewertung' : 'Overall Score'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: colors.text }}>{category.score}%</div>
        </div>
        <div style={{
          width: 120,
          height: 8,
          background: '#E8EDF2',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${category.score}%`,
            height: '100%',
            background: colors.gradient,
            borderRadius: 4,
          }} />
        </div>
      </div>
      
      {/* Subcategories Detail */}
      {subcategories && subcategories.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', marginBottom: 12 }}>
            {language === 'de' ? 'Detailbewertung' : 'Detailed Scores'}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {subcategories.map((sub, idx) => {
              const subColors = getHeatColor(sub.score);
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#F7F9FC',
                  borderRadius: 8,
                  border: '1px solid #E8EDF2',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: subColors.gradient,
                    }} />
                    <span style={{ fontSize: 13, color: '#1B3A5C', fontWeight: 500 }}>{sub.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 80,
                      height: 6,
                      background: '#E8EDF2',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${sub.score}%`,
                        height: '100%',
                        background: subColors.gradient,
                        borderRadius: 3,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: subColors.text,
                      minWidth: 40,
                      textAlign: 'right',
                    }}>
                      {sub.score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {category.recommendations && category.recommendations.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', marginBottom: 12 }}>
            {language === 'de' ? 'Empfehlungen' : 'Recommendations'}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {category.recommendations.map((rec, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                background: rec.priority === 'high' ? '#FDEDEC' : rec.priority === 'medium' ? '#FEF9E7' : '#EAFAF1',
                borderRadius: 8,
                fontSize: 12,
                color: '#2C3E50',
              }}>
                <span>{rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}</span>
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Legend Component
const HeatMapLegend = ({ language }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: '12px 20px',
    background: '#F7F9FC',
    borderRadius: 10,
    marginBottom: 20,
  }}>
    <div style={{ fontSize: 12, color: '#7F8C8D', fontWeight: 600 }}>
      {language === 'de' ? 'Legende:' : 'Legend:'}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #E74C3C, #EC7063)' }} />
      <span style={{ fontSize: 11, color: '#5D6D7E' }}>0-33% ({language === 'de' ? 'Kritisch' : 'Critical'})</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #F39C12, #F1C40F)' }} />
      <span style={{ fontSize: 11, color: '#5D6D7E' }}>34-66% ({language === 'de' ? 'Mittel' : 'Medium'})</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #27AE60, #2ECC71)' }} />
      <span style={{ fontSize: 11, color: '#5D6D7E' }}>67-100% ({language === 'de' ? 'Gut' : 'Good'})</span>
    </div>
  </div>
);

// Main Heat Map Component
export default function HeatMap({ 
  scores = {}, 
  answers = {}, 
  industry = null,
  onCategoryClick = null,
  showLegend = true,
  compact = false,
}) {
  const { language } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Helper function to calculate subcategory scores from answers
  const calculateSubcategoryScores = useCallback((categoryId, baseScore) => {
    const val = (sId, qi) => (answers[`${sId}_${qi}`] || "").toLowerCase().trim();
    
    if (categoryId === 'sap') {
      // S/4HANA score based on landscape questions
      const ls = (qi) => val("landscape", qi);
      let s4Score = 20;
      if (/s\/4|s4|hana|rise|grow/i.test(ls(0) + ls(1) + ls(2))) s4Score += 40;
      if (/cloud|rise|grow|public/i.test(ls(2))) s4Score += 20;
      if (/hana/i.test(ls(3))) s4Score += 20;
      s4Score = Math.min(100, s4Score);
      
      // Clean Core score
      let cleanCoreScore = 20;
      if (/clean.?core|ja|yes/i.test(ls(5))) cleanCoreScore += 60;
      if (/ja|yes|plan/i.test(ls(4))) cleanCoreScore += 20;
      cleanCoreScore = Math.min(100, cleanCoreScore);
      
      // Joule score
      let jouleScore = 10;
      if (/ja|yes|aktiv|nutz/i.test(val("aiSap", 0))) jouleScore += 40;
      if (/ja|yes|aktiv|plan/i.test(val("aiSap", 1))) jouleScore += 50;
      jouleScore = Math.min(100, jouleScore);
      
      return [
        { label: 'S/4HANA', score: s4Score },
        { label: 'Clean Core', score: cleanCoreScore },
        { label: 'Joule', score: jouleScore },
      ];
    }
    
    if (categoryId === 'btp') {
      // AI Core score
      let aiCoreScore = 10;
      if (/ja|yes|nutz/i.test(val("btp", 0))) aiCoreScore += 30;
      if (/ai.?core/i.test(val("btp", 1))) aiCoreScore += 40;
      if (/ja|yes|ai|joule|core/i.test(val("licensing", 1))) aiCoreScore += 20;
      aiCoreScore = Math.min(100, aiCoreScore);
      
      // Datasphere score
      let datasphereScore = 10;
      if (/ja|yes|nutz|plan/i.test(val("btp", 3))) datasphereScore += 60;
      if (/datasphere/i.test(val("btp", 1))) datasphereScore += 30;
      datasphereScore = Math.min(100, datasphereScore);
      
      // BDC score
      let bdcScore = 10;
      if (/ja|yes|nutz|plan/i.test(val("btp", 4))) bdcScore += 70;
      if (/bdc|business.?data/i.test(val("btp", 1))) bdcScore += 20;
      bdcScore = Math.min(100, bdcScore);
      
      // Integration Suite score
      let integrationScore = 10;
      if (/integration/i.test(val("btp", 1))) integrationScore += 60;
      if (/ja|yes|nutz/i.test(val("btp", 0))) integrationScore += 30;
      integrationScore = Math.min(100, integrationScore);
      
      return [
        { label: 'AI Core', score: aiCoreScore },
        { label: 'Datasphere', score: datasphereScore },
        { label: 'BDC', score: bdcScore },
        { label: 'Integration Suite', score: integrationScore },
      ];
    }
    
    if (categoryId === 'data') {
      // Data Quality score
      let qualityScore = 10;
      if (/sehr gut|excellent/i.test(val("data", 0))) qualityScore += 80;
      else if (/gut|good/i.test(val("data", 0))) qualityScore += 60;
      else if (/ausbau|moderate/i.test(val("data", 0))) qualityScore += 30;
      qualityScore = Math.min(100, qualityScore);
      
      // Data Governance score
      let governanceScore = 10;
      if (/ja|yes|vorhanden/i.test(val("data", 1))) governanceScore += 80;
      governanceScore = Math.min(100, governanceScore);
      
      // Data Warehouse score
      let dwhScore = 10;
      if (/ja|yes|bw|datasphere|lake|warehouse|snowflake/i.test(val("data", 2))) dwhScore += 70;
      if (val("aiNonSap", 1).length > 5) dwhScore += 20;
      dwhScore = Math.min(100, dwhScore);
      
      return [
        { label: language === 'de' ? 'Datenqualität' : 'Data Quality', score: qualityScore },
        { label: 'Data Governance', score: governanceScore },
        { label: 'Data Warehouse', score: dwhScore },
      ];
    }
    
    return [];
  }, [answers, language]);

  // Build heat map data from scores and answers
  const heatMapData = useMemo(() => {
    const categories = [
      {
        id: 'sap',
        icon: '💻',
        label: language === 'de' ? 'SAP System' : 'SAP System',
        description: language === 'de' ? 'S/4HANA, Clean Core, Joule' : 'S/4HANA, Clean Core, Joule',
        score: scores.sap || 0,
        subcategories: calculateSubcategoryScores('sap', scores.sap || 0),
        recommendations: scores.sap < 33 ? [
          { text: language === 'de' ? 'Migration auf S/4HANA empfohlen' : 'Migration to S/4HANA recommended', priority: 'high' },
          { text: language === 'de' ? 'Clean Core Strategie entwickeln' : 'Develop Clean Core strategy', priority: 'high' },
        ] : scores.sap < 66 ? [
          { text: language === 'de' ? 'Joule aktivieren' : 'Activate Joule', priority: 'medium' },
          { text: language === 'de' ? 'Clean Core Strategie vorantreiben' : 'Advance Clean Core strategy', priority: 'medium' },
        ] : [
          { text: language === 'de' ? 'SAP System ist AI-ready' : 'SAP System is AI-ready', priority: 'low' },
        ],
      },
      {
        id: 'btp',
        icon: '☁️',
        label: language === 'de' ? 'BTP & AI Platform' : 'BTP & AI Platform',
        description: language === 'de' ? 'AI Core, Datasphere, BDC' : 'AI Core, Datasphere, BDC',
        score: scores.btp || 0,
        subcategories: calculateSubcategoryScores('btp', scores.btp || 0),
        recommendations: scores.btp < 33 ? [
          { text: language === 'de' ? 'SAP BTP mit AI Core erforderlich' : 'SAP BTP with AI Core required', priority: 'high' },
          { text: language === 'de' ? 'CPEA/BTPEA Lizenzierung prüfen' : 'Check CPEA/BTPEA licensing', priority: 'high' },
        ] : scores.btp < 66 ? [
          { text: language === 'de' ? 'SAP AI Core evaluieren' : 'Evaluate SAP AI Core', priority: 'medium' },
          { text: language === 'de' ? 'SAP Business Data Cloud prüfen' : 'Check SAP Business Data Cloud', priority: 'medium' },
        ] : [
          { text: language === 'de' ? 'BTP & AI Platform einsatzbereit' : 'BTP & AI Platform ready', priority: 'low' },
        ],
      },
      {
        id: 'data',
        icon: '📊',
        label: language === 'de' ? 'Datenreife' : 'Data Maturity',
        description: language === 'de' ? 'Qualität, Governance, DWH' : 'Quality, Governance, DWH',
        score: scores.data || 0,
        subcategories: calculateSubcategoryScores('data', scores.data || 0),
        recommendations: scores.data < 33 ? [
          { text: language === 'de' ? 'Datenstrategie entwickeln' : 'Develop data strategy', priority: 'high' },
          { text: language === 'de' ? 'Data Governance aufbauen' : 'Build Data Governance', priority: 'high' },
          { text: language === 'de' ? 'Zentrales DWH einführen' : 'Implement central DWH', priority: 'high' },
        ] : scores.data < 66 ? [
          { text: language === 'de' ? 'Data Governance stärken' : 'Strengthen Data Governance', priority: 'medium' },
          { text: language === 'de' ? 'SAP Datasphere einführen' : 'Introduce SAP Datasphere', priority: 'medium' },
        ] : [
          { text: language === 'de' ? 'Datenreife unterstützt KI-Initiativen' : 'Data maturity supports AI initiatives', priority: 'low' },
        ],
      },
    ];
    
    // Add industry-specific category if available
    if (industry) {
      // Calculate industry score based on answered industry questions
      const industryAnswers = Object.entries(answers).filter(([k]) => k.startsWith('ind_'));
      const answeredIndustryQuestions = industryAnswers.filter(([_, v]) => v?.trim()).length;
      const totalIndustryQuestions = industry.specificQuestions?.reduce((sum, sq) => sum + sq.questions.length, 0) || 1;
      const industryCompletionScore = Math.round((answeredIndustryQuestions / totalIndustryQuestions) * 100);
      
      // Calculate overall industry readiness based on main scores
      const industryReadinessScore = Math.round((scores.sap + scores.btp + scores.data) / 3) || 0;
      
      categories.push({
        id: 'industry',
        icon: industry.icon || '🏢',
        label: industry.label || (language === 'de' ? 'Branchenspezifisch' : 'Industry-specific'),
        description: industry.desc || '',
        score: industryReadinessScore,
        subcategories: industry.specificQuestions?.slice(0, 3).map((sq, idx) => {
          // Calculate score for each industry section based on answered questions
          const sectionAnswers = Object.entries(answers).filter(([k]) => k.startsWith(`ind_${idx}_`));
          const answeredCount = sectionAnswers.filter(([_, v]) => v?.trim()).length;
          const totalCount = sq.questions?.length || 1;
          return {
            label: sq.section,
            score: Math.round((answeredCount / totalCount) * 100),
          };
        }) || [],
        recommendations: [],
      });
    }
    
    return categories;
  }, [scores, answers, industry, language, calculateSubcategoryScores]);
  
  // Calculate overall score
  const overallScore = useMemo(() => {
    if (heatMapData.length === 0) return 0;
    const sum = heatMapData.reduce((acc, cat) => acc + cat.score, 0);
    return Math.round(sum / heatMapData.length);
  }, [heatMapData]);
  
  const overallColors = getHeatColor(overallScore);
  
  const handleCategoryClick = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };
  
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
              🗺️ {language === 'de' ? 'AI Readiness Heat Map' : 'AI Readiness Heat Map'}
            </h3>
            <p style={{ fontSize: 12, color: '#7F8C8D', margin: '4px 0 0 0' }}>
              {language === 'de' 
                ? 'Visuelle Übersicht der Stärken und Schwächen' 
                : 'Visual overview of strengths and weaknesses'}
            </p>
          </div>
          
          {/* Overall Score Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            background: overallColors.bg,
            border: `2px solid ${overallColors.border}40`,
            borderRadius: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#7F8C8D', textTransform: 'uppercase' }}>
                {language === 'de' ? 'Gesamt' : 'Overall'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: overallColors.text }}>
                {overallScore}%
              </div>
            </div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: overallColors.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 20,
            }}>
              {overallScore >= 66 ? '✓' : overallScore >= 33 ? '!' : '⚠'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && <HeatMapLegend language={language} />}
      
      {/* Heat Map Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {heatMapData.map((category) => (
          <div key={category.id}>
            <HeatMapCell
              category={category}
              score={category.score}
              subcategories={category.subcategories}
              onClick={handleCategoryClick}
              isExpanded={expandedCategory === category.id}
              language={language}
            />
          </div>
        ))}
      </div>
      
      {/* Expanded Detail Panel */}
      {expandedCategory && (
        <DetailPanel
          category={heatMapData.find(c => c.id === expandedCategory)}
          subcategories={heatMapData.find(c => c.id === expandedCategory)?.subcategories}
          onClose={() => setExpandedCategory(null)}
          language={language}
        />
      )}
    </div>
  );
}

// Compact Heat Map for Dashboard
export function HeatMapCompact({ scores = {}, onClick }) {
  const { language } = useLanguage();
  
  const categories = [
    { id: 'sap', icon: '💻', label: 'SAP', score: scores.sap || 0 },
    { id: 'btp', icon: '☁️', label: 'BTP', score: scores.btp || 0 },
    { id: 'data', icon: '📊', label: language === 'de' ? 'Daten' : 'Data', score: scores.data || 0 },
  ];
  
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        background: '#F7F9FC',
        borderRadius: 8,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {categories.map((cat) => {
        const colors = getHeatColor(cat.score);
        return (
          <div key={cat.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            background: colors.bg,
            borderRadius: 6,
            border: `1px solid ${colors.border}30`,
          }}>
            <span style={{ fontSize: 12 }}>{cat.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{cat.score}%</span>
          </div>
        );
      })}
    </div>
  );
}

// Mini Heat Map for Table Rows
export function HeatMapMini({ scores = {} }) {
  const categories = [
    { id: 'sap', score: scores.sap || 0 },
    { id: 'btp', score: scores.btp || 0 },
    { id: 'data', score: scores.data || 0 },
  ];
  
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {categories.map((cat) => {
        const colors = getHeatColor(cat.score);
        return (
          <div key={cat.id} style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: colors.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
          }}>
            {cat.score}
          </div>
        );
      })}
    </div>
  );
}