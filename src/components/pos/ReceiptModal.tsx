import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sale Completed</h3>
              <p className="text-xs text-slate-500">{transaction.invoiceNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice / Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              BUILDCRAFT HARDWARE (U) LTD
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Construction Materials · Roofings Steel · Tororo & Hima Cement · Goodwill Tiles · Uganda Baati
            </p>
            <p className="text-xs text-slate-500">
              Plot 28 6th Street Industrial Area, Kampala · Tel: +256 700 000 111 · URA TIN: 1000192837
            </p>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">CUSTOMER DETAILS</p>
              <p className="font-bold text-slate-900 mt-0.5">{transaction.customerName}</p>
              {transaction.siteReference && (
                <p className="text-slate-600 mt-0.5">Site: {transaction.siteReference}</p>
              )}
              <p className="text-slate-500 mt-0.5">Account: {transaction.customerType.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-medium">DOCUMENT INFO</p>
              <p className="font-bold text-slate-900 mt-0.5 font-mono">{transaction.invoiceNo}</p>
              <p className="text-slate-600 mt-0.5">Date: {formatDate(transaction.date)} {transaction.time}</p>
              <p className="text-slate-500 mt-0.5">Served By: {transaction.sellerName}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold">Item & Description</th>
                  <th className="py-2 px-3 text-center font-semibold">Qty</th>
                  <th className="py-2 px-3 text-right font-semibold">Unit Price</th>
                  <th className="py-2 px-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono tabular-nums">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Allowed</span>
                <span className="font-mono tabular-nums">-{formatCurrency(transaction.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums">{formatCurrency(transaction.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Payment Mode</span>
              <span className="font-medium uppercase">{transaction.paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid</span>
              <span className="font-mono tabular-nums text-emerald-600 font-semibold">{formatCurrency(transaction.amountPaid)}</span>
            </div>
            {transaction.balanceDue > 0 && (
              <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded-md font-semibold">
                <span>Outstanding Credit Balance</span>
                <span className="font-mono tabular-nums">{formatCurrency(transaction.balanceDue)}</span>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">Remarks: </span>
              <span className="text-slate-600">{transaction.notes}</span>
            </div>
          )}

          {/* Footer note */}
          <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <p>Goods received in good order & condition. No cash refunds without original delivery note.</p>
            <p>Thank you for building with BuildCraft Hardware!</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
