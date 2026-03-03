import { useState, useEffect, useRef } from 'react';
import {
  subscribeToRecommendations,
  requestRecommendations,
  forceRefresh,
  getCategoryInfo,
} from '../lib/recommendationService';

/**
 * Section-specific AI Recommendations Panel
 * Shows AI-generated recommendations for the current section based on answers
 * Uses background generation service for smooth UX
 */
export default function SectionRecommendations({
  section,
  answers,
  industry,
  language = 'de',
  customerName = '',
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);
  const prevRecommendationsRef = useRef([]);

  // Subscribe to recommendation updates
  useEffect(() => {
    if (!section?.id) return;

    const unsubscribe = subscribeToRecommendations(
      section.id,
      (newRecommendations, loading, err) => {
        // Smooth transition: only show update indicator, not full loading
        setIsUpdating(loading);
        setError(err);
        
        if (newRecommendations && newRecommendations.length > 0) {
          // Check if recommendations actually changed
          const prevIds = prevRecommendationsRef.current.map(r => r.id).join(',');
          const newIds = newRecommendations.map(r => r.id).join(',');
          
          if (prevIds !== newIds) {
            // Show brief update indicator for smooth transition
            setShowUpdateIndicator(true);
            setTimeout(() => {
              setRecommendations(newRecommendations);
              prevRecommendationsRef.current = newRecommendations;
              setShowUpdateIndicator(false);
            }, 150);
          } else {
            setRecommendations(newRecommendations);
          }
        } else if (!loading) {
          setRecommendations(newRecommendations || []);
          prevRecommendationsRef.current = newRecommendations || [];
        }
      }
    );

    return unsubscribe;
  }, [section?.id]);

  // Request recommendations when answers change (debounced in service)
  useEffect(() => {
    if (!section?.id) return;

    requestRecommendations({
      section,
      answers,
      industry,
      language,
      customerName,
      debounceMs: 2000, // Wait 2 seconds after user stops typing
    });
  }, [section, answers, industry, language, customerName]);

  // Get section answers to check if we have any
  const getSectionAnswers = () => {
    if (!section) return {};
    const sectionAnswers = {};
    section.questions.forEach((q, qi) => {
      const key = `${section.id}_${qi}`;
      if (answers[key]?.trim()) {
        sectionAnswers[q.q] = answers[key];
      }
    });
    return sectionAnswers;
  };

  const sectionAnswers = getSectionAnswers();
  const hasAnswers = Object.keys(sectionAnswers).length > 0;

  const handleRefresh = () => {
    forceRefresh(section, answers, industry, language, customerName);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #E8EDF2',
      overflow: 'hidden',
      height: 'fit-content',
      transition: 'opacity 0.2s ease',
      opacity: showUpdateIndicator ? 0.7 : 1,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #8E44AD10, #9B59B610)',
        borderBottom: '1px solid #E8EDF2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 700, 
              color: '#8E44AD',
              margin: 0,
            }}>
              AI Empfehlungen
            </h3>
            <p style={{ 
              fontSize: 11, 
              color: '#95A5A6', 
              margin: '2px 0 0 0',
            }}>
              {language === 'de' ? 'Top 4 für diesen Abschnitt' : 'Top 4 for this section'}
            </p>
          </div>
        </div>
        
        {/* Subtle updating indicator */}
        {isUpdating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: '#F7F9FC',
            borderRadius: 12,
            fontSize: 10,
            color: '#8E44AD',
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#8E44AD',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            {language === 'de' ? 'Aktualisiert...' : 'Updating...'}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px' }}>
        {!hasAnswers ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            color: '#95A5A6',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.5 }}>💡</div>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>
              {language === 'de' 
                ? 'Beantworten Sie die Fragen, um personalisierte Empfehlungen zu erhalten.'
                : 'Answer the questions to receive personalized recommendations.'}
            </p>
          </div>
        ) : error && recommendations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px 16px',
            color: '#E74C3C',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
            <p style={{ fontSize: 12 }}>{error}</p>
            <button
              onClick={handleRefresh}
              style={{
                marginTop: 10,
                padding: '6px 14px',
                fontSize: 11,
                background: '#8E44AD',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {language === 'de' ? 'Erneut versuchen' : 'Try again'}
            </button>
          </div>
        ) : recommendations.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 10,
            transition: 'all 0.3s ease',
          }}>
            {recommendations.map((rec, i) => {
              const categoryInfo = getCategoryInfo(rec.category, language);
              return (
                <div
                  key={rec.id || i}
                  style={{
                    padding: '12px 14px',
                    background: categoryInfo.bgColor || '#F7F9FC',
                    borderRadius: 10,
                    borderLeft: `3px solid ${categoryInfo.color || '#8E44AD'}`,
                    fontSize: 13,
                    color: '#2C3E50',
                    lineHeight: 1.5,
                    transition: 'all 0.2s ease',
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  {/* Category badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: categoryInfo.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                    {rec.priority === 'high' && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        background: '#E74C3C20',
                        color: '#E74C3C',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>
                        {language === 'de' ? 'PRIORITÄT' : 'PRIORITY'}
                      </span>
                    )}
                  </div>
                  {/* Recommendation text */}
                  <div>{rec.text}</div>
                </div>
              );
            })}
            
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              style={{
                alignSelf: 'center',
                marginTop: 4,
                padding: '6px 14px',
                fontSize: 11,
                background: 'transparent',
                color: isUpdating ? '#BDC3C7' : '#8E44AD',
                border: `1px solid ${isUpdating ? '#E8EDF2' : '#8E44AD40'}`,
                borderRadius: 6,
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (!isUpdating) e.currentTarget.style.background = '#8E44AD10';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              🔄 {language === 'de' ? 'Neu generieren' : 'Regenerate'}
            </button>
            
            {/* Error indicator (non-blocking) */}
            {error && (
              <div style={{
                textAlign: 'center',
                fontSize: 10,
                color: '#E74C3C',
                padding: '4px 8px',
                background: '#FDEDEC',
                borderRadius: 4,
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        ) : hasAnswers && !isUpdating ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            color: '#95A5A6',
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #E8EDF2',
              borderTopColor: '#8E44AD',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ fontSize: 12, color: '#7F8C8D' }}>
              {language === 'de' ? 'Empfehlungen werden generiert...' : 'Generating recommendations...'}
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px 16px',
            color: '#95A5A6',
          }}>
            <p style={{ fontSize: 12 }}>
              {language === 'de' 
                ? 'Keine Empfehlungen verfügbar.'
                : 'No recommendations available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}