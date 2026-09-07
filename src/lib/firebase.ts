import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc,
  getDocFromServer,
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
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GigItem, MatchRecord, UserProfile } from '../types';
import { INITIAL_JOBS, INITIAL_CANDIDATES } from '../data/mockData';

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
 * Seed initial mock gigs and candidate talent into Firestore if collection is empty
 */
export async function seedInitialFirestoreData() {
  try {
    const gigsCol = collection(db, 'gigs');
    // Set a quick timeout so slow connections or offline mode don't stall execution
    const snapshotPromise = getDocs(gigsCol);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2500)
    );
    const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);
    if (snapshot && snapshot.empty) {
      const allItems = [
        ...INITIAL_JOBS.map((j) => ({ ...j, type: 'job' })),
        ...INITIAL_CANDIDATES.map((c) => ({ ...c, type: 'candidate' })),
      ];

      for (const item of allItems) {
        await setDoc(doc(db, 'gigs', item.id), {
          ...item,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'gigs');
  }
}

/**
 * Real-time listener for gigs or talent profiles from Firestore
 */
export function subscribeToGigs(
  role: 'freelancer' | 'business',
  onUpdate: (items: GigItem[]) => void
) {
  const targetType = role === 'freelancer' ? 'job' : 'candidate';
  const pathForQuery = 'gigs';

  // Immediately provide initial mock data so the app displays cards instantly without network lag
  onUpdate(role === 'freelancer' ? INITIAL_JOBS : INITIAL_CANDIDATES);

  try {
    const q = query(collection(db, pathForQuery), where('type', '==', targetType));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: GigItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              rate: data.rate || '$50',
              unit: data.unit || '/hr',
              title: data.title || '',
              client: data.client || '',
              category: data.category || 'Others',
              tags: data.tags || [],
              desc: data.desc || '',
              posted: data.posted || 'recently',
              proposals: data.proposals || 'open',
              hot: Boolean(data.hot),
            });
          });
          onUpdate(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForQuery);
      }
    );

    return unsubscribe;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, pathForQuery);
    return () => {};
  }
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
 * Sync user profile to Firestore
 */
export async function saveUserProfileToFirestore(userId: string, profile: UserProfile) {
  const userPath = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export default app;
