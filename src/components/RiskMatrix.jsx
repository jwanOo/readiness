import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';

/**
 * Risk Assessment Matrix Component
 * 
 * Displays a visual risk matrix with probability vs impact,
 * auto-detects risks from assessment answers, and provides
 * mitigation recommendations.
 */

// Risk categories and their detection rules
const RISK_FRAMEWORK = {
  technical: {
    icon: '⚙️',
    label: { de: 'Technische Risiken', en: 'Technical Risks' },
    risks: [
      {
        id: 'legacy_integration',
        name: { de: 'Legacy-System-Integration', en: 'Legacy System Integration' },
        description: { de: 'Komplexe Integration mit Altsystemen', en: 'Complex integration with legacy systems' },
        triggers: (answers, scores) => scores.sap < 40 || /ecc|r\/3|legacy/i.test(JSON.stringify(answers)),
        mitigation: { de: 'Schrittweise Migration mit Middleware-Layer', en: 'Phased migration with middleware layer' },
      },
      {
        id: 'data_quality',
        name: { de: 'Datenqualitätsprobleme', en: 'Data Quality Issues' },
        description: { de: 'Unzureichende Datenqualität für KI-Modelle', en: 'Insufficient data quality for AI models' },
        triggers: (answers, scores) => scores.data < 40,
        mitigation: { de: 'Data Cleansing und Governance-Framework implementieren', en: 'Implement data cleansing and governance framework' },
      },
      {
        id: 'scalability',
        name: { de: 'Skalierbarkeit', en: 'Scalability' },
        description: { de: 'System kann nicht mit wachsenden Anforderungen skalieren', en: 'System cannot scale with growing demands' },
        triggers: (answers, scores) => scores.btp < 30,
        mitigation: { de: 'Cloud-native Architektur mit SAP BTP', en: 'Cloud-native architecture with SAP BTP' },
      },
    ],
  },
  organizational: {
    icon: '👥',
    label: { de: 'Organisatorische Risiken', en: 'Organizational Risks' },
    risks: [
      {
        id: 'change_management',
        name: { de: 'Change Management', en: 'Change Management' },
        description: { de: 'Widerstand gegen Veränderungen', en: 'Resistance to change' },
        triggers: (answers, scores) => {
          const orgAnswers = Object.entries(answers).filter(([k]) => k.startsWith('org_'));
          return orgAnswers.length < 2 || scores.data < 50;
        },
        mitigation: { de: 'Stakeholder-Engagement und Schulungsprogramm', en: 'Stakeholder engagement and training program' },
      },
      {
        id: 'skill_gap',
        name: { de: 'Kompetenzlücke', en: 'Skill Gap' },
        description: { de: 'Fehlende KI/ML-Expertise im Team', en: 'Missing AI/ML expertise in team' },
        triggers: (answers, scores) => /einsteiger|beginner|keine/i.test(answers['org_2'] || ''),
        mitigation: { de: 'Upskilling-Programm und externe Expertise', en: 'Upskilling program and external expertise' },
      },
      {
        id: 'sponsor_support',
        name: { de: 'Management-Unterstützung', en: 'Management Support' },
        description: { de: 'Unzureichende Unterstützung durch Führungsebene', en: 'Insufficient support from leadership' },
        triggers: (answers, scores) => !answers['org_1'] || answers['org_1'].length < 5,
        mitigation: { de: 'Executive Sponsorship sichern und Business Case erstellen', en: 'Secure executive sponsorship and create business case' },
      },
    ],
  },
  financial: {
    icon: '💰',
    label: { de: 'Finanzielle Risiken', en: 'Financial Risks' },
    risks: [
      {
        id: 'budget_overrun',
        name: { de: 'Budgetüberschreitung', en: 'Budget Overrun' },
        description: { de: 'Kosten übersteigen geplantes Budget', en: 'Costs exceed planned budget' },
        triggers: (answers, scores) => {
          const budget = answers['useCases_2'] || '';
          return /< ?50k|klein|small/i.test(budget) && scores.sap < 50;
        },
        mitigation: { de: 'Phasenweise Implementierung mit klaren Meilensteinen', en: 'Phased implementation with clear milestones' },
      },
      {
        id: 'roi_uncertainty',
        name: { de: 'ROI-Unsicherheit', en: 'ROI Uncertainty' },
        description: { de: 'Unklarer Return on Investment', en: 'Unclear return on investment' },
        triggers: (answers, scores) => !answers['useCases_0'] || answers['useCases_0'].length < 10,
        mitigation: { de: 'Pilot-Projekt mit messbaren KPIs starten', en: 'Start pilot project with measurable KPIs' },
      },
      {
        id: 'license_costs',
        name: { de: 'Lizenzkosten', en: 'License Costs' },
        description: { de: 'Unerwartete Lizenzkosten', en: 'Unexpected license costs' },
        triggers: (answers, scores) => scores.btp < 40 && !/cpea|btpea/i.test(JSON.stringify(answers)),
        mitigation: { de: 'Lizenzmodell-Analyse und CPEA/BTPEA-Evaluierung', en: 'License model analysis and CPEA/BTPEA evaluation' },
      },
    ],
  },
  regulatory: {
    icon: '⚖️',
    label: { de: 'Regulatorische Risiken', en: 'Regulatory Risks' },
    risks: [
      {
        id: 'gdpr_compliance',
        name: { de: 'DSGVO-Compliance', en: 'GDPR Compliance' },
        description: { de: 'Datenschutzanforderungen nicht erfüllt', en: 'Data protection requirements not met' },
        triggers: (answers, scores) => !answers['security_1'] || !/ja|yes|vorhanden/i.test(answers['security_1']),
        mitigation: { de: 'Datenschutz-Folgenabschätzung durchführen', en: 'Conduct data protection impact assessment' },
      },
      {
        id: 'ai_act',
        name: { de: 'EU AI Act', en: 'EU AI Act' },
        description: { de: 'Anforderungen des EU AI Act nicht berücksichtigt', en: 'EU AI Act requirements not considered' },
        triggers: (answers, scores) => !answers['security_2'] || answers['security_2'].length < 5,
        mitigation: { de: 'AI Act Compliance-Check und Risikoklassifizierung', en: 'AI Act compliance check and risk classification' },
      },
      {
        id: 'industry_regulation',
        name: { de: 'Branchenregulierung', en: 'Industry Regulation' },
        description: { de: 'Branchenspezifische Vorschriften nicht eingehalten', en: 'Industry-specific regulations not met' },
        triggers: (answers, scores) => {
          // Check for industry-specific answers
          const indAnswers = Object.entries(answers).filter(([k]) => k.startsWith('ind_'));
          return indAnswers.length > 0 && indAnswers.filter(([_, v]) => v?.trim()).length < indAnswers.length / 2;
        },
        mitigation: { de: 'Branchenspezifische Compliance-Prüfung', en: 'Industry-specific compliance review' },
      },
    ],
  },
};

// Calculate risk level based on probability and impact
const calculateRiskLevel = (probability, impact) => {
  const score = probability * impact;
  if (score >= 16) return { level: 'critical', color: '#C0392B', bg: '#FDEDEC', label: { de: 'Kritisch', en: 'Critical' } };
  if (score >= 9) return { level: 'high', color: '#E74C3C', bg: '#FADBD8', label: { de: 'Hoch', en: 'High' } };
  if (score >= 4) return { level: 'medium', color: '#F39C12', bg: '#FEF9E7', label: { de: 'Mittel', en: 'Medium' } };
  return { level: 'low', color: '#27AE60', bg: '#EAFAF1', label: { de: 'Niedrig', en: 'Low' } };
};

// Risk Matrix Grid Component
const RiskMatrixGrid = ({ risks, language, onRiskClick, selectedRisk }) => {
  // 5x5 matrix: probability (y-axis) vs impact (x-axis)
  const gridSize = 5;
  
  // Position risks on the grid
  const riskPositions = risks.map(risk => ({
    ...risk,
    x: risk.impact,
    y: risk.probability,
  }));
  
  const getCellColor = (x, y) => {
    const score = x * y;
    if (score >= 16) return '#C0392B';
    if (score >= 12) return '#E74C3C';
    if (score >= 6) return '#F39C12';
    if (score >= 3) return '#F1C40F';
    return '#27AE60';
  };
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Y-axis label */}
      <div style={{
        position: 'absolute',
        left: -40,
        top: '50%',
        transform: 'translateY(-50%) rotate(-90deg)',
        fontSize: 11,
        fontWeight: 600,
        color: '#7F8C8D',
        whiteSpace: 'nowrap',
      }}>
        {language === 'de' ? 'Wahrscheinlichkeit →' : 'Probability →'}
      </div>
      
      {/* X-axis label */}
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        fontWeight: 600,
        color: '#7F8C8D',
      }}>
        {language === 'de' ? 'Auswirkung →' : 'Impact →'}
      </div>
      
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 2,
        marginLeft: 30,
        marginBottom: 40,
      }}>
        {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
          const x = (idx % gridSize) + 1;
          const y = gridSize - Math.floor(idx / gridSize);
          const cellRisks = riskPositions.filter(r => r.x === x && r.y === y);
          
          return (
            <div
              key={idx}
              style={{
                width: 60,
                height: 60,
                background: `${getCellColor(x, y)}20`,
                border: `1px solid ${getCellColor(x, y)}40`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: cellRisks.length > 0 ? 'pointer' : 'default',
              }}
              onClick={() => cellRisks.length > 0 && onRiskClick(cellRisks[0])}
            >
              {cellRisks.length > 0 && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: getCellColor(x, y),
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: selectedRisk?.id === cellRisks[0].id ? `0 0 0 3px ${getCellColor(x, y)}50` : 'none',
                  transition: 'all 0.2s',
                }}>
                  {cellRisks.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 30, marginTop: -35, paddingRight: 10 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{ width: 60, textAlign: 'center', fontSize: 10, color: '#95A5A6' }}>{n}</div>
        ))}
      </div>
    </div>
  );
};

// Risk Card Component
const RiskCard = ({ risk, language, isSelected, onClick }) => {
  const riskLevel = calculateRiskLevel(risk.probability, risk.impact);
  
  return (
    <div
      onClick={() => onClick(risk)}
      style={{
        background: isSelected ? riskLevel.bg : '#fff',
        border: `2px solid ${isSelected ? riskLevel.color : '#E8EDF2'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: 8,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = riskLevel.color + '60';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#E8EDF2';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{risk.categoryIcon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1B3A5C' }}>
            {risk.name[language]}
          </span>
        </div>
        <div style={{
          padding: '3px 8px',
          borderRadius: 12,
          background: riskLevel.bg,
          color: riskLevel.color,
          fontSize: 10,
          fontWeight: 700,
        }}>
          {riskLevel.label[language]}
        </div>
      </div>
      
      <p style={{ fontSize: 11, color: '#7F8C8D', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        {risk.description[language]}
      </p>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#95A5A6' }}>
            {language === 'de' ? 'Wahrsch.' : 'Prob.'}:
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: n <= risk.probability ? riskLevel.color : '#E8EDF2',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#95A5A6' }}>
            {language === 'de' ? 'Auswirk.' : 'Impact'}:
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: n <= risk.impact ? riskLevel.color : '#E8EDF2',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Risk Detail Panel
const RiskDetailPanel = ({ risk, language, onClose }) => {
  const riskLevel = calculateRiskLevel(risk.probability, risk.impact);
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: `2px solid ${riskLevel.color}40`,
      padding: 20,
      marginTop: 16,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{risk.categoryIcon}</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
              {risk.name[language]}
            </h3>
          </div>
          <p style={{ fontSize: 12, color: '#7F8C8D', margin: 0 }}>
            {risk.description[language]}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            color: '#95A5A6',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Risk Score */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          background: '#F7F9FC',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 4 }}>
            {language === 'de' ? 'Wahrscheinlichkeit' : 'Probability'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: riskLevel.color }}>
            {risk.probability}/5
          </div>
        </div>
        <div style={{
          background: '#F7F9FC',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 4 }}>
            {language === 'de' ? 'Auswirkung' : 'Impact'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: riskLevel.color }}>
            {risk.impact}/5
          </div>
        </div>
        <div style={{
          background: riskLevel.bg,
          borderRadius: 8,
          padding: 12,
          textAlign: 'center',
          border: `1px solid ${riskLevel.color}30`,
        }}>
          <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 4 }}>
            {language === 'de' ? 'Risikostufe' : 'Risk Level'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: riskLevel.color }}>
            {riskLevel.label[language]}
          </div>
        </div>
      </div>
      
      {/* Mitigation */}
      <div style={{
        background: '#EAFAF1',
        borderRadius: 8,
        padding: 14,
        border: '1px solid #27AE6030',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1E8449' }}>
            {language === 'de' ? 'Empfohlene Maßnahme' : 'Recommended Mitigation'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#2C3E50', margin: 0, lineHeight: 1.5 }}>
          {risk.mitigation[language]}
        </p>
      </div>
    </div>
  );
};

// Main Risk Matrix Component
export default function RiskMatrix({
  answers = {},
  scores = {},
  industry = null,
  showMatrix = true,
}) {
  const { language } = useLanguage();
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Detect risks based on answers and scores
  const detectedRisks = useMemo(() => {
    const risks = [];
    const val = (sId, qi) => (answers[`${sId}_${qi}`] || "").toLowerCase().trim();
    
    Object.entries(RISK_FRAMEWORK).forEach(([categoryId, category]) => {
      category.risks.forEach(risk => {
        if (risk.triggers(answers, scores)) {
          // Calculate probability and impact based on actual scores and answers
          let probability = 2;
          let impact = 2;
          
          // Calculate overall readiness
          const overall = ((scores.sap || 0) + (scores.btp || 0) + (scores.data || 0)) / 3;
          
          // Adjust probability based on overall readiness
          if (overall < 25) {
            probability = 5;
          } else if (overall < 40) {
            probability = 4;
          } else if (overall < 55) {
            probability = 3;
          } else if (overall < 70) {
            probability = 2;
          } else {
            probability = 1;
          }
          
          // Category-specific probability adjustments based on actual scores
          if (categoryId === 'technical') {
            if ((scores.sap || 0) < 30) probability = Math.min(5, probability + 1);
            if ((scores.btp || 0) < 30) probability = Math.min(5, probability + 1);
          }
          if (categoryId === 'organizational') {
            // Check if org questions are answered
            const orgAnswered = Object.entries(answers).filter(([k, v]) => k.startsWith('org_') && v?.trim()).length;
            if (orgAnswered < 2) probability = Math.min(5, probability + 1);
          }
          if (categoryId === 'financial') {
            if ((scores.btp || 0) < 40) probability = Math.min(5, probability + 1);
          }
          if (categoryId === 'regulatory') {
            // Check security/compliance answers
            const securityAnswered = Object.entries(answers).filter(([k, v]) => k.startsWith('security_') && v?.trim()).length;
            if (securityAnswered < 2) probability = Math.min(5, probability + 1);
          }
          
          // Calculate impact based on risk type and scores
          if (risk.id === 'legacy_integration') {
            impact = (scores.sap || 0) < 30 ? 5 : (scores.sap || 0) < 50 ? 4 : 3;
          } else if (risk.id === 'data_quality') {
            impact = (scores.data || 0) < 30 ? 5 : (scores.data || 0) < 50 ? 4 : 3;
          } else if (risk.id === 'scalability') {
            impact = (scores.btp || 0) < 30 ? 5 : (scores.btp || 0) < 50 ? 4 : 3;
          } else if (risk.id === 'budget_overrun' || risk.id === 'license_costs') {
            impact = overall < 40 ? 5 : overall < 60 ? 4 : 3;
          } else if (risk.id === 'gdpr_compliance' || risk.id === 'ai_act') {
            impact = 4; // Regulatory risks always have high impact
          } else if (risk.id === 'change_management' || risk.id === 'skill_gap') {
            impact = overall < 50 ? 4 : 3;
          } else {
            // Default impact based on overall score
            impact = overall < 33 ? 4 : overall < 66 ? 3 : 2;
          }
          
          risks.push({
            ...risk,
            categoryId,
            categoryIcon: category.icon,
            categoryLabel: category.label,
            probability,
            impact,
          });
        }
      });
    });
    
    // Sort by risk score (probability * impact)
    return risks.sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));
  }, [answers, scores]);
  
  // Filter risks by category
  const filteredRisks = filterCategory === 'all' 
    ? detectedRisks 
    : detectedRisks.filter(r => r.categoryId === filterCategory);
  
  // Calculate risk summary
  const riskSummary = useMemo(() => {
    const summary = { critical: 0, high: 0, medium: 0, low: 0 };
    detectedRisks.forEach(risk => {
      const level = calculateRiskLevel(risk.probability, risk.impact).level;
      summary[level]++;
    });
    return summary;
  }, [detectedRisks]);
  
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
              ⚠️ {language === 'de' ? 'Risiko-Assessment' : 'Risk Assessment'}
            </h3>
            <p style={{ fontSize: 12, color: '#7F8C8D', margin: '4px 0 0 0' }}>
              {language === 'de' 
                ? 'Automatisch erkannte Risiken basierend auf Ihren Antworten' 
                : 'Automatically detected risks based on your answers'}
            </p>
          </div>
          
          {/* Risk Summary */}
          <div style={{ display: 'flex', gap: 8 }}>
            {riskSummary.critical > 0 && (
              <div style={{ padding: '6px 12px', background: '#FDEDEC', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#C0392B' }}>{riskSummary.critical}</span>
                <span style={{ fontSize: 10, color: '#C0392B' }}>{language === 'de' ? 'Kritisch' : 'Critical'}</span>
              </div>
            )}
            {riskSummary.high > 0 && (
              <div style={{ padding: '6px 12px', background: '#FADBD8', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E74C3C' }}>{riskSummary.high}</span>
                <span style={{ fontSize: 10, color: '#E74C3C' }}>{language === 'de' ? 'Hoch' : 'High'}</span>
              </div>
            )}
            {riskSummary.medium > 0 && (
              <div style={{ padding: '6px 12px', background: '#FEF9E7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F39C12' }}>{riskSummary.medium}</span>
                <span style={{ fontSize: 10, color: '#F39C12' }}>{language === 'de' ? 'Mittel' : 'Medium'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: 'none',
            background: filterCategory === 'all' ? '#1B3A5C' : '#F7F9FC',
            color: filterCategory === 'all' ? '#fff' : '#5D6D7E',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {language === 'de' ? 'Alle' : 'All'} ({detectedRisks.length})
        </button>
        {Object.entries(RISK_FRAMEWORK).map(([id, cat]) => {
          const count = detectedRisks.filter(r => r.categoryId === id).length;
          if (count === 0) return null;
          return (
            <button
              key={id}
              onClick={() => setFilterCategory(id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                background: filterCategory === id ? '#1B3A5C' : '#F7F9FC',
                color: filterCategory === id ? '#fff' : '#5D6D7E',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label[language]}</span>
              <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>
      
      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: showMatrix ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Risk Matrix Grid */}
        {showMatrix && (
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 20,
            border: '1px solid #E8EDF2',
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', marginBottom: 16 }}>
              {language === 'de' ? 'Risiko-Matrix' : 'Risk Matrix'}
            </h4>
            <RiskMatrixGrid
              risks={filteredRisks}
              language={language}
              onRiskClick={setSelectedRisk}
              selectedRisk={selectedRisk}
            />
          </div>
        )}
        
        {/* Risk List */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', marginBottom: 12 }}>
            {language === 'de' ? 'Erkannte Risiken' : 'Detected Risks'} ({filteredRisks.length})
          </h4>
          
          {filteredRisks.length === 0 ? (
            <div style={{
              background: '#EAFAF1',
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
              border: '1px solid #27AE6030',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E8449' }}>
                {language === 'de' ? 'Keine kritischen Risiken erkannt' : 'No critical risks detected'}
              </div>
              <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 4 }}>
                {language === 'de' 
                  ? 'Basierend auf Ihren Antworten wurden keine signifikanten Risiken identifiziert.' 
                  : 'Based on your answers, no significant risks were identified.'}
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {filteredRisks.map(risk => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  language={language}
                  isSelected={selectedRisk?.id === risk.id}
                  onClick={setSelectedRisk}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Risk Detail */}
      {selectedRisk && (
        <RiskDetailPanel
          risk={selectedRisk}
          language={language}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </div>
  );
}

// Compact Risk Summary for Dashboard
export function RiskSummaryCompact({ answers = {}, scores = {} }) {
  const { language } = useLanguage();
  
  // Quick risk detection
  const riskCount = useMemo(() => {
    let count = 0;
    Object.values(RISK_FRAMEWORK).forEach(category => {
      category.risks.forEach(risk => {
        if (risk.triggers(answers, scores)) count++;
      });
    });
    return count;
  }, [answers, scores]);
  
  const overall = (scores.sap + scores.btp + scores.data) / 3;
  const riskLevel = overall < 33 ? 'high' : overall < 66 ? 'medium' : 'low';
  const colors = {
    high: { bg: '#FDEDEC', color: '#E74C3C' },
    medium: { bg: '#FEF9E7', color: '#F39C12' },
    low: { bg: '#EAFAF1', color: '#27AE60' },
  };
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      background: colors[riskLevel].bg,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors[riskLevel].color }}>
        {riskCount} {language === 'de' ? 'Risiken' : 'Risks'}
      </span>
    </div>
  );
}