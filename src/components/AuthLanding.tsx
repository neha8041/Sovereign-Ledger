import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Database,
  Play
} from 'lucide-react';

interface AuthLandingProps {
  onSignInWithGoogle: () => Promise<void>;
  onEnterDemoMode: () => void;
  authError: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignInWithGoogle,
  onEnterDemoMode,
  authError
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await onSignInWithGoogle();
    } catch (err: any) {
      // Gracefully handle popup close/cancel without uncaught exceptions
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.warn('Sign in info:', err?.message || err);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Bar */}
      <div className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-mono font-bold tracking-tight text-lg text-zinc-100">
            SOVEREIGN LEDGER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Firestore Isolated Engine
          </span>
        </div>
      </div>

      {/* Hero Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission & Auth CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>ENTERPRISE-GRADE SECURITY ENGINE ACTIVE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight">
              Sovereign Ledger: <br className="hidden sm:inline" />
              <span className="text-emerald-400">Intelligent Audit Vault</span> &amp; <br className="hidden sm:inline" />
              <span className="text-zinc-200">Executive Journal</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
              An enterprise reflection assistant and financial ledger auditor. Input your reflections, founder brainstorms, or invoices. Sovereign Ledger pairs multi-turn Gemini intelligence with deterministic backend mathematical verification.
            </p>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Deterministic Math Tooling</span>
                </div>
                <p className="text-xs text-zinc-400 leading-normal">
                  Deterministic Math Engine — AI reasoning paired with exact, server-validated calculations to eliminate hallucinated totals.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                  <Database className="w-4 h-4" />
                  <span>Strict User Isolation</span>
                </div>
                <p className="text-xs text-zinc-400 leading-normal">
                  Zero-Trust Data Isolation — Your financial logs and transcripts are encrypted and strictly isolated to your authenticated profile.
                </p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="pt-4 space-y-3">
              {authError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="btn-google-auth-login"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-zinc-100 hover:bg-white text-zinc-950 transition flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                </button>

                <button
                  id="btn-sandbox-auditor-login"
                  onClick={onEnterDemoMode}
                  className="px-5 py-3.5 rounded-xl font-semibold text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center justify-center gap-2"
                  title="Explore all audit features without external login"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sandbox Auditor Session</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-500">
                Encrypted session authentication via Google Identity Provider. Zero raw password storage.
              </p>
            </div>
          </div>

          {/* Right Column: Executive Simulation Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-xs">
              {/* Title Bar */}
              <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-2 text-zinc-400 text-[11px] font-medium font-sans">Audit Engine Preview</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  LIVE VERIFICATION
                </span>
              </div>

              {/* Simulation Body */}
              <div className="p-4 space-y-3 bg-zinc-950/80 text-zinc-300">
                {/* Input Step */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Input: Invoice / Audit Entry</span>
                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 leading-relaxed text-xs">
                    &ldquo;Audit vendor invoice #8841: Subtotal $120.00, Tax 8.5%, Total charged $130.20 for cloud infrastructure.&rdquo;
                  </div>
                </div>

                {/* Verification Process & Result */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Verification Process</span>
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Deterministic Math Check Passed</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        VERIFIED
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-zinc-300">
                      <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Subtotal:</span> $120.00
                      </div>
                      <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Tax (8.5%):</span> $10.20
                      </div>
                      <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Calculated Total:</span> $130.20
                      </div>
                      <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Variance:</span> $0.00
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Vault State */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">Security</span>
                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Encrypted &amp; Owner-Isolated Vault Entry</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-500 font-mono">
        SOVEREIGN LEDGER &bull; OWASP TOP 10 MITIGATED &bull; GOOGLE GENAI TS SDK &bull; CLOUD FIRESTORE
      </footer>
    </div>
  );
};
