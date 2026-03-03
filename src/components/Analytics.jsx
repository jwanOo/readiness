import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { INDUSTRIES, getIndustryInfo } from '../lib/constants';
import { computeReadinessFromAnswers, calculateOverallScore, getScoreColor, getScoreLabel } from '../lib/scoring';
import { RecommendationsModal } from './Recommendations';
import { generateRecommendations } from '../lib/aiService';
import AnalyticsAIPanel from './AnalyticsAIPanel';

export default function Analytics({ onSelectAssessment }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [assessmentScores, setAssessmentScores] = useState({});
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  
  // Recommendations state
  const [selectedForRecs, setSelectedForRecs] = useState(null);
  const [recommendationCounts, setRecommendationCounts] = useState({});
  const [generatingRecs, setGeneratingRecs] = useState({});
  const autoGenerateRef = useRef(false);
  
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_readiness_language') || 'de';
    }
    return 'de';
  });

  useEffect(() => {
    if (user) {
      fetchAssessmentsWithScores();
    }
  }, [user]);

  // Auto-generate recommendations for assessments without any
  useEffect(() => {
    if (!loading && assessments.length > 0 && !autoGenerateRef.current) {
      autoGenerateRef.current = true;
      autoGenerateRecommendations();
    }
  }, [loading, assessments]);

  const fetchAssessmentsWithScores = async () => {
    try {
      // Fetch assessments created by the current user
      const { data: myAssessments, error: myError } = await supabase
        .from('assessments')
        .select('*')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (myError) throw myError;

      // Fetch section assignments for the current user to get assigned assessments
      const { data: assignments, error: assignError } = await supabase
        .from('section_assignments')
        .select('assessment_id')
        .eq('assigned_to', user.id);

      // Get unique assigned assessment IDs
      const assignedIds = [...new Set((assignments || []).map(a => a.assessment_id))];
      
      // Fetch assigned assessments (that are not already in myAssessments)
      let assignedAssessments = [];
      if (assignedIds.length > 0) {
        const myIds = (myAssessments || []).map(a => a.id);
        const idsToFetch = assignedIds.filter(id => !myIds.includes(id));
        
        if (idsToFetch.length > 0) {
          const { data: assigned, error: assignedError } = await supabase
            .from('assessments')
            .select('*')
            .in('id', idsToFetch);
          
          if (!assignedError) {
            assignedAssessments = assigned || [];
          }
        }
      }

      // Combine: my assessments + assigned assessments (no duplicates)
      const assessmentsData = [...(myAssessments || []), ...assignedAssessments];

      // Fetch answers for all assessments
      const scores = {};
      for (const assessment of assessmentsData || []) {
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('assessment_id', assessment.id);

        if (answers && answers.length > 0) {
          const answersObj = {};
          answers.forEach(a => {
            answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
          });
          const readiness = computeReadinessFromAnswers(answersObj);
          scores[assessment.id] = {
            ...readiness,
            overall: calculateOverallScore(readiness),
            answersCount: answers.length
          };
        } else {
          scores[assessment.id] = { sap: 0, btp: 0, data: 0, overall: 0, answersCount: 0 };
        }
      }

      setAssessments(assessmentsData || []);
      setAssessmentScores(scores);
      
      // Fetch recommendation counts
      await fetchRecommendationCounts(assessmentsData);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendation counts for all assessments
  const fetchRecommendationCounts = async (assessmentsList) => {
    try {
      const counts = {};
      for (const assessment of assessmentsList || []) {
        const { data, error } = await supabase
          .from('recommendations')
          .select('id')
          .eq('assessment_id', assessment.id)
          .eq('is_completed', false);
        
        if (!error) {
          counts[assessment.id] = data?.length || 0;
        } else {
          counts[assessment.id] = 0;
        }
      }
      setRecommendationCounts(counts);
    } catch (error) {
      console.log('Could not fetch recommendation counts:', error);
    }
  };

  // Auto-generate recommendations for assessments that have answers but no recommendations
  const autoGenerateRecommendations = async () => {
    const assessmentsToGenerate = assessments.filter(a => {
      const score = assessmentScores[a.id];
      const recCount = recommendationCounts[a.id] || 0;
      // Only generate for assessments with answers but no recommendations
      return score?.answersCount > 0 && recCount === 0;
    });

    // Generate for up to 3 assessments at a time to avoid overwhelming the API
    const toGenerate = assessmentsToGenerate.slice(0, 3);
    
    for (const assessment of toGenerate) {
      await generateRecsForAssessment(assessment);
    }
  };

  // Generate recommendations for a single assessment
  const generateRecsForAssessment = async (assessment) => {
    if (generatingRecs[assessment.id]) return;
    
    setGeneratingRecs(prev => ({ ...prev, [assessment.id]: true }));
    
    try {
      // Fetch answers for this assessment
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessment.id);
      
      if (!answersData || answersData.length === 0) {
        setGeneratingRecs(prev => ({ ...prev, [assessment.id]: false }));
        return;
      }

      const answersObj = {};
      answersData.forEach(a => {
        answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
      });

      const scores = assessmentScores[assessment.id] || computeReadinessFromAnswers(answersObj);
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

      try {
        const { data: savedRecs, error: saveError } = await supabase
          .from('recommendations')
          .insert(recsToSave)
          .select();

        if (!saveError && savedRecs) {
          setRecommendationCounts(prev => ({
            ...prev,
            [assessment.id]: savedRecs.length
          }));
        }
      } catch (dbError) {
        console.warn('Could not save recommendations:', dbError);
        // Still update the count locally
        setRecommendationCounts(prev => ({
          ...prev,
          [assessment.id]: newRecs.length
        }));
      }
    } catch (error) {
      console.error('Error generating recommendations for', assessment.customer_name, ':', error);
    } finally {
      setGeneratingRecs(prev => ({ ...prev, [assessment.id]: false }));
    }
  };

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    let filtered = [...assessments];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        const customerMatch = a.customer_name?.toLowerCase().includes(query);
        const industryLabel = INDUSTRIES[a.industry]?.label?.toLowerCase() || '';
        const industryMatch = industryLabel.includes(query) || a.industry?.toLowerCase().includes(query);
        return customerMatch || industryMatch;
      });
    }
    
    // Industry filter
    if (filterIndustry !== 'all') {
      filtered = filtered.filter(a => a.industry === filterIndustry);
    }
    
    return filtered;
  }, [assessments, searchQuery, filterIndustry]);

  // Sort by score for top performers and action needed
  const sortedByScore = useMemo(() => {
    return [...filteredAssessments].sort((a, b) => {
      const scoreA = assessmentScores[a.id]?.overall || 0;
      const scoreB = assessmentScores[b.id]?.overall || 0;
      return scoreB - scoreA;
    });
  }, [filteredAssessments, assessmentScores]);

  // Top performers (score >= 66)
  const topPerformers = sortedByScore.filter(a => (assessmentScores[a.id]?.overall || 0) >= 66);
  
  // Action needed (score < 50)
  const actionNeeded = sortedByScore.filter(a => (assessmentScores[a.id]?.overall || 0) < 50 && assessmentScores[a.id]?.answersCount > 0);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .analytics { min-height: 100vh; background: #F7F9FC; font-family: 'Outfit', sans-serif; }
    .analytics-header { background: #fff; border-bottom: 1px solid #E8EDF2; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    .analytics-content { padding: 32px; max-width: 1200px; margin: 0 auto; }
    .card { background: #fff; border-radius: 14px; border: 1px solid #E8EDF2; padding: 20px; margin-bottom: 16px; transition: all 0.2s; }
    .card:hover { border-color: #2E86C1; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .card-clickable { cursor: pointer; }
    .card-clickable:hover { transform: translateY(-2px); }
    .btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s; }
    .btn:hover { transform: translateY(-2px); }
    .btn-secondary { background: #fff; color: #5D6D7E; border: 2px solid #E8EDF2; }
    .score-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; }
  `;

  if (loading) {
    return (
      <div className="analytics">
        <style>{styles}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, color: '#5D6D7E' }}>Lade Analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="analytics-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ← Zurück
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1B3A5C', margin: 0 }}>
              📊 Analytics Dashboard
            </h1>
            <p style={{ fontSize: 12, color: '#7F8C8D', margin: 0 }}>
              Kundenübersicht und AI Readiness Vergleich
            </p>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* Search and Filter */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 250px', minWidth: 200 }}>
              <input
                type="text"
                placeholder="🔍 Suchen nach Kunde oder Branche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E8EDF2',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2E86C1'}
                onBlur={(e) => e.target.style.borderColor = '#E8EDF2'}
              />
            </div>
            
            {/* Industry Filter */}
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #E8EDF2',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: 'Outfit, sans-serif',
                background: '#fff',
                cursor: 'pointer',
                minWidth: 180
              }}
            >
              <option value="all">Alle Branchen</option>
              {Object.entries(INDUSTRIES).map(([key, ind]) => (
                <option key={key} value={key}>{ind.icon} {ind.label}</option>
              ))}
            </select>
            
            {/* Clear Filters */}
            {(searchQuery || filterIndustry !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterIndustry('all');
                }}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif',
                  background: '#FDEDEC',
                  color: '#E74C3C',
                  cursor: 'pointer'
                }}
              >
                ✕ Filter zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #2E86C1 100%)', color: '#fff' }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{filteredAssessments.length}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Kunden gesamt</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)', color: '#fff' }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{topPerformers.length}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>🏆 Top Performer</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)', color: '#fff' }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{actionNeeded.length}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>⚠️ Handlungsbedarf</div>
          </div>
        </div>

        {/* Two Column Layout: Top Performers & Action Needed */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Top Performers */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#27AE60', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 Top Performer
              <span style={{ fontSize: 12, fontWeight: 500, color: '#7F8C8D' }}>({topPerformers.length})</span>
            </h2>
            {topPerformers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: '#95A5A6' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div>Noch keine Top Performer</div>
              </div>
            ) : (
              topPerformers.slice(0, 5).map(assessment => {
                const score = assessmentScores[assessment.id];
                const industry = INDUSTRIES[assessment.industry];
                return (
                  <div 
                    key={assessment.id} 
                    className="card card-clickable"
                    onClick={() => onSelectAssessment && onSelectAssessment(assessment)}
                    style={{ borderLeft: '4px solid #27AE60' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 10, 
                          background: industry?.color || '#2E86C1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20
                        }}>
                          {industry?.icon || '📋'}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>
                            {assessment.customer_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#7F8C8D' }}>
                            {industry?.label || assessment.industry}
                          </div>
                        </div>
                      </div>
                      <div className="score-badge" style={{ background: '#EAFAF1', color: '#27AE60' }}>
                        ✓ {score?.overall || 0}%
                      </div>
                    </div>
                    {/* Progress Bars */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>SAP</span>
                          <span>{score?.sap || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.sap || 0}%`, height: '100%', background: getScoreColor(score?.sap || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>BTP</span>
                          <span>{score?.btp || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.btp || 0}%`, height: '100%', background: getScoreColor(score?.btp || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>Daten</span>
                          <span>{score?.data || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.data || 0}%`, height: '100%', background: getScoreColor(score?.data || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Needed */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E74C3C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ Handlungsbedarf
              <span style={{ fontSize: 12, fontWeight: 500, color: '#7F8C8D' }}>({actionNeeded.length})</span>
            </h2>
            {actionNeeded.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: '#95A5A6' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div>Keine Kunden mit dringendem Handlungsbedarf</div>
              </div>
            ) : (
              actionNeeded.slice(0, 5).map(assessment => {
                const score = assessmentScores[assessment.id];
                const industry = INDUSTRIES[assessment.industry];
                return (
                  <div 
                    key={assessment.id} 
                    className="card card-clickable"
                    onClick={() => onSelectAssessment && onSelectAssessment(assessment)}
                    style={{ borderLeft: '4px solid #E74C3C' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 10, 
                          background: industry?.color || '#2E86C1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20
                        }}>
                          {industry?.icon || '📋'}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>
                            {assessment.customer_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#7F8C8D' }}>
                            {industry?.label || assessment.industry}
                          </div>
                        </div>
                      </div>
                      <div className="score-badge" style={{ background: '#FDEDEC', color: '#E74C3C' }}>
                        ⚠️ {score?.overall || 0}%
                      </div>
                    </div>
                    {/* Progress Bars */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>SAP</span>
                          <span>{score?.sap || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.sap || 0}%`, height: '100%', background: getScoreColor(score?.sap || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>BTP</span>
                          <span>{score?.btp || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.btp || 0}%`, height: '100%', background: getScoreColor(score?.btp || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7F8C8D', marginBottom: 3 }}>
                          <span>Daten</span>
                          <span>{score?.data || 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${score?.data || 0}%`, height: '100%', background: getScoreColor(score?.data || 0), borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Full Customer List */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Alle Kunden
            <span style={{ fontSize: 12, fontWeight: 500, color: '#7F8C8D' }}>({filteredAssessments.length})</span>
          </h2>
          
          {filteredAssessments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: '#95A5A6' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Keine Kunden gefunden</div>
              <div style={{ fontSize: 14 }}>Passen Sie Ihre Filterkriterien an.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedByScore.map(assessment => {
                const score = assessmentScores[assessment.id];
                const industry = INDUSTRIES[assessment.industry];
                const scoreColor = getScoreColor(score?.overall || 0);
                const scoreLabel = getScoreLabel(score?.overall || 0);
                
                return (
                  <div 
                    key={assessment.id} 
                    className="card card-clickable"
                    onClick={() => onSelectAssessment && onSelectAssessment(assessment)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 12, 
                          background: industry?.gradient || industry?.color || '#2E86C1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24
                        }}>
                          {industry?.icon || '📋'}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C' }}>
                            {assessment.customer_name}
                          </div>
                          <div style={{ fontSize: 13, color: '#7F8C8D' }}>
                            {industry?.label || assessment.industry}
                          </div>
                          <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 2 }}>
                            {score?.answersCount || 0} Antworten • Aktualisiert: {new Date(assessment.updated_at || assessment.created_at).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Score Bars */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 2 }}>SAP</div>
                            <div style={{ 
                              width: 50, 
                              height: 6, 
                              background: '#E8EDF2', 
                              borderRadius: 3,
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${score?.sap || 0}%`, 
                                height: '100%', 
                                background: getScoreColor(score?.sap || 0),
                                borderRadius: 3
                              }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 2 }}>BTP</div>
                            <div style={{ 
                              width: 50, 
                              height: 6, 
                              background: '#E8EDF2', 
                              borderRadius: 3,
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${score?.btp || 0}%`, 
                                height: '100%', 
                                background: getScoreColor(score?.btp || 0),
                                borderRadius: 3
                              }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#7F8C8D', marginBottom: 2 }}>Daten</div>
                            <div style={{ 
                              width: 50, 
                              height: 6, 
                              background: '#E8EDF2', 
                              borderRadius: 3,
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${score?.data || 0}%`, 
                                height: '100%', 
                                background: getScoreColor(score?.data || 0),
                                borderRadius: 3
                              }} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Overall Score */}
                        <div 
                          className="score-badge" 
                          style={{ 
                            background: `${scoreColor}15`, 
                            color: scoreColor,
                            minWidth: 80,
                            justifyContent: 'center'
                          }}
                        >
                          {score?.overall || 0}%
                        </div>
                        
                        {/* AI Recommendations Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (generatingRecs[assessment.id]) return;
                            setSelectedForRecs(assessment);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: generatingRecs[assessment.id] 
                              ? '#BDC3C7' 
                              : 'linear-gradient(135deg, #8E44AD, #9B59B6)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: generatingRecs[assessment.id] ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                            position: 'relative',
                            minWidth: 70,
                            justifyContent: 'center',
                          }}
                          onMouseOver={(e) => !generatingRecs[assessment.id] && (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {generatingRecs[assessment.id] ? (
                            <>⏳ ...</>
                          ) : (
                            <>
                              🤖
                              {(recommendationCounts[assessment.id] || 0) > 0 && (
                                <span style={{
                                  background: '#fff',
                                  color: '#8E44AD',
                                  borderRadius: '50%',
                                  width: 18,
                                  height: 18,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}>
                                  {recommendationCounts[assessment.id]}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations Modal */}
      {selectedForRecs && (
        <RecommendationsModal
          assessment={selectedForRecs}
          language={language}
          onClose={() => setSelectedForRecs(null)}
          onCountChange={(assessmentId, newCount) => {
            setRecommendationCounts(prev => ({
              ...prev,
              [assessmentId]: newCount
            }));
          }}
        />
      )}
      
      {/* Analytics AI Assistant */}
      <AnalyticsAIPanel 
        language={language}
        userId={user?.id}
      />
    </div>
  );
}
