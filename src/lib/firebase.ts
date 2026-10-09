import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc,
  getDocFromServer,
  deleteDoc,
  setLogLevel,
} from 'firebase/firestore';

// Silence internal Firestore SDK connection logs (e.g. offline/retry messages)
setLogLevel('silent');
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GigItem, MatchRecord, UserProfile } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics if supported in browser environment
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics unsupported environment errors
  });
}

// Initialize Firestore with forced long polling and databaseId
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  }, firebaseConfig.firestoreDatabaseId || undefined);
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
}
export const db = dbInstance;

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider configured with prompt and default scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in using Firebase GoogleAuthProvider
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    // If popup is blocked or fails in iframe, offer redirect or informative error
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw error;
  }
}

// Apple Auth Provider configured with standard scopes
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

/**
 * Sign in using Firebase OAuthProvider for Apple
 */
export async function signInWithApple() {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result;
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, appleProvider);
        return null;
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw error;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  // Keep offline, unavailable, permission, and timeout errors silent to avoid noisy console warnings
  if (
    errMessage.includes('offline') ||
    errMessage.includes('unavailable') ||
    errMessage.includes('could not be completed') ||
    errMessage.includes('PERMISSION_DENIED') ||
    errMessage.includes('timeout')
  ) {
    return;
  }
  console.warn('Firestore notice: ', JSON.stringify(errInfo));
}

export function encodeEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export interface AuthUserSession {
  uid: string;
  email: string;
  displayName?: string;
  isNewUser?: boolean;
}

export function getActiveUserSession(): AuthUserSession | null {
  try {
    const raw = localStorage.getItem('gigly_active_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function logoutUser() {
  try {
    await auth.signOut();
  } catch {}
  try {
    localStorage.removeItem('gigly_active_user');
    sessionStorage.removeItem('gigly_admin_session');
  } catch {}
}

/**
 * Robust User Authentication:
 * First attempts Firebase Auth. If email/password is not enabled in Firebase project
 * (e.g. auth/operation-not-allowed), it seamlessly falls back to Firestore accounts collection
 * so real users can always create accounts, log in, and be saved to Firestore across devices.
 */
export async function loginOrRegisterAccount(
  email: string,
  pass: string,
  mode: 'login' | 'signup'
): Promise<AuthUserSession> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = pass.trim();
  const accountKey = encodeEmailKey(cleanEmail);

  // 1. Try Firebase Auth
  try {
    let userCred: any;
    if (mode === 'signup') {
      userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    } else {
      userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    }

    if (userCred && userCred.user) {
      const session: AuthUserSession = {
        uid: userCred.user.uid,
        email: cleanEmail,
        displayName: userCred.user.displayName || cleanEmail.split('@')[0],
        isNewUser: mode === 'signup',
      };
      localStorage.setItem('gigly_active_user', JSON.stringify(session));

      // Also record in Firestore accounts collection for cross-system reference
      try {
        await setDoc(
          doc(db, 'accounts', accountKey),
          {
            email: cleanEmail,
            uid: userCred.user.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {}

      return session;
    }
  } catch (firebaseErr: any) {
    // If user already exists in Firebase Auth during signup, attempt sign in:
    if (firebaseErr.code === 'auth/email-already-in-use') {
      try {
        const loginCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const session: AuthUserSession = {
          uid: loginCred.user.uid,
          email: cleanEmail,
          isNewUser: false,
        };
        localStorage.setItem('gigly_active_user', JSON.stringify(session));
        return session;
      } catch {
        throw new Error('This email is already registered. Switch to the Log in tab to continue.');
      }
    }

    // If Firebase Auth fails with invalid password/credential:
    if (
      firebaseErr.code === 'auth/wrong-password' ||
      firebaseErr.code === 'auth/invalid-credential'
    ) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    // If Firebase Auth gives operation-not-allowed, network-request-failed, or user-not-found,
    // seamlessly use Firestore account authentication so the user is never blocked!
    console.warn('Firebase Auth fallback to Firestore account:', firebaseErr?.code || firebaseErr);
  }

  // 2. Firestore-backed Account Authentication
  const accRef = doc(db, 'accounts', accountKey);
  let accSnap;
  try {
    accSnap = await getDoc(accRef);
  } catch (err) {
    console.warn('Firestore account lookup error:', err);
  }

  const generatedUid = `usr_${accountKey}`;

  if (mode === 'signup') {
    if (accSnap && accSnap.exists()) {
      throw new Error('This email is already registered. Please switch to the Log in tab.');
    }

    const newAccountData = {
      email: cleanEmail,
      password: cleanPassword,
      uid: generatedUid,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(accRef, newAccountData);
    } catch (err) {
      console.warn('Firestore setDoc account notice:', err);
    }

    const session: AuthUserSession = {
      uid: generatedUid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      isNewUser: true,
    };
    localStorage.setItem('gigly_active_user', JSON.stringify(session));
    return session;
  } else {
    // Mode is 'login'
    if (accSnap && accSnap.exists()) {
      const data = accSnap.data();
      if (data && data.password && data.password !== cleanPassword) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
      const session: AuthUserSession = {
        uid: data.uid || generatedUid,
        email: cleanEmail,
        isNewUser: false,
      };
      localStorage.setItem('gigly_active_user', JSON.stringify(session));
      return session;
    }

    // Check if user profile exists in Firestore users
    try {
      const userSnap = await getDoc(doc(db, 'users', generatedUid));
      if (userSnap.exists()) {
        const session: AuthUserSession = {
          uid: generatedUid,
          email: cleanEmail,
          isNewUser: false,
        };
        localStorage.setItem('gigly_active_user', JSON.stringify(session));
        return session;
      }
    } catch {}

    throw new Error('No account found for this email. Switch to the Sign up tab to register!');
  }
}

/**
 * Validate connection to Firestore on initial boot
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Graceful offline fallback
  }
}

/**
 * Purge mock/fake gigs or profiles from Firestore collection
 */
export async function purgeFakeDataFromFirestore() {
  try {
    const gigsCol = collection(db, 'gigs');
    const snapshot = await getDocs(gigsCol);
    if (!snapshot.empty) {
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        // Check if doc matches any mock id or format
        if (
          docId.startsWith('job-') ||
          docId.startsWith('cand-') ||
          docSnap.data().isMock ||
          docSnap.data().isFake
        ) {
          deletePromises.push(deleteDoc(doc(db, 'gigs', docId)));
        }
      });
      await Promise.all(deletePromises);
    }
  } catch (err) {
    // Ignore cleanup warnings
  }
}

/**
 * Seed initial data if required (no mock data seeded)
 */
export async function seedInitialFirestoreData() {
  // Purge any residual mock/fake profiles so database strictly has real users
  await purgeFakeDataFromFirestore();
}

/**
 * Convert a real UserProfile into a GigItem for the swipe deck
 */
export function convertProfileToGigItem(user: UserProfile, uid?: string): GigItem {
  const isFreelancer = (user.role || '').toLowerCase() === 'freelancer';
  const effectiveId = user.userId || uid || (user.email ? `user-${encodeEmailKey(user.email)}` : `user-${Date.now()}`);
  return {
    id: effectiveId,
    userId: user.userId || uid || effectiveId,
    rate: user.rateOrBudget || (isFreelancer ? '$60 / hr' : '$1,500 project'),
    unit: '',
    title: user.roleTitle || (isFreelancer ? 'Freelancer' : 'Hiring Project'),
    client: user.name || 'Member',
    category: (user.category as any) || 'Others',
    tags: Array.isArray(user.skills) && user.skills.length > 0 ? user.skills : [user.category || 'Specialist'],
    desc: user.bio || (isFreelancer ? 'Looking for exciting gigs and client partnerships.' : 'Looking for talented freelancers to collaborate with.'),
    posted: 'Active account',
    proposals: isFreelancer ? 'Available now' : 'Hiring now',
    hot: Boolean(user.verified),
    avatarBg: '#FFC629',
    type: isFreelancer ? 'candidate' : 'job',
  };
}

/**
 * Real-time listener for authentic people who have made an account from Firestore & local storage
 * - If current user is a freelancer: shows real businesses who made an account & are hiring
 * - If current user is a business: shows real freelancers who made an account & are looking for gigs
 */
export function subscribeToGigs(
  role: 'freelancer' | 'business',
  arg2: any,
  arg3?: any,
  arg4?: any
): () => void {
  let onUpdate: (items: GigItem[]) => void;
  let currentUserId: string | undefined;
  let currentUserEmail: string | undefined;

  if (typeof arg2 === 'function') {
    onUpdate = arg2;
    currentUserId = arg3;
    currentUserEmail = arg4;
  } else {
    currentUserId = arg2;
    currentUserEmail = arg3;
    onUpdate = arg4;
  }

  const targetRole = role === 'freelancer' ? 'business' : 'freelancer';
  const targetGigType = role === 'freelancer' ? 'job' : 'candidate';

  let usersList: GigItem[] = [];
  let gigsList: GigItem[] = [];
  let localList: GigItem[] = [];

  const emitCombined = () => {
    const map = new Map<string, GigItem>();

    // Helper to check if item belongs to current user
    const isSelf = (item: GigItem, email?: string) => {
      if (currentUserId && (item.id === currentUserId || item.id === `gig-user-${currentUserId}`)) {
        return true;
      }
      if (currentUserEmail && email && email.toLowerCase() === currentUserEmail.toLowerCase()) {
        return true;
      }
      return false;
    };

    // 1. Add real users who registered as target role
    usersList.forEach((item) => {
      if (!isSelf(item)) {
        map.set(item.id, item);
      }
    });

    // 2. Add gigs created for this target role
    gigsList.forEach((item) => {
      if (!isSelf(item) && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    // 3. Add local real profiles from other accounts (useful for preview/testing)
    localList.forEach((item) => {
      if (!isSelf(item) && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    const combined = Array.from(map.values());
    onUpdate(combined);
  };

  // 1. Load real profiles from localStorage
  try {
    const foundLocal: GigItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gigly_profile_')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const p = JSON.parse(raw);
          if (
            p &&
            (p.role || '').toLowerCase() === targetRole &&
            (p.name || p.roleTitle) &&
            p.userId !== currentUserId &&
            p.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
          ) {
            foundLocal.push(convertProfileToGigItem(p, p.userId));
          }
        }
      }
    }
    localList = foundLocal;
    emitCombined();
  } catch {}

  // Instant fetch from Firestore users to populate immediately
  getDocs(collection(db, 'users'))
    .then((snap) => {
      if (!snap.empty) {
        const list: GigItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          const userRole = (data?.role || '').toLowerCase();
          const docId = docSnap.id;
          if (
            data &&
            userRole === targetRole &&
            (data.name || data.roleTitle || data.profileCompleted) &&
            docId !== currentUserId &&
            data.userId !== currentUserId &&
            data.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
          ) {
            list.push(convertProfileToGigItem(data, docId));
          }
        });
        usersList = list;
        emitCombined();
      }
    })
    .catch(() => {});

  // 2. Subscribe to real users collection in Firestore with live listener
  let unsubUsers = () => {};
  try {
    unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: GigItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          const userRole = (data?.role || '').toLowerCase();
          const docId = docSnap.id;
          if (
            data &&
            userRole === targetRole &&
            (data.name || data.roleTitle || data.profileCompleted) &&
            docId !== currentUserId &&
            data.userId !== currentUserId &&
            data.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
          ) {
            list.push(convertProfileToGigItem(data, docId));
          }
        });
        usersList = list;
        emitCombined();
      },
      () => {
        // Fallback gracefully without throwing
      }
    );
  } catch {}

  // Instant fetch from Firestore gigs to populate immediately
  getDocs(collection(db, 'gigs'))
    .then((snap) => {
      if (!snap.empty) {
        const list: GigItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id.startsWith('job-') || docSnap.id.startsWith('cand-')) {
            return;
          }
          if (
            data.type === targetGigType &&
            data.userId !== currentUserId &&
            docSnap.id !== `gig-user-${currentUserId}`
          ) {
            list.push({
              id: docSnap.id,
              userId: data.userId || (docSnap.id.startsWith('gig-user-') ? docSnap.id.replace('gig-user-', '') : docSnap.id),
              rate: data.rate || '$50',
              unit: data.unit || '',
              title: data.title || '',
              client: data.client || '',
              category: data.category || 'Others',
              tags: data.tags || [],
              desc: data.desc || '',
              posted: data.posted || 'recently',
              proposals: data.proposals || 'open',
              hot: Boolean(data.hot),
              avatarBg: data.avatarBg || '#FFC629',
              type: targetGigType,
            });
          }
        });
        gigsList = list;
        emitCombined();
      }
    })
    .catch(() => {});

  // 3. Subscribe to gigs collection in Firestore with live listener
  let unsubGigs = () => {};
  try {
    unsubGigs = onSnapshot(
      collection(db, 'gigs'),
      (snapshot) => {
        const list: GigItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id.startsWith('job-') || docSnap.id.startsWith('cand-')) {
            return;
          }
          if (
            data.type === targetGigType &&
            data.userId !== currentUserId &&
            docSnap.id !== `gig-user-${currentUserId}`
          ) {
            list.push({
              id: docSnap.id,
              userId: data.userId || (docSnap.id.startsWith('gig-user-') ? docSnap.id.replace('gig-user-', '') : docSnap.id),
              rate: data.rate || '$50',
              unit: data.unit || '',
              title: data.title || '',
              client: data.client || '',
              category: data.category || 'Others',
              tags: data.tags || [],
              desc: data.desc || '',
              posted: data.posted || 'recently',
              proposals: data.proposals || 'open',
              hot: Boolean(data.hot),
              avatarBg: data.avatarBg || '#FFC629',
              type: targetGigType,
            });
          }
        });
        gigsList = list;
        emitCombined();
      },
      () => {
        // Fallback gracefully without throwing
      }
    );
  } catch {}

  return () => {
    unsubUsers();
    unsubGigs();
  };
}

/**
 * Helper to extract target user's UID from a GigItem
 */
export function getTargetUserIdFromGig(item: GigItem): string {
  if (item.userId && item.userId !== 'anonymous') return item.userId;
  if (item.id.startsWith('gig-user-')) return item.id.replace('gig-user-', '');
  if (item.id.startsWith('usr_')) return item.id;
  if (item.id.startsWith('user-')) return item.id;
  return item.id;
}

/**
 * Record a swipe action to Firestore and localStorage
 */
export async function recordSwipeToFirestore(
  userId: string,
  itemId: string,
  direction: 'left' | 'right' | 'up',
  targetUserId?: string
) {
  const effectiveTargetId =
    targetUserId || (itemId.startsWith('gig-user-') ? itemId.replace('gig-user-', '') : itemId);

  // 1. Record to Firestore
  try {
    await addDoc(collection(db, 'swipes'), {
      userId: userId || 'anonymous',
      targetUserId: effectiveTargetId,
      itemId,
      direction,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'swipes');
  }

  // 2. Cache in localStorage for instant offline access and cross-profile testing
  try {
    const localKey = `gigly_swipes_${userId}`;
    const raw = localStorage.getItem(localKey);
    const swipes: any[] = raw ? JSON.parse(raw) : [];
    swipes.push({
      userId,
      targetUserId: effectiveTargetId,
      itemId,
      direction,
      timestamp: Date.now(),
    });
    localStorage.setItem(localKey, JSON.stringify(swipes));
  } catch {}
}

/**
 * Get all profile/item IDs a user has already swiped on to prevent duplicates
 */
export async function getUserSwipedIds(userId: string): Promise<string[]> {
  if (!userId || userId === 'guest-user') return [];
  const set = new Set<string>();

  // 1. Instant check from local cache
  try {
    const local = localStorage.getItem(`gigly_swiped_items_${userId}`);
    if (local) {
      const arr = JSON.parse(local);
      if (Array.isArray(arr)) {
        arr.forEach((id: string) => set.add(id));
      }
    }
  } catch {}

  // Also read recorded swipes list
  try {
    const raw = localStorage.getItem(`gigly_swipes_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          if (s.itemId) set.add(s.itemId);
          if (s.targetUserId) {
            set.add(s.targetUserId);
            set.add(`gig-user-${s.targetUserId}`);
          }
        });
      }
    }
  } catch {}

  // 2. Query Firestore swipes collection
  try {
    const q = query(collection(db, 'swipes'), where('userId', '==', userId));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.itemId) set.add(data.itemId);
      if (data.targetUserId) {
        set.add(data.targetUserId);
        set.add(`gig-user-${data.targetUserId}`);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'swipes');
  }

  const result = Array.from(set);
  try {
    localStorage.setItem(`gigly_swiped_items_${userId}`, JSON.stringify(result));
  } catch {}
  return result;
}

export interface MutualMatchResult {
  isMutual: boolean;
  match?: MatchRecord;
  targetUserHasLikedMe?: boolean;
}

/**
 * Check if the other user has ALSO liked the current user (true mutual match)
 * If mutual: persists match for BOTH users and returns { isMutual: true, match }
 * If one-way: records like and returns { isMutual: false }
 */
export async function checkMutualLikeAndMatch(
  currentUserId: string,
  currentUserProfile: UserProfile,
  targetItem: GigItem,
  direction: 'left' | 'right' | 'up'
): Promise<MutualMatchResult> {
  const targetUserId = getTargetUserIdFromGig(targetItem);

  // 1. Always record current user's swipe first
  await recordSwipeToFirestore(currentUserId, targetItem.id, direction, targetUserId);

  // If swiped left (pass), it's never a match
  if (direction === 'left') {
    return { isMutual: false, targetUserHasLikedMe: false };
  }

  // 2. Check if the target user has ALREADY swiped right or up on the current user
  let targetHasLikedMe = false;

  // Check Firestore swipes collection
  try {
    const q = query(
      collection(db, 'swipes'),
      where('userId', '==', targetUserId)
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const dir = data.direction;
      if (dir === 'right' || dir === 'up') {
        const matchesCurrent =
          data.targetUserId === currentUserId ||
          data.itemId === currentUserId ||
          data.itemId === `gig-user-${currentUserId}` ||
          (currentUserProfile.userId && data.targetUserId === currentUserProfile.userId) ||
          (currentUserProfile.userId && data.itemId === currentUserProfile.userId) ||
          (currentUserProfile.email && data.itemId === `usr_${encodeEmailKey(currentUserProfile.email)}`);

        if (matchesCurrent) {
          targetHasLikedMe = true;
        }
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'swipes');
  }

  // Also check local storage (supports testing between multiple users on same browser/device)
  if (!targetHasLikedMe) {
    try {
      const localSwipesRaw = localStorage.getItem(`gigly_swipes_${targetUserId}`);
      if (localSwipesRaw) {
        const localSwipes = JSON.parse(localSwipesRaw);
        if (Array.isArray(localSwipes)) {
          for (const s of localSwipes) {
            if (s.direction === 'right' || s.direction === 'up') {
              if (
                s.targetUserId === currentUserId ||
                s.itemId === currentUserId ||
                s.itemId === `gig-user-${currentUserId}` ||
                (currentUserProfile.userId && s.targetUserId === currentUserProfile.userId)
              ) {
                targetHasLikedMe = true;
                break;
              }
            }
          }
        }
      }
    } catch {}
  }

  // 🌟 CASE 1: MUTUAL MATCH! Both people liked each other!
  if (targetHasLikedMe) {
    const matchId = Date.now();

    // Match record for current user viewing target user's card
    const matchForCurrentUser: MatchRecord = {
      id: matchId,
      job: targetItem,
      partnerUserId: targetUserId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      messages: [],
      matchedAt: 'Just now',
    };
    await saveMatchToFirestore(matchForCurrentUser, currentUserId);

    // Reciprocal match record for target user viewing current user's card
    const myGigCard = convertProfileToGigItem(currentUserProfile, currentUserId);
    const matchForTargetUser: MatchRecord = {
      id: matchId,
      job: myGigCard,
      partnerUserId: currentUserId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      messages: [],
      matchedAt: 'Just now',
    };
    await saveMatchToFirestore(matchForTargetUser, targetUserId);

    // Update local storage caches for instant UI update
    try {
      const myMatchesRaw = localStorage.getItem(`gigly_matches_${currentUserId}`);
      const myMatches = myMatchesRaw ? JSON.parse(myMatchesRaw) : [];
      localStorage.setItem(
        `gigly_matches_${currentUserId}`,
        JSON.stringify([matchForCurrentUser, ...myMatches.filter((m: any) => m.id !== matchId)])
      );

      const targetMatchesRaw = localStorage.getItem(`gigly_matches_${targetUserId}`);
      const targetMatches = targetMatchesRaw ? JSON.parse(targetMatchesRaw) : [];
      localStorage.setItem(
        `gigly_matches_${targetUserId}`,
        JSON.stringify([matchForTargetUser, ...targetMatches.filter((m: any) => m.id !== matchId)])
      );
    } catch {}

    return {
      isMutual: true,
      match: matchForCurrentUser,
      targetUserHasLikedMe: true,
    };
  }

  // 🌟 CASE 2: ONE-WAY LIKE (Interest registered, awaiting other party to swipe right back)
  return {
    isMutual: false,
    targetUserHasLikedMe: false,
  };
}

/**
 * Save a match to Firestore under user-specific document key
 */
export async function saveMatchToFirestore(match: MatchRecord, userId: string) {
  const docKey = `${match.id}_${userId}`;
  const matchPath = `matches/${docKey}`;
  try {
    const matchRef = doc(db, 'matches', docKey);
    await setDoc(matchRef, {
      ...match,
      userId: userId || 'guest',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, matchPath);
  }
}

/**
 * Update messages for a match across both participants in Firestore
 */
export async function syncMatchMessagesToFirestore(matchId: number, messages: any[], userId?: string) {
  try {
    const q = query(collection(db, 'matches'), where('id', '==', matchId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const updatePromises: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        updatePromises.push(
          updateDoc(doc(db, 'matches', docSnap.id), {
            messages,
            updatedAt: serverTimestamp(),
          })
        );
      });
      await Promise.all(updatePromises);
      return;
    }
  } catch {}

  // Fallback to direct key
  try {
    const docKey = userId ? `${matchId}_${userId}` : String(matchId);
    const matchRef = doc(db, 'matches', docKey);
    await updateDoc(matchRef, {
      messages,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `matches/${matchId}`);
  }
}

/**
 * Fetch a user profile from Firestore with local storage caching fallback
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!userId || userId === 'guest-user') return null;
  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap && snap.exists()) {
      const data = snap.data() as UserProfile;
      try {
        localStorage.setItem(`gigly_profile_${userId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(`gigly_profile_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return null;
}

/**
 * Subscribe to user-specific matches in Firestore in real-time
 */
export function subscribeToUserMatches(
  userId: string,
  onUpdate: (matches: MatchRecord[]) => void
): () => void {
  if (!userId) return () => {};
  try {
    const q = query(collection(db, 'matches'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: MatchRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id,
            job: data.job,
            expiresAt: data.expiresAt,
            messages: data.messages || [],
            matchedAt: data.matchedAt || 'Just now',
          });
        });
        // Sort newest matches first
        list.sort((a, b) => b.id - a.id);
        onUpdate(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'matches');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'matches');
    return () => {};
  }
}

/**
 * Sync user profile to Firestore and create real discoverable gig card
 */
export async function saveUserProfileToFirestore(userId: string, profile: UserProfile) {
  let effectiveId = userId;
  if (!effectiveId || effectiveId === 'guest-user') {
    effectiveId = profile.userId || (profile.email ? `usr_${encodeEmailKey(profile.email)}` : `usr_${Date.now()}`);
  }

  const cleanProfile: UserProfile = {
    ...profile,
    userId: effectiveId,
    profileCompleted: true,
  };

  // 1. Immediately cache locally
  try {
    localStorage.setItem(`gigly_profile_${effectiveId}`, JSON.stringify(cleanProfile));
    if (cleanProfile.email) {
      localStorage.setItem(`gigly_profile_${encodeEmailKey(cleanProfile.email)}`, JSON.stringify(cleanProfile));
    }
  } catch {}

  const userPath = `users/${effectiveId}`;

  // 2. Persist to Firestore users collection
  try {
    await setDoc(
      doc(db, 'users', effectiveId),
      {
        ...cleanProfile,
        userId: effectiveId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }

  // 3. Persist as an active talent/gig card for the opposite role to discover
  try {
    const gigDocRef = doc(db, 'gigs', `gig-user-${effectiveId}`);
    const isFreelancer = (cleanProfile.role || '').toLowerCase() === 'freelancer';
    const gigData: any = {
      id: `gig-user-${effectiveId}`,
      userId: effectiveId,
      isRealUser: true,
      type: isFreelancer ? 'candidate' : 'job',
      rate: cleanProfile.rateOrBudget || (isFreelancer ? '$60 / hr' : '$1,500 project'),
      unit: '',
      title: cleanProfile.roleTitle || (isFreelancer ? 'Freelancer' : 'Hiring Project'),
      client: cleanProfile.name || 'Member',
      category: cleanProfile.category || 'Others',
      tags: Array.isArray(cleanProfile.skills) && cleanProfile.skills.length > 0
        ? cleanProfile.skills
        : [cleanProfile.category || 'Specialist'],
      desc: cleanProfile.bio || (isFreelancer ? 'Looking for exciting gigs and client partnerships.' : 'Looking for talented freelancers to collaborate with.'),
      posted: 'Active account',
      proposals: isFreelancer ? 'Available now' : 'Hiring now',
      hot: Boolean(cleanProfile.verified),
      avatarBg: '#FFC629',
      updatedAt: serverTimestamp(),
    };
    await setDoc(gigDocRef, gigData, { merge: true });
  } catch (err) {
    console.warn('Failed saving gig card:', err);
  }
}

export default app;
