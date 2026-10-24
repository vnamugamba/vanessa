import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { Customer, InventoryItem, PaymentMethod, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { CashierQueue } from './CashierQueue';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Printer,
  MapPin,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Send,
  Sparkles,
  Layers,
  Clock,
  Landmark,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export const PosCheckout: React.FC = () => {
  const {
    inventory,
    hardwareGroups,
    customers,
    createSalesOrder,
    processSale,
    isAdmin,
    isCashier,
    isSeller,
    currentUser,
    pendingOrdersCount,
  } = useHardwareStore();

  // Tab switch between "New Sale / Order" and "Cashier Queue"
  const [activeSubTab, setActiveSubTab] = useState<'NEW_SALE' | 'CASHIER_QUEUE'>(
    isSeller ? 'NEW_SALE' : (pendingOrdersCount > 0 ? 'CASHIER_QUEUE' : 'NEW_SALE')
  );

  // Stepped selling workflow (No scrolling!)
  // Step 1: Client Selection
  // Step 2: Material Picking
  // Step 3: Review & Submit (Seller -> Cashier, or Cashier -> Instant confirm)
  const [sellingStep, setSellingStep] = useState<1 | 2 | 3>(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Order Items
  const [cart, setCart] = useState<{
    item: InventoryItem;
    qty: number;
    unitPrice: number;
    discount: number;
    total: number;
  }[]>([]);

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_walkin');
  const [siteReference, setSiteReference] = useState('');
  const [notes, setNotes] = useState('');

  // Cashier Instant Mode fields (only relevant when Cashier/Admin bypasses queue)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');

  // Order completion state
  const [completedOrder, setCompletedOrder] = useState<Transaction | null>(null);
  const [isSubmittedToCashier, setIsSubmittedToCashier] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Print Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Selected customer details
  const selectedCustomer = useMemo<Customer | undefined>(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust && cust.projectName) {
      setSiteReference(cust.projectName);
    } else {
      setSiteReference('');
    }
  };

  // Filtered materials
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesGroup = selectedGroup === 'ALL' || item.group === selectedGroup;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.subType.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [inventory, selectedGroup, searchQuery]);

  // Cart operations
  const addToCart = (item: InventoryItem, quantity: number = 1) => {
    setValidationError('');
    if (item.currentStock <= 0) {
      setValidationError(`${item.name} is currently out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        const nextQty = existing.qty + quantity;
        if (nextQty > item.currentStock) {
          setValidationError(`Stock limit: Only ${item.currentStock} ${item.unit} available.`);
          return prev;
        }
        return prev.map(ci =>
          ci.item.id === item.id
            ? { ...ci, qty: nextQty, total: (nextQty * ci.unitPrice) - ci.discount }
            : ci
        );
      }

      if (quantity > item.currentStock) {
        setValidationError(`Stock limit: Only ${item.currentStock} ${item.unit} available.`);
        return prev;
      }

      return [
        ...prev,
        {
          item,
          qty: quantity,
          unitPrice: item.sellingPrice,
          discount: 0,
          total: quantity * item.sellingPrice,
        },
      ];
    });
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    setValidationError('');
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev =>
      prev.map(ci => {
        if (ci.item.id === itemId) {
          if (newQty > ci.item.currentStock) {
            setValidationError(`Only ${ci.item.currentStock} ${ci.item.unit} available for ${ci.item.name}`);
            return ci;
          }
          return {
            ...ci,
            qty: newQty,
            total: (newQty * ci.unitPrice) - ci.discount,
          };
        }
        return ci;
      })
    );
  };

  const updateCartPrice = (itemId: string, newPrice: number) => {
    if (!isAdmin) return; // Only admin can override price
    setCart(prev =>
      prev.map(ci => {
        if (ci.item.id === itemId) {
          return {
            ...ci,
            unitPrice: newPrice,
            total: (ci.qty * newPrice) - ci.discount,
          };
        }
        return ci;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaidInput('');
    setNotes('');
    setValidationError('');
    setCompletedOrder(null);
    setIsSubmittedToCashier(false);
    setSellingStep(1);
  };

  // Calculations
  const subtotal = cart.reduce((sum, ci) => sum + ci.qty * ci.unitPrice, 0);
  const discountTotal = cart.reduce((sum, ci) => sum + ci.discount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);

  // Submit flow
  const handleSellerSubmitOrder = () => {
    setValidationError('');
    if (cart.length === 0) {
      setValidationError('Please select at least one material.');
      return;
    }
    if (!selectedCustomer) {
      setValidationError('Please choose a customer or Walk-in cash client.');
      return;
    }

    const order = createSalesOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerType: selectedCustomer.type,
      items: cart,
      subtotal,
      discountTotal,
      grandTotal,
      notes: notes.trim() || undefined,
      siteReference: siteReference.trim() || undefined,
    });

    setCompletedOrder(order);
    setIsSubmittedToCashier(true);
  };

  const handleCashierInstantCheckout = () => {
    setValidationError('');
    if (cart.length === 0) {
      setValidationError('Please select at least one material.');
      return;
    }
    if (!selectedCustomer) {
      setValidationError('Please choose a customer.');
      return;
    }

    const paid = amountPaidInput === '' ? grandTotal : Number(amountPaidInput);
    const balanceRemaining = Math.max(0, grandTotal - paid);

    if (balanceRemaining > 0 || paymentMethod === 'CREDIT_ACCOUNT') {
      if (selectedCustomer.type === 'RETAIL_WALK_IN') {
        setValidationError('Walk-in retail customers cannot buy on credit. Please collect payment in full.');
        return;
      }
      const projected = selectedCustomer.outstandingBalance + balanceRemaining;
      if (projected > selectedCustomer.creditLimit) {
        setValidationError(`Customer credit limit of ${formatCurrency(selectedCustomer.creditLimit)} exceeded.`);
        return;
      }
    }

    const tx = processSale({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerType: selectedCustomer.type,
      items: cart,
      subtotal,
      discountTotal,
      grandTotal,
      paymentMethod,
      amountPaid: paid,
      notes: notes.trim() || undefined,
      siteReference: siteReference.trim() || undefined,
    });

    setCompletedOrder(tx);
    // Show print preview immediately
    setIsPreviewOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Workflow Mode Switcher for Cashier/Admin */}
      {!isSeller && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('NEW_SALE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'NEW_SALE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New Sale / Order Booking</span>
            </button>

            <button
              onClick={() => setActiveSubTab('CASHIER_QUEUE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'CASHIER_QUEUE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Cashier Till Queue</span>
              {pendingOrdersCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activeSubTab === 'CASHIER_QUEUE' ? 'bg-emerald-800 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 pr-2">
            <span className="font-semibold text-slate-800">{currentUser.name}</span>
            <span>({currentUser.role})</span>
          </div>
        </div>
      )}

      {/* RENDER CASHIER QUEUE TAB */}
      {!isSeller && activeSubTab === 'CASHIER_QUEUE' ? (
        <CashierQueue />
      ) : (
        /* RENDER STEP-BY-STEP SELLING WORKFLOW (NO SCROLLING) */
        <div className="space-y-4">
          {/* Progress Header / Step Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                POS
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isSeller ? 'Counter Sales Order Entry' : 'Material Sales & Order Booking'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isSeller
                    ? 'Step 1-3: Select client, pick materials, and transmit order to Cashier Desk.'
                    : 'Step 1-3: Book counter order or checkout directly with payment confirmation.'}
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            {!isSubmittedToCashier && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSellingStep(1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sellingStep === 1
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">1</span>
                  <span>Client / Site</span>
                </button>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <button
                  type="button"
                  onClick={() => setSellingStep(2)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sellingStep === 2
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">2</span>
                  <span>Materials ({cart.length})</span>
                </button>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <button
                  type="button"
                  onClick={() => {
                    if (cart.length > 0) setSellingStep(3);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sellingStep === 3
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">3</span>
                  <span>Review & Dispatch</span>
                </button>
              </div>
            )}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: CLIENT SELECTION */}
          {sellingStep === 1 && !isSubmittedToCashier && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 1: Select Customer or Construction Site</h3>
                  <p className="text-xs text-slate-500">Pick who the materials are being invoiced to</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSellingStep(2)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <span>Continue to Materials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Walk-in Cash Option */}
                <div
                  onClick={() => handleCustomerChange('cust_walkin')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedCustomerId === 'cust_walkin'
                      ? 'border-orange-600 bg-orange-50/50 ring-2 ring-orange-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                        Default Walk-In
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        Walk-in Retail Cash Client
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Over-the-counter walk-in buyer paying immediate Cash or MoMo.
                      </p>
                    </div>
                    {selectedCustomerId === 'cust_walkin' && (
                      <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Registered Contractors & Site Clients */}
                {customers
                  .filter(c => c.id !== 'cust_walkin')
                  .map(c => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleCustomerChange(c.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50/50 ring-2 ring-orange-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {c.type.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{c.name}</h4>
                            {c.projectName && (
                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{c.projectName}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[11px]">
                              <span className="text-slate-500">
                                Debt: <strong className="text-slate-800 font-mono">{formatCurrency(c.outstandingBalance)}</strong>
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-emerald-700 font-medium">
                                Limit: {formatCurrency(c.creditLimit)}
                              </span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Delivery Site Destination Specification */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Construction Site / Delivery Destination
                  </label>
                  <input
                    type="text"
                    value={siteReference}
                    onChange={(e) => setSiteReference(e.target.value)}
                    placeholder="e.g. Kololo Apartment Slab Casting / Kyanja Estate Plot 4..."
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Order Memo / Contractor Reference
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Deliver before 2pm on Isuzu truck..."
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSellingStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-98"
                >
                  <span>Confirm Customer & Select Materials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MATERIAL PICKING (FAST NON-SCROLLING CATALOG) */}
          {sellingStep === 2 && !isSubmittedToCashier && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-150">
              {/* Left 8 Cols: Materials Catalog */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                {/* Search & Category Pills */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search iron bars, Tororo cement, Goodwill tiles, Baati..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Group Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedGroup('ALL')}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
                        selectedGroup === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Groups
                    </button>
                    {hardwareGroups.map(group => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setSelectedGroup(group)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors ${
                          selectedGroup === group
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials High-Density Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredItems.map(item => {
                    const inCartItem = cart.find(ci => ci.item.id === item.id);
                    const isOutOfStock = item.currentStock <= 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          inCartItem
                            ? 'border-orange-600 bg-orange-50/40 ring-1 ring-orange-600/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.currentStock < item.minStockLevel
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {item.supplierName}
                          </span>
                        </div>

                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black font-mono text-slate-900 block">
                              {formatCurrency(item.sellingPrice)}
                            </span>
                            <span className="text-[10px] text-slate-400">per {item.unit}</span>
                          </div>

                          {inCartItem ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.id, inCartItem.qty - 1)}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs px-1 text-slate-900">
                                {inCartItem.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item, 1)}
                                className="w-6 h-6 rounded bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => addToCart(item, 1)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                                isOutOfStock
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-900 hover:bg-orange-600 text-white shadow-xs'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 4 Cols: Live Order Tray */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                      <h3 className="text-sm font-bold text-slate-900">Order Tray</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Customer reminder */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Customer</span>
                      <strong className="text-slate-900 truncate block max-w-[180px]">
                        {selectedCustomer?.name}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSellingStep(1)}
                      className="text-[11px] text-orange-600 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>

                  {/* Selected items list */}
                  <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>No materials added yet. Click &ldquo;Add&rdquo; on items to build the order.</span>
                      </div>
                    ) : (
                      cart.map(ci => (
                        <div
                          key={ci.item.id}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 line-clamp-1">{ci.item.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(ci.item.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateCartQty(ci.item.id, ci.qty - 1)}
                                className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-slate-900">{ci.qty}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(ci.item, 1)}
                                className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                              <span className="text-[11px] text-slate-400">{ci.item.unit}</span>
                            </div>

                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(ci.total)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tray Totals & Next Action */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Order Total:</span>
                    <span className="text-base font-mono font-black text-orange-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSellingStep(1)}
                      className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
                    >
                      Back: Client
                    </button>
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={() => setSellingStep(3)}
                      className={`px-3 py-2 text-xs font-bold text-white rounded-lg text-center flex items-center justify-center gap-1 transition-all ${
                        cart.length === 0
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-500 shadow-xs'
                      }`}
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & TRANSMIT / CONFIRM */}
          {sellingStep === 3 && !isSubmittedToCashier && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 3: Review Order Summary & Dispatch
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSeller
                      ? 'Submit this sales order to the Cashier Desk for payment collection and tax receipt printing.'
                      : 'Choose to send to Cashier Queue or process instant payment directly.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSellingStep(2)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modify Materials</span>
                </button>
              </div>

              {/* Order Meta Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedCustomer?.name}</p>
                  <p className="text-slate-500">{selectedCustomer?.type.replace('_', ' ')}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Site Destination</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {siteReference || 'Kampala Central Yard Pickup'}
                  </p>
                  <p className="text-slate-500">Note: {notes || 'None'}</p>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Order Grand Total</span>
                    <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    {cart.length} lines
                  </span>
                </div>
              </div>

              {/* Materials Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Material Description</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (USh)</th>
                      <th className="py-2.5 px-3 text-right">Total (USh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((ci, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block">{ci.item.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{ci.item.code}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{ci.item.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{ci.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatCurrency(ci.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(ci.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION SECTION BASED ON LOGGED-IN ROLE */}
              {isSeller ? (
                /* SELLER VIEW: SUBMIT TO CASHIER DESK ONLY */
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Ready to Transmit to Cashier Desk
                      </h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        As a Counter Sales Clerk, submitting this order will generate an unconfirmed Sales Order Slip and send it to the Cashier Till. The customer will pay at the cashier, who confirms payment and prints the official receipt.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSellingStep(2)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Back to Materials
                    </button>
                    <button
                      type="button"
                      onClick={handleSellerSubmitOrder}
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-98"
                    >
                      <Send className="w-4 h-4" />
                      <span>Transmit Order to Cashier Desk</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CASHIER / ADMIN VIEW: CHOICE OF INSTANT CHECKOUT OR SEND TO QUEUE */
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Cashier Payment Options (Instant Checkout)
                    </h4>
                    <button
                      type="button"
                      onClick={handleSellerSubmitOrder}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                    >
                      Or save to Cashier Queue only
                    </button>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['CASH', 'MTN_MOMO', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CREDIT_ACCOUNT'] as PaymentMethod[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                          paymentMethod === mode
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="w-full sm:w-64">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Amount Paid (USh)
                      </label>
                      <input
                        type="number"
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value)}
                        placeholder={`Exact ${formatCurrency(grandTotal)}`}
                        className="w-full px-3 py-1.5 font-mono font-bold text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setSellingStep(2)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleCashierInstantCheckout}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-98"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Confirm Payment & Print Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ORDER TRANSMITTED CONFIRMATION SCREEN (FOR SELLER) */}
          {isSubmittedToCashier && completedOrder && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Sales Order Transmitted Successfully
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  Order Ref: {completedOrder.orderNo || completedOrder.invoiceNo}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                  Customer <strong>{completedOrder.customerName}</strong> has been assigned order{' '}
                  <strong className="font-mono">{completedOrder.orderNo}</strong> for{' '}
                  <strong className="font-mono text-slate-900">{formatCurrency(completedOrder.grandTotal)}</strong>.
                  Please direct customer to the Cashier Till for payment.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Preview Order Slip</span>
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Next Sale</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Universal On-Screen Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentType={completedOrder?.status === 'PENDING_CASHIER' ? 'SALES_ORDER' : 'INVOICE'}
        data={{ transaction: completedOrder || undefined }}
      />
    </div>
  );
};
