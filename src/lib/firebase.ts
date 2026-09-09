import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  deleteDoc,
  setDoc,
  query, 
  orderBy,
  setLogLevel
} from 'firebase/firestore/lite';
import type { AuditVaultEntry, UserProfile } from '../types';
import { sanitizePayload } from './sanitizer';
import firebaseConfig from '../../firebase-applet-config.json';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Standard fallback Firebase configuration keys
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "sovereign-ledger-507009",
  appId: "1:404256580882:web:8a7661aaa2efbbdf6d3fcb",
  apiKey: "AIzaSyAdcklsg5DRn6DwZ_NQuQ9-nqC7biSRVeQ",
  authDomain: "sovereign-ledger-507009.firebaseapp.com",
  databaseURL: "https://sovereign-ledger-507009.firebaseio.com",
  firestoreDatabaseId: "ai-studio-38ced5ef-68f6-4afd-a785-4b73e8ae853c",
  storageBucket: "sovereign-ledger-507009.firebasestorage.app",
  messagingSenderId: "404256580882",
  measurementId: "",
  recaptchaSiteKey: ""
};

let safeFirebaseConfig: any = DEFAULT_FIREBASE_CONFIG;
try {
  if (firebaseConfig && typeof firebaseConfig === 'object') {
    safeFirebaseConfig = {
      ...DEFAULT_FIREBASE_CONFIG,
      ...firebaseConfig,
      projectId: firebaseConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
    };
  }
} catch (configErr) {
  console.warn('[Firebase Config Warning]: Malformed config object, falling back to default:', configErr);
}

let app: any;
try {
  app = getApps().length === 0 ? initializeApp(safeFirebaseConfig) : getApp();
} catch (appErr) {
  console.warn('[Firebase App Init Warning]:', appErr);
  app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Using specific firestoreDatabaseId provisioned for this applet
setLogLevel('error');
export const db = getFirestore(app, safeFirebaseConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId);

export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (err: any) {
    // If popup was dismissed by user, throw standard code for clean handling
    throw err;
  }
}

export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Strict User Isolation Data Operations:
 * Always reads and writes under /users/{userId}/audits/{auditId}
 */

const LOCAL_STORAGE_KEY_PREFIX = 'sovereign_ledger_vault_';

export async function fetchUserAudits(userId: string): Promise<AuditVaultEntry[]> {
  if (!userId) return [];
  
  // If demo user, load from isolated localStorage
  if (userId.startsWith('demo_')) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // 1. First check server store via /api/audit
  try {
    const res = await fetch(`/api/audit?userId=${encodeURIComponent(userId)}`, {
      headers: { 'x-user-id': userId }
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item: any) => ({
          ...item,
          id: item.id || item.auditId,
          title: item.title || item.filename || 'Audit Record',
          createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
          updatedAt: item.updatedAt || item.timestamp || new Date().toISOString(),
          status: item.status || (item.isFraudulent ? 'FLAGGED' : 'VERIFIED'),
          category: item.category || 'FINANCIAL_AUDIT',
          summary: item.summary || item.rawAiSummaries?.summary || '',
          keyTakeaways: item.keyTakeaways || item.rawAiSummaries?.keyTakeaways || [],
          actionItems: item.actionItems || item.rawAiSummaries?.actionItems || [],
          financialReconciliations: item.financialReconciliations || item.lineItems || [],
          messages: item.messages || [],
          tags: item.tags || item.rawAiSummaries?.tags || ['#Vault'],
          fraudRiskScore: item.fraudRiskScore || (item.isFraudulent ? 'HIGH' : 'LOW'),
          statedTotalSum: item.statedTotalSum ?? item.statedTotal ?? 0,
          calculatedTotalSum: item.calculatedTotalSum ?? item.statedTotal ?? 0,
          fileHash: item.fileHash,
          invoiceNumber: item.invoiceNumber
        }));
      }
    }
  } catch (apiErr) {
    console.warn('API fetch notice, falling back to direct Firestore:', apiErr);
  }

  // 2. Query Firestore only if the client user is authenticated in Firebase Auth matching userId
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }

  const path = `users/${userId}/audits`;
  try {
    const auditsRef = collection(db, 'users', userId, 'audits');
    let snapshot: any = null;
    try {
      const q = query(auditsRef, orderBy('createdAt', 'desc'));
      snapshot = await getDocs(q);
    } catch {
      snapshot = await getDocs(auditsRef);
    }

    const items: AuditVaultEntry[] = [];
    const encryptedItems: { index: number; payload: string }[] = [];

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data() as any;
      const item: AuditVaultEntry = {
        ...data,
        id: docSnap.id,
      };
      if (data.encryptedPayload) {
        encryptedItems.push({ index: items.length, payload: data.encryptedPayload });
      }
      items.push(item);
    });

    // Decrypt any encrypted fields via server decryption endpoint
    if (encryptedItems.length > 0) {
      try {
        const decRes = await fetch('/api/audit/decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: encryptedItems.map(ei => ({ encryptedPayload: ei.payload }))
          })
        });
        if (decRes.ok) {
          const decData = await decRes.json();
          if (Array.isArray(decData.records)) {
            decData.records.forEach((decRecord: any, i: number) => {
              const targetIdx = encryptedItems[i]?.index;
              if (targetIdx !== undefined && items[targetIdx]) {
                items[targetIdx] = {
                  ...items[targetIdx],
                  ...decRecord
                };
              }
            });
          }
        }
      } catch (decErr) {
        console.warn('Decryption endpoint notice:', decErr);
      }
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.warn('Firestore user permission check notice:', error?.message);
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveUserAudit(userId: string, audit: AuditVaultEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to persist audit records.');
  
  // If demo user, persist to isolated localStorage
  if (userId.startsWith('demo_')) {
    try {
      const existing = await fetchUserAudits(userId);
      const cleanData = sanitizePayload({
        ...audit,
        userId,
        updatedAt: new Date().toISOString(),
      });
      const updated = [cleanData, ...existing.filter(a => a.id !== audit.id)];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
      return;
    } catch (err) {
      console.warn('Demo vault save failed:', err);
      return;
    }
  }

  // Acquire current authenticated user token if available for zero-trust Firestore channel
  let userToken = '';
  try {
    if (auth.currentUser) {
      userToken = await auth.currentUser.getIdToken();
    }
  } catch {}

  // Ensure Firestore writes are performed EXCLUSIVELY by server.ts using the Firebase Admin SDK.
  // Sensitive financial fields (itemSummary, lineItems, extractedData, explanation) are encrypted
  // into encryptedPayload and raw plain-text fields are purged on the server prior to persistence.
  const res = await fetch('/api/vault/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
    },
    body: JSON.stringify({
      ...audit,
      userId,
      filename: audit.filename || audit.title || 'invoice_document.pdf',
      fileHash: audit.fileHash,
      timestamp: audit.createdAt || new Date().toISOString(),
      isFraudulent: audit.isFraudulent === true || audit.status === 'FLAGGED' || audit.status === 'DISCREPANCY_FLAGGED' || audit.fraudRiskScore === 'HIGH' || audit.fraudRiskScore === 'CRITICAL',
      statedTotal: audit.statedTotalSum ?? 0,
      fraudReason: (audit.isFraudulent || audit.status === 'FLAGGED' || audit.status === 'DISCREPANCY_FLAGGED') ? (audit.fraudReason || 'Financial discrepancy flagged') : null,
      itemSummary: audit.title || audit.filename || 'Financial Audit',
      lineItems: audit.financialReconciliations,
      extractedData: audit.financialReconciliations?.[0]?.vendorName ? {
        vendorName: audit.financialReconciliations[0]?.vendorName,
        taxId: audit.financialReconciliations[0]?.taxId,
        poNumber: audit.financialReconciliations[0]?.poNumber,
        bankingDetails: audit.financialReconciliations[0]?.bankingDetails
      } : undefined,
      explanation: audit.summary || 'Audit verified.',
      rawAiSummaries: {
        summary: audit.summary,
        keyTakeaways: audit.keyTakeaways,
        actionItems: audit.actionItems,
        tags: audit.tags
      }
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to persist encrypted audit record via server: ${res.status}`);
  }
}

export async function deleteUserAudit(userId: string, auditId: string, fileHash?: string, invoiceNumber?: string): Promise<void> {
  if (!userId || !auditId) throw new Error('User ID and Audit ID required for deletion.');
  
  // If demo user, delete from isolated localStorage
  if (userId.startsWith('demo_')) {
    try {
      const existing = await fetchUserAudits(userId);
      const updated = existing.filter(a => a.id !== auditId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
      return;
    } catch (err) {
      console.warn('Demo vault delete failed:', err);
      return;
    }
  }

  let userToken = '';
  try {
    if (auth.currentUser) {
      userToken = await auth.currentUser.getIdToken();
    }
  } catch {}

  // Direct client Firestore deleteDoc for owner-isolated path for immediate consistency
  if (auth.currentUser && auth.currentUser.uid === userId && db) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'audits', auditId));
    } catch (clientDocErr) {
      console.warn('[Firestore client deleteDoc notice]:', clientDocErr);
    }
  }

  // Ensure Firestore deletions & in-memory replay ledger purges are performed by server
  const res = await fetch(`/api/vault/records/${encodeURIComponent(auditId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
    },
    body: JSON.stringify({
      fileHash,
      invoiceNumber
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.warn(`Server deletion notice: ${errData.error || res.status}`);
  }
}
