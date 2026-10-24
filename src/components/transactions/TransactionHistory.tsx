import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { PaymentMethod, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  Search,
  Printer,
  Trash2,
  Edit3,
  AlertTriangle,
  Lock,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  X,
} from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    updateTransaction,
    isAdmin,
    currentUser,
  } = useHardwareStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Receipt Modal state
  const [viewReceiptTx, setViewReceiptTx] = useState<Transaction | null>(null);

  // Void / Delete Modal state
  const [voidTargetTx, setVoidTargetTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Edit Modal state
  const [editTargetTx, setEditTargetTx] = useState<Transaction | null>(null);
  const [editSiteRef, setEditSiteRef] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('CASH');
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.invoiceNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.siteReference && t.siteReference.toLowerCase().includes(q)) ||
        (t.deliveryNoteNo && t.deliveryNoteNo.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || t.paymentMethod === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [transactions, searchQuery, statusFilter, paymentFilter]);

  // Handlers
  const openVoidModal = (tx: Transaction) => {
    if (!isAdmin) return;
    setVoidTargetTx(tx);
    setVoidReason('');
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTargetTx) return;
    deleteTransaction(voidTargetTx.id, voidReason || 'Voided by manager order reversal');
    setVoidTargetTx(null);
  };

  const openEditModal = (tx: Transaction) => {
    if (!isAdmin) return;
    setEditTargetTx(tx);
    setEditSiteRef(tx.siteReference || '');
    setEditPaymentMethod(tx.paymentMethod);
    setEditAmountPaid(tx.amountPaid);
    setEditNotes(tx.notes || '');
    setEditReason('');
  };

  const handleConfirmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetTx) return;
    const balanceDue = Math.max(0, editTargetTx.grandTotal - editAmountPaid);

    updateTransaction(
      editTargetTx.id,
      {
        siteReference: editSiteRef,
        paymentMethod: editPaymentMethod,
        amountPaid: editAmountPaid,
        balanceDue,
        notes: editNotes,
      },
      editReason || 'Corrected transaction parameters'
    );

    setEditTargetTx(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'Transaction Audit & Sales Ledger' : 'Counter Sales Log'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Complete sales log with admin privileges to modify parameters, void invoices, and reverse inventory.'
              : 'Review daily counter sales tickets and reprint customer receipts.'}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Admin Clearance: Void & Edit Permitted</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Seller Mode: Viewing & reprinting allowed; edits locked</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by invoice # (e.g. INV-2026-0891), customer name, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash Only</option>
              <option value="MOBILE_MONEY">MPesa / Mobile Money</option>
              <option value="BANK_TRANSFER">Bank Transfer (RTGS)</option>
              <option value="CREDIT_ACCOUNT">Contractor Credit</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('VOIDED')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === 'VOIDED'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              Voided
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice / Date</th>
                <th className="py-3 px-4">Customer & Site Reference</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                {isAdmin && <th className="py-3 px-4 text-right">Gross Profit</th>}
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const isVoid = tx.status === 'VOIDED';

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isVoid ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900">{tx.invoiceNo}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatDate(tx.date)} {tx.time}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      {tx.siteReference && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{tx.siteReference}</div>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono">By: {tx.sellerName}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {tx.items.length > 0 ? (
                        <div className="text-slate-700 line-clamp-2">
                          {tx.items.map(i => `${i.qty} ${i.unit} ${i.name}`).join(', ')}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Statement Payment Receipt</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(tx.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="text-emerald-700 font-semibold">{formatCurrency(tx.amountPaid)}</div>
                      {tx.balanceDue > 0 && (
                        <div className="text-[10px] text-amber-700">Credit: {formatCurrency(tx.balanceDue)}</div>
                      )}
                    </td>

                    {/* Admin only Profit column */}
                    {isAdmin && (
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-700">
                        {tx.grossProfit > 0 ? (
                          <span className="text-emerald-700">+{formatCurrency(tx.grossProfit)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isVoid
                            ? 'bg-rose-100 text-rose-800'
                            : tx.status === 'MODIFIED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewReceiptTx(tx)}
                          title="Print or view official ticket"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && !isVoid && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(tx)}
                              title="Edit transaction details"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openVoidModal(tx)}
                              title="Void and return stock"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Void Transaction (Admin Only) */}
      {voidTargetTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Void / Delete Sale Ticket</h3>
              </div>
              <button onClick={() => setVoidTargetTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-rose-900">
                  Are you sure you want to void {voidTargetTx.invoiceNo}?
                </p>
                <p className="text-rose-700">
                  This action will immediately:
                </p>
                <ul className="list-disc list-inside text-rose-700 space-y-0.5 pt-1">
                  <li>Return all {voidTargetTx.items.reduce((s, i) => s + i.qty, 0)} items back into physical inventory stock.</li>
                  <li>Reverse {formatCurrency(voidTargetTx.balanceDue)} from customer statement balance.</li>
                  <li>Log a permanent audit record with your name and reason.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation / Void
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wrong items billed over counter, customer cancelled order"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidTargetTx(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                >
                  Confirm Void & Reclaim Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transaction Details (Admin Only) */}
      {editTargetTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Transaction Parameters</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editTargetTx.invoiceNo} · Total {formatCurrency(editTargetTx.grandTotal)}</p>
              </div>
              <button onClick={() => setEditTargetTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Delivery Reference
                </label>
                <input
                  type="text"
                  value={editSiteRef}
                  onChange={(e) => setEditSiteRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="CASH">Cash</option>
                    <option value="MOBILE_MONEY">MPesa / Mobile Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_ACCOUNT">Contractor Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (KES)</label>
                  <input
                    type="number"
                    min="0"
                    max={editTargetTx.grandTotal}
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Edit (Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corrected cashier payment channel typo"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTargetTx(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for reprint */}
      <ReceiptModal
        transaction={viewReceiptTx}
        isOpen={Boolean(viewReceiptTx)}
        onClose={() => setViewReceiptTx(null)}
      />
    </div>
  );
};
