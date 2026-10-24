import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { PaymentMethod, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Edit3,
  Trash2,
  Printer,
  Plus,
  Scale,
  Shield,
  X,
  FileSpreadsheet,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const DayBalanceSheet: React.FC = () => {
  const {
    transactions,
    expenses,
    getDayBalancingRecord,
    closeDayRegister,
    reopenDayRegister,
    updateTransaction,
    deleteTransaction,
    addExpense,
    isAdmin,
    currentUser,
  } = useHardwareStore();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Day balancing record for selected date
  const dayRecord = getDayBalancingRecord(selectedDate);

  // Physical count state
  const [actualCashInput, setActualCashInput] = useState<string>(
    dayRecord.status === 'CLOSED' ? String(dayRecord.actualCountedCash) : ''
  );
  const [balanceNotes, setBalanceNotes] = useState<string>(dayRecord.notes || '');

  // Modals state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('CASH');
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [editSiteRef, setEditSiteRef] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');

  const [voidTx, setVoidTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [isSheetPreviewOpen, setIsSheetPreviewOpen] = useState(false);

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseCat, setExpenseCat] = useState<'Offloading & Casual Labor' | 'Transport & Fuel' | 'Shop Utilities & Rent'>('Offloading & Casual Labor');
  const [expenseAmt, setExpenseAmt] = useState<number>(60000);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseFrom, setExpenseFrom] = useState<'CASH' | 'MTN_MOMO'>('CASH');

  // Filter transactions for this day
  const dayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const activeDayTransactions = dayTransactions.filter(t => t.status !== 'VOIDED');
  const dayExpenses = expenses.filter(e => e.date === selectedDate);

  // Calculated variance
  const parsedCountedCash = actualCashInput === ''
    ? dayRecord.expectedCashInDrawer
    : Number(actualCashInput);
  const variance = parsedCountedCash - dayRecord.expectedCashInDrawer;

  // Handlers
  const handleBalanceDaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Admin/Manager can balance and certify the day register.');
      return;
    }
    closeDayRegister(selectedDate, parsedCountedCash, balanceNotes || 'Day register balanced and certified.');
  };

  const openEditModal = (tx: Transaction) => {
    if (!isAdmin) return;
    setEditTx(tx);
    setEditPaymentMethod(tx.paymentMethod);
    setEditAmountPaid(tx.amountPaid);
    setEditSiteRef(tx.siteReference || '');
    setEditNotes(tx.notes || '');
    setEditReason('');
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx) return;

    const balanceDue = Math.max(0, editTx.grandTotal - editAmountPaid);
    updateTransaction(
      editTx.id,
      {
        paymentMethod: editPaymentMethod,
        amountPaid: editAmountPaid,
        balanceDue,
        siteReference: editSiteRef,
        notes: editNotes,
      },
      editReason || 'Day balance sheet manager adjustment'
    );
    setEditTx(null);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTx) return;
    deleteTransaction(voidTx.id, voidReason || 'Sale voided from Day Balance Sheet');
    setVoidTx(null);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      date: selectedDate,
      category: expenseCat,
      amount: Number(expenseAmt),
      paidFrom: expenseFrom,
      description: expenseDesc || 'Casual labor offloading materials at yard',
    });
    setIsExpenseOpen(false);
    setExpenseDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header with Date Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Daily Balance Sheet & Sales Reconciliation
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review all sales entries of the day, edit transactions, record offloading expenses, and balance the cash drawer.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Operating Day:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setActualCashInput('');
            }}
            className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          />

          <button
            onClick={() => setSelectedDate(today)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              selectedDate === today
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* The Day's Financial Balance Sheet Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Balance Sheet for {formatDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500">
                Opening float + Inflows (Cash, MTN MoMo, Bank) - Outflows (Casual labor wages, fuel)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSheetPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Preview Balance Sheet</span>
            </button>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                dayRecord.status === 'CLOSED'
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dayRecord.status === 'CLOSED' ? 'Certified & Balanced' : 'Open / In Progress'}
            </span>
            {dayRecord.status === 'CLOSED' && isAdmin && (
              <button
                onClick={() => reopenDayRegister(dayRecord.id)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Reopen
              </button>
            )}
          </div>
        </div>

        {/* Financial Flow Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Opening Cash Float</span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-800 mt-1 block tabular-nums">
              {formatCurrency(dayRecord.openingCash)}
            </span>
            <span className="text-[10px] text-slate-400">Desk change float</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Cash Sales Inflow</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
              +{formatCurrency(dayRecord.totalCashSales)}
            </span>
            <span className="text-[10px] text-slate-400">Notes collected</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">MTN MoMo / Airtel</span>
            <span className="text-sm sm:text-base font-bold font-mono text-amber-700 mt-1 block tabular-nums">
              {formatCurrency(dayRecord.totalMtnMomoSales + dayRecord.totalAirtelMoneySales)}
            </span>
            <span className="text-[10px] text-slate-400">Mobile money paybills</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Bank Transfer (EFT)</span>
            <span className="text-sm sm:text-base font-bold font-mono text-blue-700 mt-1 block tabular-nums">
              {formatCurrency(dayRecord.totalBankSales)}
            </span>
            <span className="text-[10px] text-slate-400">Stanbic / Centenary</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Paid Out (Offloading)</span>
            <span className="text-sm sm:text-base font-bold font-mono text-rose-600 mt-1 block tabular-nums">
              -{formatCurrency(dayRecord.totalPaidOutExpenses)}
            </span>
            <span className="text-[10px] text-slate-400">Casual offloaders/fuel</span>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xs">
            <span className="text-[11px] text-slate-300 font-medium block">Expected Drawer Cash</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white mt-1 block tabular-nums">
              {formatCurrency(dayRecord.expectedCashInDrawer)}
            </span>
            <span className="text-[10px] text-slate-400">Target physical cash</span>
          </div>
        </div>

        {/* Balancing & Certification Action (Requested explicitly: "balance the sales of the day") */}
        {isAdmin && (
          <form onSubmit={handleBalanceDaySubmit} className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:w-64">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Counted Cash in Drawer (USh)
                </label>
                <input
                  type="number"
                  step="500"
                  placeholder={String(dayRecord.expectedCashInDrawer)}
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full text-base font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Balancing Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales reconciled with physical notes. Paid casuals 60k for Tororo cement trailer."
                  value={balanceNotes}
                  onChange={(e) => setBalanceNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                {dayRecord.status === 'CLOSED' ? 'Update Day Balance' : 'Balance Sales & Close Day'}
              </button>
            </div>

            {/* Reconciliation Variance Result */}
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className="font-semibold text-slate-600">Reconciliation Variance:</span>
              {variance === 0 ? (
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Balanced! USh 0.00 Variance (Physical cash matches recorded receipts & expenses exactly)</span>
                </span>
              ) : variance > 0 ? (
                <span className="flex items-center gap-1.5 font-bold text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>Surplus: +{formatCurrency(variance)} excess cash in drawer</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Shortfall: {formatCurrency(variance)} missing cash</span>
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* CORE REQUEST: The Day's Sales Entries Ledger (With EDIT and DELETE/VOID capabilities) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sales Entries of the Day ({dayTransactions.length} orders)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <span className="font-semibold text-slate-700">Edit</span> on any entry to modify customer, payment method, or amount. Click <span className="font-semibold text-rose-600">Void</span> to cancel and reclaim stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Day Expense</span>
            </button>
          </div>
        </div>

        {/* Interactive Day's Sales Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Invoice / Time</th>
                <th className="py-2.5 px-3">Customer & Site Reference</th>
                <th className="py-2.5 px-3">Construction Materials</th>
                <th className="py-2.5 px-3 text-center">Payment Mode</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Day Audit Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dayTransactions.map(tx => {
                const isVoid = tx.status === 'VOIDED';

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isVoid ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold font-mono text-slate-900">{tx.invoiceNo}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{tx.time}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      {tx.siteReference && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">Site: {tx.siteReference}</div>
                      )}
                      <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                        <span className="text-amber-800 font-medium">Order: {tx.sellerName}</span>
                        <span>·</span>
                        <span className="text-emerald-800 font-medium">Till: {tx.cashierName || 'Cashier Desk'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      {tx.items.length > 0 ? (
                        <div className="text-slate-700 line-clamp-2">
                          {tx.items.map(i => `${i.qty} ${i.unit} ${i.name}`).join(', ')}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">{tx.notes || 'Statement Debt Settlement'}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(tx.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="text-emerald-700 font-semibold">{formatCurrency(tx.amountPaid)}</div>
                      {tx.balanceDue > 0 && (
                        <div className="text-[10px] text-amber-700 font-bold">Credit: {formatCurrency(tx.balanceDue)}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
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

                    {/* Admin Actions: Edit & Void */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReceiptTx(tx)}
                            title="Print / View Invoice"
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isVoid && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(tx)}
                                title="Edit this sale entry"
                                className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidTx(tx);
                                  setVoidReason('');
                                }}
                                title="Void sale and reclaim stock"
                                className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Void</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {dayTransactions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-400">
                    No sales recorded on {formatDate(selectedDate)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day Petty Cash & Casual Expenses Table */}
      {dayExpenses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Casual Labor & Operating Cash Paid Out on {formatDate(selectedDate)}
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {dayExpenses.map(exp => (
              <div key={exp.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{exp.category}</span>
                  <p className="text-slate-600 mt-0.5">{exp.description}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-600">-{formatCurrency(exp.amount)}</span>
                  <span className="text-[10px] text-slate-400 block">{exp.paidFrom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Sale of the Day */}
      {editTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Sale Entry: {editTx.invoiceNo}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total Value: {formatCurrency(editTx.grandTotal)}</p>
              </div>
              <button onClick={() => setEditTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTx} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Delivery Project / Reference
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
                    <option value="CASH">Cash (USh)</option>
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer (Stanbic/Centenary)</option>
                    <option value="CREDIT_ACCOUNT">Contractor Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (USh)</label>
                  <input
                    type="number"
                    min="0"
                    max={editTx.grandTotal}
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Counter Notes
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
                  Reason for Adjustment (Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corrected payment mode from Cash to MTN MoMo"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTx(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Save Changes to Day Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Void Day's Sale */}
      {voidTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700">Void / Cancel Sale Ticket</h3>
              <button onClick={() => setVoidTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1 text-rose-800">
                <p className="font-bold">Void {voidTx.invoiceNo}?</p>
                <p>This will return {voidTx.items.reduce((s, i) => s + i.qty, 0)} items back into physical yard inventory and reverse {formatCurrency(voidTx.balanceDue)} from the customer ledger.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Order cancelled before truck departure"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidTx(null)}
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

      {/* MODAL 3: Record Casual Labor Expense */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setIsExpenseOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Offloading & Casual Labor">Offloading & Casual Labor (Trailer offloaders)</option>
                  <option value="Transport & Fuel">Transport & Fuel (Forklift / Generator)</option>
                  <option value="Shop Utilities & Rent">Shop Utilities & Electricity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (USh)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={expenseAmt}
                    onChange={(e) => setExpenseAmt(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid From</label>
                  <select
                    value={expenseFrom}
                    onChange={(e) => setExpenseFrom(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="CASH">Cash Drawer (Deducts from Till)</option>
                    <option value="MTN_MOMO">MTN MoMo Float</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Paid casuals 5 men offloading Tororo cement trailer"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal On-Screen Print Preview Modal for Invoices & Receipts */}
      <PrintPreviewModal
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
        documentType="INVOICE"
        data={{ transaction: receiptTx || undefined }}
      />

      {/* Universal On-Screen Print Preview Modal for Day's Balance Sheet */}
      <PrintPreviewModal
        isOpen={isSheetPreviewOpen}
        onClose={() => setIsSheetPreviewOpen(false)}
        documentType="DAY_BALANCE_SHEET"
        data={{
          dayRecord,
          dayTransactions,
          dayExpenses,
          selectedDate,
        }}
      />
    </div>
  );
};
