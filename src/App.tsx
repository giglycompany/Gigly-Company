import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AppScreen,
  GigItem,
  MatchRecord,
  UserProfile,
  ChatMessage,
  isAdminEmail,
  ADMIN_EMAIL,
} from './types';
import {
  auth,
  seedInitialFirestoreData,
  subscribeToGigs,
  recordSwipeToFirestore,
  saveMatchToFirestore,
  syncMatchMessagesToFirestore,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  subscribeToUserMatches,
  getActiveUserSession,
  logoutUser,
  AuthUserSession,
  getUserSwipedIds,
  checkMutualLikeAndMatch,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { StartupAnimation } from './components/StartupAnimation';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingProfileScreen } from './components/OnboardingProfileScreen';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { ExploreDeck } from './components/ExploreDeck';
import { MatchOverlay } from './components/MatchOverlay';
import { MatchesScreen } from './components/MatchesScreen';
import { MessagesScreen } from './components/MessagesScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { formatWithCurrency, CurrencyInfo } from './lib/currency';

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.3);
  } catch {}
}

export default function App() {
  // App Navigation State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('startup');
  const [userRole, setUserRole] = useState<'freelancer' | 'business'>('freelancer');
  const [currentUserId, setCurrentUserId] = useState<string>('guest-user');

  // Deck Items State (STRICTLY EMPTY for logged in users - NO fake/mock profiles)
  const [jobs, setJobs] = useState<GigItem[]>([]);
  const [candidates, setCandidates] = useState<GigItem[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Matches & Chat State with user-isolated persistence
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [matchedOverlayJob, setMatchedOverlayJob] = useState<GigItem | null>(null);
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  // Unread read-receipts tracking per match for current user
  const [lastReadMessageIds, setLastReadMessageIds] = useState<Record<number, string>>({});

  // Active in-app notification toast when somebody texts back
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    matchId: number;
    senderName: string;
    text: string;
  } | null>(null);

  // Persistent Set of Swiped Profiles (Cards already reviewed)
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());

  // Global Currency Preference (Dollar $, Euro €, Rupee ₹, Pound £, Yen ¥, CAD C$, AUD A$)
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem('gigly_currency') || '$';
    } catch {
      return '$';
    }
  });

  const handleCurrencyChange = (curr: CurrencyInfo) => {
    setCurrency(curr.symbol);
    try {
      localStorage.setItem('gigly_currency', curr.symbol);
    } catch {}
    setProfile((prev) => {
      if (!prev.rateOrBudget) return prev;
      const updatedRate = formatWithCurrency(prev.rateOrBudget, curr.symbol);
      const updated = { ...prev, rateOrBudget: updatedRate };
      if (currentUserId && currentUserId !== 'guest-user') {
        try {
          localStorage.setItem(`gigly_profile_${currentUserId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // User Profile State: clean unauthenticated default (NO assumption of user or email prior to login)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const activeSession = getActiveUserSession();
    if (activeSession && activeSession.uid) {
      try {
        const cached = localStorage.getItem(`gigly_profile_${activeSession.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.profileCompleted) {
            return parsed;
          }
        }
      } catch {}
    }
    return {
      name: '',
      role: 'freelancer',
      roleTitle: '',
      rateOrBudget: '',
      bio: '',
      skills: [],
      email: '',
      avatarInitials: '',
      verified: false,
      profileCompleted: false,
      stats: {
        appliedOrPosted: 0,
        hired: 0,
        ratingOrResponse: '100%',
      },
    };
  });

  // Seed Firestore & Listen to Auth state and local sessions on initial load
  useEffect(() => {
    seedInitialFirestoreData();

    // 1. Check local session first for instant resume
    const localSession = getActiveUserSession();
    if (localSession && localSession.uid) {
      // Direct admin session directly to admin portal
      if (isAdminEmail(localSession.email)) {
        sessionStorage.setItem('gigly_admin_session', 'true');
        setCurrentUserId(localSession.uid);
        setProfile((prev) => ({
          ...prev,
          email: localSession.email,
          name: localSession.displayName || 'Gigly Admin',
          userId: localSession.uid,
          profileCompleted: true,
        }));
        setCurrentScreen('admin');
        return;
      }

      setCurrentUserId(localSession.uid);
      const cached = localStorage.getItem(`gigly_profile_${localSession.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.profileCompleted) {
            setProfile(parsed);
            setUserRole(parsed.role || 'freelancer');
            setCurrentScreen((prev) => (['auth', 'onboarding'].includes(prev) ? 'explore' : prev));
          }
        } catch {}
      } else {
        getUserProfileFromFirestore(localSession.uid).then((prof) => {
          if (prof && prof.profileCompleted) {
            setProfile(prof);
            setUserRole(prof.role || 'freelancer');
            setCurrentScreen((prev) => (['auth', 'onboarding'].includes(prev) ? 'explore' : prev));
          }
        });
      }
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userEmail = (user.email || '').trim().toLowerCase();

        // 🌟 CRITICAL: If signed in with admin email (Google or password), route directly to Admin Portal!
        if (isAdminEmail(userEmail)) {
          sessionStorage.setItem('gigly_admin_session', 'true');
          setProfile((prev) => ({
            ...prev,
            email: user.email || ADMIN_EMAIL,
            name: user.displayName || 'Gigly Admin',
            userId: user.uid,
            profileCompleted: true,
          }));
          setCurrentScreen('admin');
          return;
        }

        // Try local storage cache for instant 0ms rendering
        try {
          const cachedProfile = localStorage.getItem(`gigly_profile_${user.uid}`);
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            if (parsed && parsed.profileCompleted) {
              setProfile(parsed);
              setUserRole(parsed.role || 'freelancer');
              setCurrentScreen((prev) =>
                ['auth', 'onboarding'].includes(prev) ? 'explore' : prev
              );
              return;
            }
          }
        } catch {}

        // Fast check Firestore
        const firestoreProf = await getUserProfileFromFirestore(user.uid);
        if (firestoreProf && firestoreProf.profileCompleted) {
          // Returning user: restore their profile and role
          setProfile(firestoreProf);
          setUserRole(firestoreProf.role);
          try {
            localStorage.setItem(`gigly_profile_${user.uid}`, JSON.stringify(firestoreProf));
          } catch {}
          setCurrentScreen((prev) =>
            ['auth', 'onboarding'].includes(prev) ? 'explore' : prev
          );
        } else {
          // New user / new email: Immediately show profile setup
          setProfile((prev) => ({
            ...prev,
            email: user.email || prev.email,
            name: user.displayName || (user.email ? user.email.split('@')[0] : prev.name),
            userId: user.uid,
            profileCompleted: false,
          }));
          setCurrentScreen((prev) => (prev === 'startup' ? prev : 'onboarding'));
        }
      } else {
        const activeSess = getActiveUserSession();
        if (!activeSess) {
          setCurrentUserId('guest-user');
          setMatches([]);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to user-specific matches in Firestore
  useEffect(() => {
    if (!currentUserId || currentUserId === 'guest-user') {
      setMatches([]);
      setToastNotification(null);
      return;
    }

    // Load cached matches for this specific user
    try {
      const cached = localStorage.getItem(`gigly_matches_${currentUserId}`);
      if (cached) {
        setMatches(JSON.parse(cached));
      }
    } catch {}

    const unsubMatches = subscribeToUserMatches(currentUserId, (userMatches) => {
      setMatches(userMatches);
      try {
        localStorage.setItem(`gigly_matches_${currentUserId}`, JSON.stringify(userMatches));
      } catch {}
    });

    return () => unsubMatches();
  }, [currentUserId]);

  // Load and sync read messages status for current user & cross-tab events
  useEffect(() => {
    if (currentUserId) {
      try {
        const stored = localStorage.getItem(`gigly_read_messages_${currentUserId}`);
        if (stored) {
          setLastReadMessageIds(JSON.parse(stored));
        } else {
          setLastReadMessageIds({});
        }
      } catch {}
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === `gigly_matches_${currentUserId}` && e.newValue) {
        try {
          setMatches(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `gigly_read_messages_${currentUserId}` && e.newValue) {
        try {
          setLastReadMessageIds(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [currentUserId]);

  // Load and sync reviewed/swiped card IDs whenever current user changes
  useEffect(() => {
    if (currentUserId) {
      try {
        const local = localStorage.getItem(`gigly_swiped_items_${currentUserId}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setSwipedIds(new Set(parsed));
          }
        }
      } catch {}

      if (currentUserId !== 'guest-user') {
        getUserSwipedIds(currentUserId).then((ids) => {
          if (ids && ids.length > 0) {
            setSwipedIds((prev) => {
              const merged = new Set([...prev, ...ids]);
              try {
                localStorage.setItem(`gigly_swiped_items_${currentUserId}`, JSON.stringify(Array.from(merged)));
              } catch {}
              return merged;
            });
          }
        });
      }
    }
  }, [currentUserId]);

  // Subscribe to real-time people who made an account from Firestore
  useEffect(() => {
    const unsubGigs = subscribeToGigs(
      userRole,
      (items) => {
        if (userRole === 'freelancer') {
          setJobs(items);
        } else {
          setCandidates(items);
        }
      },
      currentUserId,
      profile.email
    );

    return () => unsubGigs();
  }, [userRole, currentUserId, profile.email]);

  // Handle Authentication Success
  const handleAuthSuccess = async (session?: AuthUserSession) => {
    const user = auth.currentUser;
    const uid = session?.uid || user?.uid || currentUserId;
    const email = session?.email || user?.email || profile.email;

    // 🌟 Direct administrator immediately to Admin Portal
    if (isAdminEmail(email)) {
      sessionStorage.setItem('gigly_admin_session', 'true');
      setProfile((prev) => ({
        ...prev,
        email: email || ADMIN_EMAIL,
        name: user?.displayName || session?.displayName || 'Gigly Admin',
        userId: uid,
        profileCompleted: true,
      }));
      setCurrentScreen('admin');
      return;
    }

    if (uid && uid !== 'guest-user') {
      setCurrentUserId(uid);

      if (session?.isNewUser) {
        // Direct new accounts immediately to fill out their profile!
        setProfile((prev) => ({
          ...prev,
          email: email,
          name: session.displayName || (email ? email.split('@')[0] : prev.name),
          userId: uid,
          profileCompleted: false,
        }));
        setCurrentScreen('onboarding');
        return;
      }

      // Check cached profile first for instant transition
      try {
        const cached = localStorage.getItem(`gigly_profile_${uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.profileCompleted) {
            setProfile(parsed);
            setUserRole(parsed.role || 'freelancer');
            setCurrentScreen('explore');
            return;
          }
        }
      } catch {}

      // Fast Firestore check
      const firestoreProf = await getUserProfileFromFirestore(uid);
      if (firestoreProf && firestoreProf.profileCompleted) {
        // Returning user with completed profile
        setProfile(firestoreProf);
        setUserRole(firestoreProf.role);
        try {
          localStorage.setItem(`gigly_profile_${uid}`, JSON.stringify(firestoreProf));
        } catch {}
        setCurrentScreen('explore');
      } else {
        // Mandatory to fill in profile
        setProfile((prev) => ({
          ...prev,
          email: email,
          name: user?.displayName || session?.displayName || (email ? email.split('@')[0] : prev.name),
          userId: uid,
          profileCompleted: false,
        }));
        setCurrentScreen('onboarding');
      }
    } else {
      setCurrentScreen('onboarding');
    }
  };

  // Complete Mandatory Profile Onboarding for New Users
  const handleCompleteOnboarding = async (newProfile: UserProfile) => {
    const activeSession = getActiveUserSession();
    let uid = auth.currentUser?.uid || activeSession?.uid || currentUserId;
    if (!uid || uid === 'guest-user') {
      uid = newProfile.email
        ? `usr_${newProfile.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        : `usr_${Date.now()}`;
    }
    setCurrentUserId(uid);

    const completed: UserProfile = {
      ...newProfile,
      userId: uid,
      profileCompleted: true,
    };

    // 1. Immediately save to local storage
    try {
      localStorage.setItem(`gigly_profile_${uid}`, JSON.stringify(completed));
    } catch {}

    // 2. Immediately update state and transition to explore
    setProfile(completed);
    setUserRole(completed.role);
    setCurrentScreen('explore');

    // 3. Persist to Firestore asynchronously so all other users on the platform see this account
    saveUserProfileToFirestore(uid, completed).catch((err) => {
      console.warn('Background profile save warning:', err);
    });
  };

  // Handle User Log Out
  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('gigly_admin_session');
    } catch {}
    await logoutUser();
    setCurrentUserId('guest-user');
    setMatches([]);
    setLastReadMessageIds({});
    setToastNotification(null);
    userBaselineLoadedRef.current = null;
    prevMatchesRef.current = [];
    setProfile({
      name: '',
      role: 'freelancer',
      roleTitle: '',
      rateOrBudget: '',
      bio: '',
      skills: [],
      email: '',
      avatarInitials: '',
      verified: false,
      profileCompleted: false,
      stats: {
        appliedOrPosted: 0,
        hired: 0,
        ratingOrResponse: '100%',
      },
    });
    setCurrentScreen('auth');
  };

  // Handle Profile Updates (keeps profile strictly locked to single role chosen at start)
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated, role: prev.role };
      const uid = auth.currentUser?.uid || currentUserId;
      if (uid && uid !== 'guest-user') {
        saveUserProfileToFirestore(uid, next);
        try {
          localStorage.setItem(`gigly_profile_${uid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Handle Role Selection
  const handleSelectRole = (role: 'freelancer' | 'business') => {
    setUserRole(role);
    setProfile((prev) => {
      const updatedProfile: UserProfile = {
        ...prev,
        role: role,
        roleTitle:
          prev.roleTitle ||
          (role === 'freelancer' ? 'Product & Frontend Designer' : 'Design & Tech Studio'),
        rateOrBudget:
          prev.rateOrBudget || (role === 'freelancer' ? '$55–70 / hr' : '$1,000–3,000 / project'),
      };
      const uid = auth.currentUser?.uid || currentUserId;
      if (uid && uid !== 'guest-user') {
        saveUserProfileToFirestore(uid, updatedProfile);
        try {
          localStorage.setItem(`gigly_profile_${uid}`, JSON.stringify(updatedProfile));
        } catch {}
      }
      return updatedProfile;
    });
    setCurrentScreen('explore');
  };

  // Handle Swipe with True Mutual Matching & Duplicate Prevention
  const handleSwipe = async (item: GigItem, direction: 'left' | 'right' | 'up') => {
    // 1. Permanently record swiped profile so it never reappears in deck
    setSwipedIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      if (item.userId) next.add(item.userId);
      try {
        localStorage.setItem(`gigly_swiped_items_${currentUserId}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // 2. Perform True Mutual Match check:
    // Only triggers a match if the other user has ALSO liked / superliked back!
    try {
      const matchResult = await checkMutualLikeAndMatch(currentUserId, profile, item, direction);
      if (matchResult.isMutual && matchResult.match) {
        // 🎉 Genuine Mutual Match!
        setMatches((prev) => [matchResult.match!, ...prev.filter((m) => m.id !== matchResult.match!.id)]);
        setIsSuperLikeMatch(direction === 'up');
        setMatchedOverlayJob(item);
      }
    } catch (err) {
      console.warn('Mutual match check warning:', err);
    }
  };

  // Mark a conversation as read by recording the latest message id
  const markChatAsRead = (matchId: number) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch || !targetMatch.messages || targetMatch.messages.length === 0) return;
    const latestMsg = targetMatch.messages[targetMatch.messages.length - 1];
    setLastReadMessageIds((prev) => {
      if (prev[matchId] === latestMsg.id) return prev;
      const updated = { ...prev, [matchId]: latestMsg.id };
      try {
        localStorage.setItem(`gigly_read_messages_${currentUserId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Automatically mark active chat as read whenever user is viewing it
  useEffect(() => {
    if (currentScreen === 'messages' && activeChatId !== null) {
      markChatAsRead(activeChatId);
    }
  }, [currentScreen, activeChatId, matches]);

  // Send Message in Chat (sync to Firestore for real users)
  const handleSendMessage = (matchId: number, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setMatches((prev) => {
      const nextMatches = prev.map((m) => {
        if (m.id === matchId) {
          const newMsg = {
            id: newMsgId,
            senderId: currentUserId,
            from: 'me' as const,
            text: cleanText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          const updatedMessages = [...m.messages, newMsg];
          syncMatchMessagesToFirestore(matchId, updatedMessages, currentUserId);
          return {
            ...m,
            messages: updatedMessages,
          };
        }
        return m;
      });
      return nextMatches;
    });

    // Mark as read for myself
    setLastReadMessageIds((prev) => {
      const updated = { ...prev, [matchId]: newMsgId };
      try {
        localStorage.setItem(`gigly_read_messages_${currentUserId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Simulate text back from matched party (for easy on-demand notification testing)
  const handleSimulateIncomingText = (matchId: number, customText?: string) => {
    const defaultReplies = [
      "Hey! Thanks for reaching out. I'd love to discuss this project!",
      "Sounds great! What is your availability for a quick kickoff call?",
      "Thanks for your message! Can you share a link to past work?",
      "Awesome connecting with you. Let's discuss scope and timeline!",
      "Received! I reviewed your details and I think it's a great match.",
    ];
    const replyText = customText || defaultReplies[Math.floor(Math.random() * defaultReplies.length)];

    setMatches((prev) => {
      const nextMatches = prev.map((m) => {
        if (m.id === matchId) {
          const partnerId = m.partnerUserId || `partner-${m.id}`;
          const newMsg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: partnerId,
            from: 'them' as const,
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          const updatedMessages = [...m.messages, newMsg];
          syncMatchMessagesToFirestore(matchId, updatedMessages, currentUserId);
          return {
            ...m,
            messages: updatedMessages,
          };
        }
        return m;
      });
      return nextMatches;
    });
  };

  // Helper to calculate unread incoming messages from the other person
  const getMatchUnreadCount = (match: MatchRecord): number => {
    if (!match.messages || match.messages.length === 0) return 0;
    const lastReadId = lastReadMessageIds[match.id];
    if (lastReadId) {
      const lastReadIdx = match.messages.findIndex((m) => m.id === lastReadId);
      if (lastReadIdx !== -1) {
        return match.messages.slice(lastReadIdx + 1).filter((m) => {
          return m.senderId ? m.senderId !== currentUserId : m.from === 'them';
        }).length;
      }
    }
    // If not read yet, count incoming messages from the other person
    let unread = 0;
    for (let i = match.messages.length - 1; i >= 0; i--) {
      const m = match.messages[i];
      const isIncoming = m.senderId ? m.senderId !== currentUserId : m.from === 'them';
      if (isIncoming) {
        unread++;
      } else {
        break; // Stop at message sent by current user
      }
    }
    return unread;
  };

  // Calculate unread map per match and total unread texts (ONLY for authenticated in-app sessions)
  const unreadCountByMatch = useMemo(() => {
    if (!currentUserId || currentUserId === 'guest-user' || ['startup', 'auth', 'onboarding'].includes(currentScreen)) {
      return {};
    }
    const map: Record<number, number> = {};
    matches.forEach((m) => {
      map[m.id] = getMatchUnreadCount(m);
    });
    return map;
  }, [matches, lastReadMessageIds, currentUserId, currentScreen]);

  const totalUnreadIncomingMessages = useMemo(() => {
    if (!currentUserId || currentUserId === 'guest-user' || ['startup', 'auth', 'onboarding'].includes(currentScreen)) {
      return 0;
    }
    return Object.values(unreadCountByMatch).reduce((acc: number, count: number) => acc + count, 0);
  }, [unreadCountByMatch, currentUserId, currentScreen]);

  // Real-time incoming text detection: Trigger toast notification & audio chime ONLY when logged in and somebody texts back
  const prevMatchesRef = useRef<MatchRecord[]>([]);
  const userBaselineLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    // 🛑 STRICT GUARD: If user has NOT logged in or is on startup / login / onboarding screen,
    // NEVER show notification toast, NEVER play chime, and clear any dangling notification
    const isUserLoggedIn = Boolean(currentUserId && currentUserId !== 'guest-user');
    const isInAppScreen = ['explore', 'matches', 'messages', 'profile'].includes(currentScreen);

    if (!isUserLoggedIn || !isInAppScreen) {
      if (toastNotification) {
        setToastNotification(null);
      }
      prevMatchesRef.current = matches;
      return;
    }

    // Baseline establishment: when a user first logs in or session matches first load,
    // establish the baseline WITHOUT assuming old existing messages are new incoming texts!
    if (userBaselineLoadedRef.current !== currentUserId) {
      userBaselineLoadedRef.current = currentUserId;
      prevMatchesRef.current = matches;
      return;
    }

    // Only compare for real new incoming messages after the baseline has been established
    matches.forEach((m) => {
      const prev = prevMatchesRef.current.find((p) => p.id === m.id);
      const prevCount = prev?.messages?.length || 0;
      const currentCount = m.messages?.length || 0;

      // Only notify if this is an existing match that gained a new message
      if (currentCount > prevCount && prev !== undefined) {
        const newMsgs = m.messages.slice(prevCount);
        const incomingMsgs = newMsgs.filter((msg) => {
          return msg.senderId ? msg.senderId !== currentUserId : msg.from === 'them';
        });

        if (incomingMsgs.length > 0) {
          const latestIncoming = incomingMsgs[incomingMsgs.length - 1];
          const isActivelyViewingChat = currentScreen === 'messages' && activeChatId === m.id;

          if (!isActivelyViewingChat) {
            playNotificationChime();
            setToastNotification({
              id: latestIncoming.id,
              matchId: m.id,
              senderName: m.job.client,
              text: latestIncoming.text,
            });
          }
        }
      }
    });

    prevMatchesRef.current = matches;
  }, [matches, currentUserId, currentScreen, activeChatId]);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Reshuffle Deck
  const handleReshuffle = () => {
    // Deck reshuffle resets viewed cards without injecting fake profiles
  };

  // Guard Admin Dashboard access with verified admin session & route admin automatically
  useEffect(() => {
    const isUserAdmin = isAdminEmail(profile.email) || isAdminEmail(auth.currentUser?.email);
    if (isUserAdmin) {
      sessionStorage.setItem('gigly_admin_session', 'true');
    }

    if (currentScreen === 'admin') {
      try {
        const authed = sessionStorage.getItem('gigly_admin_session');
        if (authed !== 'true' && !isUserAdmin) {
          setCurrentScreen('auth');
        }
      } catch {
        if (!isUserAdmin) {
          setCurrentScreen('auth');
        }
      }
    } else if (currentScreen === 'onboarding' && isUserAdmin) {
      // Direct administrator immediately to admin portal
      setCurrentScreen('admin');
    }
  }, [currentScreen, profile.email]);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex justify-center text-[#1A1A1A]">
      {/* 1. STARTUP ANIMATION SCREEN */}
      {currentScreen === 'startup' && (
        <StartupAnimation onStart={() => setCurrentScreen('auth')} />
      )}

      {/* 2. AUTH SCREEN */}
      {currentScreen === 'auth' && (
        <AuthScreen
          onSuccess={handleAuthSuccess}
          onAdminClick={() => {
            sessionStorage.setItem('gigly_admin_session', 'true');
            setCurrentScreen('admin');
          }}
          onBackToStartup={() => setCurrentScreen('startup')}
        />
      )}

      {/* 2.5 MANDATORY PROFILE SETUP FOR NEW USERS */}
      {currentScreen === 'onboarding' && (
        <OnboardingProfileScreen
          userEmail={profile.email || auth.currentUser?.email || ''}
          initialName={profile.name}
          defaultCurrency={currency}
          onCurrencyChange={handleCurrencyChange}
          onSaveProfile={handleCompleteOnboarding}
          onGoToAdmin={() => {
            sessionStorage.setItem('gigly_admin_session', 'true');
            setCurrentScreen('admin');
          }}
        />
      )}

      {/* 3. ROLE SELECT SCREEN */}
      {currentScreen === 'roleSelect' && (
        <RoleSelectScreen onSelectRole={handleSelectRole} />
      )}

      {/* 4. ADMIN DASHBOARD */}
      {currentScreen === 'admin' && (
        <AdminDashboard
          onBackToApp={() => {
            setCurrentScreen('explore');
          }}
          matches={matches}
          currentProfile={profile}
          jobs={jobs}
          candidates={candidates}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />
      )}

      {/* 5. MAIN APP SHELL WITH BOTTOM NAV */}
      {['explore', 'matches', 'messages', 'profile'].includes(currentScreen) && (
        <div className="w-full max-w-[440px] min-h-screen flex flex-col p-5 pb-24 relative">
          <AnimatePresence mode="wait">
            {currentScreen === 'explore' && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <ExploreDeck
                  items={userRole === 'freelancer' ? jobs : candidates}
                  role={userRole}
                  matchesCount={matches.length}
                  swipedIds={swipedIds}
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  onSwipe={handleSwipe}
                  onReshuffle={() => {}}
                />
              </motion.div>
            )}

            {currentScreen === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <MatchesScreen
                  matches={matches}
                  role={userRole}
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  onOpenChat={(id) => {
                    const targetMatch = matches.find((m) => m.id === id);
                    if (
                      targetMatch &&
                      (!targetMatch.messages || targetMatch.messages.length === 0) &&
                      targetMatch.expiresAt <= Date.now()
                    ) {
                      return; // Pitch window closed
                    }
                    setActiveChatId(id);
                    markChatAsRead(id);
                    setCurrentScreen('messages');
                  }}
                />
              </motion.div>
            )}

            {currentScreen === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <MessagesScreen
                  matches={matches}
                  role={userRole}
                  activeChatId={activeChatId}
                  currentUserId={currentUserId}
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  unreadCountByMatch={unreadCountByMatch}
                  onSelectChat={(id) => {
                    setActiveChatId(id);
                    if (id !== null) {
                      markChatAsRead(id);
                    }
                  }}
                  onSendMessage={handleSendMessage}
                  onSimulateIncomingText={handleSimulateIncomingText}
                />
              </motion.div>
            )}

            {currentScreen === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <ProfileScreen
                  profile={profile}
                  currentCurrency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                  onOpenAdmin={() => {
                    sessionStorage.setItem('gigly_admin_session', 'true');
                    setCurrentScreen('admin');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Navigation */}
          <Navbar
            currentScreen={currentScreen}
            isAdmin={isAdminEmail(profile.email) || isAdminEmail(auth.currentUser?.email)}
            onNavigate={(screen) => {
              if (screen === 'messages') {
                setActiveChatId(null);
              }
              if (screen === 'admin') {
                sessionStorage.setItem('gigly_admin_session', 'true');
              }
              setCurrentScreen(screen);
            }}
            matchesBadgeCount={
              matches.filter(
                (m) =>
                  (!m.messages || m.messages.length === 0) &&
                  m.expiresAt > Date.now()
              ).length
            }
            messagesBadgeCount={totalUnreadIncomingMessages}
          />
        </div>
      )}

      {/* IN-APP FLOATING NOTIFICATION TOAST WHEN SOMEONE TEXTS BACK (STRICTLY IN-APP FOR LOGGED-IN USERS ONLY) */}
      <AnimatePresence>
        {['explore', 'matches', 'messages', 'profile'].includes(currentScreen) &&
          currentUserId &&
          currentUserId !== 'guest-user' &&
          toastNotification && (
            <NotificationToast
              key={toastNotification.id}
              matchId={toastNotification.matchId}
              senderName={toastNotification.senderName}
              text={toastNotification.text}
              onOpen={() => {
                setActiveChatId(toastNotification.matchId);
                markChatAsRead(toastNotification.matchId);
                setCurrentScreen('messages');
                setToastNotification(null);
              }}
              onDismiss={() => setToastNotification(null)}
            />
          )}
      </AnimatePresence>

      {/* MATCH POPUP OVERLAY */}
      <AnimatePresence>
        {matchedOverlayJob && (
          <MatchOverlay
            key={matchedOverlayJob.id}
            matchedJob={matchedOverlayJob}
            isSuperLike={isSuperLikeMatch}
            onKeepSwiping={() => {
              setMatchedOverlayJob(null);
              setIsSuperLikeMatch(false);
            }}
            onGoToChat={() => {
              if (matches.length > 0) {
                setActiveChatId(matches[0].id);
                markChatAsRead(matches[0].id);
              }
              setMatchedOverlayJob(null);
              setIsSuperLikeMatch(false);
              setCurrentScreen('messages');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
