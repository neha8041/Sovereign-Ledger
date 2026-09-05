import React from 'react';
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recordTitle?: string;
  recordId?: string;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recordTitle,
  recordId,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-delete-confirm-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div 
        id="modal-delete-confirm-dialog"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/70 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-sans">
                Delete Audit Record
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Permanent Vault Purge
              </p>
            </div>
          </div>

          <button
            id="btn-close-delete-modal"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="space-y-2 text-xs">
          <p className="text-zinc-300 leading-relaxed font-sans">
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          {(recordTitle || recordId) && (
            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-mono text-[11px] break-all">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-0.5">Target Record:</span>
              <span className="text-red-300 font-semibold">{recordTitle || recordId}</span>
              {recordId && recordTitle !== recordId && (
                <span className="text-zinc-500 text-[10px] block mt-0.5">ID: {recordId}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-delete"
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-[0.98] transition flex items-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
