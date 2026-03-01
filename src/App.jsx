import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AIReadinessCheck from './components/AIReadinessCheck';

// Main App Content with Auth Check
function AppContent() {
  const { isAuthenticated, loading, error, connectionStatus, retryConnection } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'assessment', or 'demo'
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await retryConnection();
    setRetrying(false);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F9FC',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 16, color: '#5D6D7E' }}>Lade AI Readiness Check...</div>
          <div style={{ fontSize: 12, color: '#95A5A6', marginTop: 8 }}>
            {connectionStatus === 'connecting' ? 'Verbinde mit Supabase...' : 'Initialisiere...'}
          </div>
          {/* Loading animation */}
          <div style={{ marginTop: 20 }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #E8EDF2',
              borderTop: '3px solid #2E86C1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // If there's an error or demo mode, show option to continue without auth
  if (error && !demoMode) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F9FC',
        fontFamily: 'Outfit, sans-serif',
        padding: 20
      }}>
        <div style={{ 
          textAlign: 'center', 
          background: '#fff', 
          padding: 40, 
          borderRadius: 16, 
          maxWidth: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', marginBottom: 8 }}>
            Verbindungsproblem
          </h2>
          <p style={{ fontSize: 14, color: '#5D6D7E', marginBottom: 8 }}>
            Konnte keine Verbindung zu Supabase herstellen.
          </p>
          <p style={{ fontSize: 12, color: '#E74C3C', marginBottom: 24, background: '#FDEDEC', padding: '8px 12px', borderRadius: 8 }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleRetry}
              disabled={retrying}
              style={{
                background: '#fff',
                border: '2px solid #E8EDF2',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: retrying ? '#BDC3C7' : '#5D6D7E',
                cursor: retrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {retrying ? (
                <>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #E8EDF2',
                    borderTop: '2px solid #2E86C1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block'
                  }} />
                  Verbinde...
                </>
              ) : (
                <>🔄 Erneut versuchen</>
              )}
            </button>
            <button
              onClick={() => setDemoMode(true)}
              style={{
                background: 'linear-gradient(135deg, #1B3A5C, #2E86C1)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              🚀 Demo-Modus starten
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#95A5A6', marginTop: 16 }}>
            Im Demo-Modus können Sie das Tool ohne Anmeldung testen.<br/>
            Daten werden nicht gespeichert.
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Demo mode - go directly to assessment
  if (demoMode) {
    return (
      <div>
        {/* Demo Mode Banner */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #F39C12, #E67E22)',
          color: '#fff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 1001,
          fontFamily: 'Outfit, sans-serif',
        }}>
          🎮 Demo-Modus — Daten werden nicht gespeichert
          <button
            onClick={() => { setDemoMode(false); window.location.reload(); }}
            style={{
              marginLeft: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              padding: '4px 12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Beenden
          </button>
        </div>
        <div style={{ paddingTop: 40 }}>
          <AIReadinessCheck />
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show dashboard or assessment based on current view
  if (currentView === 'dashboard') {
    return (
      <Dashboard 
        onSelectAssessment={(assessment) => {
          setSelectedAssessment(assessment);
          setCurrentView('assessment');
        }}
        onCreateNew={() => {
          setSelectedAssessment(null);
          setCurrentView('assessment');
        }}
      />
    );
  }

  // Show the AI Readiness Check form
  // For now, we'll use the existing component
  // In the future, this will be enhanced to save to Supabase
  return (
    <div>
      {/* Back to Dashboard Button */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 1000,
      }}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            background: '#fff',
            border: '2px solid #E8EDF2',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            color: '#2E86C1',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ← Dashboard
        </button>
      </div>
      
      {/* Assessment Info Banner (if editing existing) */}
      {selectedAssessment && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#fff',
          border: '2px solid #E8EDF2',
          borderRadius: 10,
          padding: '10px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontFamily: 'Outfit, sans-serif',
        }}>
          <div style={{ fontSize: 12, color: '#7F8C8D' }}>Bearbeite Assessment für</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C' }}>
            {selectedAssessment.customer_name}
          </div>
        </div>
      )}
      
      <AIReadinessCheck 
        assessment={selectedAssessment}
        onBack={() => setCurrentView('dashboard')}
      />
    </div>
  );
}

// Root App with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}