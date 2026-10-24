import React, { useState } from 'react';
import { HardwareStoreProvider, useHardwareStore } from './context/HardwareStoreContext';
import { Header, NavOption } from './components/common/Header';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { PosCheckout } from './components/pos/PosCheckout';
import { StockManagement } from './components/stock/StockManagement';
import { InventoryManager } from './components/inventory/InventoryManager';
import { DayBalanceSheet } from './components/balances/DayBalanceSheet';
import { ClientBalanceSheet } from './components/balances/ClientBalanceSheet';
import { BalanceSheetsHub } from './components/balances/BalanceSheetsHub';
import { RotateCcw, ShieldCheck, Landmark, ShoppingBag, MapPin, AlertCircle } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavOption>('dashboard');
  const {
    currentUser,
    isAdmin,
    isCashier,
    isSeller,
    switchRole,
    resetToSampleData,
    pendingOrdersCount,
  } = useHardwareStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Sub-header Context Bar with Ugandan Market & 3-Role Separation Indicator */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-white">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Main Manager / Admin (Full Store Access)</span>
                </>
              ) : currentUser.role === 'CASHIER' ? (
                <>
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Cashier Desk (Till & Payment Queue)</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Counter Sales Clerk (Seller Order Entry)</span>
                </>
              )}
            </span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Kampala Hardware Hub (USh · MTN MoMo · Airtel · Stanbic Bank)</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {pendingOrdersCount > 0 && !isSeller && (
              <span
                onClick={() => setActiveTab('sale')}
                className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors animate-pulse"
              >
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>{pendingOrdersCount} Unconfirmed Order{pendingOrdersCount > 1 ? 's' : ''} at Cashier</span>
              </span>
            )}

            <span className="text-slate-500 hidden md:inline">Quick Switch:</span>

            {currentUser.role !== 'ADMIN' && (
              <button
                onClick={() => switchRole('ADMIN', '1234')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-colors"
                title="Switch to General Manager (PIN: 1234)"
              >
                Admin (1234)
              </button>
            )}

            {currentUser.role !== 'CASHIER' && (
              <button
                onClick={() => switchRole('CASHIER', '2222')}
                className="text-emerald-300 hover:text-white font-semibold underline transition-colors"
                title="Switch to Cashier Till (PIN: 2222)"
              >
                Cashier (2222)
              </button>
            )}

            {currentUser.role !== 'SELLER' && (
              <button
                onClick={() => switchRole('SELLER')}
                className="text-amber-400 hover:text-amber-300 font-semibold underline transition-colors"
                title="Switch to Counter Seller (PIN: 0000)"
              >
                Seller (0000)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Viewport */}
      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardHome onNavigate={setActiveTab} />}
        {activeTab === 'sale' && <PosCheckout />}
        {activeTab === 'stock' && <StockManagement />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'day_sheet' && <DayBalanceSheet />}
        {activeTab === 'client_sheet' && <ClientBalanceSheet />}
        {activeTab === 'balances' && <BalanceSheetsHub />}
      </main>

      {/* Professional Hardware ERP Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900">BuildCraft Uganda Hardware ERP</span>
            <span className="mx-2">·</span>
            <span>Kampala Hardware Hub · Roofings Steel, Tororo & Hima Cement, Uganda Baati, Goodwill Tiles, Kansai Plascon</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.confirm('Reset sample hardware data back to original Ugandan defaults?')) {
                  resetToSampleData();
                }
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Ugandan Sample Data</span>
            </button>
            <span>·</span>
            <span className="font-mono text-[11px]">Roles: Admin (1234) · Cashier (2222) · Seller (0000)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HardwareStoreProvider>
      <MainApp />
    </HardwareStoreProvider>
  );
}
