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
  
  // Split by lines to handle lists
  const lines = text.split('\n');
  const elements = [];
  let currentList = null;
  let listType = null;
  
  lines.forEach((line, lineIndex) => {
    // Check for bullet points
    const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)$/);
    // Check for numbered lists
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/);
    
    if (bulletMatch) {
      if (listType !== 'ul') {
        if (currentList) {
          elements.push(currentList);
        }
        currentList = { type: 'ul', items: [] };
        listType = 'ul';
      }
      currentList.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (listType !== 'ol') {
        if (currentList) {
          elements.push(currentList);
        }
        currentList = { type: 'ol', items: [] };
        listType = 'ol';
      }
      currentList.items.push(numberedMatch[2]);
    } else {
      // Not a list item, close any open list
      if (currentList) {
        elements.push(currentList);
        currentList = null;
        listType = null;
      }
      
      // Process inline formatting
      if (line.trim()) {
        elements.push({ type: 'p', content: line });
      } else if (elements.length > 0) {
        elements.push({ type: 'br' });
      }
    }
  });
  
  // Close any remaining list
  if (currentList) {
    elements.push(currentList);
  }
  
  // Render inline formatting
  const renderInline = (text) => {
    // Process bold (**text** or __text__)
    let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Process italic (*text* or _text_)
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Process inline code (`code`)
    result = result.replace(/`([^`]+)`/g, '<code style="background:#F0F3F4;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:11px;">$1</code>');
    
    // Process links [text](url)
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
                <li key={j} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
              ))}
            </ul>
          );
        }
        if (el.type === 'ol') {
          return (
            <ol key={i} style={{ margin: '8px 0', paddingLeft: 20 }}>
              {el.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
              ))}
            </ol>
          );
        }
        if (el.type === 'br') {
          return <div key={i} style={{ height: 8 }} />;
        }
        if (el.type === 'p') {
          return (
            <p key={i} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: renderInline(el.content) }} />
          );
        }
        return null;
      })}
    </div>
  );
};

/**
 * AnalyticsAIPanel Component
 * An AI assistant for the Analytics page that can answer questions about
 * customers, their AI readiness status, and provide insights using RAG
 * (Retrieval Augmented Generation) from the Supabase database.
 */

// AI Configuration for adesso AI Hub
const AI_CONFIG = {
  baseUrl: 'https://adesso-ai-hub.3asabc.de/v1',
  apiKey: 'sk-ccwu3ZNJMFCfQG76gRaGjg',
  model: 'gpt-oss-120b-sovereign',
  maxTokens: 1000,
  temperature: 0.7,
};

export default function AnalyticsAIPanel({ 
  language = 'de',
  userId = null,
}) {
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Customer data cache for RAG
  const [customerData, setCustomerData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Generate a unique storage key for this user's analytics chat history
  const getChatStorageKey = () => {
    if (!userId) return null;
    return `ai_analytics_chat_${userId}`;
  };

  // Load chat history from localStorage on mount
  useEffect(() => {
    const storageKey = getChatStorageKey();
    if (storageKey) {
      try {
        const savedChat = localStorage.getItem(storageKey);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed)) {
            setChatMessages(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not load chat history:', e);
      }
    }
  }, [userId]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    const storageKey = getChatStorageKey();
    if (storageKey && chatMessages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chatMessages));
      } catch (e) {
        console.warn('Could not save chat history:', e);
      }
    }
  }, [chatMessages, userId]);

  // Load customer data from Supabase for RAG context
  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setDataLoading(true);
    try {
      // Fetch all assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .order('updated_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Fetch all answers
      const { data: allAnswers, error: answersError } = await supabase
        .from('answers')
        .select('*');

      if (answersError) throw answersError;

      // Process data for each assessment
      const processedData = (assessments || []).map(assessment => {
        // Get answers for this assessment
        const assessmentAnswers = (allAnswers || []).filter(a => a.assessment_id === assessment.id);
        
        // Convert to object format
        const answersObj = {};
        assessmentAnswers.forEach(a => {
          answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
        });

        // Calculate scores
        const readiness = computeReadinessFromAnswers(answersObj);
        const overall = calculateOverallScore(readiness);

        // Get industry info
        const industry = INDUSTRIES[assessment.industry];

        return {
          id: assessment.id,
          customerName: assessment.customer_name,
          industry: assessment.industry,
          industryLabel: industry?.label || assessment.industry,
          industryIcon: industry?.icon || '📋',
          status: assessment.status,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at,
          scores: {
            sap: readiness.sap,
            btp: readiness.btp,
            data: readiness.data,
            overall: overall,
          },
          answersCount: assessmentAnswers.length,
          // Include some key answers for context
          keyAnswers: {
            sapSystems: answersObj['landscape_0'] || '',
            sapVersion: answersObj['landscape_1'] || '',
            cloudStrategy: answersObj['landscape_2'] || '',
            btpUsage: answersObj['btp_0'] || '',
            dataQuality: answersObj['data_0'] || '',
            aiUsage: answersObj['aiSap_0'] || '',
          }
        };
      });

      setCustomerData({
        assessments: processedData,
        totalCount: processedData.length,
        topPerformers: processedData.filter(a => a.scores.overall >= 66),
        actionNeeded: processedData.filter(a => a.scores.overall < 50 && a.answersCount > 0),
        averageScore: processedData.length > 0 
          ? Math.round(processedData.reduce((sum, a) => sum + a.scores.overall, 0) / processedData.length)
          : 0,
        byIndustry: processedData.reduce((acc, a) => {
          if (!acc[a.industry]) {
            acc[a.industry] = { count: 0, totalScore: 0, label: a.industryLabel };
          }
          acc[a.industry].count++;
          acc[a.industry].totalScore += a.scores.overall;
          return acc;
        }, {}),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading customer data:', error);
      setCustomerData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Clear chat history function
  const clearChatHistory = () => {
    setChatMessages([]);
    const storageKey = getChatStorageKey();
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn('Could not clear chat history:', e);
      }
    }
  };

  // Scroll chat to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, streamingMessage]);

  // Build context from customer data for RAG
  const buildRAGContext = () => {
    if (!customerData) return 'Keine Kundendaten verfügbar.';

    const { assessments, totalCount, topPerformers, actionNeeded, averageScore, byIndustry } = customerData;

    // Build summary
    let context = `KUNDENDATEN-KONTEXT (Stand: ${new Date().toLocaleString('de-DE')}):

ÜBERSICHT:
• Gesamtanzahl Kunden: ${totalCount}
• Durchschnittlicher AI Readiness Score: ${averageScore}%
• Top Performer (≥66%): ${topPerformers.length}
• Handlungsbedarf (<50%): ${actionNeeded.length}

BRANCHEN-VERTEILUNG:
${Object.entries(byIndustry).map(([key, data]) => 
  `• ${data.label}: ${data.count} Kunden, Ø ${Math.round(data.totalScore / data.count)}%`
).join('\n')}

KUNDENLISTE (sortiert nach Score):
${assessments
  .sort((a, b) => b.scores.overall - a.scores.overall)
  .slice(0, 20) // Limit to top 20 for context size
  .map(a => `• ${a.customerName} (${a.industryLabel}): ${a.scores.overall}% gesamt | SAP: ${a.scores.sap}% | BTP: ${a.scores.btp}% | Daten: ${a.scores.data}% | Status: ${a.status} | ${a.answersCount} Antworten`)
  .join('\n')}

${assessments.length > 20 ? `\n... und ${assessments.length - 20} weitere Kunden` : ''}

TOP PERFORMER DETAILS:
${topPerformers.slice(0, 5).map(a => 
  `• ${a.customerName}: ${a.scores.overall}% - SAP-Systeme: ${a.keyAnswers.sapSystems || 'k.A.'}, BTP: ${a.keyAnswers.btpUsage || 'k.A.'}`
).join('\n')}

KUNDEN MIT HANDLUNGSBEDARF:
${actionNeeded.slice(0, 5).map(a => 
  `• ${a.customerName}: ${a.scores.overall}% - Hauptprobleme: ${a.scores.sap < 33 ? 'SAP-System' : ''} ${a.scores.btp < 33 ? 'BTP' : ''} ${a.scores.data < 33 ? 'Datenqualität' : ''}`
).join('\n')}`;

    return context;
  };

  const getChatSystemPrompt = () => {
    const ragContext = buildRAGContext();

    if (language === 'en') {
      return `You are an SAP AI consultant with access to a customer database for AI Readiness Assessments. You can answer questions about customers, their AI readiness status, compare them, and provide insights.

${ragContext}

IMPORTANT INSTRUCTIONS:

1. FORMATTING FOR CHAT:
   - Use flowing text, NOT tables
   - Use bullet points (•) for lists
   - Use numbered lists (1., 2., 3.) for steps
   - Keep paragraphs short (2-3 sentences max)
   - Use line breaks between sections

2. CAPABILITIES:
   - Answer questions about specific customers
   - Compare customers by score, industry, or status
   - Identify trends and patterns
   - Provide recommendations for customers with low scores
   - Summarize overall portfolio status

3. RESPONSE STRUCTURE:
   - Start with a direct answer
   - Provide supporting data from the customer database
   - End with actionable insights when relevant

4. Be concise, accurate, and helpful. Answer in English.`;
    }

    return `Du bist ein SAP KI-Berater mit Zugriff auf eine Kundendatenbank für AI Readiness Assessments. Du kannst Fragen zu Kunden, ihrem AI-Readiness-Status beantworten, sie vergleichen und Einblicke geben.

${ragContext}

WICHTIGE ANWEISUNGEN:

1. FORMATIERUNG FÜR CHAT:
   - Verwende Fließtext, KEINE Tabellen
   - Verwende Aufzählungspunkte (•) für Listen
   - Verwende nummerierte Listen (1., 2., 3.) für Schritte
   - Halte Absätze kurz (max. 2-3 Sätze)
   - Verwende Zeilenumbrüche zwischen Abschnitten

2. FÄHIGKEITEN:
   - Beantworte Fragen zu bestimmten Kunden
   - Vergleiche Kunden nach Score, Branche oder Status
   - Identifiziere Trends und Muster
   - Gib Empfehlungen für Kunden mit niedrigen Scores
   - Fasse den Gesamtstatus des Portfolios zusammen

3. ANTWORTSTRUKTUR:
   - Beginne mit einer direkten Antwort
   - Liefere unterstützende Daten aus der Kundendatenbank
   - Ende mit umsetzbaren Erkenntnissen wenn relevant

4. Sei prägnant, genau und hilfreich. Antworte auf Deutsch.`;
  };

  // Streaming chat message handler
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    setStreamingMessage('');

    try {
      // Build conversation history for context
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

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Check if streaming is supported
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream') || response.body) {
        // Handle streaming response
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
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Add complete message to chat
        if (fullMessage) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: fullMessage }]);
        }
        setStreamingMessage('');
      } else {
        // Fallback to non-streaming with simulated word-by-word display
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;

        if (assistantMessage) {
          // Simulate streaming by displaying word by word
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
      console.error('Error sending chat message:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'de' 
          ? 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.'
          : 'Sorry, there was an error processing your request. Please try again.',
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

  // Refresh data
  const handleRefreshData = () => {
    loadCustomerData();
  };

  // Collapsed state - pill-shaped button like Sophie AI
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
        {/* Sparkle icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#2E86C1"/>
          <path d="M19 2L19.5 4L21 3.5L19.5 5L20 7L18.5 5.5L17 6L18 4.5L17 3L18.5 3.5L19 2Z" fill="#2E86C1" opacity="0.6"/>
        </svg>
        
        {/* Text */}
        <span style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: '#2E86C1',
          letterSpacing: '-0.3px',
        }}>
          adesso
        </span>
        <span style={{ 
          fontSize: 16, 
          fontWeight: 700, 
          color: '#1B3A5C',
          letterSpacing: '-0.3px',
        }}>
          ai
        </span>
        
        {/* Smile icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: -4 }}>
          <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#F39C12" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 400,
      height: 560,
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
        {/* Collapse button */}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="#5D6D7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#2E86C1"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2E86C1' }}>adesso</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>ai</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: -2 }}>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#F39C12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        {/* Menu button */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleRefreshData}
            disabled={dataLoading}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              cursor: dataLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'background 0.2s',
              opacity: dataLoading ? 0.5 : 1,
            }}
            onMouseOver={(e) => !dataLoading && (e.currentTarget.style.background = '#F7F9FC')}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: dataLoading ? 'spin 1s linear infinite' : 'none' }}>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          gap: 10,
        }}
      >
        {chatMessages.length === 0 && !streamingMessage ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#95A5A6',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
              {language === 'de' 
                ? 'Fragen Sie mich zu Ihren Kunden und deren AI Readiness Status.'
                : 'Ask me about your customers and their AI readiness status.'}
            </div>
            <div style={{ fontSize: 10, color: '#BDC3C7', marginBottom: 16 }}>
              {language === 'de' 
                ? '🔒 Ihr Chat-Verlauf ist privat.'
                : '🔒 Your chat history is private.'}
            </div>
            <div style={{ fontSize: 11, color: '#BDC3C7', marginBottom: 8 }}>
              {language === 'de' ? 'Beispiele:' : 'Examples:'}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 6,
            }}>
              {(language === 'de' ? [
                'Welcher Kunde hat den höchsten Score?',
                'Zeige mir Kunden mit Handlungsbedarf',
                'Vergleiche die Branchen nach AI Readiness',
                'Was sind die häufigsten Schwachstellen?',
              ] : [
                'Which customer has the highest score?',
                'Show me customers that need action',
                'Compare industries by AI readiness',
                'What are the most common weaknesses?',
              ]).map((example, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(example)}
                  style={{
                    background: '#F7F9FC',
                    border: '1px solid #E8EDF2',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
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
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #1B3A5C, #2E86C1)' 
                      : msg.isError ? '#FDEDEC' : '#F7F9FC',
                    color: msg.role === 'user' ? '#fff' : msg.isError ? '#E74C3C' : '#1B3A5C',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                </div>
              </div>
            ))}
            
            {/* Streaming message */}
            {streamingMessage && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '14px 14px 14px 4px',
                    background: '#F7F9FC',
                    color: '#1B3A5C',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {renderMarkdown(streamingMessage)}
                  <span style={{ 
                    display: 'inline-block',
                    width: 6,
                    height: 14,
                    background: '#8E44AD',
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
              padding: '10px 16px',
              borderRadius: '14px 14px 14px 4px',
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
        
        {/* Clear chat button */}
        {chatMessages.length > 0 && !chatLoading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginTop: 8,
          }}>
            <button
              onClick={clearChatHistory}
              style={{
                background: 'transparent',
                border: '1px solid #E8EDF2',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 10,
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

      {/* Chat Input */}
      <div style={{
        padding: 16,
        borderTop: '1px solid #E8EDF2',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
      }}>
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={language === 'de' ? 'Frage zu Kunden stellen...' : 'Ask about customers...'}
          rows={1}
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: 12,
            border: '2px solid #E8EDF2',
            fontSize: 13,
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s',
            minHeight: 44,
            maxHeight: 100,
          }}
          onFocus={(e) => e.target.style.borderColor = '#8E44AD'}
          onBlur={(e) => e.target.style.borderColor = '#E8EDF2'}
        />
        <button
          onClick={handleSendMessage}
          disabled={!chatInput.trim() || chatLoading || dataLoading}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: 'none',
            background: chatInput.trim() && !chatLoading && !dataLoading
              ? 'linear-gradient(135deg, #8E44AD, #9B59B6)' 
              : '#E8EDF2',
            color: chatInput.trim() && !chatLoading && !dataLoading ? '#fff' : '#BDC3C7',
            cursor: chatInput.trim() && !chatLoading && !dataLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}