import React, { useState } from 'react';
import { 
  History, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  FileText, 
  Trash2, 
  RefreshCw,
  Calendar, 
  DollarSign, 
  Filter,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import type { AuditVaultEntry, AuditStatus } from '../types';

interface SidebarProps {
  audits: AuditVaultEntry[];
  selectedAuditId: string | null;
  onSelectAudit: (audit: AuditVaultEntry) => void;
  onRequestDelete: (audit: AuditVaultEntry) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  audits,
  selectedAuditId,
  onSelectAudit,
  onRequestDelete,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AuditStatus>('ALL');

  const handleDeleteClick = (audit: AuditVaultEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(audit);
  };

  const filteredAudits = audits.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = audits.filter(a => a.status === 'VERIFIED').length;
  const discrepancyCount = audits.filter(a => a.status === 'DISCREPANCY_FLAGGED').length;

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col h-full bg-zinc-950 border-r border-zinc-800/90">
      {/* Sidebar Header & Metrics */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-300">
            <History className="w-4 h-4 text-emerald-400" />
            <span>VAULT HISTORY & LOGS</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {audits.length} Records
          </span>
        </div>

        {/* Quick Stat Pill Highlights */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300">{verifiedCount}</span>
          </div>

          <div className="p-2 rounded-lg bg-red-950/30 border border-red-800/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Flagged</span>
            </div>
            <span className="text-xs font-mono font-bold text-red-300">{discrepancyCount}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-audits"
            type="text"
            placeholder="Search vault or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          {(['ALL', 'VERIFIED', 'DISCREPANCY_FLAGGED', 'LOGGED'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            const label = 
              filter === 'ALL' ? 'All' :
              filter === 'VERIFIED' ? 'Verified' :
              filter === 'DISCREPANCY_FLAGGED' ? 'Flagged' : 'Reflections';
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-2 font-mono">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Syncing isolated Firestore vault...</p>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-zinc-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-zinc-700 stroke-1" />
            <p className="font-medium text-zinc-400">No vault entries found</p>
            <p className="text-[11px]">
              {searchTerm ? 'Try adjusting your search query' : 'Start a new journal or audit session to record entries.'}
            </p>
          </div>
        ) : (
          filteredAudits.map((item) => {
            const isSelected = item.id === selectedAuditId;
            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectAudit(item)}
                className={`group relative p-3 rounded-xl border text-left cursor-pointer transition ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700'
                }`}
              >
                {/* Status Indicator Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {item.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      VERIFIED
                    </span>
                  )}
                  {item.status === 'DISCREPANCY_FLAGGED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 animate-pulse">
                      <AlertOctagon className="w-3 h-3" />
                      DISCREPANCY
                    </span>
                  )}
                  {item.status === 'LOGGED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400">
                      <Sparkles className="w-3 h-3" />
                      REFLECTION
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-zinc-500">
                    {formattedDate}
                  </span>
                </div>

                {/* Entry Title */}
                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-white transition">
                  {item.title}
                </h4>

                {/* Summary snippet */}
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.summary}
                </p>

                {/* Tags or Financial Highlights */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                  <div className="flex items-center gap-1 truncate max-w-[180px]">
                    {item.tags?.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-400">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-delete-record-${item.id}`}
                      onClick={(e) => handleDeleteClick(item, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 text-zinc-500 hover:bg-red-950/50 rounded-lg transition"
                      title="Delete record from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
