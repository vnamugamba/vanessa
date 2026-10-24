import React from 'react';
import { Customer, DayBalancingRecord, ExpenseRecord, StatementEntry, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, X, Download, ShieldCheck, CheckCircle2, FileText, Building2, MapPin, Phone } from 'lucide-react';

export type DocumentType = 'INVOICE' | 'SALES_ORDER' | 'DAY_BALANCE_SHEET' | 'CLIENT_STATEMENT';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  data: {
    transaction?: Transaction;
    dayRecord?: DayBalancingRecord;
    dayTransactions?: Transaction[];
    dayExpenses?: ExpenseRecord[];
    selectedDate?: string;
    customer?: Customer;
    statement?: StatementEntry[];
  };
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  data,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    transaction,
    dayRecord,
    dayTransactions = [],
    dayExpenses = [],
    selectedDate,
    customer,
    statement = [],
  } = data;

  const getDocTitle = () => {
    switch (documentType) {
      case 'INVOICE':
        return `Tax Invoice / Cash Receipt · ${transaction?.invoiceNo || 'INV'}`;
      case 'SALES_ORDER':
        return `Sales Order Slip · ${transaction?.orderNo || 'SO'}`;
      case 'DAY_BALANCE_SHEET':
        return `Day's Financial Balance Sheet · ${formatDate(selectedDate || dayRecord?.date || '')}`;
      case 'CLIENT_STATEMENT':
        return `Client Statement & Balance Sheet · ${customer?.name || 'Customer'}`;
      default:
        return 'Document Print Preview';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      {/* Top Floating Control Bar (No Print) */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 shadow-xl no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            A4
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Print Preview Mode
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-medium">Standard A4 Letterhead</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              {getDocTitle()}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Verify preview before printing or exporting
          </span>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Print to Printer (Ctrl+P)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container with Simulated A4 Paper */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center items-start">
        <div
          id="printable-document-content"
          className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 border border-slate-200 space-y-6 text-sm"
        >
          {/* Universal Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                    BC
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 font-sans">
                    BUILDCRAFT HARDWARE (U) LTD
                  </h1>
                </div>
                <p className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Importers & Distributors of Heavy Construction Materials & Hardware
                </p>
                <p className="text-xs text-slate-500">
                  Plot 28, 6th Street Industrial Area, Kampala, Uganda · P.O. Box 7842 Kampala
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                  <span><strong>Tel:</strong> +256 (0) 700 000 111 / +256 (0) 414 123 456</span>
                  <span><strong>Email:</strong> sales@buildcraft.co.ug</span>
                </div>
              </div>

              <div className="sm:text-right space-y-1 text-xs bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                <div className="font-mono text-slate-900">
                  <span className="text-slate-500">URA TIN: </span>
                  <strong className="text-slate-950">1000192837</strong>
                </div>
                <div className="font-mono text-slate-900">
                  <span className="text-slate-500">VAT Reg No: </span>
                  <strong className="text-slate-950">554902-V</strong>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Kampala Central Yard & Showroom
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT BODY BASED ON TYPE */}

          {/* 1. INVOICE / RECEIPT / SALES ORDER PREVIEW */}
          {(documentType === 'INVOICE' || documentType === 'SALES_ORDER') && transaction && (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Official Document
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    {documentType === 'SALES_ORDER'
                      ? 'COUNTER SALES ORDER SLIP'
                      : 'OFFICIAL TAX INVOICE & CASH RECEIPT'}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-slate-200 text-slate-800">
                    {documentType === 'SALES_ORDER'
                      ? transaction.orderNo || transaction.invoiceNo
                      : transaction.invoiceNo}
                  </span>
                  {transaction.deliveryNoteNo && (
                    <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-amber-100 text-amber-900">
                      {transaction.deliveryNoteNo}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      transaction.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : transaction.status === 'PENDING_CASHIER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {transaction.status === 'PENDING_CASHIER'
                      ? 'PENDING CASHIER PAYMENT'
                      : transaction.status}
                  </span>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 space-y-1 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Billed To / Customer Details
                  </span>
                  <p className="text-sm font-bold text-slate-900">{transaction.customerName}</p>
                  <p className="text-slate-600">
                    Account Category: <strong className="text-slate-800">{transaction.customerType.replace('_', ' ')}</strong>
                  </p>
                  {transaction.siteReference && (
                    <p className="text-slate-700 font-medium">
                      Site Destination: <span className="text-slate-950 font-bold">{transaction.siteReference}</span>
                    </p>
                  )}
                  {transaction.notes && (
                    <p className="text-slate-500 italic mt-1">Notes: {transaction.notes}</p>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-slate-200 space-y-1.5 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Transaction Audit Details
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatDate(transaction.date)} {transaction.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booked By (Seller):</span>
                    <span className="font-semibold text-slate-900">{transaction.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier Confirmed By:</span>
                    <span className="font-semibold text-slate-900">
                      {transaction.cashierName || (transaction.status === 'CONFIRMED' ? 'Cashier Desk' : 'Awaiting Cashier Till')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Materials & Grade</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (USh)</th>
                      <th className="py-2.5 px-3 text-right">Total (USh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {transaction.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Code: {item.code} · Group: {item.group}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Strip */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="text-xs text-slate-500 space-y-1 max-w-sm">
                  <p className="font-semibold text-slate-700">Uganda Payment Methods Accepted:</p>
                  <p>• MTN MoMo Merchant Code: <strong className="font-mono text-slate-900">559201</strong></p>
                  <p>• Airtel Money Merchant Paybill: <strong className="font-mono text-slate-900">881200</strong></p>
                  <p>• Stanbic Bank Uganda A/C: <strong className="font-mono text-slate-900">9030018274628</strong></p>
                </div>

                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(transaction.subtotal)}
                    </span>
                  </div>
                  {transaction.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount Allowed:</span>
                      <span className="font-mono font-semibold">
                        -{formatCurrency(transaction.discountTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-slate-950">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base font-black">
                      {formatCurrency(transaction.grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(transaction.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                    <span>Balance Due:</span>
                    <span className={`font-mono font-black ${transaction.balanceDue > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {formatCurrency(transaction.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Official Stamps */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-center text-xs">
                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1">
                    <span className="font-semibold text-slate-800">{transaction.sellerName}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Order Prepared By (Seller)
                  </span>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1">
                    <span className="font-semibold text-slate-800">
                      {transaction.cashierName || 'Official Cashier Stamp'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Cashier Payment Received & Stamp
                  </span>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-300">
                    ..........................................
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Customer / Driver Received In Good Order
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. DAY'S BALANCE SHEET PREVIEW */}
          {documentType === 'DAY_BALANCE_SHEET' && dayRecord && (
            <div className="space-y-6">
              {/* Title Strip */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Official Daily Audit & Reconciliation Report
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    DAILY FINANCIAL & SALES BALANCE SHEET
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operating Date: <strong className="text-slate-900 font-mono">{formatDate(dayRecord.date)}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      dayRecord.status === 'CLOSED'
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {dayRecord.status === 'CLOSED' ? 'Certified & Reconciled' : 'Open / Working Shift'}
                  </span>
                </div>
              </div>

              {/* Day Financial Inflow/Outflow Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">1. Opening Till Float</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    {formatCurrency(dayRecord.openingCash)}
                  </span>
                  <span className="text-[10px] text-slate-400">Desk change float</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">2. Cash Sales Collected</span>
                  <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                    +{formatCurrency(dayRecord.totalCashSales)}
                  </span>
                  <span className="text-[10px] text-slate-400">Over counter notes</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">3. MTN MoMo / Airtel</span>
                  <span className="text-base font-bold font-mono text-amber-700 mt-1 block">
                    {formatCurrency(dayRecord.totalMtnMomoSales + dayRecord.totalAirtelMoneySales)}
                  </span>
                  <span className="text-[10px] text-slate-400">Digital merchant payments</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">4. Bank Transfers (EFT)</span>
                  <span className="text-base font-bold font-mono text-blue-700 mt-1 block">
                    {formatCurrency(dayRecord.totalBankSales)}
                  </span>
                  <span className="text-[10px] text-slate-400">Stanbic / Centenary RTGS</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">5. Contractor Credit Sales</span>
                  <span className="text-base font-bold font-mono text-purple-700 mt-1 block">
                    {formatCurrency(dayRecord.totalCreditSales)}
                  </span>
                  <span className="text-[10px] text-slate-400">Ledger receivables</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 block">6. Petty Cash Outflows</span>
                  <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
                    -{formatCurrency(dayRecord.totalPaidOutExpenses)}
                  </span>
                  <span className="text-[10px] text-slate-400">Casual wages & transport</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                  <span className="text-slate-700 font-bold block">7. Expected Cash in Drawer</span>
                  <span className="text-base font-black font-mono text-slate-900 mt-1 block">
                    {formatCurrency(dayRecord.expectedCashInDrawer)}
                  </span>
                  <span className="text-[10px] text-slate-500">(1 + 2 - 6 - supplier cash)</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-900 bg-slate-900 text-white">
                  <span className="text-slate-300 font-medium block">8. Physical Count Variance</span>
                  <span
                    className={`text-base font-black font-mono mt-1 block ${
                      dayRecord.cashVariance === 0
                        ? 'text-emerald-400'
                        : dayRecord.cashVariance > 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {dayRecord.cashVariance >= 0 ? '+' : ''}
                    {formatCurrency(dayRecord.cashVariance)}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {dayRecord.cashVariance === 0 ? 'Exact Match (Balanced)' : 'Reconciliation Discrepancy'}
                  </span>
                </div>
              </div>

              {/* Transactions of the Day with Seller & Cashier */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audited Sales Entries of the Day ({dayTransactions.length} Total Entries)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Invoice / Order #</th>
                        <th className="py-2 px-3">Customer & Site</th>
                        <th className="py-2 px-3">Seller (Counter)</th>
                        <th className="py-2 px-3">Cashier (Till)</th>
                        <th className="py-2 px-3">Payment Mode</th>
                        <th className="py-2 px-3 text-right">Grand Total</th>
                        <th className="py-2 px-3 text-right">Paid</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {dayTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono text-slate-500">{tx.time}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{tx.invoiceNo}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 block">{tx.customerName}</span>
                            {tx.siteReference && (
                              <span className="text-[10px] text-slate-500 truncate block max-w-xs">{tx.siteReference}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{tx.sellerName}</td>
                          <td className="py-2 px-3 text-slate-700">{tx.cashierName || 'Cashier Desk'}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-800">
                            {tx.paymentMethod.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(tx.grandTotal)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                            {formatCurrency(tx.amountPaid)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                tx.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.status === 'PENDING_CASHIER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Petty Cash Outflows */}
              {dayExpenses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Petty Cash & Casual Yard Labor Paid Out ({dayExpenses.length} Records)
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Purpose & Description</th>
                          <th className="py-2 px-3">Disbursed From</th>
                          <th className="py-2 px-3">Approved By</th>
                          <th className="py-2 px-3 text-right">Amount (USh)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayExpenses.map((exp, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{exp.category}</td>
                            <td className="py-2 px-3 text-slate-600">{exp.description}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{exp.paidFrom}</td>
                            <td className="py-2 px-3 text-slate-600">{exp.recordedBy}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                              -{formatCurrency(exp.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1">
                    <span className="font-semibold text-slate-800">
                      {dayRecord.closedBy || 'Cashier on Duty'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Cashier Drawer Balancing Verification
                  </span>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-300">
                    ..................................................................
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Store Manager / General Auditor Sign-Off
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. CLIENT STATEMENT & BALANCE SHEET PREVIEW */}
          {documentType === 'CLIENT_STATEMENT' && customer && (
            <div className="space-y-6">
              {/* Client Statement Header */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Official Client Account Ledger
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    CLIENT STATEMENT & BALANCE SHEET
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statement As Of: <strong className="text-slate-900 font-mono">{formatDate(new Date().toISOString().split('T')[0])}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Net Outstanding Balance:</span>
                  <span className="text-xl font-black font-mono text-amber-700">
                    {formatCurrency(customer.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Client Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Account
                  </span>
                  <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                  <p className="text-slate-600">Contact: {customer.phone}</p>
                  <p className="text-slate-600">
                    URA TIN: <strong className="font-mono text-slate-900">{customer.tinNumber || 'N/A'}</strong>
                  </p>
                  <p className="text-slate-600">
                    Account Classification: <strong>{customer.type.replace('_', ' ')}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Credit & Site Limits
                  </span>
                  <p className="text-slate-700">
                    Project Site: <strong>{customer.projectName || 'Kampala Central'}</strong> ({customer.siteLocation || 'Uganda'})
                  </p>
                  <p className="text-slate-700">
                    Approved Credit Limit: <strong className="font-mono">{formatCurrency(customer.creditLimit)}</strong>
                  </p>
                  <p className="text-slate-700">
                    Available Credit Buffer: <strong className="font-mono text-emerald-700">
                      {formatCurrency(Math.max(0, customer.creditLimit - customer.outstandingBalance))}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Ledger Statement Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Transaction & Payment History ({statement.length} Records)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Reference #</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Debit / Billed (USh)</th>
                        <th className="py-2.5 px-3 text-right">Credit / Paid (USh)</th>
                        <th className="py-2.5 px-3 text-right">Running Balance (USh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {statement.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-600">{formatDate(entry.date)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{entry.referenceNo}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                entry.type === 'INVOICE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs">{entry.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement Instructions */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Payment & Settlement Channels:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div>MTN MoMo: <strong>559201</strong></div>
                  <div>Airtel Money: <strong>881200</strong></div>
                  <div>Stanbic Bank: <strong>9030018274628</strong></div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1">
                    <span className="font-semibold text-slate-800">
                      Credit Controller / Accountant
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Certified True Statement of Account
                  </span>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-dashed border-slate-400 pb-1 text-slate-300">
                    ..................................................................
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase font-medium">
                    Client / Contractor Statement Acceptance
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Official Document Footer Notice */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <p>
              BuildCraft Hardware (U) Ltd · Quality Assured Ugandan Construction Materials
            </p>
            <p>
              This computer-generated document is official under the laws of the Republic of Uganda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
