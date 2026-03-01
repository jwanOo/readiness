import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp, signInWithMagicLink, error: authError, connectionStatus, retryConnection } = useAuth();
  const [mode, setMode] = useState('login'); // login, register, magic
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'register') {
        await signUp(email, password, fullName);
        setMessage('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail.');
      } else if (mode === 'magic') {
        await signInWithMagicLink(email);
        setMessage('Magic Link wurde gesendet! Bitte prüfen Sie Ihre E-Mail.');
      }
    } catch (err) {
      // Error is already set in AuthContext, but we can add local handling
      if (!authError) {
        setError(err.message || 'Ein Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    await retryConnection();
    setLoading(false);
  };

  // Display error from auth context or local error
  const displayError = authError || error;

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F7F9FC; padding: 20px; }
    .login-card { background: #fff; border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .login-input { width: 100%; padding: 14px 16px; border: 2px solid #E8EDF2; border-radius: 10px; font-size: 14px; font-family: 'Outfit', sans-serif; transition: all 0.2s; margin-bottom: 16px; box-sizing: border-box; }
    .login-input:focus { outline: none; border-color: #2E86C1; box-shadow: 0 0 0 3px rgba(46,134,193,0.1); }
    .login-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s; box-sizing: border-box; }
    .login-btn:hover:not(:disabled) { transform: translateY(-2px); }
    .login-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .login-btn-primary { background: linear-gradient(135deg, #1B3A5C, #2E86C1); color: #fff; }
    .login-btn-primary:hover:not(:disabled) { box-shadow: 0 8px 24px rgba(30,60,114,0.25); }
    .login-btn-secondary { background: #F7F9FC; color: #5D6D7E; border: 2px solid #E8EDF2; }
    .login-btn-secondary:hover:not(:disabled) { background: #EBF5FB; border-color: #2E86C1; }
    .login-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .login-tab { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s; }
    .login-tab-active { background: #1B3A5C; color: #fff; }
    .login-tab-inactive { background: #F7F9FC; color: #7F8C8D; }
    .login-error { background: #FDEDEC; color: #E74C3C; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
    .login-success { background: #EAFAF1; color: #27AE60; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
    .login-warning { background: #FEF9E7; color: #B7950B; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .login-divider { display: flex; align-items: center; margin: 20px 0; }
    .login-divider-line { flex: 1; height: 1px; background: #E8EDF2; }
    .login-divider-text { padding: 0 16px; color: #95A5A6; font-size: 12px; }
    .connection-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
    .connection-connected { background: #EAFAF1; color: #27AE60; }
    .connection-connecting { background: #EBF5FB; color: #2E86C1; }
    .connection-error { background: #FDEDEC; color: #E74C3C; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .spinner { width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
  `;

  return (
    <div className="login-container">
      <style>{styles}</style>
      <div className="login-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 10, 
            background: 'linear-gradient(135deg, #1B3A5C, #2E86C1)', 
            padding: '10px 24px', 
            borderRadius: 40, 
            marginBottom: 20 
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
              AI Readiness Check
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>
            {mode === 'login' ? 'Willkommen zurück' : mode === 'register' ? 'Konto erstellen' : 'Magic Link Login'}
          </h1>
          <p style={{ fontSize: 14, color: '#7F8C8D' }}>
            {mode === 'login' ? 'Melden Sie sich an, um fortzufahren' : 
             mode === 'register' ? 'Erstellen Sie ein neues Konto' : 
             'Erhalten Sie einen Login-Link per E-Mail'}
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus === 'connecting' && (
          <div className="connection-status connection-connecting">
            <span className="spinner" />
            <span>Verbinde mit Server...</span>
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="connection-status connection-error">
            <span>⚠️</span>
            <span>Verbindungsproblem</span>
            <button 
              onClick={handleRetry}
              style={{ 
                marginLeft: 'auto', 
                background: 'none', 
                border: 'none', 
                color: '#E74C3C', 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                textDecoration: 'underline'
              }}
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="login-tabs">
          <button 
            className={`login-tab ${mode === 'login' ? 'login-tab-active' : 'login-tab-inactive'}`}
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
          >
            Anmelden
          </button>
          <button 
            className={`login-tab ${mode === 'register' ? 'login-tab-active' : 'login-tab-inactive'}`}
            onClick={() => { setMode('register'); setError(''); setMessage(''); }}
          >
            Registrieren
          </button>
        </div>

        {/* Error/Success Messages */}
        {displayError && <div className="login-error">⚠️ {displayError}</div>}
        {message && <div className="login-success">✓ {message}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="text"
              className="login-input"
              placeholder="Vollständiger Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          
          <input
            type="email"
            className="login-input"
            placeholder="E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {mode !== 'magic' && (
            <input
              type="password"
              className="login-input"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}

          <button 
            type="submit" 
            className="login-btn login-btn-primary"
            disabled={loading || connectionStatus === 'connecting'}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                Bitte warten...
              </span>
            ) : 
             mode === 'login' ? 'Anmelden' : 
             mode === 'register' ? 'Registrieren' : 
             'Magic Link senden'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-text">oder</span>
          <div className="login-divider-line" />
        </div>

        {/* Magic Link Option */}
        <button 
          className="login-btn login-btn-secondary"
          onClick={() => { setMode(mode === 'magic' ? 'login' : 'magic'); setError(''); setMessage(''); }}
        >
          {mode === 'magic' ? '← Zurück zur Anmeldung' : '✉️ Login ohne Passwort (Magic Link)'}
        </button>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#95A5A6' }}>
            Powered by adesso SE
          </p>
        </div>
      </div>
    </div>
  );
}