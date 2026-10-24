import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { PaymentMethod, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  Landmark,
  CheckCircle2,
  Clock,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const CashierQueue: React.FC = () => {
  const {
    pendingOrders,
    confirmSalesOrder,
    cancelSalesOrder,
    customers,
    currentUser,
    isCashier,
  } = useHardwareStore();

  const [selectedOrder, setSelectedOrder] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Print Preview state
  const [previewTransaction, setPreviewTransaction] = useState<Transaction | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // When order is opened for processing
  const handleOpenProcess = (order: Transaction) => {
    setSelectedOrder(order);
    setPaymentMethod(order.paymentMethod || 'CASH');
    setAmountPaidInput(String(order.grandTotal));
    setPaymentNotes('');
    setError('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError('');

    const paidNum = amountPaidInput === '' ? selectedOrder.grandTotal : Number(amountPaidInput);
    if (isNaN(paidNum) || paidNum < 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const balanceRemaining = Math.max(0, selectedOrder.grandTotal - paidNum);

    // If credit or partial, check if customer is allowed credit
    if (balanceRemaining > 0 || paymentMethod === 'CREDIT_ACCOUNT') {
      const customer = customers.find(c => c.id === selectedOrder.customerId);
      if (!customer || customer.type === 'RETAIL_WALK_IN') {
        setError('Walk-in retail customers cannot take materials on credit. Please collect payment in full.');
        return;
      }
      const projected = customer.outstandingBalance + balanceRemaining;
      if (projected > customer.creditLimit) {
        setError(`Customer credit limit of ${formatCurrency(customer.creditLimit)} exceeded. Current debt: ${formatCurrency(customer.outstandingBalance)}.`);
        return;
      }
    }

    const confirmedTx = confirmSalesOrder(selectedOrder.id, {
      paymentMethod,
      amountPaid: paidNum,
      notes: paymentNotes.trim() || undefined,
    });

    if (confirmedTx) {
      setSelectedOrder(null);
      // Automatically open on-screen Print Preview modal as requested!
      setPreviewTransaction(confirmedTx);
      setIsPreviewOpen(true);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this pending sales order?')) {
      cancelSalesOrder(orderId, 'Customer cancelled order before payment confirmation');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Queue Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Cashier Till & Confirmation Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingOrders.length} Pending {pendingOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sellers book customer sales orders at the counter. Cashiers verify payment mode, confirm funds, and issue tax receipts.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
          <span>Active Cashier: </span>
          <strong className="text-slate-900">{currentUser.name}</strong>
        </div>
      </div>

      {/* Main Queue List */}
      {pendingOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Cashier Queue is All Clear!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no unconfirmed sales orders waiting at the Cashier Till. As sellers enter orders at the counter, they will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                selectedOrder?.id === order.id
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {order.orderNo || order.invoiceNo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      PENDING CASHIER
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {order.customerName}
                  </h4>
                  {order.siteReference && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                      Site: {order.siteReference}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Due</span>
                  <span className="text-lg font-black font-mono text-emerald-700">
                    {formatCurrency(order.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="py-3 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Materials Requested ({order.items.length} {order.items.length === 1 ? 'item' : 'items'}):
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 bg-slate-50 px-2.5 py-1 rounded">
                      <span className="truncate max-w-[200px]">
                        <strong>{item.qty} {item.unit}</strong> × {item.name}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 shrink-0">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Meta Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Seller: <strong>{order.sellerName}</strong></span>
                  <span className="text-slate-300">·</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order.id)}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenProcess(order)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs transition-all active:scale-98"
                  >
                    <span>Confirm & Pay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Processing Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Payment & Dispatch
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Order Ref: {selectedOrder.orderNo || selectedOrder.invoiceNo} · Client: {selectedOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
              {/* Grand Total Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Order Payable Total</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {formatCurrency(selectedOrder.grandTotal)}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Booked By: <strong>{selectedOrder.sellerName}</strong></p>
                  <p>Items: <strong>{selectedOrder.items.length} lines</strong></p>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Payment Method (Ugandan Channels)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Cash at Desk</span>
                    <span className="text-[10px] text-slate-500">Physical notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MTN_MOMO')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'MTN_MOMO'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">MTN MoMo</span>
                    <span className="text-[10px] text-slate-500">Merchant: 559201</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'AIRTEL_MONEY'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold">Airtel Money</span>
                    <span className="text-[10px] text-slate-500">Paybill: 881200</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Stanbic / EFT</span>
                    <span className="text-[10px] text-slate-500">Direct wire transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_ACCOUNT')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === 'CREDIT_ACCOUNT'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold">Contractor Credit</span>
                    <span className="text-[10px] text-slate-500">30-day invoice terms</span>
                  </button>
                </div>
              </div>

              {/* Amount Paid Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Amount Paid by Customer (USh)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(String(selectedOrder.grandTotal))}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Exact Full Total
                    </button>
                    {paymentMethod === 'CREDIT_ACCOUNT' && (
                      <button
                        type="button"
                        onClick={() => setAmountPaidInput('0')}
                        className="text-[11px] font-semibold text-purple-600 hover:underline"
                      >
                        100% On Credit
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                    USh
                  </span>
                  <input
                    type="number"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder="Enter collected amount..."
                    className="w-full pl-12 pr-4 py-2 text-base font-bold font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                  />
                </div>

                {Number(amountPaidInput) < selectedOrder.grandTotal && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    Remaining balance of <strong>{formatCurrency(selectedOrder.grandTotal - Number(amountPaidInput))}</strong> will be posted to the customer's credit ledger.
                  </p>
                )}
              </div>

              {/* Cashier Notes or Payment Reference */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Transaction Reference / MoMo Ref / Delivery Instructions
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. MTN MoMo TxID 488192001 / Cash over desk..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>Confirm Payment & Print Preview</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal On-Screen Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentType="INVOICE"
        data={{ transaction: previewTransaction || undefined }}
      />
    </div>
  );
};
