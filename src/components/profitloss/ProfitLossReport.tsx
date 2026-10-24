import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { HardwareGroup } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Receipt,
  Truck,
  Building,
} from 'lucide-react';

export const ProfitLossReport: React.FC = () => {
  const { transactions, expenses, isAdmin, currentUser } = useHardwareStore();
  const [timeframe, setTimeframe] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  // Filter transactions and expenses based on timeframe
  const filteredData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const isMatch = (dateStr: string) => {
      if (timeframe === 'ALL') return true;
      if (timeframe === 'TODAY') return dateStr === today;
      if (timeframe === 'WEEK') {
        const itemDate = new Date(dateStr);
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (timeframe === 'MONTH') {
        return dateStr.startsWith(today.substring(0, 7));
      }
      return true;
    };

    const validTxs = transactions.filter(t => t.status !== 'VOIDED' && t.items.length > 0 && isMatch(t.date));
    const validExpenses = expenses.filter(e => isMatch(e.date));

    // Calculate revenue, COGS, and gross profit
    let totalRevenue = 0;
    let totalCogs = 0;

    // Group breakdown map
    const groupStats: Record<HardwareGroup, { revenue: number; cogs: number; unitsSold: number }> = {
      'Steel & Iron Bars': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Ceramics & Tiles': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Cement & Aggregates': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Roofing & Timber': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Plumbing & Piping': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Paints & Finishes': { revenue: 0, cogs: 0, unitsSold: 0 },
      'Electrical & Hardware': { revenue: 0, cogs: 0, unitsSold: 0 },
    };

    validTxs.forEach(tx => {
      totalRevenue += tx.grandTotal;

      tx.items.forEach(it => {
        const lineCost = it.costPriceAtSale * it.qty;
        totalCogs += lineCost;

        if (groupStats[it.group]) {
          groupStats[it.group].revenue += it.total;
          groupStats[it.group].cogs += lineCost;
          groupStats[it.group].unitsSold += it.qty;
        }
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalOperatingExpenses = validExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      validTxs,
      validExpenses,
      totalRevenue,
      totalCogs,
      grossProfit,
      grossMarginPercent,
      totalOperatingExpenses,
      netProfit,
      netMarginPercent,
      groupStats,
    };
  }, [transactions, expenses, timeframe]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Profit & Loss Access Restricted</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Only the Main Manager (Admin) can view cost prices, profit margins, and net income calculations. Please switch to the Admin account using your security PIN to review store financials.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and timeframe selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Profit & Loss Assessment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial income statement, Cost of Goods Sold (COGS), margins, and category-level profitability.
          </p>
        </div>

        {/* Timeframe pill tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setTimeframe('TODAY')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              timeframe === 'TODAY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('WEEK')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              timeframe === 'WEEK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('MONTH')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              timeframe === 'MONTH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('ALL')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              timeframe === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Main Income Statement Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatCurrency(filteredData.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            From {filteredData.validTxs.length} completed sales
          </span>
        </div>

        {/* COGS */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Cost of Goods (COGS)
          </span>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1 tabular-nums">
            {formatCurrency(filteredData.totalCogs)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Direct supplier purchase cost
          </span>
        </div>

        {/* Gross Profit & Margin */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Gross Margin Profit
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums flex items-baseline gap-1.5">
            <span>{formatCurrency(filteredData.grossProfit)}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block font-mono">
            {filteredData.grossMarginPercent.toFixed(1)}% Gross Margin
          </span>
        </div>

        {/* Net Profit */}
        <div className={`p-4 rounded-xl border ${
          filteredData.netProfit >= 0
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-rose-900 text-white border-rose-900'
        }`}>
          <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
            Net Profit (After Expenses)
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatCurrency(filteredData.netProfit)}
          </div>
          <span className="text-[11px] text-slate-300 mt-1 block font-mono">
            {filteredData.netMarginPercent.toFixed(1)}% Net Margin after {formatCurrency(filteredData.totalOperatingExpenses)} ops
          </span>
        </div>
      </div>

      {/* Domain-Specific Category Profitability Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Profitability by Material Category (Where the Money is Made)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Heavy structural materials (Steel & Cement) drive large revenue volume, while Finishing materials (Ceramics & Paints) generate higher percentage margins.
          </p>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Construction Material Group</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Cost (COGS)</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Gross Margin %</th>
                <th className="py-3 px-4">Margin Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(filteredData.groupStats).map(([groupName, data]) => {
                const profit = data.revenue - data.cogs;
                const marginPct = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
                if (data.revenue === 0) return null; // skip groups with zero sales in timeframe

                return (
                  <tr key={groupName} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {groupName}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                      {data.unitsSold}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                      {formatCurrency(data.revenue)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(data.cogs)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                      {formatCurrency(profit)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {marginPct.toFixed(1)}%
                    </td>

                    <td className="py-3 px-4">
                      <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            marginPct >= 20 ? 'bg-emerald-600' : marginPct >= 10 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, marginPct * 3))}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {Object.values(filteredData.groupStats).every(d => d.revenue === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No material sales recorded in this selected timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operating Expenses Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Yard Operating Expenses Deduction</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Offloading wages, forklift fuel, transport, and facility utilities deducted from gross profit.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-600">
            Total Deductions: {formatCurrency(filteredData.totalOperatingExpenses)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredData.validExpenses.map(exp => (
            <div key={exp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{exp.category}</span>
                <span className="text-slate-600 block mt-0.5">{exp.description}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">Recorded by: {exp.recordedBy} · {exp.date}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-rose-600 text-sm">
                  -{formatCurrency(exp.amount)}
                </span>
                <span className="text-[10px] text-slate-400 block">{exp.paidFrom}</span>
              </div>
            </div>
          ))}

          {filteredData.validExpenses.length === 0 && (
            <div className="col-span-full py-4 text-center text-slate-400 text-xs">
              No operating expenses recorded in this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
