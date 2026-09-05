import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Key, 
  AlertTriangle,
  Server
} from 'lucide-react';

interface SecuritySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySpecModal: React.FC<SecuritySpecModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-zinc-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-zinc-100">
                SECURITY CONSTITUTION & AGENTIC THREAT MODEL
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Phase 1 Compliance &bull; OWASP Top 10 Mitigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-zinc-300">
          
          {/* Threat Modeling Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono font-bold text-zinc-100 text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>AGENTIC THREAT MODEL (THE 5 THREAT ZONES)</span>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3">Threat Zone</th>
                    <th className="py-2.5 px-3">Identified Vector</th>
                    <th className="py-2.5 px-3">Countermeasure / Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">1. Input Surfaces</td>
                    <td className="py-2.5 px-3 text-zinc-300">Untrusted receipt text, Prompt Injection in journal entries</td>
                    <td className="py-2.5 px-3 text-emerald-400">Strict system prompt disarming, untrusted data labeling, zero-eval policy</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">2. Planning & Reasoning</td>
                    <td className="py-2.5 px-3 text-zinc-300">LLM math hallucinations, unauthorized total approval</td>
                    <td className="py-2.5 px-3 text-emerald-400">Mandatory JSON Tool Calling (<code className="text-zinc-200">reconcile_invoice_math</code>) - model barred from manual arithmetic</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">3. Tool Execution</td>
                    <td className="py-2.5 px-3 text-zinc-300">SSRF, dynamic command injection, privilege escalation</td>
                    <td className="py-2.5 px-3 text-emerald-400">Deterministic isolated TypeScript backend function with strict number coercion</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">4. Memory & State</td>
                    <td className="py-2.5 px-3 text-zinc-300">Duplicate invoice replay attacks, cross-user data leaks, session hijacking</td>
                    <td className="py-2.5 px-3 text-emerald-400">Cryptographic SHA-256 buffer hash & invoice number deduplication check, Cloud Firestore owner isolation (<code className="text-zinc-200">/users/{'{userId}'}/audits/{'{auditId}'}</code>)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">5. Inter-System Comm.</td>
                    <td className="py-2.5 px-3 text-zinc-300">Gemini API key leakage, client-side exposure</td>
                    <td className="py-2.5 px-3 text-emerald-400">Server-side proxy routes, Secret Manager integration, no frontend key leaks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Security Rules Block */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-zinc-300 font-bold">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                Deployed Firestore Security Rules (firestore.rules)
              </span>
              <span className="text-[10px] text-zinc-500">Owner-Bound Only</span>
            </div>
            <pre className="text-[11px] text-zinc-300 overflow-x-auto p-3 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/audits/{auditId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>

          {/* Gemini Resilient Fallback Ladder */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Resilient Model Fallback Ladder</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Tier 1 (Primary)</span>
                <span className="font-semibold text-emerald-400">gemini-3.6-flash</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Tier 2 (High-Avail)</span>
                <span className="font-semibold text-cyan-400">gemini-3.1-flash-lite</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Tier 3 (Dynamic)</span>
                <span className="font-semibold text-yellow-400">gemini-flash-latest</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Tier 4 (Reasoning)</span>
                <span className="font-semibold text-purple-400">gemini-3.7-flash</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
