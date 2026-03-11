import React, { useState } from 'react';

/**
 * PresenceIndicator - Shows active users collaborating on an assessment
 * 
 * Features:
 * - Avatar stack showing active users
 * - Tooltip with user details
 * - Connection status indicator
 * - Expandable user list
 */
export default function PresenceIndicator({ 
  activeUsers = [], 
  isConnected = false, 
  currentSection = null,
  compact = false,
  maxAvatars = 4,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Filter out current user and get other collaborators
  const otherUsers = activeUsers.filter(u => !u.isCurrentUser);
  const currentUser = activeUsers.find(u => u.isCurrentUser);
  
  // Users to display in avatar stack
  const displayUsers = otherUsers.slice(0, maxAvatars);
  const remainingCount = otherUsers.length - maxAvatars;
  
  // Get users in the same section
  const usersInSameSection = currentSection 
    ? otherUsers.filter(u => u.currentSection === currentSection)
    : [];

  if (compact) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Connection Status Dot */}
        <div 
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected ? '#27AE60' : '#E74C3C',
            boxShadow: isConnected ? '0 0 6px #27AE60' : 'none',
          }}
          title={isConnected ? 'Live verbunden' : 'Nicht verbunden'}
        />
        
        {/* User Count */}
        {otherUsers.length > 0 && (
          <span style={{ fontSize: 11, color: '#7F8C8D', fontWeight: 500 }}>
            {otherUsers.length} {otherUsers.length === 1 ? 'Benutzer' : 'Benutzer'} online
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Connection Status */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: isConnected ? '#EAFAF1' : '#FDEDEC',
          borderRadius: 16,
          border: `1px solid ${isConnected ? '#27AE6040' : '#E74C3C40'}`,
        }}
      >
        <div 
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected ? '#27AE60' : '#E74C3C',
            boxShadow: isConnected ? '0 0 6px #27AE60' : 'none',
            animation: isConnected ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: isConnected ? '#27AE60' : '#E74C3C' 
        }}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Avatar Stack */}
      {otherUsers.length > 0 && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {/* Stacked Avatars */}
          <div style={{ display: 'flex', marginRight: 8 }}>
            {displayUsers.map((user, index) => (
              <div
                key={user.id}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: user.color || '#2E86C1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  border: '2px solid #fff',
                  marginLeft: index > 0 ? -10 : 0,
                  zIndex: displayUsers.length - index,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative',
                }}
                title={user.name}
              >
                {user.initials}
                {/* Online indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#27AE60',
                  border: '2px solid #fff',
                }} />
              </div>
            ))}
            
            {/* Remaining count badge */}
            {remainingCount > 0 && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#7F8C8D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  border: '2px solid #fff',
                  marginLeft: -10,
                  zIndex: 0,
                }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
          
          {/* User count text */}
          <span style={{ fontSize: 12, color: '#5D6D7E', fontWeight: 500 }}>
            {otherUsers.length} {otherUsers.length === 1 ? 'Benutzer' : 'Benutzer'} bearbeiten
          </span>
        </div>
      )}

      {/* Tooltip / Expanded User List */}
      {(showTooltip || expanded) && otherUsers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #E8EDF2',
            padding: 16,
            minWidth: 240,
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: '#1B3A5C', 
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>👥</span>
            Aktive Benutzer ({otherUsers.length})
          </div>
          
          {/* User List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherUsers.map(user => (
              <div 
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: user.currentSection === currentSection ? '#EBF5FB' : '#F7F9FC',
                  borderRadius: 8,
                  border: user.currentSection === currentSection ? '1px solid #2E86C140' : '1px solid transparent',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: user.color || '#2E86C1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {user.initials}
                </div>
                
                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#1B3A5C',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user.name}
                  </div>
                  {user.currentSection && (
                    <div style={{ 
                      fontSize: 10, 
                      color: '#7F8C8D',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.currentSection === currentSection 
                        ? '📍 Gleicher Abschnitt' 
                        : `📄 ${user.currentSection}`}
                    </div>
                  )}
                </div>
                
                {/* Status indicator */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#27AE60',
                    flexShrink: 0,
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Same section notice */}
          {usersInSameSection.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: '8px 10px',
              background: '#FEF9E7',
              borderRadius: 8,
              border: '1px solid #F39C1240',
              fontSize: 11,
              color: '#B7950B',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span>⚠️</span>
              {usersInSameSection.length} {usersInSameSection.length === 1 ? 'Person bearbeitet' : 'Personen bearbeiten'} diesen Abschnitt
            </div>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
 * TypingIndicator - Shows when other users are typing on a specific question
 */
export function TypingIndicator({ typingUsers = [] }) {
  if (typingUsers.length === 0) return null;
  
  const names = typingUsers.map(u => u.name || u.initials).join(', ');
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      background: '#EBF5FB',
      borderRadius: 8,
      marginTop: 8,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {/* Typing dots animation */}
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#2E86C1',
              animation: `typingDot 1.4s infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      
      {/* User avatars */}
      <div style={{ display: 'flex', marginLeft: 4 }}>
        {typingUsers.slice(0, 3).map((user, i) => (
          <div
            key={user.id}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: user.color || '#2E86C1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              border: '1.5px solid #fff',
              marginLeft: i > 0 ? -6 : 0,
            }}
          >
            {user.initials}
          </div>
        ))}
      </div>
      
      {/* Text */}
      <span style={{ fontSize: 11, color: '#2E86C1', fontWeight: 500 }}>
        {typingUsers.length === 1 
          ? `${names} tippt...`
          : `${typingUsers.length} Personen tippen...`}
      </span>
      
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/**
 * ConflictBanner - Shows when there's a conflict with another user's edit
 */
export function ConflictBanner({ 
  conflict, 
  onUseLocal, 
  onUseRemote,
  onDismiss,
}) {
  if (!conflict) return null;
  
  return (
    <div style={{
      background: '#FDEDEC',
      border: '1px solid #E74C3C40',
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      animation: 'slideDown 0.3s ease-out',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            color: '#C0392B',
            marginBottom: 4,
          }}>
            Konflikt erkannt
          </div>
          <div style={{ fontSize: 12, color: '#7F8C8D', marginBottom: 12 }}>
            <strong>{conflict.remoteUserName || 'Ein anderer Benutzer'}</strong> hat diese Frage ebenfalls bearbeitet.
          </div>
          
          {/* Comparison */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 12,
            marginBottom: 12,
          }}>
            {/* Local version */}
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: 12,
              border: '2px solid #27AE60',
            }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: '#27AE60',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                Ihre Version
              </div>
              <div style={{ 
                fontSize: 12, 
                color: '#1B3A5C',
                maxHeight: 60,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {conflict.localValue || '(leer)'}
              </div>
            </div>
            
            {/* Remote version */}
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: 12,
              border: '2px solid #E74C3C',
            }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: '#E74C3C',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                Version von {conflict.remoteUserName || 'Andere'}
              </div>
              <div style={{ 
                fontSize: 12, 
                color: '#1B3A5C',
                maxHeight: 60,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {conflict.remoteValue || '(leer)'}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onUseLocal}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#27AE60',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Meine Version behalten
            </button>
            <button
              onClick={onUseRemote}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#E74C3C',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Andere Version übernehmen
            </button>
          </div>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            color: '#95A5A6',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}