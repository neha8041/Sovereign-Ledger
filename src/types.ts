export type AuditStatus = 'VERIFIED' | 'DISCREPANCY_FLAGGED' | 'FLAGGED' | 'LOGGED' | 'IN_REVIEW';
export type AuditCategory = 'FINANCIAL_AUDIT' | 'JOURNAL_REFLECTION' | 'EXPENSE_RECONCILIATION' | 'TAX_NOTE' | 'STRATEGIC_BRAINSTORM';
export type FraudRiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
  rowTotal: number;
}

export interface LineItemAuditResult extends LineItem {
  calculatedRowTotal: number;
  rowMismatch: boolean;
  rowDiscrepancy: number;
}

export interface ReconcileInvoiceParams {
  vendorName?: string;
  taxId?: string;
  poNumber?: string;
  invoiceNumber?: string;
  fileHash?: string;
  fileName?: string;
  bankingDetails?: string;
  matchedField?: string;
  subtotal?: number;
  taxRate?: number;
  statedTax?: number;
  statedTotal?: number;
  lineItems?: LineItem[];
  itemSummary?: string;
  isDuplicate?: boolean;
}

export interface ReconcileInvoiceResult {
  vendorName?: string;
  taxId?: string;
  poNumber?: string;
  invoiceNumber?: string;
  fileHash?: string;
  bankingDetails?: string;
  subtotal?: number;
  taxRate?: number;
  statedTax?: number;
  calculatedTax?: number;
  calculatedTotal?: number;
  statedTotal?: number;
  discrepancy?: number;
  lineItems?: LineItemAuditResult[];
  sumOfLineItems?: number;
  totalMismatch?: boolean;
  taxMismatch?: boolean;
  lineItemMismatch?: boolean;
  isDuplicate?: boolean;
  isFraudulent: boolean;
  fraudReason?: string | null;
  fraudRiskScore?: FraudRiskScore;
  reason?: string;
  checks?: {
    macroMath?: boolean;
    microMath?: boolean;
    metadataFormat?: boolean;
    replayProtection?: boolean;
  };
  status: 'VERIFIED' | 'DISCREPANCY_FLAGGED' | 'FLAGGED';
  explanation?: string;
  itemSummary?: string;
}

export interface MessageAttachment {
  name: string;
  mimeType: string;
  size?: number;
  data?: string; // Base64 data for inline Gemini ingestion
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachment?: MessageAttachment;
  toolCalls?: {
    toolName: string;
    params: ReconcileInvoiceParams;
    result: ReconcileInvoiceResult;
  }[];
  isAuditAlert?: boolean;
}

export interface AuditVaultEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: AuditStatus;
  category: AuditCategory;
  summary: string;
  keyTakeaways: string[];
  actionItems?: string[];
  financialReconciliations: ReconcileInvoiceResult[];
  messages: ChatMessage[];
  tags: string[];
  fraudRiskScore: FraudRiskScore;
  statedTotalSum: number;
  calculatedTotalSum: number;
  confidenceScore?: number;
  fileHash?: string;
  invoiceNumber?: string;
  filename?: string;
  isFraudulent?: boolean;
  statedTotal?: number;
  fraudReason?: string | null;
  encryptedPayload?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
