import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { Customer, HardwareGroup, StatementEntry, Supplier } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileText,
  Printer,
  Plus,
  CreditCard,
  Building2,
  Users,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Phone,
  MapPin,
  X,
  CheckCircle,
} from 'lucide-react';

export const StatementsLedgers: React.FC = () => {
  const {
    customers,
    suppliers,
    hardwareGroups,
    getCustomerStatement,
    getSupplierStatement,
    recordCustomerPayment,
    recordSupplierPayment,
    addCustomer,
    addSupplier,
    isAdmin,
  } = useHardwareStore();

  const [activeLedgerTab, setActiveLedgerTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[1]?.id || customers[0]?.id);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCustomerPaymentOpen, setIsCustomerPaymentOpen] = useState(false);
  const [isSupplierPaymentOpen, setIsSupplierPaymentOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentMode, setPaymentMode] = useState<string>('MOBILE_MONEY');
  const [paymentRef, setPaymentRef] = useState<string>('MPESA-REF');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Add Customer form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustType, setNewCustType] = useState<Customer['type']>('CONTRACTOR');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustProject, setNewCustProject] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('');
  const [newCustLimit, setNewCustLimit] = useState<number>(500000);

  // Add Supplier form state
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPerson, setNewSuppPerson] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppEmail, setNewSuppEmail] = useState('');
  const [newSuppAddress, setNewSuppAddress] = useState('');
  const [newSuppGroups, setNewSuppGroups] = useState<HardwareGroup[]>(['Steel & Iron Bars']);

  // Current entity
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const customerStatement = useMemo(() => {
    return currentCustomer ? getCustomerStatement(currentCustomer.id) : [];
  }, [currentCustomer, getCustomerStatement]);

  const supplierStatement = useMemo(() => {
    return currentSupplier ? getSupplierStatement(currentSupplier.id) : [];
  }, [currentSupplier, getSupplierStatement]);

  // Aggregate stats
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  // Handlers
  const handleCustomerPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    recordCustomerPayment(
      currentCustomer.id,
      Number(paymentAmount),
      paymentMode,
      paymentRef,
      paymentNotes || 'Settlement against statement'
    );
    setIsCustomerPaymentOpen(false);
    setPaymentNotes('');
    setPaymentRef('');
  };

  const handleSupplierPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    recordSupplierPayment(
      currentSupplier.id,
      Number(paymentAmount),
      paymentMode,
      paymentRef,
      paymentNotes || 'Direct vendor bank transfer'
    );
    setIsSupplierPaymentOpen(false);
    setPaymentNotes('');
    setPaymentRef('');
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name: newCustName,
      type: newCustType,
      phone: newCustPhone,
      projectName: newCustProject,
      siteLocation: newCustLocation,
      creditLimit: Number(newCustLimit),
    });
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustProject('');
    setNewCustLocation('');
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      name: newSuppName,
      contactPerson: newSuppPerson,
      phone: newSuppPhone,
      email: newSuppEmail,
      address: newSuppAddress,
      materialGroups: newSuppGroups,
    });
    setIsAddSupplierOpen(false);
    setNewSuppName('');
    setNewSuppPerson('');
    setNewSuppPhone('');
    setNewSuppAddress('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Balances */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Statements & Account Balances
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance ledgers for construction clients & material suppliers with running debts and credit statements.
          </p>
        </div>

        {/* Global Debt Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs">
            <span className="text-rose-600 block text-[10px] font-semibold uppercase">Total Customer Debts (Receivable)</span>
            <span className="font-mono font-bold text-rose-800 text-sm tabular-nums">
              {formatCurrency(totalReceivables)}
            </span>
          </div>

          <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <span className="text-amber-700 block text-[10px] font-semibold uppercase">Total Supplier Payables (Owed)</span>
            <span className="font-mono font-bold text-amber-900 text-sm tabular-nums">
              {formatCurrency(totalPayables)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Mode Segment Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setActiveLedgerTab('CUSTOMERS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            activeLedgerTab === 'CUSTOMERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer & Contractor Ledgers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveLedgerTab('SUPPLIERS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            activeLedgerTab === 'SUPPLIERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Supplier Ledgers ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER STATEMENTS */}
      {activeLedgerTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Contractor / Client Directory */}
          <div className="lg:col-span-4 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Client Account
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="text-xs text-slate-900 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Client</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {customers
                .filter(c => c.type !== 'RETAIL_WALK_IN')
                .map(customer => {
                  const isSelected = customer.id === selectedCustomerId;
                  const hasDebt = customer.outstandingBalance > 0;

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold leading-snug">
                            {customer.name}
                          </h4>
                          {customer.projectName && (
                            <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {customer.projectName}
                            </p>
                          )}
                          <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                            <Phone className="w-2.5 h-2.5" />
                            <span>{customer.phone}</span>
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
                            {formatCurrency(customer.outstandingBalance)}
                          </span>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                            Limit: {formatCurrency(customer.creditLimit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right 8 Cols: Detailed Customer Statement Sheet */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Official Statement of Account
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {currentCustomer.name}
                </h3>
                {currentCustomer.projectName && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Project Site: {currentCustomer.projectName} ({currentCustomer.siteLocation})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Record Payment / Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Printable Statement Header */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">CURRENT OUTSTANDING</span>
                  <div className="text-base font-bold font-mono text-rose-700 mt-0.5 tabular-nums">
                    {formatCurrency(currentCustomer.outstandingBalance)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">APPROVED CREDIT LIMIT</span>
                  <div className="text-base font-bold font-mono text-slate-800 mt-0.5 tabular-nums">
                    {formatCurrency(currentCustomer.creditLimit)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">AVAILABLE CREDIT</span>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5 tabular-nums">
                    {formatCurrency(Math.max(0, currentCustomer.creditLimit - currentCustomer.outstandingBalance))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">ACCOUNT STATUS</span>
                  <div className="text-xs font-bold text-slate-900 mt-1 uppercase">
                    {currentCustomer.outstandingBalance > currentCustomer.creditLimit ? 'Limit Exceeded' : 'Good Standing'}
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Chronological Statement Entries
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Details / Materials</th>
                      <th className="py-2.5 px-3 text-right">Debit (Owed +)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Paid -)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerStatement.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {entry.referenceNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                          {entry.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}

                    {customerStatement.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No transactions recorded for this customer account yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER STATEMENTS */}
      {activeLedgerTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Supplier Directory */}
          <div className="lg:col-span-4 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Material Suppliers
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="text-xs text-slate-900 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Supplier</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {suppliers.map(supplier => {
                const isSelected = supplier.id === selectedSupplierId;
                const hasBalance = supplier.outstandingBalance > 0;

                return (
                  <div
                    key={supplier.id}
                    onClick={() => setSelectedSupplierId(supplier.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold leading-snug">
                          {supplier.name}
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {supplier.materialGroups.join(', ')}
                        </p>
                        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          <Phone className="w-2.5 h-2.5" />
                          <span>{supplier.phone} · {supplier.contactPerson}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                            hasBalance
                              ? isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-amber-50 text-amber-900'
                              : isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {formatCurrency(supplier.outstandingBalance)}
                        </span>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          Payable balance
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 8 Cols: Detailed Supplier Ledger Sheet */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Supplier Payable Statement
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {currentSupplier.name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Supplying: {currentSupplier.materialGroups.join(', ')} · Contact: {currentSupplier.contactPerson} ({currentSupplier.phone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Record Supplier Payment</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            {/* Supplier Meta & Outstanding Payable Box */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">TOTAL PAYABLE TO SUPPLIER</span>
                  <div className="text-lg font-bold font-mono text-amber-800 mt-0.5 tabular-nums">
                    {formatCurrency(currentSupplier.outstandingBalance)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">FACTORY / DEPOT ADDRESS</span>
                  <div className="text-xs font-medium text-slate-800 mt-1">
                    {currentSupplier.address}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px]">URA TIN NUMBER</span>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                    {currentSupplier.tinNumber || '1000088912'}
                  </div>
                </div>
              </div>
            </div>

            {/* Inwards & Payment Ledger Table */}
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Goods Received Notes & Supplier Settlements
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Doc Ref</th>
                      <th className="py-2.5 px-3">Material Inward / Payment Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (We Owed)</th>
                      <th className="py-2.5 px-3 text-right">Credit (We Paid)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierStatement.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {entry.referenceNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                          {entry.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}

                    {supplierStatement.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No stock inward bills recorded for this supplier yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Customer Payment */}
      {isCustomerPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Customer Debt Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentCustomer.name}</p>
              </div>
              <button onClick={() => setIsCustomerPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomerPaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding Debt:</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(currentCustomer.outstandingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (KES)
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentCustomer.outstandingBalance || 10000000}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="MOBILE_MONEY">MPesa / Mobile Money</option>
                    <option value="BANK_TRANSFER">Bank RTGS / Cheque</option>
                    <option value="CASH">Counter Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. QKH891209 / KCB-991"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Partial clearance for slab materials"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerPaymentOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Supplier Payment */}
      {isSupplierPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Payment to Supplier</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentSupplier.name}</p>
              </div>
              <button onClick={() => setIsSupplierPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierPaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding Payable:</span>
                  <span className="font-mono font-bold text-amber-800">{formatCurrency(currentSupplier.outstandingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Disbursed (KES)
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentSupplier.outstandingBalance || 10000000}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="BANK_TRANSFER">Bank RTGS / Wire</option>
                    <option value="CASH">Cash Drawer (Deducts from Till)</option>
                    <option value="MOBILE_MONEY">Supplier Paybill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Ref / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. RTGS-88129"
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
                  placeholder="e.g. Payment towards invoice DEV-INV-9941"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierPaymentOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Post Supplier Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Contractor / Client Account</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor / Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Foundations Ltd / Eng. Otieno"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Category</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name (e.g. 5-Storey Plaza)</label>
                <input
                  type="text"
                  placeholder="e.g. Highland Residences (16 Units)"
                  value={newCustProject}
                  onChange={(e) => setNewCustProject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Delivery Location</label>
                <input
                  type="text"
                  placeholder="e.g. Kitengela Plains, Plot 214"
                  value={newCustLocation}
                  onChange={(e) => setNewCustLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
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

      {/* MODAL: Add New Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Hardware Supplier</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Manufacturer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Triangle Cement PLC"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sales Rep Name"
                    value={newSuppPerson}
                    onChange={(e) => setNewSuppPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={newSuppPhone}
                    onChange={(e) => setNewSuppPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Factory / Depot Address</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Road Depot 4"
                  value={newSuppAddress}
                  onChange={(e) => setNewSuppAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
