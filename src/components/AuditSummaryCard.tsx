import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldAlert, 
  Copy, 
  Check, 
  Download, 
  Tag, 
  ListChecks, 
  ArrowUpRight,
  TrendingDown,
  Layers,
  Save,
  CloudCheck,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { AuditVaultEntry, ReconcileInvoiceResult } from '../types';

interface AuditSummaryCardProps {
  audit: AuditVaultEntry;
  onSaveToVault?: () => Promise<void>;
  onDeleteFromVault?: () => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

function cleanMarkdownForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  audit,
  onSaveToVault,
  onDeleteFromVault,
  isSaving,
  isDeleting
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadPdfReport = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 14;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 18) {
          doc.addPage();
          y = 16;
        }
      };

      // 1. Top Decorative Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate header
      doc.rect(margin, y, contentWidth, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('SOVEREIGN LEDGER', margin + 6, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('FORENSIC FINANCIAL AUDIT & RECONCILIATION DOSSIER', margin + 6, y + 16);

      // Status Badge in Header
      const statusText = audit.status === 'VERIFIED' ? 'VERIFIED BY AUDIT TOOL' :
        audit.status === 'DISCREPANCY_FLAGGED' ? 'DISCREPANCY DETECTED' : 'EXECUTIVE REFLECTION';
      
      const badgeWidth = doc.getTextWidth(statusText) + 8;
      const badgeX = margin + contentWidth - badgeWidth - 5;
      
      if (audit.status === 'VERIFIED') {
        doc.setFillColor(6, 78, 59); // Emerald dark
        doc.setTextColor(52, 211, 153);
      } else if (audit.status === 'DISCREPANCY_FLAGGED') {
        doc.setFillColor(127, 29, 29); // Red dark
        doc.setTextColor(248, 113, 113);
      } else {
        doc.setFillColor(30, 58, 138); // Blue dark
        doc.setTextColor(147, 197, 253);
      }
      doc.roundedRect(badgeX, y + 5, badgeWidth, 12, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(statusText, badgeX + 4, y + 12.5);

      y += 28;

      // 2. Metadata Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(audit.title || 'Executive Audit Session', contentWidth - 10);
      doc.text(titleLines[0] || 'Executive Audit Session', margin + 5, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Vault ID: ${audit.id}`, margin + 5, y + 14);
      doc.text(`Recorded: ${new Date(audit.createdAt).toLocaleString()}`, margin + 5, y + 19);

      doc.text(`Category: ${audit.category || 'FINANCIAL_AUDIT'}`, margin + 95, y + 14);
      doc.text(`Fraud Risk: ${audit.fraudRiskScore || 'LOW'}`, margin + 95, y + 19);

      y += 30;

      // 3. Executive Synopsis Section
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. EXECUTIVE AI SYNOPSIS', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const cleanedSummary = cleanMarkdownForPdf(audit.summary);
      const summaryLines = doc.splitTextToSize(cleanedSummary || 'No summary text available.', contentWidth);
      
      for (const line of summaryLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;

      // 4. Key Takeaways Section
      if (audit.keyTakeaways && audit.keyTakeaways.length > 0) {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('2. KEY FORENSIC TAKEAWAYS', margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);

        for (const takeaway of audit.keyTakeaways) {
          const cleaned = cleanMarkdownForPdf(takeaway);
          const lines = doc.splitTextToSize(`•  ${cleaned}`, contentWidth - 4);
          for (const l of lines) {
            checkPageBreak(5);
            doc.text(l, margin + 2, y);
            y += 4.5;
          }
          y += 1;
        }
        y += 4;
      }

      // 5. Strategic Action Items
      if (audit.actionItems && audit.actionItems.length > 0) {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('3. STRATEGIC ACTION ITEMS', margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);

        audit.actionItems.forEach((action, idx) => {
          const cleaned = cleanMarkdownForPdf(action);
          const lines = doc.splitTextToSize(`[  ]  ${idx + 1}. ${cleaned}`, contentWidth - 4);
          for (const l of lines) {
            checkPageBreak(5);
            doc.text(l, margin + 2, y);
            y += 4.5;
          }
          y += 1;
        });
        y += 4;
      }

      // 6. Forensic Reconciliation Telemetry (Multi-Layer Checks)
      if (audit.financialReconciliations && audit.financialReconciliations.length > 0) {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text('4. DETERMINISTIC RECONCILIATION TELEMETRY', margin, y);
        y += 6;

        audit.financialReconciliations.forEach((rec: ReconcileInvoiceResult, i: number) => {
          checkPageBreak(38);

          // Card container for each line item
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`Item #${i + 1}: ${rec.itemSummary || 'Financial Item'}`, margin + 4, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Vendor: ${rec.vendorName || 'N/A'}  |  Tax ID: ${rec.taxId || 'N/A'}  |  PO #: ${rec.poNumber || 'N/A'}`, margin + 4, y + 11);

          // Math numbers
          doc.text(`Subtotal: $${rec.subtotal.toFixed(2)}  |  Tax Rate: ${rec.taxRate}% ($${rec.calculatedTax.toFixed(2)})  |  Forensic Total: $${rec.calculatedTotal.toFixed(2)}`, margin + 4, y + 16);
          doc.text(`Stated Total: $${rec.statedTotal.toFixed(2)}  |  Discrepancy: $${rec.discrepancy.toFixed(2)}`, margin + 4, y + 21);

          // Verification Checks
          const macroCheck = rec.checks?.macroMath ? 'PASS' : 'FAIL';
          const microCheck = rec.checks?.microMath ? 'PASS' : 'FAIL';
          const metaCheck = rec.checks?.metadataFormat ? 'PASS' : 'FAIL';
          doc.text(`Checks: [Macro Math: ${macroCheck}] [Micro Line-Item: ${microCheck}] [Metadata Format: ${metaCheck}]`, margin + 4, y + 26);

          const statusStr = rec.isFraudulent ? `⚠️ FRAUD: ${rec.fraudReason || 'Discrepancy'}` : '✅ VERIFIED CLEAN';
          doc.setFont('helvetica', 'bold');
          if (rec.isFraudulent) {
            doc.setTextColor(220, 38, 38);
          } else {
            doc.setTextColor(5, 150, 105);
          }
          doc.text(statusStr, margin + contentWidth - doc.getTextWidth(statusStr) - 4, y + 6);

          y += 36;
        });
      }

      // Add Headers & Footers across all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);
        doc.text('SOVEREIGN LEDGER • CONFIDENTIAL FORENSIC AUDIT RECORD', margin, pageHeight - 8);
        doc.text(`Page ${p} of ${totalPages}`, margin + contentWidth - doc.getTextWidth(`Page ${p} of ${totalPages}`), pageHeight - 8);
      }

      // Save PDF to browser
      const sanitizedTitle = (audit.title || 'audit-report')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);
      const filename = `sovereign-ledger-${sanitizedTitle}-${audit.id.slice(0, 8)}.pdf`;
      doc.save(filename);
    } catch (err: any) {
      console.error('Failed to generate audit PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyMarkdown = () => {
    const md = `
# SOVEREIGN LEDGER AUDIT REPORT: ${audit.title}
**Status:** ${audit.status} | **Date:** ${audit.createdAt}
**Category:** ${audit.category} | **Fraud Risk Score:** ${audit.fraudRiskScore}

## Executive Summary
${audit.summary}

## Key Takeaways
${audit.keyTakeaways.map(t => `- ${t}`).join('\n')}

## Strategic Action Items
${(audit.actionItems || []).map(a => `- [ ] ${a}`).join('\n')}

## Multi-Layer Fraud Detection & Math Telemetry
${audit.financialReconciliations.map((r, i) => `
### Line Item #${i + 1}: ${r.vendorName ? `${r.vendorName} - ` : ''}${r.itemSummary || 'Financial Item'}
- **Vendor:** ${r.vendorName || 'N/A'} | **Tax ID:** ${r.taxId || 'N/A'} | **PO #:** ${r.poNumber || 'N/A'}
- **Macro Math:** Subtotal $${r.subtotal.toFixed(2)} + ${r.taxRate}% Tax ($${r.calculatedTax.toFixed(2)}) = Forensic Total $${r.calculatedTotal.toFixed(2)} (Stated: $${r.statedTotal.toFixed(2)}, Variance: $${r.discrepancy.toFixed(2)})
- **Checks:** Macro Math: ${r.checks?.macroMath ? 'PASS' : 'FAIL'} | Micro Math: ${r.checks?.microMath ? 'PASS' : 'FAIL'} | Tax ID Format: ${r.checks?.metadataFormat ? 'PASS' : 'FAIL'}
- **Fraud Status:** ${r.isFraudulent ? `FRAUD DETECTED (${r.fraudReason || 'Failed checks'})` : 'VERIFIED CLEAN'}
- **Forensic Note:** ${r.explanation}
`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {audit.status === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VERIFIED BY AUDIT TOOL
              </span>
            )}
            {audit.status === 'DISCREPANCY_FLAGGED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950 border border-red-700 text-red-400">
                <AlertOctagon className="w-3.5 h-3.5" />
                DISCREPANCY DETECTED
              </span>
            )}
            {audit.status === 'LOGGED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 border border-blue-700 text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                EXECUTIVE REFLECTION
              </span>
            )}

            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              Risk: {audit.fraudRiskScore}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download PDF Report Button */}
            <button
              id="btn-download-pdf-report"
              onClick={downloadPdfReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/60 hover:text-white transition disabled:opacity-50 shadow-sm"
              title="Download Formatted Text-Based PDF Report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}</span>
            </button>

            <button
              id="btn-export-markdown"
              onClick={copyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white transition"
              title="Copy Markdown Report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export MD'}</span>
            </button>

            {onSaveToVault && (
              <button
                id="btn-save-vault"
                onClick={onSaveToVault}
                disabled={isSaving || isDeleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Syncing...' : 'Save & Seal to Vault'}</span>
              </button>
            )}

            {onDeleteFromVault && (
              <button
                id="btn-delete-active-record"
                onClick={onDeleteFromVault}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 bg-red-950/50 border border-red-800/80 hover:bg-red-900/60 hover:text-white transition disabled:opacity-50"
                title="Delete this dossier permanently from vault"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            {audit.title}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Vault Key: {audit.id} &bull; Recorded: {new Date(audit.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Executive AI Summary (Blue Card Requirement) */}
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI EXECUTIVE SYNOPSIS</span>
          </div>
          <div className="markdown-body text-xs sm:text-sm text-blue-200/90 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-blue-800/80 bg-zinc-950/80">
                    <table className="w-full text-left border-collapse my-0 text-xs font-mono" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-zinc-800/80 text-zinc-200 border-b border-zinc-700 font-semibold" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="p-2.5 text-zinc-200 border-b border-zinc-700 font-semibold text-xs" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="p-2.5 border-b border-zinc-800 text-zinc-300 text-xs" {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr className="hover:bg-zinc-800/30 transition-colors" {...props} />
                )
              }}
            >
              {audit.summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Grid: Key Takeaways & Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Takeaways */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
            <ListChecks className="w-4 h-4 text-emerald-400" />
            <span>KEY TAKEAWAYS</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {audit.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span className="leading-normal">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            <span>STRATEGIC ACTION ITEMS</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {(audit.actionItems || ['Review financial documentation', 'Archive verified transaction']).map((act, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-[9px] text-zinc-500">
                  {idx + 1}
                </span>
                <span className="leading-normal">{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Deterministic Reconciliations Table (if any) */}
      {audit.financialReconciliations && audit.financialReconciliations.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>FORENSIC RECONCILIATION TELEMETRY</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Deterministic Backend Function: <code className="text-zinc-300">reconcile_invoice_math</code>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60">
            <table className="w-full text-left font-mono text-xs border-collapse my-0">
              <thead className="bg-zinc-800/80 text-zinc-200 border-b border-zinc-700">
                <tr className="text-[11px] font-semibold">
                  <th className="p-2.5">Line / Item</th>
                  <th className="p-2.5">Subtotal</th>
                  <th className="p-2.5">Tax Rate</th>
                  <th className="p-2.5">Calc. Total</th>
                  <th className="p-2.5">Stated Total</th>
                  <th className="p-2.5">Variance</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {audit.financialReconciliations.map((rec, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition">
                    <td className="p-2.5 text-zinc-200 font-sans text-xs">
                      <div className="font-semibold">{rec.itemSummary || `Transaction #${i + 1}`}</div>
                      {(rec.vendorName || rec.taxId) && (
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {rec.vendorName && <span>Vendor: {rec.vendorName} </span>}
                          {rec.taxId && <span>| Tax ID: {rec.taxId}</span>}
                        </div>
                      )}
                      {rec.fraudReason && (
                        <div className="text-[10px] text-red-400 font-mono mt-0.5">
                          {rec.fraudReason}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-zinc-300">${rec.subtotal.toFixed(2)}</td>
                    <td className="p-2.5 text-zinc-400">{rec.taxRate}% (${rec.calculatedTax.toFixed(2)})</td>
                    <td className="p-2.5 font-semibold text-emerald-400">${rec.calculatedTotal.toFixed(2)}</td>
                    <td className="p-2.5 text-zinc-300">${rec.statedTotal.toFixed(2)}</td>
                    <td className={`p-2.5 font-bold ${rec.discrepancy > 0.01 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ${rec.discrepancy.toFixed(2)}
                    </td>
                    <td className="p-2.5">
                      {rec.status === 'VERIFIED' && !rec.isFraudulent ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px]">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 text-[10px]">
                          {rec.isFraudulent ? 'FRAUD DETECTED' : 'DISCREPANCY'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
