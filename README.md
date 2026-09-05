# Sovereign Ledger — Personal Gemini Journal & Forensic Audit Vault

**Sovereign Ledger** is an enterprise-grade, zero-trust pre-transaction financial audit vault and executive reflection journal. It pairs Google's Gemini multimodal models with deterministic backend tool execution (`reconcile_invoice_math`), cryptographic replay shielding, client-side zero-egress document rendering, and strict owner-bound data isolation in Google Cloud Firestore.

---

## 🏛️ Security Constitution & Core Directives

1. **Untrusted Data & Injection Defense (OWASP LLM01 / LLM02)**: All user inputs, uploaded receipts, images (PNG, JPEG, WEBP), and PDF documents are treated as untrusted data. Prompt injections disguised as invoices or system commands are disarmed.
2. **3-Layer Forensic Reconciliation**: Under no circumstances does the LLM guess or approximate financial math:
   - **Layer 1 (Macro Math)**: Verifies `Subtotal + Tax == Stated Total`.
   - **Layer 2 (Micro Math)**: Verifies `Qty * UnitPrice == RowTotal` for every itemized line item, raising `lineItemMismatch: true` on discrepancies.
   - **Layer 3 (Metadata)**: Extracts and validates Vendor Name, Tax ID (TIN), PO Number, and format integrity.
3. **Unified Cryptographic Replay Protection**:
   - Computes deterministic SHA-256 digests across raw file byte buffers and extracted invoice numbers.
   - Cross-verifies duplicates across **both** active session memory (`sessionHashes`, active message streams) and persistent Firestore collections (`/users/{userId}/audits`) without session-scoping restrictions.
   - Intercepts replay attacks immediately post-OCR to halt unneeded model calls and prevent duplicate ledger billing.
4. **Resilient 4-Tier Model Fallback Ladder & Local Deterministic Engine**:
   - `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.6-flash` ➔ `gemini-3.7-flash`.
   - Automated cooldown tracking on HTTP 429 / `RESOURCE_EXHAUSTED` with exponential backoff.
   - Fallback to an offline deterministic parser (`extractLocalInvoiceData()` + `executeReconcileMath()`) if all external APIs are exhausted.
5. **Zero-Egress Client-Side Document Rendering**: Audit reports and executive dossiers are rendered into clean, paginated PDFs via `jspdf` directly within browser memory. Confidential accounting data never leaves the client context.
6. **Strict Firestore User Isolation & Field-Level AES-256-GCM Encryption**:
   - All records are saved under the user-isolated path `/users/{userId}/audits/{auditId}`.
   - **Field-Level Encryption**: Sensitive accounting data (itemized line items, banking details, extracted vendor telemetry, and raw AI summaries) is encrypted at the field level using Node's native `crypto` module with the `aes-256-gcm` cipher and a fresh 12-byte initialization vector (IV) for every write.
   - **Search Optimization**: Top-level search and filter metadata (`userId`, `filename`, `fileHash`, `timestamp`, `isFraudulent`, `statedTotal`, `fraudReason`) remains unencrypted, enabling fast indexed queries without sacrificing confidentiality.
   - **Automated API Decryption**: Records retrieved via the `/api/audit` endpoints are automatically decrypted before delivery to the client.

---

## 🛡️ Agentic Threat Model Summary (5 Threat Zones)

| Threat Zone | Identified Attack Vector | Countermeasure & Production Implementation |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious multimodal payloads (PNG, JPEG, WEBP, PDF), prompt injection in invoice descriptions, corrupted binary streams. | Strict MIME and buffer validation, raw text isolation, system instruction guardrails, deterministic SHA-256 byte hashing. |
| **2. Planning & Reasoning** | LLM arithmetic hallucinations, unauthorized invoice balance sign-offs, tool routing hijacking. | Mandatory JSON Tool Calling (`reconcile_invoice_math`) executing server-side float normalization across all 3 audit layers. |
| **3. Tool Execution** | Dynamic code execution risks, duplicate billing replay attacks, quota exhaustion stalls. | Unified Duplicate Verification (session + Firestore), quota cooldown ladder with deterministic local offline fallback. |
| **4. Memory & State** | Cross-tenant data leaks, database breach exposure of raw financial records, session hijacking, unconfirmed record deletion. | Firestore owner-bound path verification (`/users/{userId}/audits/{auditId}`), Field-Level AES-256-GCM encryption (`encryptedPayload`), UI confirmation modal workflows, deletion hash purging. |
| **5. Inter-System Comm.** | Client-side API key leakage, third-party document exfiltration. | Server-side Express proxy, Google Cloud Secret Manager injection, zero-egress in-browser `jspdf` document compilation. |

---

## 🏗️ System Architecture & Tech Stack

- **Frontend**: React 18 (Vite SPA), TypeScript, Tailwind CSS, Lucide React Icons, `motion` animations, `jspdf` (in-memory PDF engine).
- **Authentication**: Firebase Auth (Google Sign-In with federated state management).
- **Backend API**: Express.js server hosted on **Google Cloud Run** with JSON body parsing and raw binary buffer ingestion.
- **AI Reasoning**: Google Gen AI SDK (`@google/genai`) with candidate thought signature preservation (`response.candidates[0].content`) and `thinkingBudget: 0` on secondary tool turns.
- **Database**: Cloud Firestore with owner-isolated security rules (`/users/{userId}/audits/{auditId}`).
- **Secret Management**: Google Cloud Secret Manager (`GEMINI_API_KEY`).

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- Node.js 20+
- Google Cloud Project with Cloud Run, Firestore, and Secret Manager enabled
- Firebase project configuration

### 2. Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` and `ENCRYPTION_KEY` (a 32-byte / 64-char hex string) are configured.

### 3. Install Dependencies & Launch
```bash
npm install
npm run dev
```
The full-stack application will boot on `http://localhost:3000`.

---

## 🔒 Cloud Firestore Security Rules (`firestore.rules`)

Deploy the following security rules to guarantee strict owner-bound data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/audits/{auditId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🔑 Google Cloud Secret Manager Setup

Secure operational credentials dynamically using Google Cloud Secret Manager:

```bash
# 1. Create and populate the secrets
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

gcloud secrets create ENCRYPTION_KEY --replication-policy="automatic"
# Generate a random 32-byte hex key:
openssl rand -hex 32 | gcloud secrets versions add ENCRYPTION_KEY --data-file=-

# 2. Grant the Cloud Run service account access to read the secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding ENCRYPTION_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## ☁️ Google Cloud Run Deployment

### 1. Build and Deploy Container
Deploy the container with automatic secret mounting:

```bash
gcloud run deploy sovereign-ledger \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest
```

### 2. Required Challenge Verification Label
Apply the mandatory campaign label to register the service for automated verification:

```bash
gcloud run services update sovereign-ledger \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Functional Walkthrough & Test Guide

Every user process and system capability can be tested through the following reproducible steps:

1. **Authentication Flow (Single Sign-On)**:
   - Click **"Sign In with Google via Firebase Auth"**.
   - Authenticate with your Google account.
   - Verify that your user avatar, display email, and unique Firebase UID display in the top navigation bar.

2. **Multimodal Invoice & Receipt Auditing**:
   - Drag and drop or click to upload a PDF or image invoice (PNG, JPEG, WEBP).
   - Alternatively, test via the preset prompts:
     * `🧾 Audit Clean Receipt`: Stated total matches computed macro and micro math. Confirms green `STATUS: VERIFIED` badge with `$0.00` variance.
     * `⚠️ Test Discrepant Invoice`: Subtotal `$450.00` + 10% tax vs. Stated `$520.00`. Confirms red `STATUS: DISCREPANCY_FLAGGED` badge detailing the `$25.00` variance.
     * `🔍 Itemized 3-Layer Audit`: Tests line items with intentional unit price mismatches. Confirms `lineItemMismatch: true` flag and metadata validation.

3. **Cryptographic Replay Attack Protection**:
   - Resubmit the exact same file or submit an invoice with the same PO / Invoice Number within the session or across stored Firestore records.
   - Verify that the **Replay Protection Filter** triggers immediately without re-running Gemini or math calculations.
   - Observe the high-contrast `FRAUD BLOCKED` alert card and click **"View Existing Record"** to navigate directly to the previously sealed entry.

4. **Prompt Injection Defense Simulation**:
   - Click the preset: `🛡️ Prompt Injection Attack Simulation` ("IGNORE ALL PREVIOUS INSTRUCTIONS...").
   - Confirm that Gemini neutralizes the prompt injection, treats the text as untrusted invoice data, and refuses to approve unverified balances without tool execution.

5. **Client-Side Document Export (Zero Egress)**:
   - Click **"Download Report"**: Generates a paginated, formatted PDF dossier via `jspdf` directly in browser memory without sending document data to any external server.
   - Click **"Export MD"**: Triggers an instant download of the complete audit log in Markdown format.

6. **Executive Summarization & Session Sealing**:
   - Click **"Save & Seal to Vault"** or trigger **"Summarize & Seal"**.
   - Confirm that the session is condensed into structured JSON (executive title, key takeaways, action items, audit tags) and written to `/users/{userId}/audits/{auditId}` in Firestore.

7. **Vault Search, Filtering & Safe Deletion**:
   - In the left sidebar, use the search input to filter historical audits by vendor, invoice number, or tags.
   - Switch between filter chips (`All`, `Verified`, `Flagged`, `Reflections`).
   - Click the trash icon on a vault card. Confirm that a confirmation dialog appears before permanent deletion (`deleteDoc`), the record is removed optimistically, and its hash is purged from memory caches.
