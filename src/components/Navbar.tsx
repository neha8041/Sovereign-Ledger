import React from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Calculator, 
  FileText, 
  Lock,
  Sparkles,
  Terminal
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewSession: () => void;
  onOpenQuickReconcile: () => void;
  onOpenSecuritySpec: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewSession,
  onOpenQuickReconcile,
  onOpenSecuritySpec,
  isSaving
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base tracking-tight text-zinc-100">
                SOVEREIGN LEDGER
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Auditor Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Personal Gemini Journal & Forensic Audit Vault
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-quick-reconcile"
            onClick={onOpenQuickReconcile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
            title="Instant Deterministic Math Reconciler"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Quick Reconciler</span>
          </button>

          <button
            id="btn-security-spec"
            onClick={onOpenSecuritySpec}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="View Threat Model & Security Constitution"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Security Spec</span>
          </button>

          <button
            id="btn-new-audit-session"
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-200">
                  {user.displayName?.slice(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[120px]">
                  {user.displayName || 'Auditor'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                  UID: {user.uid.slice(0, 6)}...
                </span>
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
