import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { RoleSwitchModal } from './RoleSwitchModal';
import { NewCategoryModal } from '../inventory/NewCategoryModal';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Boxes,
  Scale,
  Users,
  Shield,
  User,
  Landmark,
  Menu,
  X,
  Plus,
  Layers,
  Calendar,
} from 'lucide-react';

export type NavOption = 
  | 'dashboard' 
  | 'sale' 
  | 'stock' 
  | 'inventory' 
  | 'day_sheet' 
  | 'client_sheet' 
  | 'balances';

interface HeaderProps {
  activeTab: NavOption;
  onTabChange: (tab: NavOption) => void;
  onOpenNewItem?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenNewItem }) => {
  const { currentUser, isAdmin, isCashier, isSeller, pendingOrdersCount } = useHardwareStore();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavOption; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'sale',
      label: isSeller ? 'Sale (Counter Orders)' : 'Sale & Cashier Desk',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 && !isSeller ? `${pendingOrdersCount} Queue` : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'stock',
      label: 'Stock management',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      label: 'Inventory & Items',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      id: 'day_sheet',
      label: "Day's Balance Sheet",
      icon: <Calendar className="w-4 h-4" />,
      badge: 'Reconcile',
    },
    {
      id: 'client_sheet',
      label: 'Client Statements',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'balances',
      label: 'Balance Sheets Hub',
      icon: <Scale className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Zone 1: Brand Wordmark with Ugandan Context */}
            <div
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-3 cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-sm ring-1 ring-white/10">
                UG
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block leading-tight">
                  BuildCraft Uganda
                </span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                  Hardware & Construction ERP
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-orange-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        item.badgeColor || (isActive ? 'bg-orange-700 text-orange-100' : 'bg-slate-800 text-amber-400')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Compact Nav for Medium Screens */}
            <nav className="hidden lg:flex xl:hidden items-center gap-1 overflow-x-auto py-1">
              {navItems.slice(0, 5).map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-orange-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-emerald-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => onTabChange('balances')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
                  activeTab === 'balances' || activeTab === 'client_sheet'
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Balances</span>
              </button>
            </nav>

            {/* Zone 3: Quick Category Creation + 3-Role Account Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Add a new construction material category"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Category</span>
                </button>
              )}

              <button
                onClick={() => setIsRoleModalOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-all ${
                  isAdmin
                    ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-750'
                    : currentUser.role === 'CASHIER'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-amber-900'
                }`}
                title="Switch between Admin, Cashier, and Seller roles"
              >
                {isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : currentUser.role === 'CASHIER' ? (
                  <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>
                  {isAdmin
                    ? 'Admin'
                    : currentUser.role === 'CASHIER'
                    ? 'Cashier'
                    : 'Seller'}
                </span>
                <span className="text-[10px] opacity-75 font-normal hidden sm:inline">
                  (PIN)
                </span>
              </button>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-orange-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => {
                  setIsCategoryModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-900 rounded-lg text-left pt-2 border-t border-slate-850"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>+ Create New Material Category</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Modal for creating a new category dynamically */}
      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={() => onTabChange('inventory')}
      />

      {/* Role Switcher PIN Modal (Admin 1234, Cashier 2222, Seller 0000) */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
};
