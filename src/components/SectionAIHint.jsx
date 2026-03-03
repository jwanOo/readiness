import { useState } from 'react';
import { getSectionHint } from '../lib/aiService';

/**
 * SectionAIHint Component
 * Displays AI-powered tips for each assessment section
 * Helps users understand what's needed to make the customer AI-ready
 */
export default function SectionAIHint({ sectionId, language = 'de', isIndustry = false, industryColor = '#2E86C1' }) {
  const hint = getSectionHint(sectionId, language);
  
  if (!hint) return null;
  
  const accentColor = isIndustry ? industryColor : '#8E44AD';
  
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${accentColor}20`,
      borderRadius: 10,
      marginBottom: 20,
      overflow: 'hidden',
      boxShadow: `0 2px 8px ${accentColor}08`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`,
        borderBottom: `1px solid ${accentColor}15`,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#fff',
          flexShrink: 0,
        }}>
          ✓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: accentColor,
          }}>
            {hint.title}
          </div>
        </div>
      </div>
      
      {/* Tips List */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hint.tips.map((tip, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                background: `${accentColor}04`,
                borderRadius: 7,
                fontSize: 12,
                color: '#34495E',
                lineHeight: 1.5,
                border: `1px solid ${accentColor}12`,
              }}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: accentColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {index + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
