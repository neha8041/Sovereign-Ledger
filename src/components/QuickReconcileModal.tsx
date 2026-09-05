import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  CheckCircle2, 
  AlertOctagon, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  FileText
} from 'lucide-react';
import type { ReconcileInvoiceResult, LineItem } from '../types';

interface QuickReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
}

export const QuickReconcileModal: React.FC<QuickReconcileModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat
}) => {
  const [vendorName, setVendorName] = useState<string>('Apex Systems Inc');
  const [taxId, setTaxId] = useState<string>('12-3456789');
  const [poNumber, setPoNumber] = useState<string>('PO-2026-8891');
  const [subtotal, setSubtotal] = useState<string>('450.00');
  const [taxRate, setTaxRate] = useState<string>('8.25');
  const [statedTotal, setStatedTotal] = useState<string>('487.13');
  const [itemSummary, setItemSummary] = useState<string>('Enterprise Cloud Compute Invoice');
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Cloud Infrastructure Hosting', qty: 1, unitPrice: 300.00, rowTotal: 300.00 },
    { description: 'Dedicated IP & Security Gateway', qty: 3, unitPrice: 50.00, rowTotal: 150.00 }
  ]);

  const [result, setResult] = useState<ReconcileInvoiceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: `Item #${lineItems.length + 1}`, qty: 1, unitPrice: 50, rowTotal: 50 }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    // Auto calculate row total if qty or unitPrice changed
    if (field === 'qty' || field === 'unitPrice') {
      const q = field === 'qty' ? Number(value) : updated[index].qty;
      const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
      updated[index].rowTotal = Number((q * p).toFixed(2));
    }
    setLineItems(updated);
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reconcile-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: vendorName || undefined,
          taxId: taxId || undefined,
          poNumber: poNumber || undefined,
          subtotal: Number(subtotal),
          taxRate: Number(taxRate),
          statedTotal: Number(statedTotal),
          lineItems: lineItems.length > 0 ? lineItems : undefined,
          itemSummary: itemSummary || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run multi-layer forensic fraud check.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Fraud verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>MULTI-LAYER INVOICE FRAUD DETECTOR</span>
                <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] rounded font-mono">
                  3-TIER AUDIT
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Backend Tool Verification: <code className="text-emerald-400">reconcile_invoice_math()</code>
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

        {/* Modal Body */}
        <form onSubmit={handleReconcile} className="p-5 space-y-4 overflow-y-auto">
          {/* Metadata Section */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Entity & Metadata Extraction</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Vendor Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Apex Systems Inc"
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Tax ID / EIN / VAT</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. 12-3456789 or GB123456789"
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">PO / Invoice #</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-8891"
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section (Micro Math) */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 font-semibold">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Itemized Micro Math (Qty × Unit Price == Row Total)</span>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] rounded flex items-center gap-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleLineItemChange(idx, 'qty', e.target.value)}
                      className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit $"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Total $"
                      value={item.rowTotal}
                      onChange={(e) => handleLineItemChange(idx, 'rowTotal', Number(e.target.value))}
                      className="w-full p-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Financial Totals */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Macro Math Totals (Subtotal + Tax == Total Due)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Subtotal ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Stated Total Due ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={statedTotal}
                  onChange={(e) => setStatedTotal(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              id="btn-run-reconciliation"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/10"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Executing Multi-Layer Verification...' : 'Execute 3-Layer Fraud Reconcile'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs space-y-3 ${
                result.status === 'VERIFIED' && !result.isFraudulent
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/30 border-red-800/60 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  {result.status === 'VERIFIED' && !result.isFraudulent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-400" />
                  )}
                  <span>AUDIT RESULT: {result.isFraudulent ? 'FRAUD DETECTED' : result.status}</span>
                </div>
                <span className="text-[10px] text-zinc-400">Tolerance: ±$0.01</span>
              </div>

              {/* 3 Check Badges */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className={`p-2 rounded border flex items-center justify-between ${
                  result.checks?.macroMath ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'
                }`}>
                  <span>1. Macro Math</span>
                  <span className="font-bold">{result.checks?.macroMath ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${
                  result.checks?.microMath ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'
                }`}>
                  <span>2. Micro Math</span>
                  <span className="font-bold">{result.checks?.microMath ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${
                  result.checks?.metadataFormat ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'
                }`}>
                  <span>3. Tax ID Format</span>
                  <span className="font-bold">{result.checks?.metadataFormat ? 'PASS' : 'FAIL'}</span>
                </div>
              </div>

              {result.fraudReason && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700/80 text-red-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Fraud & Discrepancy Breakdown:</span>
                  </div>
                  <p className="font-sans leading-relaxed">{result.fraudReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-200">
                <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">Subtotal</span>
                  <span>${result.subtotal.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">Tax ({result.taxRate}%)</span>
                  <span>${result.calculatedTax.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">Forensic Total</span>
                  <span className="text-emerald-400 font-bold">${result.calculatedTotal.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">Variance</span>
                  <span className={`font-bold ${result.discrepancy > 0.01 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ${result.discrepancy.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                {result.explanation}
              </p>

              {onInsertToChat && (
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Perform forensic multi-layer audit on invoice: Vendor "${result.vendorName || vendorName}", Tax ID "${result.taxId || taxId}", PO "${result.poNumber || poNumber}". Subtotal $${result.subtotal.toFixed(2)}, Tax Rate ${result.taxRate}%, Stated Total $${result.statedTotal.toFixed(2)}.`;
                    onInsertToChat(prompt);
                    onClose();
                  }}
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition font-sans flex items-center justify-center gap-1.5"
                >
                  <span>Inject into Multi-Turn Journal Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
