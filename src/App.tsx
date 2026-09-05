import React, { useState, useEffect } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  AuthLanding 
} from './components/AuthLanding';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  JournalChat 
} from './components/JournalChat';
import { 
  AuditSummaryCard 
} from './components/AuditSummaryCard';
import { 
  QuickReconcileModal 
} from './components/QuickReconcileModal';
import { 
  SecuritySpecModal 
} from './components/SecuritySpecModal';
import {
  DeleteConfirmModal
} from './components/DeleteConfirmModal';
import { 
  subscribeToAuth, 
  signInWithGoogle, 
  logOut, 
  fetchUserAudits, 
  saveUserAudit, 
  deleteUserAudit 
} from './lib/firebase';
import type { 
  UserProfile, 
  AuditVaultEntry, 
  ChatMessage, 
  MessageAttachment,
  AuditStatus 
} from './types';
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Plus,
  X
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Vault Audits History
  const [audits, setAudits] = useState<AuditVaultEntry[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditVaultEntry | null>(null);

  // Active Session State
  const [currentAuditId, setCurrentAuditId] = useState<string>(() => `audit_${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // View tabs
  const [activeTab, setActiveTab] = useState<'CHAT' | 'SUMMARY'>('CHAT');

  // Modals
  const [isQuickReconcileOpen, setIsQuickReconcileOpen] = useState(false);
  const [isSecuritySpecOpen, setIsSecuritySpecOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    auditId: string;
    title: string;
  } | null>(null);

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch User Isolated Audits from Firestore upon login
  const loadAudits = async (uid: string) => {
    setIsLoadingAudits(true);
    try {
      const records = await fetchUserAudits(uid);
      setAudits(records);
    } catch (err: any) {
      console.error('Failed to load user audits:', err);
    } finally {
      setIsLoadingAudits(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadAudits(user.uid);
    } else {
      setAudits([]);
      setSelectedAudit(null);
    }
  }, [user?.uid]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User voluntarily dismissed the sign-in window. No action needed.
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups or use Sandbox Auditor Session.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setAuthError('Domain not authorized in Firebase Console yet. You can use Sandbox Auditor Session.');
      } else {
        setAuthError(err?.message || 'Google Authentication failed. Please try again or use Sandbox Auditor Session.');
      }
    }
  };

  // Demo / Sandbox Auditor session for instant testing
  const handleEnterDemoMode = () => {
    setUser({
      uid: 'demo_guest_auditor',
      email: 'guest.auditor@sovereignledger.internal',
      displayName: 'Sandbox Auditor',
      photoURL: undefined
    });
    setAuthError(null);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      if (user?.uid && !user.uid.startsWith('demo_')) {
        await logOut();
      }
      setUser(null);
      startNewSession();
    } catch (err) {
      console.warn('Sign out completed with notice:', err);
      setUser(null);
      startNewSession();
    }
  };

  // Start a fresh audit/reflection session
  const startNewSession = () => {
    const newId = `audit_${Date.now()}`;
    setCurrentAuditId(newId);
    setMessages([]);
    setSelectedAudit(null);
    setActiveTab('CHAT');
  };

  // Select an existing audit from history sidebar
  const handleSelectAudit = (audit: AuditVaultEntry) => {
    setSelectedAudit(audit);
    setCurrentAuditId(audit.id);
    setMessages(audit.messages || []);
    setActiveTab('SUMMARY');
  };

  // Delete an audit record with real-time UI synchronization, auto-advance, and defensive rollback
  const handleDeleteRecord = async (auditId: string) => {
    if (!user?.uid) return;
    
    // Save snapshots for optimistic rollback
    const previousAudits = [...audits];
    const previousSelected = selectedAudit;
    const targetAudit = audits.find(a => a.id === auditId) || (selectedAudit?.id === auditId ? selectedAudit : null);
    const targetTitle = targetAudit?.title || auditId;

    // 1. Optimistically update local React state array immediately
    const remainingAudits = previousAudits.filter((a) => a.id !== auditId);
    setAudits(remainingAudits);

    // 2. If the record currently being viewed is deleted, auto-select next available or start new session
    if (selectedAudit?.id === auditId) {
      if (remainingAudits.length > 0) {
        handleSelectAudit(remainingAudits[0]);
      } else {
        startNewSession();
      }
    }

    showNotification(`Audit record "${targetTitle}" removed from vault.`, 'success');
    setIsDeletingRecord(true);

    try {
      // 3. Perform durable deletion against Firestore (deleteDoc) & backend ledger (purging cache)
      await deleteUserAudit(user.uid, auditId, targetAudit?.fileHash, targetAudit?.invoiceNumber);
      setSaveStatusMessage('Record purged from Firestore');
      setTimeout(() => setSaveStatusMessage(null), 3000);
      setDeleteModalState(null);
    } catch (err: any) {
      console.error('Error deleting audit record:', err);
      // 4. Defensive state rollback upon failure
      setAudits(previousAudits);
      if (previousSelected?.id === auditId) {
        setSelectedAudit(previousSelected);
        setActiveTab('SUMMARY');
      }
      showNotification(`Failed to delete record: ${err?.message || 'Database error'}. Rollback completed.`, 'error');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Send a message in active journal turn
  const handleSendMessage = async (text: string, attachment?: MessageAttachment) => {
    if (!user) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachment
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      // Collect prior audits' hashes and invoice numbers (excluding current session)
      const otherAudits = audits.filter(a => !selectedAudit || a.id !== selectedAudit.id);
      const existingHashes = otherAudits.map(a => a.fileHash).filter(Boolean) as string[];
      const existingInvoiceNumbers = otherAudits.map(a => a.invoiceNumber).filter(Boolean) as string[];

      const response = await fetch('/api/gemini/audit-journal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || 'anonymous'
        },
        body: JSON.stringify({
          userId: user?.uid,
          auditId: selectedAudit?.id,
          existingHashes,
          existingInvoiceNumbers,
          messages: updatedMessages.map(m => ({ 
            role: m.role, 
            content: m.content,
            attachment: m.attachment
          })),
          category: 'FINANCIAL_AUDIT'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle OCR / image reading failure cleanly
        if (errorData.ocrFailed || response.status === 422 || (typeof errorData.error === 'string' && errorData.error.includes('Unable to read image text / OCR failed'))) {
          const errorMsg = errorData.error || 'Unable to read image text / OCR failed';
          const replyText = errorData.reply || `⚠️ **Forensic Audit Error: Unable to read image text / OCR failed**\n\nThe uploaded invoice file could not be processed for readable text or numerical values. Please ensure the document is clear, legible, and uncorrupted.`;

          setNotification({
            type: 'error',
            message: `⚠️ ${errorMsg}`
          });

          const ocrAssistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_ocr_fail`,
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toISOString(),
            isAuditAlert: true,
            toolCalls: [{
              toolName: 'ocr_extraction',
              params: {
                fileName: attachment?.name || 'Uploaded File'
              },
              result: {
                isFraudulent: false,
                status: 'FLAGGED',
                fraudRiskScore: 'HIGH',
                reason: errorMsg
              }
            }]
          };

          setMessages([...updatedMessages, ocrAssistantMessage]);
          return;
        }

        // Handle Replay Protection Rejection cleanly without throwing an unhandled exception
        if (errorData.isFraudulent || errorData.fraudReason || response.status === 400) {
          const fraudReason = errorData.fraudReason || 'Duplicate invoice file or PO number has already been processed.';
          const replyText = errorData.reply || `⚠️ **CRITICAL FRAUD REJECTION**: Duplicate Replay Attack detected. ${fraudReason}`;

          setNotification({
            type: 'error',
            message: `⚠️ Replay Protection: ${fraudReason}`
          });

          const fraudAssistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_fraud`,
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toISOString(),
            isAuditAlert: true,
            toolCalls: [{
              toolName: 'replay_protection_filter',
              params: {
                fileHash: errorData.fileHash,
                invoiceNumber: errorData.invoiceNumber,
                matchedField: errorData.matchedField
              },
              result: {
                isFraudulent: true,
                status: 'DISCREPANCY_FLAGGED',
                fraudRiskScore: 'CRITICAL',
                reason: fraudReason
              }
            }]
          };

          setMessages([...updatedMessages, fraudAssistantMessage]);
          return;
        }

        const errorMsg = errorData.error || errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // If server returned OCR failure cleanly
      if (data.ocrFailed || (typeof data.error === 'string' && data.error.includes('Unable to read image text / OCR failed'))) {
        const errorMsg = data.error || 'Unable to read image text / OCR failed';
        setNotification({
          type: 'error',
          message: `⚠️ ${errorMsg}`
        });

        const ocrAssistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_ocr_fail`,
          role: 'assistant',
          content: data.reply || `⚠️ **Forensic Audit Error: Unable to read image text / OCR failed**\n\nThe uploaded invoice file could not be processed for text or numerical values.`,
          timestamp: new Date().toISOString(),
          isAuditAlert: true,
          toolCalls: [{
            toolName: 'ocr_extraction',
            params: {
              fileName: attachment?.name || 'Uploaded File'
            },
            result: {
              isFraudulent: false,
              status: 'FLAGGED',
              fraudRiskScore: 'HIGH',
              reason: errorMsg
            }
          }]
        };

        setMessages([...updatedMessages, ocrAssistantMessage]);
        return;
      }
      
      // If server returned structured replay rejection (HTTP 200 with isDuplicate/isFraudulent)
      if (data.isDuplicate || (data.isFraudulent && data.fraudReason?.toLowerCase().includes('duplicate'))) {
        const fraudReason = data.fraudReason || 'Duplicate invoice file or PO number has already been processed.';
        const replyText = data.reply || `⚠️ **CRITICAL FRAUD REJECTION**: Duplicate Replay Attack detected. ${fraudReason}`;

        setNotification({
          type: 'error',
          message: `⚠️ Replay Protection: ${fraudReason}`
        });

        const fraudAssistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_fraud`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toISOString(),
          isAuditAlert: true,
          toolCalls: data.toolCalls || [{
            toolName: 'replay_protection_filter',
            params: {
              fileHash: data.fileHash,
              invoiceNumber: data.invoiceNumber,
              matchedField: data.matchedField
            },
            result: {
              isFraudulent: true,
              status: 'DISCREPANCY_FLAGGED',
              fraudRiskScore: 'CRITICAL',
              reason: fraudReason
            }
          }]
        };

        setMessages([...updatedMessages, fraudAssistantMessage]);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls || []
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Auto-persist draft state to Firestore (only if not duplicate replay)
      await autoPersistAuditState(finalMessages, data);

    } catch (err: any) {
      console.error('Audit turn error:', err);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `⚠️ **Forensic Auditor Notification**: ${err.message || 'Failed to process turn'}.`,
        timestamp: new Date().toISOString(),
        isAuditAlert: true
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Automatically save current turn state to Firestore under /users/{userId}/audits/{auditId}
  const autoPersistAuditState = async (currentMsgs: ChatMessage[], turnData?: any) => {
    if (!user?.uid) return;
    try {
      setIsSaving(true);
      const allReconciliations: any[] = [];
      let extractedInvoiceNum = turnData?.invoiceNumber || undefined;

      currentMsgs.forEach(m => {
        if (m.toolCalls) {
          m.toolCalls.forEach(tc => {
            if (tc.result) {
              allReconciliations.push(tc.result);
              if (tc.result.poNumber && !extractedInvoiceNum) {
                extractedInvoiceNum = tc.result.poNumber;
              }
            }
          });
        }
      });

      const hasDiscrepancy = allReconciliations.some(
        r => r.status === 'DISCREPANCY_FLAGGED' || r.status === 'FLAGGED' || r.isFraudulent === true
      );
      const auditStatus: AuditStatus = 
        allReconciliations.length > 0 
          ? (hasDiscrepancy ? 'FLAGGED' : 'VERIFIED')
          : 'LOGGED';

      // Keep metadata only for attachment in Firestore (strip heavy base64)
      const sanitizedMessages = currentMsgs.map(m => {
        if (m.attachment) {
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            attachment: {
              name: m.attachment.name,
              mimeType: m.attachment.mimeType,
              size: m.attachment.size || 0
            },
            toolCalls: m.toolCalls,
            isAuditAlert: m.isAuditAlert
          };
        }
        return m;
      });

      const entry: AuditVaultEntry = {
        id: currentAuditId,
        userId: user.uid,
        title: selectedAudit?.title || `Journal & Audit (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        createdAt: selectedAudit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: auditStatus,
        category: allReconciliations.length > 0 ? 'FINANCIAL_AUDIT' : 'JOURNAL_REFLECTION',
        summary: selectedAudit?.summary || currentMsgs[currentMsgs.length - 1]?.content.slice(0, 160) + '...',
        keyTakeaways: selectedAudit?.keyTakeaways || ['Multi-turn turn recorded', 'State isolated to Firebase user'],
        actionItems: selectedAudit?.actionItems || ['Review financial telemetry', 'Archive verified entries'],
        financialReconciliations: allReconciliations,
        messages: sanitizedMessages,
        tags: selectedAudit?.tags || ['#Vault', '#GeminiAuditor'],
        fraudRiskScore: hasDiscrepancy ? 'HIGH' : 'LOW',
        statedTotalSum: allReconciliations.reduce((acc, r) => acc + (r.statedTotal || 0), 0),
        calculatedTotalSum: allReconciliations.reduce((acc, r) => acc + (r.calculatedTotal || 0), 0),
        fileHash: turnData?.fileHash || selectedAudit?.fileHash || undefined,
        invoiceNumber: extractedInvoiceNum || selectedAudit?.invoiceNumber || undefined
      };

      await saveUserAudit(user.uid, entry);
      setSelectedAudit(entry);

      // Refresh sidebar list
      setAudits(prev => {
        const existingIdx = prev.findIndex(a => a.id === entry.id);
        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = entry;
          return clone;
        }
        return [entry, ...prev];
      });

      setSaveStatusMessage('Sealed to Firestore');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } catch (e) {
      console.error('Auto persist failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Executive Summary & Key Takeaways
  const handleGenerateSummary = async () => {
    if (!user?.uid || messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/gemini/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('Summary generation failed');
      }

      const summaryData = await response.json();

      // Gather all tool reconciliations from messages
      const allReconciliations: any[] = [];
      messages.forEach(m => {
        if (m.toolCalls) {
          m.toolCalls.forEach(tc => {
            if (tc.result) allReconciliations.push(tc.result);
          });
        }
      });

      const hasDiscrepancy = allReconciliations.some(r => r.status === 'DISCREPANCY_FLAGGED');
      const auditStatus: AuditStatus = 
        allReconciliations.length > 0 
          ? (hasDiscrepancy ? 'DISCREPANCY_FLAGGED' : 'VERIFIED')
          : 'LOGGED';

      const finalizedEntry: AuditVaultEntry = {
        id: currentAuditId,
        userId: user.uid,
        title: summaryData.title || 'Executive Audit Session',
        createdAt: selectedAudit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: auditStatus,
        category: summaryData.category || (allReconciliations.length > 0 ? 'FINANCIAL_AUDIT' : 'JOURNAL_REFLECTION'),
        summary: summaryData.summary || 'Summary synthesized.',
        keyTakeaways: summaryData.keyTakeaways || [],
        actionItems: summaryData.actionItems || [],
        financialReconciliations: allReconciliations,
        messages: messages,
        tags: summaryData.tags || ['#Vault', '#Audit'],
        fraudRiskScore: hasDiscrepancy ? 'HIGH' : 'LOW',
        statedTotalSum: allReconciliations.reduce((acc, r) => acc + (r.statedTotal || 0), 0),
        calculatedTotalSum: allReconciliations.reduce((acc, r) => acc + (r.calculatedTotal || 0), 0),
        fileHash: selectedAudit?.fileHash || undefined,
        invoiceNumber: selectedAudit?.invoiceNumber || undefined
      };

      await saveUserAudit(user.uid, finalizedEntry);
      setSelectedAudit(finalizedEntry);
      
      setAudits(prev => {
        const existingIdx = prev.findIndex(a => a.id === finalizedEntry.id);
        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = finalizedEntry;
          return clone;
        }
        return [finalizedEntry, ...prev];
      });

      setActiveTab('SUMMARY');
    } catch (err: any) {
      console.error('Summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Loading Screen for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400">Initializing Sovereign Ledger Security Engine...</p>
      </div>
    );
  }

  // If user is not authenticated, render Step 1 & 2 Landing Page
  if (!user) {
    return (
      <AuthLanding
        onSignInWithGoogle={handleSignIn}
        onEnterDemoMode={handleEnterDemoMode}
        authError={authError}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewSession={startNewSession}
        onOpenQuickReconcile={() => setIsQuickReconcileOpen(true)}
        onOpenSecuritySpec={() => setIsSecuritySpecOpen(true)}
        isSaving={isSaving}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto min-h-0">
        {/* Step 6: Private History & Log Dashboard Sidebar */}
        <Sidebar
          audits={audits}
          selectedAuditId={selectedAudit?.id || null}
          onSelectAudit={handleSelectAudit}
          onRequestDelete={(audit) => {
            setDeleteModalState({
              isOpen: true,
              auditId: audit.id,
              title: audit.title
            });
          }}
          isLoading={isLoadingAudits}
        />

        {/* Main Work Area: Chat Stream & Audit Dossier Tabs */}
        <main className="flex-1 flex flex-col h-full min-h-[80vh] lg:h-[calc(100vh-4rem)] overflow-hidden bg-zinc-950 p-4 sm:p-6 space-y-4">
          
          {/* Tab Switcher & Status Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                id="tab-stream"
                onClick={() => setActiveTab('CHAT')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'CHAT'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reflection & Audit Stream</span>
                {messages.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-300">
                    {messages.length}
                  </span>
                )}
              </button>

              <button
                id="tab-dossier"
                onClick={() => setActiveTab('SUMMARY')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'SUMMARY'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Executive Dossier & Summary</span>
                {selectedAudit?.status && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    selectedAudit.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedAudit.status === 'DISCREPANCY_FLAGGED' ? 'bg-red-950 text-red-300 border border-red-800' :
                    'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {selectedAudit.status}
                  </span>
                )}
              </button>
            </div>

            {/* Sync feedback indicator */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing Firestore...
                </span>
              ) : saveStatusMessage ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {saveStatusMessage}
                </span>
              ) : (
                <span className="hidden sm:inline">Path: /users/{user.uid.slice(0, 5)}.../audits</span>
              )}
            </div>
          </div>

          {/* Active View Container */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'CHAT' ? (
              <JournalChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                onGenerateSummary={handleGenerateSummary}
                isSummarizing={isSummarizing}
                audits={audits}
                onSelectAudit={(audit) => {
                  handleSelectAudit(audit);
                  setActiveTab('SUMMARY');
                }}
              />
            ) : selectedAudit ? (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <AuditSummaryCard
                  audit={selectedAudit}
                  onSaveToVault={async () => {
                    if (user?.uid && selectedAudit) {
                      await saveUserAudit(user.uid, selectedAudit);
                      setSaveStatusMessage('Vault Record Updated');
                      showNotification('Vault record successfully saved to Firestore.', 'success');
                      setTimeout(() => setSaveStatusMessage(null), 3000);
                    }
                  }}
                  onDeleteFromVault={async () => {
                    if (selectedAudit) {
                      setDeleteModalState({
                        isOpen: true,
                        auditId: selectedAudit.id,
                        title: selectedAudit.title
                      });
                    }
                  }}
                  isSaving={isSaving}
                  isDeleting={isDeletingRecord}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
                <FileText className="w-10 h-10 text-zinc-700 stroke-1" />
                <h4 className="text-sm font-semibold text-zinc-300">No Executive Dossier Formed Yet</h4>
                <p className="text-xs max-w-sm">
                  Switch to the Stream tab, conduct your multi-turn audit or reflection, and click &ldquo;Summarize & Seal&rdquo; to generate a comprehensive forensic report.
                </p>
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition"
                >
                  Return to Stream
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <QuickReconcileModal
        isOpen={isQuickReconcileOpen}
        onClose={() => setIsQuickReconcileOpen(false)}
        onInsertToChat={(text) => {
          setActiveTab('CHAT');
          handleSendMessage(text);
        }}
      />

      <SecuritySpecModal
        isOpen={isSecuritySpecOpen}
        onClose={() => setIsSecuritySpecOpen(false)}
      />

      {/* Confirmation Modal for Permanent Record Deletion */}
      <DeleteConfirmModal
        isOpen={!!deleteModalState?.isOpen}
        recordId={deleteModalState?.auditId}
        recordTitle={deleteModalState?.title}
        onClose={() => {
          if (!isDeletingRecord) setDeleteModalState(null);
        }}
        onConfirm={async () => {
          if (deleteModalState?.auditId) {
            await handleDeleteRecord(deleteModalState.auditId);
          }
        }}
        isDeleting={isDeletingRecord}
      />

      {/* Real-time Toast Notifications */}
      {notification && (
        <div 
          id="toast-notification-banner"
          className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className={`p-3.5 rounded-xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-mono backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-zinc-950/95 border-emerald-500/60 text-emerald-300 shadow-emerald-950/30'
              : notification.type === 'error'
              ? 'bg-zinc-950/95 border-red-500/60 text-red-300 shadow-red-950/30'
              : 'bg-zinc-950/95 border-zinc-700 text-zinc-200 shadow-black/50'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              {notification.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />}
              <span className="leading-tight">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
