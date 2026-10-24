import React from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { NavOption } from '../common/Header';
import {
  ShoppingCart,
  Boxes,
  Truck,
  Scale,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Clock,
  Printer,
  ChevronRight,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardHomeProps {
  onNavigate: (tab: NavOption) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const {
    inventory,
    transactions,
    customers,
    suppliers,
    getDayBalancingRecord,
    expenses,
    isAdmin,
    currentUser,
  } = useHardwareStore();

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = getDayBalancingRecord(today);
  const todayTxs = transactions.filter(t => t.date === today && t.status !== 'VOIDED');
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStockLevel);

  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  // Today revenue
  const todayRevenue = todayTxs.reduce((sum, t) => sum + t.grandTotal, 0);
  const todayProfit = todayTxs.reduce((sum, t) => sum + t.grossProfit, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              Uganda Market Edition (USh)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Hardware Store Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kampala construction materials command center: Counter sales, stock inwards, day's balance sheet, and contractor ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('sale')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open Sales Counter</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today Sales */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {formatCurrency(todayRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{todayTxs.length} counter sales</span>
            {isAdmin && (
              <span className="text-emerald-700 font-mono font-medium">+{formatCurrency(todayProfit)} GP</span>
            )}
          </div>
        </div>

        {/* Metric 2: Till Cash Expected */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drawer Cash Float</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {formatCurrency(todayRecord.expectedCashInDrawer)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Till: {todayRecord.status}</span>
            <button
              onClick={() => onNavigate('day_sheet')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Balance Day →
            </button>
          </div>
        </div>

        {/* Metric 3: Contractor Debt Balance */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Credit Debts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-2 tabular-nums">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Across contractors</span>
            <button
              onClick={() => onNavigate('client_sheet')}
              className="text-rose-600 hover:underline font-semibold"
            >
              Client Statements →
            </button>
          </div>
        </div>

        {/* Metric 4: Stock Reorder Alerts */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-2 tabular-nums">
            {lowStockItems.length} <span className="text-xs text-slate-500 font-sans">items low</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Need restock order</span>
            <button
              onClick={() => onNavigate('stock')}
              className="text-amber-700 hover:underline font-semibold"
            >
              Receive Stock →
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Modules - Direct access to what user requested */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Main Workspaces & Fast Navigation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. SALE */}
          <div
            onClick={() => onNavigate('sale')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Sale (Counter POS)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Counter sales for walk-ins & contractors. Fast lookup by Roofings, Tororo, Hima, Goodwill, or Baati. MTN MoMo, Airtel, Cash, and invoice printing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Open Sales Counter</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. STOCK MANAGEMENT */}
          <div
            onClick={() => onNavigate('stock')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Stock Management
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Receive incoming manufacturer consignments (GRN), balance physical yard counts against computer numbers, and audit material delivery history.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Receive Consignments</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. INVENTORY MANAGEMENT */}
          <div
            onClick={() => onNavigate('inventory')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Inventory & Categories
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Material catalog grouped by Steel, Ceramics, Cement, Roofing. Adjust Cost & Selling prices in USh, and add brand-new items and categories.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Catalog & Price Control</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. DAY'S BALANCE SHEET (Specific User Request) */}
          <div
            onClick={() => onNavigate('day_sheet')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                4. Day's Balance Sheet
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Directly access any day's financial sheet: <span className="font-semibold text-slate-800">Edit or void the sales of the day</span>, balance the sales of the day, record offloader wages, and certify drawer variance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Edit & Balance Day Sales</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. CLIENT INDIVIDUAL STATEMENTS (Specific User Request) */}
          <div
            onClick={() => onNavigate('client_sheet')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                5. Client Balance Sheets
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Directly access any contractor's individual balance sheet (e.g. Eng. David Mukasa, Kampala Prime Builders), running statement ledgers, and MoMo debt repayments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Individual Client Statements</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. BALANCE SHEETS HUB */}
          <div
            onClick={() => onNavigate('balances')}
            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                6. Supplier Ledgers & P&L
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Accounts payable for Roofings, Tororo, STIL, and Uganda Baati, plus gross margins and net profit & loss evaluation by material group.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Supplier Accounts & P&L</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Sales Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left 7 Cols: Recent Counter Transactions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Sales Entries</h3>
              <p className="text-xs text-slate-500">Live feed of transactions generated at the desk</p>
            </div>
            <button
              onClick={() => onNavigate('day_sheet')}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Open Day's Balance Sheet →
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
            {todayTxs.map(tx => (
              <div key={tx.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{tx.invoiceNo}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">{tx.customerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {tx.items.length} materials ({tx.paymentMethod.replace('_', ' ')}) · Served by {tx.sellerName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{formatCurrency(tx.grandTotal)}</div>
                  {tx.balanceDue > 0 && (
                    <div className="text-[10px] text-amber-700 font-semibold">Credit: {formatCurrency(tx.balanceDue)}</div>
                  )}
                </div>
              </div>
            ))}

            {todayTxs.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No transactions recorded today yet. Click "Sale" to ring up an order.
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Low Stock Materials Warning */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reorder Priority</h3>
              <p className="text-xs text-slate-500">Materials below designated reorder threshold</p>
            </div>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Receive Stock →
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
            {lowStockItems.map(item => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 line-clamp-1">{item.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Manufacturer: {item.supplierName}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    {item.currentStock} {item.unit}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Min: {item.minStockLevel}</div>
                </div>
              </div>
            ))}

            {lowStockItems.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                All inventory levels are currently above minimum thresholds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
