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
  const isFreelancer = user.role === 'freelancer';
  return {
    id: user.userId || uid || `user-${user.email}`,
    rate: user.rateOrBudget || (isFreelancer ? '$60 / hr' : '$1,500 project'),
    unit: user.rateOrBudget?.includes('/hr') || !isFreelancer ? '' : '',
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
            p.role === targetRole &&
            p.name &&
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

  // 2. Subscribe to real users collection in Firestore
  let unsubUsers = () => {};
  try {
    const qUsers = query(collection(db, 'users'), where('role', '==', targetRole));
    unsubUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        const list: GigItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (
            data &&
            (data.name || data.profileCompleted) &&
            docSnap.id !== currentUserId &&
            data.userId !== currentUserId &&
            data.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
          ) {
            list.push(convertProfileToGigItem(data, docSnap.id));
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

  // 3. Subscribe to gigs collection in Firestore
  let unsubGigs = () => {};
  try {
    const qGigs = query(collection(db, 'gigs'), where('type', '==', targetGigType));
    unsubGigs = onSnapshot(
      qGigs,
      (snapshot) => {
        const list: GigItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Filter out legacy mock IDs
          if (docSnap.id.startsWith('job-') || docSnap.id.startsWith('cand-')) {
            return;
          }
          if (
            data.userId !== currentUserId &&
            docSnap.id !== `gig-user-${currentUserId}`
          ) {
            list.push({
              id: docSnap.id,
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
 * Record a swipe action to Firestore
 */
export async function recordSwipeToFirestore(
  userId: string,
  itemId: string,
  direction: 'left' | 'right' | 'up'
) {
  try {
    await addDoc(collection(db, 'swipes'), {
      userId: userId || 'anonymous',
      itemId,
      direction,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'swipes');
  }
}

/**
 * Save a new match to Firestore
 */
export async function saveMatchToFirestore(match: MatchRecord, userId: string) {
  const matchPath = `matches/${match.id}`;
  try {
    const matchRef = doc(db, 'matches', String(match.id));
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
 * Update messages for a match in Firestore
 */
export async function syncMatchMessagesToFirestore(matchId: number, messages: any[]) {
  const matchPath = `matches/${matchId}`;
  try {
    const matchRef = doc(db, 'matches', String(matchId));
    await updateDoc(matchRef, {
      messages,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, matchPath);
  }
}

/**
 * Fetch a user profile from Firestore with fast timeout fallback
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!userId || userId === 'guest-user') return null;
  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    // Fast timeout (1200ms) so slow cloud connection never freezes or stalls the app
    const fetchPromise = getDoc(userRef);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1200)
    );
    const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
    if (snap && typeof snap.exists === 'function' && snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
    return null;
  }
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
 * Sync user profile to Firestore
 */
export async function saveUserProfileToFirestore(userId: string, profile: UserProfile) {
  if (!userId || userId === 'guest-user') return;
  const userPath = `users/${userId}`;
  try {
    const writePromise = setDoc(
      doc(db, 'users', userId),
      {
        ...profile,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also sync as a real gig/talent card for the swiping page
    const gigDocRef = doc(db, 'gigs', `gig-user-${userId}`);
    const gigData: any = {
      id: `gig-user-${userId}`,
      userId,
      isRealUser: true,
      type: profile.role === 'freelancer' ? 'candidate' : 'job',
      rate: profile.rateOrBudget || (profile.role === 'freelancer' ? '$60 / hr' : '$1,500 project'),
      unit: '',
      title: profile.roleTitle || (profile.role === 'freelancer' ? 'Freelancer' : 'Hiring Project'),
      client: profile.name || 'Member',
      category: profile.category || 'Others',
      tags: Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills : [profile.category || 'Specialist'],
      desc: profile.bio || '',
      posted: 'Active account',
      proposals: profile.role === 'freelancer' ? 'Available now' : 'Hiring now',
      hot: Boolean(profile.verified),
      avatarBg: '#FFC629',
      updatedAt: serverTimestamp(),
    };
    const gigPromise = setDoc(gigDocRef, gigData, { merge: true }).catch(() => {});

    // Timeout of 1200ms ensures UI callers are never hung up by Firestore connection state
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1200));
    await Promise.race([Promise.all([writePromise, gigPromise]), timeoutPromise]);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export default app;
