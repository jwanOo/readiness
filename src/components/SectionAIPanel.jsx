import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { INDUSTRIES } from '../lib/constants';
import { computeReadinessFromAnswers, calculateOverallScore } from '../lib/scoring';

/**
 * Simple markdown renderer for chat messages
 * Supports: **bold**, *italic*, `code`, bullet points, numbered lists
 */
const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let currentList = null;
  let listType = null;
  
  lines.forEach((line) => {
    const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)$/);
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/);
    
    if (bulletMatch) {
      if (listType !== 'ul') {
        if (currentList) elements.push(currentList);
        currentList = { type: 'ul', items: [] };
        listType = 'ul';
      }
      currentList.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (listType !== 'ol') {
        if (currentList) elements.push(currentList);
        currentList = { type: 'ol', items: [] };
        listType = 'ol';
      }
      currentList.items.push(numberedMatch[2]);
    } else {
      if (currentList) {
        elements.push(currentList);
        currentList = null;
        listType = null;
      }
      if (line.trim()) {
        elements.push({ type: 'p', content: line });
      } else if (elements.length > 0) {
        elements.push({ type: 'br' });
      }
    }
  });
  
  if (currentList) elements.push(currentList);
  
  const renderInline = (text) => {
    let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');
    result = result.replace(/`([^`]+)`/g, '<code style="background:#F0F3F4;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>');
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#2E86C1;text-decoration:underline;">$1</a>');
    return result;
  };
  
  return (
    <div>
      {elements.map((el, i) => {
        if (el.type === 'ul') {
          return (
            <ul key={i} style={{ margin: '8px 0', paddingLeft: 20, listStyleType: 'disc' }}>
              {el.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4, fontSize: 13 }} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
              ))}
            </ul>
          );
        }
        if (el.type === 'ol') {
          return (
            <ol key={i} style={{ margin: '8px 0', paddingLeft: 20 }}>
              {el.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4, fontSize: 13 }} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
              ))}
            </ol>
          );
        }
        if (el.type === 'br') {
          return <div key={i} style={{ height: 8 }} />;
        }
        if (el.type === 'p') {
          return (
            <p key={i} style={{ margin: '4px 0', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: renderInline(el.content) }} />
          );
        }
        return null;
      })}
    </div>
  );
};

// AI Configuration
const AI_CONFIG = {
  baseUrl: 'https://adesso-ai-hub.3asabc.de/v1',
  apiKey: 'sk-ccwu3ZNJMFCfQG76gRaGjg',
  model: 'gpt-oss-120b-sovereign',
  maxTokens: 1000,
  temperature: 0.7,
};

export default function SectionAIPanel({ 
  section, 
  answers, 
  industry, 
  language = 'de',
  customerName = '',
  userId = null,
  assessmentId = null,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const chatContainerRef = useRef(null);
  
  // Database context for RAG
  const [dbContext, setDbContext] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [lastDbRefresh, setLastDbRefresh] = useState(null);

  // Storage key for chat history
  const getChatStorageKey = () => {
    if (!userId || !assessmentId) return null;
    return `ai_chat_${userId}_${assessmentId}`;
  };

  // Load chat history
  useEffect(() => {
    const storageKey = getChatStorageKey();
    if (storageKey) {
      try {
        const savedChat = localStorage.getItem(storageKey);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed)) setChatMessages(parsed);
        }
      } catch (e) {
        console.warn('Could not load chat history:', e);
      }
    }
  }, [userId, assessmentId]);

  // Save chat history
  useEffect(() => {
    const storageKey = getChatStorageKey();
    if (storageKey && chatMessages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chatMessages));
      } catch (e) {
        console.warn('Could not save chat history:', e);
      }
    }
  }, [chatMessages, userId, assessmentId]);

  // Load database context for RAG
  useEffect(() => {
    if (assessmentId) {
      loadDatabaseContext();
    }
  }, [assessmentId]);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, streamingMessage]);

  /**
   * Load database context from Supabase for RAG
   * Includes: current assessment, saved answers, other assessments for comparison
   */
  const loadDatabaseContext = async () => {
    if (!assessmentId) return;
    
    setDbLoading(true);
    try {
      // 1. Load current assessment details
      const { data: currentAssessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // 2. Load saved answers for current assessment
      const { data: savedAnswers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (answersError) throw answersError;

      // 3. Load other assessments for comparison (same industry or all)
      const { data: otherAssessments, error: othersError } = await supabase
        .from('assessments')
        .select('*')
        .neq('id', assessmentId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (othersError) throw othersError;

      // 4. Load answers for other assessments (for comparison)
      const otherIds = (otherAssessments || []).map(a => a.id);
      let otherAnswers = [];
      if (otherIds.length > 0) {
        const { data: othersAnswersData, error: othersAnswersError } = await supabase
          .from('answers')
          .select('*')
          .in('assessment_id', otherIds);
        
        if (!othersAnswersError) {
          otherAnswers = othersAnswersData || [];
        }
      }

      // 5. Load user profile if available
      let userProfile = null;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        userProfile = profile;
      }

      // Process and structure the data
      const processedContext = processDbContext({
        currentAssessment,
        savedAnswers: savedAnswers || [],
        otherAssessments: otherAssessments || [],
        otherAnswers,
        userProfile,
      });

      setDbContext(processedContext);
      setLastDbRefresh(new Date());
    } catch (error) {
      console.error('Error loading database context:', error);
      setDbContext(null);
    } finally {
      setDbLoading(false);
    }
  };

  /**
   * Process raw database data into structured context for RAG
   */
  const processDbContext = ({ currentAssessment, savedAnswers, otherAssessments, otherAnswers, userProfile }) => {
    // Convert saved answers to object format
    const savedAnswersObj = {};
    savedAnswers.forEach(a => {
      savedAnswersObj[`${a.section_id}_${a.question_index}`] = a.answer;
    });

    // Calculate scores for current assessment
    const currentScores = computeReadinessFromAnswers(savedAnswersObj);
    const currentOverall = calculateOverallScore(currentScores);

    // Process other assessments with their scores
    const processedOthers = otherAssessments.map(assessment => {
      const assessmentAnswers = otherAnswers.filter(a => a.assessment_id === assessment.id);
      const answersObj = {};
      assessmentAnswers.forEach(a => {
        answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
      });
      const scores = computeReadinessFromAnswers(answersObj);
      const overall = calculateOverallScore(scores);
      const industryInfo = INDUSTRIES[assessment.industry];

      return {
        id: assessment.id,
        customerName: assessment.customer_name,
        industry: assessment.industry,
        industryLabel: industryInfo?.label || assessment.industry,
        status: assessment.status,
        scores: { ...scores, overall },
        answersCount: assessmentAnswers.length,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
      };
    });

    // Group by industry for comparison
    const byIndustry = processedOthers.reduce((acc, a) => {
      if (!acc[a.industry]) {
        acc[a.industry] = { count: 0, totalScore: 0, label: a.industryLabel, assessments: [] };
      }
      acc[a.industry].count++;
      acc[a.industry].totalScore += a.scores.overall;
      acc[a.industry].assessments.push(a);
      return acc;
    }, {});

    // Find same industry assessments for direct comparison
    const sameIndustry = processedOthers.filter(a => a.industry === currentAssessment?.industry);

    return {
      current: {
        id: currentAssessment?.id,
        customerName: currentAssessment?.customer_name,
        industry: currentAssessment?.industry,
        industryLabel: INDUSTRIES[currentAssessment?.industry]?.label || currentAssessment?.industry,
        status: currentAssessment?.status,
        scores: { ...currentScores, overall: currentOverall },
        savedAnswers: savedAnswersObj,
        savedAnswersCount: savedAnswers.length,
        createdAt: currentAssessment?.created_at,
        updatedAt: currentAssessment?.updated_at,
      },
      comparison: {
        totalAssessments: processedOthers.length,
        sameIndustry: sameIndustry,
        sameIndustryCount: sameIndustry.length,
        sameIndustryAvgScore: sameIndustry.length > 0 
          ? Math.round(sameIndustry.reduce((sum, a) => sum + a.scores.overall, 0) / sameIndustry.length)
          : 0,
        allAvgScore: processedOthers.length > 0
          ? Math.round(processedOthers.reduce((sum, a) => sum + a.scores.overall, 0) / processedOthers.length)
          : 0,
        byIndustry,
        topPerformers: processedOthers.filter(a => a.scores.overall >= 66).slice(0, 5),
      },
      user: userProfile,
      lastRefresh: new Date().toISOString(),
    };
  };

  const clearChatHistory = () => {
    setChatMessages([]);
    const storageKey = getChatStorageKey();
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}
    }
  };

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

  /**
   * Build RAG context string from database data
   */
  const buildRAGContext = () => {
    if (!dbContext) return '';

    const { current, comparison } = dbContext;
    
    let context = `
DATENBANK-KONTEXT (Supabase - Stand: ${dbContext.lastRefresh}):

═══ AKTUELLES ASSESSMENT ═══
• Kunde: ${current.customerName || 'Unbekannt'}
• Branche: ${current.industryLabel || current.industry || 'Unbekannt'}
• Status: ${current.status || 'in_progress'}
• Gespeicherte Antworten: ${current.savedAnswersCount}
• AI Readiness Scores:
  - SAP System: ${current.scores.sap}%
  - BTP & AI Platform: ${current.scores.btp}%
  - Datenreife: ${current.scores.data}%
  - Gesamt: ${current.scores.overall}%
• Erstellt: ${current.createdAt ? new Date(current.createdAt).toLocaleDateString('de-DE') : 'k.A.'}
• Zuletzt aktualisiert: ${current.updatedAt ? new Date(current.updatedAt).toLocaleDateString('de-DE') : 'k.A.'}

═══ GESPEICHERTE ANTWORTEN ═══
${Object.entries(current.savedAnswers || {}).length > 0 
  ? Object.entries(current.savedAnswers).map(([key, value]) => `• ${key}: ${value}`).join('\n')
  : '(Noch keine Antworten in der Datenbank gespeichert)'}

═══ VERGLEICHSDATEN ═══
• Gesamtanzahl anderer Assessments: ${comparison.totalAssessments}
• Assessments in gleicher Branche (${current.industryLabel}): ${comparison.sameIndustryCount}
• Durchschnittsscore gleiche Branche: ${comparison.sameIndustryAvgScore}%
• Durchschnittsscore alle Branchen: ${comparison.allAvgScore}%

${comparison.sameIndustry.length > 0 ? `
═══ VERGLEICH MIT GLEICHER BRANCHE ═══
${comparison.sameIndustry.slice(0, 5).map(a => 
  `• ${a.customerName}: ${a.scores.overall}% (SAP: ${a.scores.sap}%, BTP: ${a.scores.btp}%, Daten: ${a.scores.data}%)`
).join('\n')}
` : ''}

${comparison.topPerformers.length > 0 ? `
═══ TOP PERFORMER (≥66%) ═══
${comparison.topPerformers.map(a => 
  `• ${a.customerName} (${a.industryLabel}): ${a.scores.overall}%`
).join('\n')}
` : ''}

═══ BRANCHEN-ÜBERSICHT ═══
${Object.entries(comparison.byIndustry).map(([key, data]) => 
  `• ${data.label}: ${data.count} Assessments, Ø ${Math.round(data.totalScore / data.count)}%`
).join('\n')}
`;

    return context;
  };

  const getChatSystemPrompt = () => {
    const sectionAnswers = getSectionAnswers();
    const answersText = Object.entries(sectionAnswers)
      .map(([q, a]) => `- ${q}: ${a}`)
      .join('\n');

    const ragContext = buildRAGContext();

    if (language === 'en') {
      return `You are an SAP AI consultant helping with an AI Readiness Assessment. You have access to the Supabase database with saved assessments and answers.

Section: ${section?.title || 'Unknown'}
${customerName ? `Customer: ${customerName}` : ''}
${industry ? `Industry: ${industry.label}` : ''}

Current answers (in session):
${answersText || 'No answers yet'}

${ragContext ? `
DATABASE CONTEXT (from Supabase):
${ragContext}
` : ''}

CAPABILITIES:
1. Answer questions about the current assessment
2. Compare with other assessments in the database
3. Show saved answers and progress
4. Provide industry benchmarks
5. Give SAP-specific recommendations

INSTRUCTIONS:
1. Use flowing text, NOT tables
2. Use bullet points (•) for lists
3. Keep paragraphs short (2-3 sentences)
4. Ground answers in SAP official sources when relevant
5. Reference database data when answering comparison questions
6. End with "📚 Source:" section when relevant

Be concise and helpful. Answer in English.`;
    }

    return `Du bist ein SAP KI-Berater für AI Readiness Assessments. Du hast Zugriff auf die Supabase-Datenbank mit gespeicherten Assessments und Antworten.

Abschnitt: ${section?.title || 'Unbekannt'}
${customerName ? `Kunde: ${customerName}` : ''}
${industry ? `Branche: ${industry.label}` : ''}

Aktuelle Antworten (in der Session):
${answersText || 'Noch keine Antworten'}

${ragContext ? `
DATENBANK-KONTEXT (aus Supabase):
${ragContext}
` : ''}

FÄHIGKEITEN:
1. Fragen zum aktuellen Assessment beantworten
2. Mit anderen Assessments in der Datenbank vergleichen
3. Gespeicherte Antworten und Fortschritt anzeigen
4. Branchen-Benchmarks liefern
5. SAP-spezifische Empfehlungen geben

ANWEISUNGEN:
1. Verwende Fließtext, KEINE Tabellen
2. Verwende Aufzählungspunkte (•) für Listen
3. Halte Absätze kurz (2-3 Sätze)
4. Basiere Antworten auf SAP-Quellen wenn relevant
5. Referenziere Datenbankdaten bei Vergleichsfragen
6. Ende mit "📚 Quelle:" Abschnitt wenn relevant

Sei prägnant und hilfreich. Antworte auf Deutsch.`;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    setStreamingMessage('');

    try {
      const conversationHistory = chatMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: getChatSystemPrompt() },
            ...conversationHistory,
            { role: 'user', content: userMessage },
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream') || response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullMessage += content;
                  setStreamingMessage(fullMessage);
                }
              } catch (e) {}
            }
          }
        }

        if (fullMessage) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: fullMessage }]);
        }
        setStreamingMessage('');
      } else {
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;

        if (assistantMessage) {
          const words = assistantMessage.split(' ');
          let displayedMessage = '';
          
          for (let i = 0; i < words.length; i++) {
            displayedMessage += (i > 0 ? ' ' : '') + words[i];
            setStreamingMessage(displayedMessage);
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
          setStreamingMessage('');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'de' 
          ? 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.'
          : 'Sorry, there was an error. Please try again.',
        isError: true,
      }]);
      setStreamingMessage('');
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefreshDb = () => {
    loadDatabaseContext();
  };

  if (!section) return null;

  // Collapsed state - pill button
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '14px 28px',
          borderRadius: 50,
          border: 'none',
          background: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          fontFamily: 'Outfit, sans-serif',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#2E86C1"/>
          <path d="M19 2L19.5 4L21 3.5L19.5 5L20 7L18.5 5.5L17 6L18 4.5L17 3L18.5 3.5L19 2Z" fill="#2E86C1" opacity="0.6"/>
        </svg>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#2E86C1' }}>Silava</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C' }}>ai</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -4 }}>
          <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#F39C12" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {/* Database indicator */}
        {dbContext && (
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#27AE60',
            marginLeft: 4,
          }} title="Database connected" />
        )}
      </button>
    );
  }

  // Expanded state - floating chat window (bigger than Analytics)
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 450,
      height: 640,
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: '#fff',
        borderBottom: '1px solid #E8EDF2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#F7F9FC'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="#5D6D7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#2E86C1"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2E86C1' }}>Silava</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>ai</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -2 }}>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#F39C12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {/* Database status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 8,
            padding: '2px 8px',
            background: dbContext ? '#EAFAF1' : '#FEF9E7',
            borderRadius: 10,
            fontSize: 10,
            color: dbContext ? '#27AE60' : '#F39C12',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dbContext ? '#27AE60' : '#F39C12',
            }} />
            {dbLoading ? 'Loading...' : dbContext ? 'DB' : 'No DB'}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Refresh database button */}
          <button
            onClick={handleRefreshDb}
            disabled={dbLoading}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              cursor: dbLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'background 0.2s',
              opacity: dbLoading ? 0.5 : 1,
            }}
            onMouseOver={(e) => !dbLoading && (e.currentTarget.style.background = '#F7F9FC')}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title={language === 'de' ? 'Datenbank aktualisieren' : 'Refresh database'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: dbLoading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267" stroke="#5D6D7E" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 3V7H17" stroke="#5D6D7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#F7F9FC'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="1.5" fill="#5D6D7E"/>
              <circle cx="12" cy="12" r="1.5" fill="#5D6D7E"/>
              <circle cx="12" cy="18" r="1.5" fill="#5D6D7E"/>
            </svg>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {chatMessages.length === 0 && !streamingMessage ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 24px',
            color: '#95A5A6',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12, color: '#5D6D7E' }}>
              {language === 'de' 
                ? 'Stellen Sie Fragen zu SAP, KI-Readiness oder diesem Assessment.'
                : 'Ask questions about SAP, AI readiness, or this assessment.'}
            </div>
            {dbContext && (
              <div style={{ 
                fontSize: 11, 
                color: '#27AE60', 
                marginBottom: 12,
                padding: '6px 12px',
                background: '#EAFAF1',
                borderRadius: 8,
                display: 'inline-block',
              }}>
                🗄️ {language === 'de' ? 'Datenbank verbunden - Ich kann gespeicherte Daten abfragen!' : 'Database connected - I can query saved data!'}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#BDC3C7', marginBottom: 20 }}>
              🔒 {language === 'de' ? 'Ihr Chat-Verlauf ist privat.' : 'Your chat history is private.'}
            </div>
            <div style={{ fontSize: 12, color: '#7F8C8D', marginBottom: 10 }}>
              {language === 'de' ? 'Beispiele:' : 'Examples:'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(language === 'de' ? [
                'Was ist Clean Core?',
                'Wie ist mein aktueller Score?',
                'Vergleiche mich mit anderen in meiner Branche',
                'Was habe ich bisher gespeichert?',
                'Welche Bereiche sollte ich verbessern?',
              ] : [
                'What is Clean Core?',
                'What is my current score?',
                'Compare me with others in my industry',
                'What have I saved so far?',
                'Which areas should I improve?',
              ]).map((example, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(example)}
                  style={{
                    background: '#F7F9FC',
                    border: '1px solid #E8EDF2',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#5D6D7E',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.target.style.background = '#EBF5FB'}
                  onMouseOut={(e) => e.target.style.background = '#F7F9FC'}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #1B3A5C, #2E86C1)' 
                      : msg.isError ? '#FDEDEC' : '#F7F9FC',
                    color: msg.role === 'user' ? '#fff' : msg.isError ? '#E74C3C' : '#1B3A5C',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                </div>
              </div>
            ))}
            
            {streamingMessage && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#F7F9FC',
                    color: '#1B3A5C',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {renderMarkdown(streamingMessage)}
                  <span style={{ 
                    display: 'inline-block',
                    width: 6,
                    height: 16,
                    background: '#2E86C1',
                    marginLeft: 2,
                    animation: 'blink 1s infinite',
                  }} />
                  <style>{`
                    @keyframes blink {
                      0%, 50% { opacity: 1; }
                      51%, 100% { opacity: 0; }
                    }
                  `}</style>
                </div>
              </div>
            )}
          </>
        )}
        
        {chatLoading && !streamingMessage && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 4px',
              background: '#F7F9FC',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ animation: 'bounce 1s infinite', animationDelay: '0s' }}>•</span>
              <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}>•</span>
              <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.4s' }}>•</span>
              <style>{`
                @keyframes bounce {
                  0%, 60%, 100% { transform: translateY(0); }
                  30% { transform: translateY(-4px); }
                }
              `}</style>
            </div>
          </div>
        )}
        
        {chatMessages.length > 0 && !chatLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button
              onClick={clearChatHistory}
              style={{
                background: 'transparent',
                border: '1px solid #E8EDF2',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                color: '#95A5A6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#FDEDEC';
                e.target.style.borderColor = '#E74C3C';
                e.target.style.color = '#E74C3C';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = '#E8EDF2';
                e.target.style.color = '#95A5A6';
              }}
            >
              🗑️ {language === 'de' ? 'Chat löschen' : 'Clear chat'}
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: 16,
        borderTop: '1px solid #E8EDF2',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F7F9FC',
          borderRadius: 24,
          padding: '4px 4px 4px 16px',
          border: '2px solid transparent',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ color: '#BDC3C7', fontSize: 18 }}>+</span>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'de' ? 'Stellen Sie irgendeine Frage' : 'Ask any question'}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              color: '#1B3A5C',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || chatLoading}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: chatInput.trim() && !chatLoading 
                ? '#1B3A5C' 
                : '#E8EDF2',
              color: chatInput.trim() && !chatLoading ? '#fff' : '#BDC3C7',
              cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}