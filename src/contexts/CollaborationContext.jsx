import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Context for real-time collaboration
const CollaborationContext = createContext(null);

// Custom hook to use collaboration context
// Returns null if not within a CollaborationProvider (safe to use outside provider)
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  // Don't throw error - return null if not in provider
  // This allows components to safely check if collaboration is available
  return context;
};

// Generate a random color for user avatar
const generateUserColor = (userId) => {
  const colors = [
    '#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#F39C12',
    '#1ABC9C', '#E91E63', '#00BCD4', '#FF5722', '#607D8B'
  ];
  const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

// Get initials from name or email
const getInitials = (name, email) => {
  if (name && !name.includes('@')) {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
  if (email) {
    const localPart = email.split('@')[0];
    const parts = localPart.split('.');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : localPart.substring(0, 2).toUpperCase();
  }
  return '??';
};

export function CollaborationProvider({ children, assessmentId }) {
  const { user, profile } = useAuth();
  
  // State
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteAnswers, setRemoteAnswers] = useState({});
  const [typingUsers, setTypingUsers] = useState({}); // { questionKey: [userId, ...] }
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [conflicts, setConflicts] = useState([]); // Array of conflict objects
  
  // Refs for channels
  const presenceChannelRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const dbSubscriptionRef = useRef(null);
  const typingTimeoutRef = useRef({});
  
  // Current user info for presence
  const currentUserInfo = {
    id: user?.id,
    email: user?.email,
    name: profile?.full_name || user?.email?.split('@')[0] || 'Unknown',
    initials: getInitials(profile?.full_name, user?.email),
    color: generateUserColor(user?.id),
    currentSection: null,
    lastActive: new Date().toISOString(),
  };

  // Initialize real-time channels when assessmentId changes
  useEffect(() => {
    console.log('[Collaboration] Setup effect triggered', { assessmentId, userId: user?.id });
    
    if (!assessmentId || !user?.id) {
      console.log('[Collaboration] Missing assessmentId or userId, skipping setup');
      return;
    }

    const setupRealtime = async () => {
      try {
        console.log('[Collaboration] Setting up realtime channels for assessment:', assessmentId);
        // 1. Set up Presence Channel for tracking active users
        const presenceChannel = supabase.channel(`presence:${assessmentId}`, {
          config: {
            presence: {
              key: user.id,
            },
          },
        });

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            console.log('[Collaboration] Presence sync, state:', state);
            const users = Object.values(state).flat().map(u => ({
              ...u,
              isCurrentUser: u.id === user.id,
            }));
            console.log('[Collaboration] Active users:', users);
            setActiveUsers(users);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('[Collaboration] User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('[Collaboration] User left:', key, leftPresences);
            // Clear typing status for user who left
            setTypingUsers(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(qKey => {
                updated[qKey] = updated[qKey].filter(id => id !== key);
                if (updated[qKey].length === 0) delete updated[qKey];
              });
              return updated;
            });
          })
          .subscribe(async (status) => {
            console.log('[Collaboration] Presence channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[Collaboration] Tracking user presence:', currentUserInfo);
              await presenceChannel.track(currentUserInfo);
              setIsConnected(true);
              console.log('[Collaboration] Connected successfully!');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Collaboration] Presence channel error');
              setIsConnected(false);
            }
          });

        presenceChannelRef.current = presenceChannel;

        // 2. Set up Broadcast Channel for real-time answer updates
        const broadcastChannel = supabase.channel(`broadcast:${assessmentId}`);

        broadcastChannel
          .on('broadcast', { event: 'answer_update' }, ({ payload }) => {
            if (payload.userId !== user.id) {
              // Update remote answers
              setRemoteAnswers(prev => ({
                ...prev,
                [payload.questionKey]: {
                  value: payload.value,
                  userId: payload.userId,
                  userName: payload.userName,
                  timestamp: payload.timestamp,
                },
              }));
              setLastSync(new Date());
            }
          })
          .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
            if (payload.userId !== user.id) {
              setTypingUsers(prev => {
                const current = prev[payload.questionKey] || [];
                if (!current.includes(payload.userId)) {
                  return { ...prev, [payload.questionKey]: [...current, payload.userId] };
                }
                return prev;
              });
              
              // Auto-clear typing after 3 seconds
              if (typingTimeoutRef.current[`${payload.questionKey}_${payload.userId}`]) {
                clearTimeout(typingTimeoutRef.current[`${payload.questionKey}_${payload.userId}`]);
              }
              typingTimeoutRef.current[`${payload.questionKey}_${payload.userId}`] = setTimeout(() => {
                setTypingUsers(prev => {
                  const current = prev[payload.questionKey] || [];
                  const updated = current.filter(id => id !== payload.userId);
                  if (updated.length === 0) {
                    const { [payload.questionKey]: _, ...rest } = prev;
                    return rest;
                  }
                  return { ...prev, [payload.questionKey]: updated };
                });
              }, 3000);
            }
          })
          .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
            if (payload.userId !== user.id) {
              setTypingUsers(prev => {
                const current = prev[payload.questionKey] || [];
                const updated = current.filter(id => id !== payload.userId);
                if (updated.length === 0) {
                  const { [payload.questionKey]: _, ...rest } = prev;
                  return rest;
                }
                return { ...prev, [payload.questionKey]: updated };
              });
            }
          })
          .on('broadcast', { event: 'section_change' }, ({ payload }) => {
            if (payload.userId !== user.id) {
              setActiveUsers(prev => prev.map(u => 
                u.id === payload.userId 
                  ? { ...u, currentSection: payload.sectionId }
                  : u
              ));
            }
          })
          .subscribe();

        broadcastChannelRef.current = broadcastChannel;

        // 3. Subscribe to database changes for answers table
        const dbSubscription = supabase
          .channel(`db:answers:${assessmentId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'answers',
              filter: `assessment_id=eq.${assessmentId}`,
            },
            (payload) => {
              if (payload.new?.answered_by !== user.id) {
                const questionKey = `${payload.new.section_id}_${payload.new.question_index}`;
                setRemoteAnswers(prev => ({
                  ...prev,
                  [questionKey]: {
                    value: payload.new.answer,
                    userId: payload.new.answered_by,
                    timestamp: payload.new.answered_at,
                  },
                }));
                setLastSync(new Date());
              }
            }
          )
          .subscribe();

        dbSubscriptionRef.current = dbSubscription;

      } catch (error) {
        console.error('[Collaboration] Error setting up realtime:', error);
        setIsConnected(false);
      }
    };

    setupRealtime();

    // Cleanup on unmount or assessmentId change
    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.unsubscribe();
        broadcastChannelRef.current = null;
      }
      if (dbSubscriptionRef.current) {
        dbSubscriptionRef.current.unsubscribe();
        dbSubscriptionRef.current = null;
      }
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
      setIsConnected(false);
      setActiveUsers([]);
    };
  }, [assessmentId, user?.id]);

  // Broadcast answer update to other users
  const broadcastAnswerUpdate = useCallback((questionKey, value) => {
    if (!broadcastChannelRef.current || !user?.id) return;

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'answer_update',
      payload: {
        questionKey,
        value,
        userId: user.id,
        userName: currentUserInfo.name,
        timestamp: new Date().toISOString(),
      },
    });
  }, [user?.id, currentUserInfo.name]);

  // Broadcast typing status
  const broadcastTypingStart = useCallback((questionKey) => {
    if (!broadcastChannelRef.current || !user?.id) return;

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'typing_start',
      payload: {
        questionKey,
        userId: user.id,
        userName: currentUserInfo.name,
      },
    });
  }, [user?.id, currentUserInfo.name]);

  const broadcastTypingStop = useCallback((questionKey) => {
    if (!broadcastChannelRef.current || !user?.id) return;

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'typing_stop',
      payload: {
        questionKey,
        userId: user.id,
      },
    });
  }, [user?.id]);

  // Broadcast section change
  const broadcastSectionChange = useCallback((sectionId) => {
    if (!broadcastChannelRef.current || !user?.id) return;

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'section_change',
      payload: {
        sectionId,
        userId: user.id,
      },
    });

    // Also update presence
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        ...currentUserInfo,
        currentSection: sectionId,
        lastActive: new Date().toISOString(),
      });
    }
  }, [user?.id, currentUserInfo]);

  // Update presence (alias for broadcastSectionChange for compatibility)
  const updatePresence = useCallback((sectionId) => {
    broadcastSectionChange(sectionId);
  }, [broadcastSectionChange]);

  // Check if a question has a conflict (remote update while user was editing)
  const checkConflict = useCallback((questionKey, localValue) => {
    const remote = remoteAnswers[questionKey];
    if (!remote) return null;
    
    // If remote value is different and was updated after we started editing
    if (remote.value !== localValue && remote.userId !== user?.id) {
      return {
        questionKey,
        localValue,
        remoteValue: remote.value,
        remoteUserId: remote.userId,
        remoteUserName: remote.userName,
        timestamp: remote.timestamp,
      };
    }
    return null;
  }, [remoteAnswers, user?.id]);

  // Resolve a conflict by choosing local or remote value
  const resolveConflict = useCallback((questionKey, useRemote = false) => {
    setConflicts(prev => prev.filter(c => c.questionKey !== questionKey));
    
    if (useRemote) {
      // Return the remote value to be applied
      return remoteAnswers[questionKey]?.value;
    }
    // Return null to keep local value
    return null;
  }, [remoteAnswers]);

  // Get users currently viewing a specific section
  const getUsersInSection = useCallback((sectionId) => {
    return activeUsers.filter(u => u.currentSection === sectionId && u.id !== user?.id);
  }, [activeUsers, user?.id]);

  // Get users currently typing on a specific question
  const getTypingUsersForQuestion = useCallback((questionKey) => {
    const typingIds = typingUsers[questionKey] || [];
    return activeUsers.filter(u => typingIds.includes(u.id));
  }, [typingUsers, activeUsers]);

  // Context value
  const value = {
    // State
    activeUsers,
    remoteAnswers,
    typingUsers,
    isConnected,
    lastSync,
    conflicts,
    
    // Actions
    broadcastAnswerUpdate,
    broadcastTypingStart,
    broadcastTypingStop,
    broadcastSectionChange,
    updatePresence,
    checkConflict,
    resolveConflict,
    
    // Helpers
    getUsersInSection,
    getTypingUsersForQuestion,
    currentUserInfo,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export default CollaborationContext;