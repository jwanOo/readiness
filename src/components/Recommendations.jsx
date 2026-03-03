import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateRecommendations, getCategoryInfo, getPriorityInfo } from '../lib/aiService';
import { INDUSTRIES } from '../lib/constants';
import { computeReadinessFromAnswers } from '../lib/scoring';

/**
 * Recommendations Component
 * Displays AI-powered recommendations for an assessment
 */
export default function Recommendations({ 
  assessment, 
  answers, 
  language = 'de',
  onClose,
  compact = false,
  onCountChange 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (assessment?.id) {
      fetchRecommendations();
    }
  }, [assessment?.id]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('assessment_id', assessment.id)
        .eq('is_completed', false)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet, that's okay
        console.log('Recommendations table not found or error:', error.message);
        setRecommendations([]);
      } else {
        setRecommendations(data || []);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      // Build answers object from props or fetch from DB
      let answersObj = answers || {};
      
      if (!answers || Object.keys(answers).length === 0) {
        const { data: answersData } = await supabase
          .from('answers')
          .select('*')
          .eq('assessment_id', assessment.id);
        
        if (answersData) {
          answersData.forEach(a => {
            answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
          });
        }
      }

      // Calculate scores
      const scores = computeReadinessFromAnswers(answersObj);
      const industry = INDUSTRIES[assessment.industry];

      // Generate recommendations via AI
      const newRecs = await generateRecommendations(
        assessment,
        answersObj,
        scores,
        industry,
        language
      );

      // Save to database
      const recsToSave = newRecs.map(rec => ({
        assessment_id: assessment.id,
        recommendation_text: rec.text,
        category: rec.category,
        priority: rec.priority,
        language: rec.language,
        is_completed: false,
      }));

      // Try to save to Supabase (table might not exist)
      try {
        // First, delete old recommendations for this assessment
        await supabase
          .from('recommendations')
          .delete()
          .eq('assessment_id', assessment.id)
          .eq('is_completed', false);

        // Insert new recommendations
        const { data: savedRecs, error: saveError } = await supabase
          .from('recommendations')
          .insert(recsToSave)
          .select();

        if (saveError) {
          console.warn('Could not save to DB, using local state:', saveError.message);
          // Use local state with generated IDs
          setRecommendations(newRecs.map((rec, i) => ({
            id: `local_${Date.now()}_${i}`,
            assessment_id: assessment.id,
            recommendation_text: rec.text,
            category: rec.category,
            priority: rec.priority,
            language: rec.language,
            is_completed: false,
          })));
        } else {
          setRecommendations(savedRecs || []);
        }
      } catch (dbError) {
        console.warn('Database error, using local state:', dbError);
        setRecommendations(newRecs.map((rec, i) => ({
          id: `local_${Date.now()}_${i}`,
          assessment_id: assessment.id,
          recommendation_text: rec.text,
          category: rec.category,
          priority: rec.priority,
          language: rec.language,
          is_completed: false,
        })));
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(language === 'de' 
        ? `Fehler beim Generieren: ${err.message}` 
        : `Error generating: ${err.message}`
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (recId) => {
    // Optimistic update - remove from local state
    const newRecs = recommendations.filter(r => r.id !== recId);
    setRecommendations(newRecs);
    
    // Notify parent about count change
    if (onCountChange) {
      onCountChange(assessment.id, newRecs.length);
    }

    try {
      // Delete from database (not just mark as completed)
      await supabase
        .from('recommendations')
        .delete()
        .eq('id', recId);
    } catch (err) {
      console.warn('Could not delete from DB:', err);
    }
  };

  // Group recommendations by category (in order: quick_win, risk, next_step, strategic)
  const groupedByCategory = {
    quick_win: recommendations.filter(r => r.category === 'quick_win'),
    risk: recommendations.filter(r => r.category === 'risk'),
    next_step: recommendations.filter(r => r.category === 'next_step'),
    strategic: recommendations.filter(r => r.category === 'strategic'),
  };

  const texts = {
    de: {
      title: '🤖 KI-Empfehlungen',
      generate: 'Empfehlungen generieren',
      regenerate: 'Neu generieren',
      generating: 'Generiere...',
      loading: 'Lade...',
      noRecs: 'Noch keine Empfehlungen vorhanden.',
      noRecsHint: 'Klicken Sie auf "Empfehlungen generieren", um KI-basierte Empfehlungen zu erhalten.',
      markDone: 'Als erledigt markieren',
      highPriority: 'Hohe Priorität',
      mediumPriority: 'Mittlere Priorität',
      lowPriority: 'Niedrige Priorität',
    },
    en: {
      title: '🤖 AI Recommendations',
      generate: 'Generate Recommendations',
      regenerate: 'Regenerate',
      generating: 'Generating...',
      loading: 'Loading...',
      noRecs: 'No recommendations yet.',
      noRecsHint: 'Click "Generate Recommendations" to get AI-powered recommendations.',
      markDone: 'Mark as done',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
    },
  };

  const t = texts[language] || texts.de;

  if (compact) {
    // Compact view for Analytics modal
    return (
      <div style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1B3A5C' }}>
            {t.title}
          </h3>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: generating ? '#BDC3C7' : 'linear-gradient(135deg, #8E44AD, #9B59B6)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: generating ? 'wait' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {generating ? t.generating : (recommendations.length > 0 ? t.regenerate : t.generate)}
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: 12, 
            background: '#FDEDEC', 
            borderRadius: 8, 
            color: '#E74C3C',
            fontSize: 13,
            marginBottom: 12 
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#7F8C8D' }}>
            {t.loading}
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#95A5A6' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
            <div style={{ fontSize: 13 }}>{t.noRecs}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{t.noRecsHint}</div>
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'grid', gap: 12 }}>
            {/* Quick Wins Cluster */}
            {groupedByCategory.quick_win.length > 0 && (
              <CompactCategoryCluster
                title={language === 'de' ? '⚡ Quick Wins' : '⚡ Quick Wins'}
                color="#27AE60"
                bgColor="#EAFAF1"
                recommendations={groupedByCategory.quick_win}
                language={language}
                onComplete={handleComplete}
                t={t}
              />
            )}

            {/* Risks Cluster */}
            {groupedByCategory.risk.length > 0 && (
              <CompactCategoryCluster
                title={language === 'de' ? '⚠️ Risiken' : '⚠️ Risks'}
                color="#E74C3C"
                bgColor="#FDEDEC"
                recommendations={groupedByCategory.risk}
                language={language}
                onComplete={handleComplete}
                t={t}
              />
            )}

            {/* Next Steps Cluster */}
            {groupedByCategory.next_step.length > 0 && (
              <CompactCategoryCluster
                title={language === 'de' ? '👣 Nächste Schritte' : '👣 Next Steps'}
                color="#3498DB"
                bgColor="#EBF5FB"
                recommendations={groupedByCategory.next_step}
                language={language}
                onComplete={handleComplete}
                t={t}
              />
            )}

            {/* Strategic Cluster */}
            {groupedByCategory.strategic.length > 0 && (
              <CompactCategoryCluster
                title={language === 'de' ? '🎯 Strategisch' : '🎯 Strategic'}
                color="#8E44AD"
                bgColor="#F5EEF8"
                recommendations={groupedByCategory.strategic}
                language={language}
                onComplete={handleComplete}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Full view for Assessment Detail
  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 14, 
      border: '2px solid #E8EDF2',
      padding: 24,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1B3A5C' }}>
            {t.title}
          </h2>
          {recommendations.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7F8C8D' }}>
              {recommendations.length} {language === 'de' ? 'offene Empfehlungen' : 'pending recommendations'}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: generating ? '#BDC3C7' : 'linear-gradient(135deg, #8E44AD, #9B59B6)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: generating ? 'wait' : 'pointer',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s',
          }}
        >
          {generating ? `⏳ ${t.generating}` : (recommendations.length > 0 ? `↻ ${t.regenerate}` : `✨ ${t.generate}`)}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: 16, 
          background: '#FDEDEC', 
          borderRadius: 10, 
          color: '#E74C3C',
          fontSize: 14,
          marginBottom: 16 
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#7F8C8D' }}>
          ⏳ {t.loading}
        </div>
      ) : recommendations.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: '#F7F9FC',
          borderRadius: 10,
          color: '#95A5A6' 
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t.noRecs}</div>
          <div style={{ fontSize: 14 }}>{t.noRecsHint}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Quick Wins */}
          {groupedByCategory.quick_win.length > 0 && (
            <CategoryBox 
              title={language === 'de' ? '⚡ Quick Wins' : '⚡ Quick Wins'}
              subtitle={language === 'de' ? 'Schnell umsetzbare Maßnahmen mit hohem Impact' : 'Fast to implement with high impact'}
              color="#27AE60"
              bgColor="#EAFAF1"
              recommendations={groupedByCategory.quick_win}
              language={language}
              onComplete={handleComplete}
              t={t}
            />
          )}

          {/* Risks */}
          {groupedByCategory.risk.length > 0 && (
            <CategoryBox 
              title={language === 'de' ? '⚠️ Risiken' : '⚠️ Risks'}
              subtitle={language === 'de' ? 'Kritische Punkte, die adressiert werden sollten' : 'Critical points that should be addressed'}
              color="#E74C3C"
              bgColor="#FDEDEC"
              recommendations={groupedByCategory.risk}
              language={language}
              onComplete={handleComplete}
              t={t}
            />
          )}

          {/* Next Steps */}
          {groupedByCategory.next_step.length > 0 && (
            <CategoryBox 
              title={language === 'de' ? '👣 Nächste Schritte' : '👣 Next Steps'}
              subtitle={language === 'de' ? 'Konkrete Maßnahmen für die nahe Zukunft' : 'Concrete actions for the near future'}
              color="#3498DB"
              bgColor="#EBF5FB"
              recommendations={groupedByCategory.next_step}
              language={language}
              onComplete={handleComplete}
              t={t}
            />
          )}

          {/* Strategic */}
          {groupedByCategory.strategic.length > 0 && (
            <CategoryBox 
              title={language === 'de' ? '🎯 Strategisch' : '🎯 Strategic'}
              subtitle={language === 'de' ? 'Langfristige strategische Empfehlungen' : 'Long-term strategic recommendations'}
              color="#8E44AD"
              bgColor="#F5EEF8"
              recommendations={groupedByCategory.strategic}
              language={language}
              onComplete={handleComplete}
              t={t}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Compact Category Cluster for Modal View
function CompactCategoryCluster({ title, color, bgColor, recommendations, language, onComplete, t }) {
  const [completing, setCompleting] = useState({});

  const handleCompleteItem = async (recId) => {
    setCompleting(prev => ({ ...prev, [recId]: true }));
    await onComplete(recId);
  };

  return (
    <div style={{
      background: bgColor,
      borderRadius: 10,
      border: `1.5px solid ${color}30`,
      overflow: 'hidden',
    }}>
      {/* Cluster Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${color}20`,
        background: `${color}08`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 700, 
          color: color,
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 11,
          color: '#7F8C8D',
          fontWeight: 500,
        }}>
          {recommendations.length}
        </span>
      </div>
      
      {/* Recommendations */}
      <div style={{ padding: 10 }}>
        {recommendations.map((rec, index) => {
          const prioInfo = getPriorityInfo(rec.priority, language);
          const isCompleting = completing[rec.id];
          
          return (
            <div 
              key={rec.id}
              style={{
                padding: 10,
                background: '#fff',
                borderRadius: 8,
                marginBottom: index < recommendations.length - 1 ? 8 : 0,
                border: '1px solid #E8EDF2',
                transition: 'all 0.3s',
                opacity: isCompleting ? 0.5 : 1,
                transform: isCompleting ? 'translateX(10px)' : 'translateX(0)',
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                gap: 8 
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: 9, 
                    padding: '1px 6px', 
                    borderRadius: 3,
                    background: `${prioInfo.color}15`,
                    color: prioInfo.color,
                    fontWeight: 600,
                    marginBottom: 4,
                    display: 'inline-block',
                  }}>
                    {prioInfo.icon} {prioInfo.label}
                  </span>
                  <div style={{ fontSize: 12, color: '#1B3A5C', lineHeight: 1.4, marginTop: 4 }}>
                    {rec.recommendation_text}
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteItem(rec.id)}
                  disabled={isCompleting}
                  title={t.markDone}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: `1.5px solid ${color}40`,
                    background: '#fff',
                    cursor: isCompleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    color: color,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = color;
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = `${color}40`;
                    e.currentTarget.style.color = color;
                  }}
                >
                  ✓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Category Box Component
function CategoryBox({ title, subtitle, color, bgColor, recommendations, language, onComplete, t }) {
  const [completing, setCompleting] = useState({});

  const handleComplete = async (recId) => {
    setCompleting(prev => ({ ...prev, [recId]: true }));
    await onComplete(recId);
  };

  return (
    <div style={{
      background: bgColor,
      borderRadius: 14,
      border: `2px solid ${color}30`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${color}20`,
        background: `${color}10`,
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: 16, 
          fontWeight: 700, 
          color: color,
        }}>
          {title}
        </h3>
        <p style={{ 
          margin: '4px 0 0', 
          fontSize: 12, 
          color: '#7F8C8D',
        }}>
          {subtitle}
        </p>
      </div>
      
      {/* Recommendations List */}
      <div style={{ padding: 14 }}>
        {recommendations.map((rec, index) => {
          const prioInfo = getPriorityInfo(rec.priority, language);
          const isCompleting = completing[rec.id];
          
          return (
            <div 
              key={rec.id}
              style={{
                padding: 14,
                background: '#fff',
                borderRadius: 10,
                marginBottom: index < recommendations.length - 1 ? 10 : 0,
                border: '1px solid #E8EDF2',
                transition: 'all 0.3s',
                opacity: isCompleting ? 0.5 : 1,
                transform: isCompleting ? 'translateX(20px)' : 'translateX(0)',
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                gap: 12 
              }}>
                <div style={{ flex: 1 }}>
                  {/* Priority Badge */}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ 
                      fontSize: 10, 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      background: `${prioInfo.color}15`,
                      color: prioInfo.color,
                      fontWeight: 600 
                    }}>
                      {prioInfo.icon} {prioInfo.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#1B3A5C', lineHeight: 1.5 }}>
                    {rec.recommendation_text}
                  </div>
                </div>
                <button
                  onClick={() => handleComplete(rec.id)}
                  disabled={isCompleting}
                  title={t.markDone}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: `2px solid ${color}40`,
                    background: '#fff',
                    cursor: isCompleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    color: color,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = color;
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = `${color}40`;
                    e.currentTarget.style.color = color;
                  }}
                >
                  ✓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Individual Recommendation Card
function RecommendationCard({ rec, language, onComplete, t }) {
  const catInfo = getCategoryInfo(rec.category, language);
  const prioInfo = getPriorityInfo(rec.priority, language);
  const [completing, setCompleting] = useState(false);

  const handleClick = async () => {
    setCompleting(true);
    await onComplete(rec.id);
  };

  return (
    <div 
      style={{
        padding: 16,
        background: catInfo.bgColor,
        borderRadius: 10,
        marginBottom: 10,
        borderLeft: `4px solid ${prioInfo.color}`,
        transition: 'all 0.3s',
        opacity: completing ? 0.5 : 1,
        transform: completing ? 'translateX(20px)' : 'translateX(0)',
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: 12 
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 8,
            flexWrap: 'wrap' 
          }}>
            <span style={{ 
              fontSize: 11, 
              padding: '3px 8px', 
              borderRadius: 6,
              background: catInfo.color,
              color: '#fff',
              fontWeight: 600 
            }}>
              {catInfo.icon} {catInfo.label}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#1B3A5C', lineHeight: 1.5 }}>
            {rec.recommendation_text}
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={completing}
          title={t.markDone}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '2px solid #D5D8DC',
            background: '#fff',
            cursor: completing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#27AE60';
            e.currentTarget.style.borderColor = '#27AE60';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#D5D8DC';
            e.currentTarget.style.color = '#1B3A5C';
          }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}

/**
 * Notification Badge Component for Analytics
 */
export function RecommendationBadge({ count, onClick }) {
  if (!count || count === 0) return null;
  
  return (
    <div 
      onClick={onClick}
      style={{
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8E44AD, #9B59B6)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(142, 68, 173, 0.4)',
        animation: 'pulse 2s infinite',
      }}
    >
      {count > 9 ? '9+' : count}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Recommendations Modal for Analytics Dashboard
 */
export function RecommendationsModal({ assessment, language, onClose, onCountChange }) {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: "'Outfit', sans-serif",
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1B3A5C' }}>
              {assessment.customer_name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7F8C8D' }}>
              {INDUSTRIES[assessment.industry]?.icon} {INDUSTRIES[assessment.industry]?.label}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#F7F9FC',
              cursor: 'pointer',
              fontSize: 18,
              color: '#7F8C8D',
            }}
          >
            ✕
          </button>
        </div>
        
        <Recommendations 
          assessment={assessment}
          language={language}
          compact={true}
          onCountChange={onCountChange}
        />
      </div>
    </div>
  );
}
