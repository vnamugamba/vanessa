import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { DayBalanceSheet } from './DayBalanceSheet';
import { ClientBalanceSheet } from './ClientBalanceSheet';
import { StatementsLedgers } from '../statements/StatementsLedgers';
import { ProfitLossReport } from '../profitloss/ProfitLossReport';
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Scale,
  FileSpreadsheet,
} from 'lucide-react';

interface BalanceSheetsHubProps {
  initialSubTab?: 'DAY_SHEET' | 'CLIENT_SHEET' | 'SUPPLIER_SHEET' | 'PROFIT_LOSS';
}

export const BalanceSheetsHub: React.FC<BalanceSheetsHubProps> = ({
  initialSubTab = 'DAY_SHEET',
}) => {
  const { isAdmin } = useHardwareStore();
  const [activeSubTab, setActiveSubTab] = useState<'DAY_SHEET' | 'CLIENT_SHEET' | 'SUPPLIER_SHEET' | 'PROFIT_LOSS'>(initialSubTab);

  return (
    <div className="space-y-4">
      {/* High-visibility Sub-Navigation for Balance Sheets */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 no-print shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Balance Sheets & Financial Ledgers
              </h2>
              <p className="text-[11px] text-slate-500">
                Daily sales balancing, individual client statements, supplier accounts, and profit & loss
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            {/* Tab 1: Day's Balance Sheet */}
            <button
              onClick={() => setActiveSubTab('DAY_SHEET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md whitespace-nowrap transition-colors ${
                activeSubTab === 'DAY_SHEET'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day's Balance Sheet</span>
            </button>

            {/* Tab 2: Client's Individual Balance Sheet */}
            <button
              onClick={() => setActiveSubTab('CLIENT_SHEET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md whitespace-nowrap transition-colors ${
                activeSubTab === 'CLIENT_SHEET'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client Balance Sheets</span>
            </button>

            {/* Tab 3: Supplier Statements */}
            <button
              onClick={() => setActiveSubTab('SUPPLIER_SHEET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md whitespace-nowrap transition-colors ${
                activeSubTab === 'SUPPLIER_SHEET'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Supplier Statements</span>
            </button>

            {/* Tab 4: Profit & Loss */}
            {isAdmin && (
              <button
                onClick={() => setActiveSubTab('PROFIT_LOSS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md whitespace-nowrap transition-colors ${
                  activeSubTab === 'PROFIT_LOSS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Profit & Loss</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render the selected balance sheet */}
      <div>
        {activeSubTab === 'DAY_SHEET' && <DayBalanceSheet />}
        {activeSubTab === 'CLIENT_SHEET' && <ClientBalanceSheet />}
        {activeSubTab === 'SUPPLIER_SHEET' && <StatementsLedgers />}
        {activeSubTab === 'PROFIT_LOSS' && <ProfitLossReport />}
      </div>
    </div>
  );
};
