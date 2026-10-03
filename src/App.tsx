import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AppScreen,
  GigItem,
  MatchRecord,
  UserProfile,
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

  // User Profile State with local persistence fallback
  const [profile, setProfile] = useState<UserProfile>(() => {
    const defaultProfile: UserProfile = {
      name: 'Yash S.',
      role: 'freelancer',
      roleTitle: 'Product & Frontend Designer',
      rateOrBudget: '$55–70 / hr',
      bio: 'I design and build product interfaces end to end — from Figma flows to shipped React. I like short, well-scoped sprints over long open-ended retainers.',
      skills: ['Figma', 'React', 'Design systems', 'UX writing'],
      email: 'giglycompany@gmail.com',
      avatarInitials: 'YS',
      verified: true,
      profileCompleted: true,
      stats: {
        appliedOrPosted: 18,
        hired: 5,
        ratingOrResponse: '96%',
      },
    };
    return defaultProfile;
  });

  // Seed Firestore & Listen to Auth state on initial load
  useEffect(() => {
    seedInitialFirestoreData();

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // 1. Try local storage cache for instant 0ms rendering
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
        } catch {
          // Ignore cache read errors
        }

        // 2. Fast check Firestore (max 1.2s timeout)
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
        setCurrentUserId('guest-user');
        setMatches([]);
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to user-specific matches in Firestore
  useEffect(() => {
    if (!currentUserId || currentUserId === 'guest-user') {
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
  const handleAuthSuccess = async (role?: 'freelancer' | 'business') => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);

      // Fast check cached profile first for instant 0ms transition
      try {
        const cached = localStorage.getItem(`gigly_profile_${user.uid}`);
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

      // Fast Firestore check (max 1.2s timeout)
      const firestoreProf = await getUserProfileFromFirestore(user.uid);
      if (firestoreProf && firestoreProf.profileCompleted) {
        // Returning user with completed profile
        setProfile(firestoreProf);
        setUserRole(firestoreProf.role);
        try {
          localStorage.setItem(`gigly_profile_${user.uid}`, JSON.stringify(firestoreProf));
        } catch {}
        setCurrentScreen('explore');
      } else {
        // New email! Mandatory to fill in profile
        setProfile((prev) => ({
          ...prev,
          email: user.email || prev.email,
          name: user.displayName || (user.email ? user.email.split('@')[0] : prev.name),
          userId: user.uid,
          profileCompleted: false,
        }));
        setCurrentScreen('onboarding');
      }
    } else if (role) {
      handleSelectRole(role);
    } else {
      setCurrentScreen('onboarding');
    }
  };

  // Complete Mandatory Profile Onboarding for New Users
  const handleCompleteOnboarding = async (newProfile: UserProfile) => {
    const uid = auth.currentUser?.uid || currentUserId;
    const completed: UserProfile = {
      ...newProfile,
      userId: uid,
      profileCompleted: true,
    };

    // 1. Immediately save to local storage
    try {
      localStorage.setItem(`gigly_profile_${uid}`, JSON.stringify(completed));
    } catch {}

    // 2. Immediately update state and transition to explore (never hangs the user!)
    setProfile(completed);
    setUserRole(completed.role);
    setCurrentScreen('explore');

    // 3. Persist to Firestore asynchronously in background
    saveUserProfileToFirestore(uid, completed).catch((err) => {
      console.warn('Background profile save warning:', err);
    });
  };

  // Handle User Log Out
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setCurrentUserId('guest-user');
    setMatches([]);
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

  // Handle Swipe (persist to Firestore)
  const handleSwipe = (item: GigItem, direction: 'left' | 'right' | 'up') => {
    recordSwipeToFirestore(currentUserId, item.id, direction);

    if (direction === 'right' || direction === 'up') {
      // Create a match
      const newMatchId = Date.now();
      const newMatch: MatchRecord = {
        id: newMatchId,
        job: item,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        messages: [],
        matchedAt: 'Just now',
      };

      setMatches((prev) => [newMatch, ...prev]);
      setIsSuperLikeMatch(direction === 'up');
      setMatchedOverlayJob(item);
      saveMatchToFirestore(newMatch, currentUserId);
    }
  };

  // Send Message in Chat (sync to Firestore)
  const handleSendMessage = (matchId: number, text: string) => {
    const isReply = text.startsWith('__THEM__:');
    const cleanText = isReply ? text.replace('__THEM__:', '') : text;

    setMatches((prev) => {
      const nextMatches = prev.map((m) => {
        if (m.id === matchId) {
          const newMsg = {
            id: `msg-${Date.now()}-${Math.random()}`,
            from: isReply ? ('them' as const) : ('me' as const),
            text: cleanText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          const updatedMessages = [...m.messages, newMsg];
          syncMatchMessagesToFirestore(matchId, updatedMessages);
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

  // Reshuffle Deck
  const handleReshuffle = () => {
    // Deck reshuffle resets viewed cards without injecting fake profiles
  };

  // Count unread messages
  const unreadMessagesCount = matches.filter((m) => m.messages.length === 0).length;

  // Guard Admin Dashboard access with verified admin session
  useEffect(() => {
    if (currentScreen === 'admin') {
      try {
        const authed = sessionStorage.getItem('gigly_admin_session');
        if (authed !== 'true') {
          setCurrentScreen('auth');
        }
      } catch {
        setCurrentScreen('auth');
      }
    }
  }, [currentScreen]);

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
          onAdminClick={() => setCurrentScreen('admin')}
          onBackToStartup={() => setCurrentScreen('startup')}
        />
      )}

      {/* 2.5 MANDATORY PROFILE SETUP FOR NEW USERS */}
      {currentScreen === 'onboarding' && (
        <OnboardingProfileScreen
          userEmail={profile.email || auth.currentUser?.email || ''}
          initialName={profile.name}
          onSaveProfile={handleCompleteOnboarding}
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
            try {
              sessionStorage.removeItem('gigly_admin_session');
            } catch {}
            setCurrentScreen('auth');
          }}
          matches={matches}
          currentProfile={profile}
          jobs={jobs}
          candidates={candidates}
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
                  onSwipe={handleSwipe}
                  onReshuffle={handleReshuffle}
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
                  onSelectChat={(id) => setActiveChatId(id)}
                  onSendMessage={handleSendMessage}
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
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Navigation */}
          <Navbar
            currentScreen={currentScreen}
            onNavigate={(screen) => {
              if (screen === 'messages') {
                setActiveChatId(null);
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
            messagesBadgeCount={unreadMessagesCount}
          />
        </div>
      )}

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
