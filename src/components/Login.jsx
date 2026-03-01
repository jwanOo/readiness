import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { signIn, signUp, signInWithMagicLink, error: authError, connectionStatus, retryConnection } = useAuth();
  const [mode, setMode] = useState('login'); // login, register, magic, setPassword
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isInvitation, setIsInvitation] = useState(false);

  // Check for invitation/recovery token in URL on mount
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check URL hash for tokens (Supabase uses hash-based routing for auth)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Also check query params
      const queryParams = new URLSearchParams(window.location.search);
      const tokenFromQuery = queryParams.get('token');
      const typeFromQuery = queryParams.get('type');

      console.log('Auth callback check:', { accessToken, type, tokenFromQuery, typeFromQuery });

      // Handle invitation or recovery
      if (type === 'invite' || type === 'recovery' || type === 'signup' || 
          typeFromQuery === 'invite' || typeFromQuery === 'recovery') {
        setIsInvitation(true);
        setMode('setPassword');
        
        // If we have tokens, set the session
        if (accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) {
              console.error('Error setting session:', error);
              setError('Fehler beim Verarbeiten der Einladung: ' + error.message);
            }
          } catch (err) {
            console.error('Session error:', err);
          }
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAuthCallback();

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session?.user?.email);
      
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        setIsInvitation(true);
        setMode('setPassword');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      } else if (mode === 'setPassword') {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Die Passwörter stimmen nicht überein');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Das Passwort muss mindestens 6 Zeichen lang sein');
          setLoading(false);
          return;
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (updateError) {
          throw updateError;
        }

        setMessage('Passwort erfolgreich gesetzt! Sie werden angemeldet...');
        
        // The auth state change will handle the redirect
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Auth error:', err);
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
    .login-info { background: #EBF5FB; color: #2E86C1; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
    .login-divider { display: flex; align-items: center; margin: 20px 0; }
    .login-divider-line { flex: 1; height: 1px; background: #E8EDF2; }
    .login-divider-text { padding: 0 16px; color: #95A5A6; font-size: 12px; }
    .connection-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
    .connection-connected { background: #EAFAF1; color: #27AE60; }
    .connection-connecting { background: #EBF5FB; color: #2E86C1; }
    .connection-error { background: #FDEDEC; color: #E74C3C; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .spinner { width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
    .password-strength { height: 4px; border-radius: 2px; margin-top: -12px; margin-bottom: 16px; transition: all 0.3s; }
  `;

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { width: '0%', color: '#E8EDF2', label: '' };
    if (pwd.length < 6) return { width: '25%', color: '#E74C3C', label: 'Zu kurz' };
    if (pwd.length < 8) return { width: '50%', color: '#F39C12', label: 'Schwach' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { width: '75%', color: '#F1C40F', label: 'Mittel' };
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return { width: '100%', color: '#27AE60', label: 'Stark' };
    return { width: '50%', color: '#F39C12', label: 'Schwach' };
  };

  const passwordStrength = getPasswordStrength(password);

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
            {mode === 'login' ? 'Willkommen zurück' : 
             mode === 'register' ? 'Konto erstellen' : 
             mode === 'setPassword' ? 'Passwort festlegen' :
             'Magic Link Login'}
          </h1>
          <p style={{ fontSize: 14, color: '#7F8C8D' }}>
            {mode === 'login' ? 'Melden Sie sich an, um fortzufahren' : 
             mode === 'register' ? 'Erstellen Sie ein neues Konto' : 
             mode === 'setPassword' ? 'Legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren' :
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

        {/* Invitation Info */}
        {isInvitation && mode === 'setPassword' && (
          <div className="login-info">
            🎉 Sie wurden eingeladen! Bitte legen Sie ein Passwort fest, um Ihr Konto zu aktivieren.
          </div>
        )}

        {/* Tabs - only show if not in setPassword mode */}
        {mode !== 'setPassword' && (
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
        )}

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
          
          {mode !== 'setPassword' && (
            <input
              type="email"
              className="login-input"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          
          {(mode === 'login' || mode === 'register' || mode === 'setPassword') && (
            <>
              <input
                type="password"
                className="login-input"
                placeholder={mode === 'setPassword' ? 'Neues Passwort' : 'Passwort'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              
              {/* Password strength indicator for setPassword mode */}
              {mode === 'setPassword' && password && (
                <div style={{ marginTop: -12, marginBottom: 16 }}>
                  <div style={{ 
                    height: 4, 
                    borderRadius: 2, 
                    background: '#E8EDF2',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: passwordStrength.width, 
                      height: '100%', 
                      background: passwordStrength.color,
                      transition: 'all 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: passwordStrength.color, marginTop: 4 }}>
                    {passwordStrength.label}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Confirm password for setPassword mode */}
          {mode === 'setPassword' && (
            <input
              type="password"
              className="login-input"
              placeholder="Passwort bestätigen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                borderColor: confirmPassword && password !== confirmPassword ? '#E74C3C' : undefined
              }}
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
             mode === 'setPassword' ? 'Passwort festlegen' :
             'Magic Link senden'}
          </button>
        </form>

        {/* Divider - only show if not in setPassword mode */}
        {mode !== 'setPassword' && (
          <>
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
          </>
        )}

        {/* Back to login for setPassword mode */}
        {mode === 'setPassword' && !isInvitation && (
          <button 
            className="login-btn login-btn-secondary"
            onClick={() => { setMode('login'); setError(''); setMessage(''); setIsInvitation(false); }}
            style={{ marginTop: 16 }}
          >
            ← Zurück zur Anmeldung
          </button>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#95A5A6' }}>
            Powered by{' '}
            <a 
              href="https://www.linkedin.com/in/jwan-s/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#2E86C1', 
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#1B3A5C'}
              onMouseOut={(e) => e.target.style.color = '#2E86C1'}
            >
              Jwan Sulyman
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}