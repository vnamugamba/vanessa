import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { Customer, StatementEntry } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  FileText,
  Printer,
  Plus,
  Users,
  Search,
  Wallet,
  Phone,
  Building2,
  MapPin,
  CheckCircle,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export const ClientBalanceSheet: React.FC = () => {
  const {
    customers,
    getCustomerStatement,
    recordCustomerPayment,
    addCustomer,
    isAdmin,
  } = useHardwareStore();

  const creditCustomers = useMemo(() => {
    return customers.filter(c => c.type !== 'RETAIL_WALK_IN');
  }, [customers]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(creditCustomers[0]?.id || customers[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000000);
  const [paymentMethod, setPaymentMethod] = useState<string>('MTN_MOMO');
  const [paymentRef, setPaymentRef] = useState<string>('MOMO-REF');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Add new customer modal state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustType, setNewCustType] = useState<Customer['type']>('CONTRACTOR');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustTin, setNewCustTin] = useState('');
  const [newCustProject, setNewCustProject] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('');
  const [newCustLimit, setNewCustLimit] = useState<number>(20000000);

  // Selected customer
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || creditCustomers[0] || customers[0];

  // Statement for selected customer
  const statement = useMemo(() => {
    return currentCustomer ? getCustomerStatement(currentCustomer.id) : [];
  }, [currentCustomer, getCustomerStatement]);

  // Totals
  const totalInvoiced = statement.reduce((sum, s) => sum + s.debit, 0);
  const totalPaid = statement.reduce((sum, s) => sum + s.credit, 0);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    recordCustomerPayment(
      currentCustomer.id,
      Number(paymentAmount),
      paymentMethod,
      paymentRef,
      paymentNotes || 'Debt clearance payment'
    );
    setIsPaymentModalOpen(false);
    setPaymentNotes('');
    setPaymentRef('');
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name: newCustName,
      type: newCustType,
      phone: newCustPhone,
      tinNumber: newCustTin,
      projectName: newCustProject,
      siteLocation: newCustLocation,
      creditLimit: Number(newCustLimit),
    });
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustTin('');
    setNewCustProject('');
    setNewCustLocation('');
  };

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Client & Contractor Individual Balance Sheets
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual statement of accounts, running balances, credit limit verification, and debt payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-700" />
              <span>Register New Client</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Client Accounts List */}
        <div className="lg:col-span-4 space-y-3 no-print">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search client by name or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {creditCustomers
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.projectName && c.projectName.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(client => {
                const isSelected = client.id === selectedCustomerId;
                const hasDebt = client.outstandingBalance > 0;

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedCustomerId(client.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold leading-tight">
                          {client.name}
                        </h4>
                        {client.projectName && (
                          <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {client.projectName}
                          </p>
                        )}
                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          <Phone className="w-2.5 h-2.5" />
                          <span>{client.phone}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                            hasDebt
                              ? isSelected ? 'bg-rose-500/30 text-rose-200' : 'bg-rose-50 text-rose-700'
                              : isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {formatCurrency(client.outstandingBalance)}
                        </span>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          Balance Due
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 8 Cols: Individual Client Balance Sheet & Statement */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6" id="client-statement-sheet">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Official Client Statement & Balance Sheet
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {currentCustomer.name}
              </h3>
              {currentCustomer.projectName && (
                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Project Site: {currentCustomer.projectName} ({currentCustomer.siteLocation || 'Uganda'})</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Record Payment (MoMo/Cash)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Balance Sheet</span>
              </button>
            </div>
          </div>

          {/* Balance Sheet KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Outstanding Balance Due
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-rose-900 mt-1 block tabular-nums">
                {formatCurrency(currentCustomer.outstandingBalance)}
              </span>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Net debit balance</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Approved Credit Limit
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1 block tabular-nums">
                {formatCurrency(currentCustomer.creditLimit)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Contractor facility</span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Available Credit
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-900 mt-1 block tabular-nums">
                {formatCurrency(Math.max(0, currentCustomer.creditLimit - currentCustomer.outstandingBalance))}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Available for orders</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Client URA TIN
              </span>
              <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">
                {currentCustomer.tinNumber || '1008821901'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tax compliance ref</span>
            </div>
          </div>

          {/* Chronological Statement Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chronological Ledger & Statement of Account
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {statement.length} ledger transactions
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ref #</th>
                    <th className="py-2.5 px-3">Details & Construction Materials</th>
                    <th className="py-2.5 px-3 text-right">Debit (Invoiced +)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Paid -)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statement.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {entry.referenceNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                        {entry.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}

                  {statement.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No transactions recorded for this client yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Record Client Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Client Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentCustomer.name}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Debt Balance:</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(currentCustomer.outstandingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount Received (USh)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="BANK_TRANSFER">Bank Wire / Stanbic / Centenary</option>
                    <option value="CASH">Counter Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MoMo / Bank Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. MOMO-99120812"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared against Kololo site beam delivery"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Post Payment to Balance Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New Client */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register New Construction Client</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Contractor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Eng. Moses Kigozi / Victoria Builders"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="CONTRACTOR">Contractor / Builder</option>
                    <option value="SITE_CLIENT">Site Owner / Homebuilder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+256 77..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Site Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lubowa Hillside Executive Bungalows"
                  value={newCustProject}
                  onChange={(e) => setNewCustProject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Delivery Location</label>
                <input
                  type="text"
                  placeholder="e.g. Lubowa, Entebbe Road, Plot 44"
                  value={newCustLocation}
                  onChange={(e) => setNewCustLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (USh)</label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={newCustLimit}
                    onChange={(e) => setNewCustLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URA TIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1009941829"
                    value={newCustTin}
                    onChange={(e) => setNewCustTin(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Create Client Account
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
        documentType="CLIENT_STATEMENT"
        data={{
          customer: currentCustomer,
          statement,
        }}
      />
    </div>
  );
};
