import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { InventoryItem } from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { NewCategoryModal } from './NewCategoryModal';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Lock,
  Layers,
  Truck,
  Check,
  X,
  AlertTriangle,
  History,
  Boxes,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const {
    inventory,
    hardwareGroups,
    suppliers,
    isAdmin,
    addItem,
    updateItemPrices,
    updateStockLevel,
    receiveStockInward,
  } = useHardwareStore();

  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);

  // Price adjustment state
  const [priceEditItem, setPriceEditItem] = useState<InventoryItem | null>(null);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState<string>('');

  // Stock take state
  const [stockTakeItem, setStockTakeItem] = useState<InventoryItem | null>(null);
  const [countedStock, setCountedStock] = useState<number>(0);
  const [stockTakeReason, setStockTakeReason] = useState<string>('');

  // Form state for New Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemGroup, setNewItemGroup] = useState<string>(hardwareGroups[0] || 'Steel & Iron Bars');
  const [newItemSubType, setNewItemSubType] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemSupplierId, setNewItemSupplierId] = useState('');
  const [newItemCost, setNewItemCost] = useState<number>(50000);
  const [newItemSelling, setNewItemSelling] = useState<number>(60000);
  const [newItemStock, setNewItemStock] = useState<number>(100);
  const [newItemMinLevel, setNewItemMinLevel] = useState<number>(20);
  const [newItemRack, setNewItemRack] = useState('Yard Bay 1');

  // Filtering
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchGroup = selectedGroup === 'ALL' || item.group === selectedGroup;
      const matchSupplier = selectedSupplier === 'ALL' || item.supplierId === selectedSupplier;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.subType.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'LOW') matchStock = item.currentStock <= item.minStockLevel && item.currentStock > 0;
      if (stockFilter === 'OUT') matchStock = item.currentStock <= 0;

      return matchGroup && matchSupplier && matchQuery && matchStock;
    });
  }, [inventory, selectedGroup, selectedSupplier, searchQuery, stockFilter]);

  // Overall Inventory Stats (Admin)
  const stats = useMemo(() => {
    let totalItems = inventory.length;
    let totalStockPieces = inventory.reduce((acc, i) => acc + i.currentStock, 0);
    let totalAssetCostValuation = inventory.reduce((acc, i) => acc + (i.costPrice * i.currentStock), 0);
    let totalSellingValuation = inventory.reduce((acc, i) => acc + (i.sellingPrice * i.currentStock), 0);
    let lowStockCount = inventory.filter(i => i.currentStock <= i.minStockLevel).length;

    return {
      totalItems,
      totalStockPieces,
      totalAssetCostValuation,
      totalSellingValuation,
      potentialGrossMargin: totalSellingValuation - totalAssetCostValuation,
      lowStockCount,
    };
  }, [inventory]);

  // Handlers
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceEditItem) return;
    updateItemPrices(priceEditItem.id, newCostPrice, newSellingPrice, priceChangeReason || 'Manager rate adjustment');
    setPriceEditItem(null);
  };

  const handleSaveStockTake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTakeItem) return;
    updateStockLevel(stockTakeItem.id, countedStock, stockTakeReason || 'Physical inventory audit');
    setStockTakeItem(null);
  };

  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === newItemSupplierId) || suppliers[0];

    addItem({
      code: newItemCode.toUpperCase() || `ITM-${Date.now().toString().slice(-4)}`,
      name: newItemName,
      group: newItemGroup,
      subType: newItemSubType || 'Standard Specification',
      unit: newItemUnit,
      supplierId: supplier ? supplier.id : 'supp_roofings',
      supplierName: supplier ? supplier.name : 'Roofings Rolling Mills Ltd',
      costPrice: Number(newItemCost),
      sellingPrice: Number(newItemSelling),
      currentStock: Number(newItemStock),
      minStockLevel: Number(newItemMinLevel),
      locationRack: newItemRack || 'General Yard',
    });

    setIsNewItemOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setNewItemSubType('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with Clear Creation Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Inventory & Material Catalog
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage construction materials, categories, manufacturer suppliers, and price adjustments (USh).
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            {/* CORE REQUEST: Explicit buttons to enter new item and new category */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>+ New Category</span>
            </button>

            <button
              onClick={() => setIsNewItemOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Material Item</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Seller Mode: Stock lookup enabled (Price adjustments & additions locked)</span>
          </div>
        )}
      </div>

      {/* Admin Valuation Metrics Strip */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog Items</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {stats.totalItems} <span className="text-xs text-slate-400 font-sans">items</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Across {hardwareGroups.length} categories
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Yard Valuation (Cost)</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {formatCurrency(stats.totalAssetCostValuation)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Capital tied in stock (USh)</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retail Value (Selling)</div>
            <div className="text-xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
              {formatCurrency(stats.totalSellingValuation)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-mono">
              +{formatCurrency(stats.potentialGrossMargin)} gross margin
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</div>
            <div className="text-xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
              {stats.lowStockCount} <span className="text-xs text-slate-400 font-sans">items</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Need restock order</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search items by name, code (e.g. RFN-Y12), or spec..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700"
            >
              <option value="ALL">All Manufacturers (Roofings, Tororo, STIL...)</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex items-center gap-1.5">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                stockFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                stockFilter === 'LOW'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Low Alert
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                stockFilter === 'OUT'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Dynamic Category Segment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedGroup === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Categories ({inventory.length})
          </button>
          {hardwareGroups.map(group => {
            const count = inventory.filter(i => i.group === group).length;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedGroup === group
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {group} ({count})
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-2 py-1 text-amber-700 hover:text-amber-800 font-bold hover:underline whitespace-nowrap"
            >
              + Add Category
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Code / Material Name</th>
                <th className="py-3 px-4">Category & Sub-Type</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 text-center">Yard Stock</th>
                {isAdmin ? (
                  <>
                    <th className="py-3 px-4 text-right">Cost Price (USh)</th>
                    <th className="py-3 px-4 text-right">Selling Price (USh)</th>
                    <th className="py-3 px-4 text-right">Markup %</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                  </>
                )}
                <th className="py-3 px-4 text-center">Location</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => {
                const isLow = item.currentStock <= item.minStockLevel && item.currentStock > 0;
                const isOut = item.currentStock <= 0;
                const markupPercent = item.costPrice > 0 
                  ? (((item.sellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(1)
                  : '0';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.code}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{item.group}</div>
                      <div className="text-[11px] text-slate-500">{item.subType}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">{item.supplierName}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block font-mono tabular-nums px-2.5 py-1 rounded-md text-xs font-semibold ${
                          isOut
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {formatNumber(item.currentStock)} {item.unit}
                      </span>
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <span className="font-mono tabular-nums font-medium text-slate-600">
                          {formatCurrency(item.costPrice)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Protected</span>
                        </span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </td>

                    {/* Margin % (Admin only) */}
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                          +{markupPercent}%
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                      {item.locationRack}
                    </td>

                    {/* Actions (Admin only) */}
                    {isAdmin && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPriceEditItem(item);
                              setNewCostPrice(item.costPrice);
                              setNewSellingPrice(item.sellingPrice);
                              setPriceChangeReason('');
                            }}
                            title="Adjust Cost & Selling Price"
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            Adjust Price
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStockTakeItem(item);
                              setCountedStock(item.currentStock);
                              setStockTakeReason('');
                            }}
                            title="Stock Balance / Physical Count"
                            className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            Stock Take
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 7} className="py-12 text-center text-slate-400">
                    No items found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Price Adjustment Modal (Admin Only) */}
      {priceEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Material Prices (USh)</h3>
                <p className="text-xs text-slate-500 mt-0.5">{priceEditItem.name} ({priceEditItem.code})</p>
              </div>
              <button onClick={() => setPriceEditItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="text-slate-500">Current Cost Price</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {formatCurrency(priceEditItem.costPrice)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="text-slate-500">Current Selling Price</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {formatCurrency(priceEditItem.sellingPrice)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Cost Price (USh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Selling Price (USh)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Factory price increase from Roofings Namanve"
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPriceEditItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Save New Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock Take Physical Balancing */}
      {stockTakeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Physical Yard Stock Count</h3>
              <button onClick={() => setStockTakeItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockTake} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-slate-900">{stockTakeItem.name}</div>
                <div className="flex justify-between text-slate-600">
                  <span>Computer Recorded:</span>
                  <span className="font-mono font-bold">{stockTakeItem.currentStock} {stockTakeItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Physical Count in Yard
                </label>
                <input
                  type="number"
                  min="0"
                  value={countedStock}
                  onChange={(e) => setCountedStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of month physical yard reconciliation"
                  value={stockTakeReason}
                  onChange={(e) => setStockTakeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockTakeItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Update & Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Item to Catalog */}
      {isNewItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Construction Item</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register new building supply with category & manufacturer</p>
              </div>
              <button onClick={() => setIsNewItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewItemSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. RFN-Y20-UG"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs uppercase font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Category</label>
                  <select
                    value={newItemGroup}
                    onChange={(e) => setNewItemGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {hardwareGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name</label>
                <input
                  type="text"
                  placeholder="e.g. Roofings Iron Bar Y20 Heavy Rebar (12m)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Type / Dimension / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 500 High Yield"
                    value={newItemSubType}
                    onChange={(e) => setNewItemSubType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="pcs">pieces (pcs)</option>
                    <option value="bags (50kg)">bags (50kg)</option>
                    <option value="box">box (tiles)</option>
                    <option value="m²">square meters (m²)</option>
                    <option value="roll">roll (mesh / wire)</option>
                    <option value="trip (Forwarder)">trip (Forwarder)</option>
                    <option value="drum (20L)">drum (20L paint)</option>
                    <option value="tin (4L)">tin (4L paint)</option>
                    <option value="kg">kg (nails)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Manufacturer / Supplier</label>
                <select
                  value={newItemSupplierId}
                  onChange={(e) => setNewItemSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (USh)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (USh)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newItemSelling}
                    onChange={(e) => setNewItemSelling(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Reorder Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemMinLevel}
                    onChange={(e) => setNewItemMinLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yard / Shed Location</label>
                <input
                  type="text"
                  placeholder="e.g. Yard Bay 4 (Structural Steel Racks)"
                  value={newItemRack}
                  onChange={(e) => setNewItemRack(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Create Material Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for creating a new category dynamically */}
      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={(name) => setSelectedGroup(name)}
      />
    </div>
  );
};
