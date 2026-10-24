import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { UserRole } from '../../types';
import { Shield, ShieldAlert, KeyRound, X, Check, Landmark, ShoppingBag } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchRole } = useHardwareStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setPin('');
  };

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'ADMIN' && currentUser.role !== 'ADMIN') {
      const success = switchRole('ADMIN', pin);
      if (!success) {
        setError('Incorrect Admin PIN. Demo PIN is 1234.');
        return;
      }
    } else if (selectedRole === 'CASHIER' && currentUser.role !== 'CASHIER') {
      const success = switchRole('CASHIER', pin || '2222');
      if (!success) {
        setError('Incorrect Cashier PIN. Demo PIN is 2222.');
        return;
      }
    } else {
      switchRole(selectedRole);
    }

    onClose();
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Switch Operating Account</h3>
              <p className="text-xs text-slate-500">Hardware store role-based separation of duties</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSwitch} className="p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Role
            </label>

            {/* 1. Admin / Owner Option */}
            <div
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedRole === 'ADMIN'
                  ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    AD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Main Admin / General Manager</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-bold">
                        PIN: 1234
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full access: Daily balance sheet reconciliation, transaction edit & void, price adjustments, stock inwards & P&L.
                    </p>
                  </div>
                </div>
                {selectedRole === 'ADMIN' && <Check className="w-4 h-4 text-slate-900 mt-1 shrink-0" />}
              </div>
            </div>

            {/* 2. Cashier Desk Option */}
            <div
              onClick={() => handleRoleSelect('CASHIER')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedRole === 'CASHIER'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Cashier Desk (Till & Payment Queue)</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        PIN: 2222
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confirms unconfirmed sales orders from sellers, selects payment mode (Cash, MoMo, Bank, Credit), deducts stock, and prints official tax receipts.
                    </p>
                  </div>
                </div>
                {selectedRole === 'CASHIER' && <Check className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />}
              </div>
            </div>

            {/* 3. Counter Sales Clerk Option */}
            <div
              onClick={() => handleRoleSelect('SELLER')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedRole === 'SELLER'
                  ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Counter Sales Clerk (Seller)</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                        PIN: 0000
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Takes customer material requests, builds Sales Orders, sends orders to Cashier Desk. Restricted from collecting cash or seeing cost prices.
                    </p>
                  </div>
                </div>
                {selectedRole === 'SELLER' && <Check className="w-4 h-4 text-amber-600 mt-1 shrink-0" />}
              </div>
            </div>
          </div>

          {/* PIN Input if entering Admin or Cashier */}
          {(selectedRole === 'ADMIN' || selectedRole === 'CASHIER') && currentUser.role !== selectedRole && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter {selectedRole === 'ADMIN' ? 'Admin' : 'Cashier'} Security PIN
                </label>
                <button
                  type="button"
                  onClick={() => setPin(selectedRole === 'ADMIN' ? '1234' : '2222')}
                  className="text-[11px] text-amber-600 hover:underline font-medium"
                >
                  Prefill Demo PIN ({selectedRole === 'ADMIN' ? '1234' : '2222'})
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={`Enter ${selectedRole === 'ADMIN' ? '1234' : '2222'}...`}
                  autoFocus
                  className="w-full px-3 py-2 pl-9 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono tracking-widest text-slate-900"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Switch Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
