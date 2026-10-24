import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { DayBalancingRecord, ExpenseRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  Receipt,
  FileText,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DayBalancingView: React.FC = () => {
  const {
    dayBalancing,
    getDayBalancingRecord,
    closeDayRegister,
    reopenDayRegister,
    transactions,
    expenses,
    addExpense,
    isAdmin,
    currentUser,
  } = useHardwareStore();

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = getDayBalancingRecord(today);
  const [actualCashInput, setActualCashInput] = useState<string>(
    todayRecord.status === 'CLOSED' ? String(todayRecord.actualCountedCash) : ''
  );
  const [closeNotes, setCloseNotes] = useState<string>(todayRecord.notes || '');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseRecord['category']>('Offloading & Casual Labor');
  const [expenseAmount, setExpenseAmount] = useState<number>(60000);
  const [expensePaidFrom, setExpensePaidFrom] = useState<'CASH' | 'BANK'>('CASH');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Counted cash vs expected calculation
  const parsedCountedCash = actualCashInput === '' 
    ? todayRecord.expectedCashInDrawer 
    : Number(actualCashInput);
  const currentVariance = parsedCountedCash - todayRecord.expectedCashInDrawer;

  const handleCloseRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Admin/Manager can officially balance and close the day register.');
      return;
    }
    closeDayRegister(today, parsedCountedCash, closeNotes || 'Daily register reconciled and balanced.');
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      date: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      amount: Number(expenseAmount),
      paidFrom: expensePaidFrom,
      description: expenseDesc || `${expenseCategory} payment`,
    });
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
  };

  // Transactions on selected date
  const activeDateForTransactions = selectedHistoryDate || todayRecord.date;
  const dayTransactions = transactions.filter(t => t.date === activeDateForTransactions && t.status !== 'VOIDED');
  const dayExpenses = expenses.filter(e => e.date === activeDateForTransactions);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Day Balancing & Cash Drawer Reconciliation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily register audit, cash counting, offloading expenses, and historical day balance ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Record Cash Expense (Offloading/Fuel)</span>
          </button>
        </div>
      </div>

      {/* Today's Active Register Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Today's Register: {formatDate(todayRecord.date)}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    todayRecord.status === 'CLOSED'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {todayRecord.status === 'CLOSED' ? 'Balanced & Closed' : 'Active / In Progress'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {todayRecord.status === 'CLOSED'
                  ? `Closed on ${todayRecord.closedAt} by ${todayRecord.closedBy}`
                  : `Currently open. Cash sales and petty cash expenses are being computed in real-time.`}
              </p>
            </div>
          </div>

          {todayRecord.status === 'CLOSED' && isAdmin && (
            <button
              onClick={() => reopenDayRegister(todayRecord.id)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reopen Today's Register
            </button>
          )}
        </div>

        {/* Day Register Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Opening Float</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {formatCurrency(todayRecord.openingCash)}
            </div>
            <span className="text-[10px] text-slate-400">Till change float</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Cash Sales</span>
            <div className="text-base font-bold font-mono text-emerald-700 mt-1 tabular-nums">
              +{formatCurrency(todayRecord.totalCashSales)}
            </div>
            <span className="text-[10px] text-slate-400">Physical notes collected</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">MTN MoMo & Airtel</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {formatCurrency(todayRecord.totalMtnMomoSales + todayRecord.totalAirtelMoneySales)}
            </div>
            <span className="text-[10px] text-slate-400">Mobile money paybills</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Bank RTGS / EFT</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {formatCurrency(todayRecord.totalBankSales)}
            </div>
            <span className="text-[10px] text-slate-400">Direct contractor wires</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Cash Expenses Paid</span>
            <div className="text-base font-bold font-mono text-rose-600 mt-1 tabular-nums">
              -{formatCurrency(todayRecord.totalPaidOutExpenses)}
            </div>
            <span className="text-[10px] text-slate-400">Offloading & diesel</span>
          </div>

          <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xs">
            <span className="text-[11px] text-slate-300 font-medium">Expected in Drawer</span>
            <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
              {formatCurrency(todayRecord.expectedCashInDrawer)}
            </div>
            <span className="text-[10px] text-slate-400">Formula target cash</span>
          </div>
        </div>

        {/* Cash Counting & Reconciliation Section */}
        {isAdmin ? (
          <form onSubmit={handleCloseRegisterSubmit} className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Physically Counted Cash in Till (KES)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    placeholder={String(todayRecord.expectedCashInDrawer)}
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Reconciliation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clean register close. Casual laborers paid for offloading cement trailer."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                {todayRecord.status === 'CLOSED' ? 'Update Close Certification' : 'Balance & Close Day'}
              </button>
            </div>

            {/* Live Variance Callout */}
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className="font-medium text-slate-600">Reconciliation Status:</span>
              {currentVariance === 0 ? (
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Balanced! 0.00 Variance (Physical cash matches recorded receipts & expenses)</span>
                </span>
              ) : currentVariance > 0 ? (
                <span className="flex items-center gap-1.5 font-bold text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>Surplus: +{formatCurrency(currentVariance)} excess cash in drawer</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Shortfall: {formatCurrency(currentVariance)} missing cash</span>
                </span>
              )}
            </div>
          </form>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Counter Sellers can view active sales. Day closing and variance certification requires Admin PIN.</span>
            </div>
            <span className="font-mono font-bold text-slate-800">
              Drawer Target: {formatCurrency(todayRecord.expectedCashInDrawer)}
            </span>
          </div>
        )}
      </div>

      {/* Historical Days Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Day History & Daily Registers</h3>
            <p className="text-xs text-slate-500">
              Audit archive of past operating days, register closing certificates, and physical cash variances.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {dayBalancing.length} registered day records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Opening Float</th>
                <th className="py-2.5 px-3 text-right">Cash Sales</th>
                <th className="py-2.5 px-3 text-right">MPesa / Bank</th>
                <th className="py-2.5 px-3 text-right">Credit Sales</th>
                <th className="py-2.5 px-3 text-right">Expenses Paid</th>
                <th className="py-2.5 px-3 text-right">Expected Cash</th>
                <th className="py-2.5 px-3 text-right">Counted Cash</th>
                <th className="py-2.5 px-3 text-center">Variance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dayBalancing.map(record => {
                const isSelected = selectedHistoryDate === record.date;
                const variance = record.cashVariance;

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-slate-50 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(record.openingCash)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      +{formatCurrency(record.totalCashSales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(record.totalMtnMomoSales + record.totalAirtelMoneySales + record.totalBankSales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700">
                      {formatCurrency(record.totalCreditSales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600">
                      -{formatCurrency(record.totalPaidOutExpenses)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                      {formatCurrency(record.expectedCashInDrawer)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(record.actualCountedCash)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block font-mono tabular-nums px-2 py-0.5 rounded text-[11px] font-bold ${
                          variance === 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : variance > 0
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {variance === 0 ? '0.00' : formatCurrency(variance)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          record.status === 'CLOSED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryDate(isSelected ? null : record.date)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        {isSelected ? 'Hide Details' : 'View Breakdown'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Date Detailed Drilldown */}
        {selectedHistoryDate && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Detailed Transaction & Expense Breakdown for {formatDate(selectedHistoryDate)}
              </h4>
              <button
                onClick={() => setSelectedHistoryDate(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Close Breakdown
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transactions on that day */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Sales Transactions ({dayTransactions.length})
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                  {dayTransactions.map(tx => (
                    <div key={tx.id} className="pt-2 first:pt-0 flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{tx.invoiceNo} · {tx.time}</div>
                        <div className="text-[11px] text-slate-500">{tx.customerName}</div>
                        <div className="text-[10px] text-slate-400">{tx.items.length} items ({tx.paymentMethod.replace('_', ' ')})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">{formatCurrency(tx.grandTotal)}</div>
                        {tx.balanceDue > 0 && (
                          <div className="text-[10px] text-amber-700">Credit: {formatCurrency(tx.balanceDue)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayTransactions.length === 0 && (
                    <p className="text-slate-400 py-2">No transactions recorded on this date.</p>
                  )}
                </div>
              </div>

              {/* Expenses on that day */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Petty Cash & Operational Expenses ({dayExpenses.length})
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                  {dayExpenses.map(exp => (
                    <div key={exp.id} className="pt-2 first:pt-0 flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{exp.category}</div>
                        <div className="text-[11px] text-slate-500">{exp.description}</div>
                        <div className="text-[10px] text-slate-400">By: {exp.recordedBy} ({exp.paidFrom})</div>
                      </div>
                      <div className="font-mono font-bold text-rose-600 text-right">
                        -{formatCurrency(exp.amount)}
                      </div>
                    </div>
                  ))}
                  {dayExpenses.length === 0 && (
                    <p className="text-slate-400 py-2">No petty cash expenses recorded on this date.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Operational Cash Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Offloading & Casual Labor">Offloading & Casual Labor (Trailer offloading, cement carrying)</option>
                  <option value="Transport & Fuel">Transport & Fuel (Yard forklift, delivery truck fuel)</option>
                  <option value="Shop Utilities & Rent">Shop Utilities & Electricity</option>
                  <option value="Hardware Repairs">Hardware Equipment Repairs (Bending machine, generator)</option>
                  <option value="Sundries">Sundries & Office Supplies</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid From
                  </label>
                  <select
                    value={expensePaidFrom}
                    onChange={(e) => setExpensePaidFrom(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="CASH">Cash Drawer (Deducts from Till)</option>
                    <option value="BANK">Bank Account / Petty Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid casuals 5 men for offloading 400 bags cement from Bamburi truck"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
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
    </div>
  );
};
