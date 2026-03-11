import React, { useState, useEffect } from 'react';
import { getAutoFillSuggestion, getSectionSuggestions, applySuggestions } from '../lib/autoFillService';

/**
 * AutoFillButton - Shows a suggestion button for a single question
 */
export function AutoFillButton({
  questionKey,
  questionText,
  questionHint,
  sectionId,
  sectionTitle,
  industry,
  customerName,
  assessmentId,
  existingAnswers,
  currentValue,
  onApply,
  language = 'de',
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Don't show if already has a value
  if (currentValue?.trim()) {
    return null;
  }

  const fetchSuggestion = async () => {
    if (suggestion) {
      setShowDropdown(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAutoFillSuggestion({
        questionKey,
        questionText,
        questionHint,
        sectionId,
        sectionTitle,
        industry,
        customerName,
        assessmentId,
        existingAnswers,
        language,
      });
      
      setSuggestion(result);
      if (result.suggestions.length > 0) {
        setShowDropdown(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (value) => {
    onApply(value);
    setShowDropdown(false);
  };

  if (compact) {
    return (
      <button
        onClick={fetchSuggestion}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 8px',
          fontSize: 12,
          color: '#8E44AD',
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: loading ? 0.6 : 1,
        }}
        title="KI-Vorschlag anzeigen"
      >
        {loading ? '⏳' : '✨'}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={fetchSuggestion}
        disabled={loading}
        style={{
          background: suggestion?.hasHighConfidence 
            ? 'linear-gradient(135deg, #8E44AD, #9B59B6)' 
            : '#F7F9FC',
          border: suggestion?.hasHighConfidence 
            ? 'none' 
            : '1px solid #E8EDF2',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: suggestion?.hasHighConfidence ? '#fff' : '#8E44AD',
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            Lade...
          </>
        ) : (
          <>
            <span>✨</span>
            {suggestion?.hasHighConfidence ? 'Vorschlag verfügbar' : 'KI-Vorschlag'}
          </>
        )}
      </button>

      {/* Dropdown with suggestions */}
      {showDropdown && suggestion && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #E8EDF2',
            padding: 16,
            minWidth: 300,
            maxWidth: 400,
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B3A5C' }}>
              ✨ Vorschläge
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                color: '#95A5A6',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {suggestion.suggestions.length === 0 ? (
            <div style={{
              padding: 16,
              textAlign: 'center',
              color: '#95A5A6',
              fontSize: 12,
            }}>
              Keine Vorschläge verfügbar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestion.suggestions.map((s, i) => (
                <SuggestionItem
                  key={i}
                  suggestion={s}
                  onApply={() => handleApply(s.value)}
                  isFirst={i === 0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * SuggestionItem - Single suggestion in the dropdown
 */
function SuggestionItem({ suggestion, onApply, isFirst }) {
  const confidenceColor = suggestion.confidence >= 0.8 
    ? '#27AE60' 
    : suggestion.confidence >= 0.5 
      ? '#F39C12' 
      : '#95A5A6';

  return (
    <div
      style={{
        background: isFirst ? '#F0E6F6' : '#F7F9FC',
        border: isFirst ? '2px solid #8E44AD40' : '1px solid #E8EDF2',
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={onApply}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{suggestion.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            color: '#1B3A5C',
            fontWeight: 500,
            marginBottom: 4,
            lineHeight: 1.4,
          }}>
            {suggestion.value}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10,
            color: '#7F8C8D',
          }}>
            <span>{suggestion.source}</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              background: `${confidenceColor}20`,
              borderRadius: 4,
              color: confidenceColor,
              fontWeight: 600,
            }}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>
        </div>
        <button
          style={{
            background: '#8E44AD',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Übernehmen
        </button>
      </div>
    </div>
  );
}

/**
 * AutoFillPanel - Panel showing all suggestions for a section
 */
export function AutoFillPanel({
  section,
  industry,
  customerName,
  assessmentId,
  existingAnswers,
  onApplyAll,
  onApplySingle,
  language = 'de',
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const result = await getSectionSuggestions({
        section,
        industry,
        customerName,
        assessmentId,
        existingAnswers,
        language,
      });
      setSuggestions(result);
      setExpanded(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = () => {
    if (!suggestions) return;
    const newAnswers = applySuggestions(suggestions, existingAnswers);
    onApplyAll(newAnswers);
    setExpanded(false);
  };

  const suggestionCount = suggestions ? Object.keys(suggestions).length : 0;
  const highConfidenceCount = suggestions 
    ? Object.values(suggestions).filter(s => s.hasHighConfidence).length 
    : 0;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #E8EDF2',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #8E44AD08, #9B59B608)',
          borderBottom: expanded ? '1px solid #E8EDF2' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => suggestions ? setExpanded(!expanded) : fetchSuggestions()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8E44AD' }}>
              Smart Auto-Fill
            </div>
            <div style={{ fontSize: 11, color: '#7F8C8D' }}>
              {suggestions 
                ? `${suggestionCount} Vorschläge verfügbar (${highConfidenceCount} mit hoher Konfidenz)`
                : 'KI-basierte Vorschläge für unbeantwortete Fragen'}
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchSuggestions();
          }}
          disabled={loading}
          style={{
            background: loading ? '#E8EDF2' : 'linear-gradient(135deg, #8E44AD, #9B59B6)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: loading ? '#7F8C8D' : '#fff',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading ? (
            <>⏳ Analysiere...</>
          ) : suggestions ? (
            <>🔄 Aktualisieren</>
          ) : (
            <>🔍 Vorschläge laden</>
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && suggestions && suggestionCount > 0 && (
        <div style={{ padding: 16 }}>
          {/* Apply All Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            padding: '10px 14px',
            background: '#EAFAF1',
            borderRadius: 8,
            border: '1px solid #27AE6040',
          }}>
            <div style={{ fontSize: 12, color: '#1E8449', fontWeight: 500 }}>
              {suggestionCount} Vorschläge können automatisch ausgefüllt werden
            </div>
            <button
              onClick={handleApplyAll}
              style={{
                background: '#27AE60',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ Alle übernehmen
            </button>
          </div>

          {/* Individual Suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(suggestions).map(([questionKey, suggestion]) => {
              const [sectionId, qIndex] = questionKey.split('_');
              const question = section.questions[parseInt(qIndex)];
              
              return (
                <div
                  key={questionKey}
                  style={{
                    background: '#F7F9FC',
                    borderRadius: 10,
                    padding: 14,
                    border: suggestion.hasHighConfidence 
                      ? '2px solid #8E44AD30' 
                      : '1px solid #E8EDF2',
                  }}
                >
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1B3A5C',
                    marginBottom: 8,
                  }}>
                    {question?.q || `Frage ${parseInt(qIndex) + 1}`}
                  </div>
                  
                  {suggestion.bestSuggestion && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{ fontSize: 14 }}>
                          {suggestion.bestSuggestion.icon}
                        </span>
                        <div style={{
                          fontSize: 12,
                          color: '#5D6D7E',
                          flex: 1,
                        }}>
                          {suggestion.bestSuggestion.value}
                        </div>
                        <span style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          background: suggestion.hasHighConfidence ? '#27AE6020' : '#F39C1220',
                          color: suggestion.hasHighConfidence ? '#27AE60' : '#F39C12',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}>
                          {Math.round(suggestion.bestSuggestion.confidence * 100)}%
                        </span>
                      </div>
                      <button
                        onClick={() => onApplySingle(questionKey, suggestion.bestSuggestion.value)}
                        style={{
                          background: '#8E44AD',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#fff',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        Übernehmen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No suggestions message */}
      {expanded && suggestions && suggestionCount === 0 && (
        <div style={{
          padding: 24,
          textAlign: 'center',
          color: '#95A5A6',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤷</div>
          <div style={{ fontSize: 13 }}>
            Keine Vorschläge verfügbar. Alle Fragen sind bereits beantwortet oder es gibt keine passenden Daten.
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoFillButton;