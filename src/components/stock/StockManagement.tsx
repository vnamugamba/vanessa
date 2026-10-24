import React, { useMemo, useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { InventoryItem, StockInwardEntry } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import {
  Truck,
  Plus,
  Scale,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  X,
  History,
  Lock,
} from 'lucide-react';

export const StockManagement: React.FC = () => {
  const {
    inventory,
    suppliers,
    stockInwards,
    receiveStockInward,
    updateStockLevel,
    isAdmin,
  } = useHardwareStore();

  const [activeSubTab, setActiveSubTab] = useState<'RECEIVE_GRN' | 'PHYSICAL_TAKE' | 'INWARD_HISTORY'>('RECEIVE_GRN');
  const [searchQuery, setSearchQuery] = useState('');

  // Receive Stock Form State
  const [grnSupplierId, setGrnSupplierId] = useState(suppliers[0]?.id || '');
  const [grnItemId, setGrnItemId] = useState(inventory[0]?.id || '');
  const [grnQty, setGrnQty] = useState<number>(50);
  const [grnCostPrice, setGrnCostPrice] = useState<number>(inventory[0]?.costPrice || 0);
  const [grnNewSelling, setGrnNewSelling] = useState<number>(inventory[0]?.sellingPrice || 0);
  const [grnInvoiceNo, setGrnInvoiceNo] = useState('');
  const [grnPaidStatus, setGrnPaidStatus] = useState<'ON_CREDIT' | 'PAID'>('ON_CREDIT');
  const [grnNotes, setGrnNotes] = useState('');
  const [receivedSuccess, setReceivedSuccess] = useState('');

  // Stock Take Modal/State
  const [selectedStockTakeItem, setSelectedStockTakeItem] = useState<InventoryItem | null>(null);
  const [actualPhysicalCount, setActualPhysicalCount] = useState<number>(0);
  const [takeReason, setTakeReason] = useState('');

  // Available items for selected supplier
  const supplierItems = useMemo(() => {
    return inventory.filter(i => !grnSupplierId || i.supplierId === grnSupplierId);
  }, [inventory, grnSupplierId]);

  // Handle supplier change to update default item
  const handleSupplierChange = (suppId: string) => {
    setGrnSupplierId(suppId);
    const firstItem = inventory.find(i => i.supplierId === suppId);
    if (firstItem) {
      setGrnItemId(firstItem.id);
      setGrnCostPrice(firstItem.costPrice);
      setGrnNewSelling(firstItem.sellingPrice);
    }
  };

  const handleItemChange = (itemId: string) => {
    setGrnItemId(itemId);
    const it = inventory.find(i => i.id === itemId);
    if (it) {
      setGrnCostPrice(it.costPrice);
      setGrnNewSelling(it.sellingPrice);
    }
  };

  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === grnItemId);
    const supplier = suppliers.find(s => s.id === grnSupplierId);
    if (!item || !supplier) return;

    const grnNo = `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const cost = grnCostPrice > 0 ? grnCostPrice : item.costPrice;

    receiveStockInward({
      date: new Date().toISOString().split('T')[0],
      grnNo,
      supplierInvoiceNo: grnInvoiceNo || `INV-SUP-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemName: item.name,
      qtyReceived: grnQty,
      unit: item.unit,
      costPrice: cost,
      totalCost: cost * grnQty,
      newSellingPrice: grnNewSelling > 0 ? grnNewSelling : item.sellingPrice,
      paidStatus: grnPaidStatus,
      notes: grnNotes,
      receivedBy: 'Main Manager (Admin)',
    });

    setReceivedSuccess(`Successfully received ${grnQty} ${item.unit} of ${item.name} (${grnNo})`);
    setGrnInvoiceNo('');
    setGrnNotes('');
    setTimeout(() => setReceivedSuccess(''), 4000);
  };

  const handleStockTakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockTakeItem) return;
    updateStockLevel(selectedStockTakeItem.id, actualPhysicalCount, takeReason || 'Physical yard stock audit');
    setSelectedStockTakeItem(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Stock Management & Yard Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Receive incoming consignments (Goods Received Notes), conduct physical stock takes, and audit inventory movements.
          </p>
        </div>

        {/* Sub-tab segment buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveSubTab('RECEIVE_GRN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeSubTab === 'RECEIVE_GRN'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Receive Stock (GRN)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PHYSICAL_TAKE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeSubTab === 'PHYSICAL_TAKE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Stock Take / Physical Count</span>
          </button>

          <button
            onClick={() => setActiveSubTab('INWARD_HISTORY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeSubTab === 'INWARD_HISTORY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Inwards History ({stockInwards.length})</span>
          </button>
        </div>
      </div>

      {receivedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{receivedSuccess}</span>
        </div>
      )}

      {/* SUB-VIEW 1: RECEIVE STOCK (GRN) */}
      {activeSubTab === 'RECEIVE_GRN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Goods Received Note (Stock Inward Entry)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record new deliveries arriving by trailer/truck from manufacturers (Devki, Bamburi, Apex, MRM).
              </p>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Supplier / Manufacturer
                  </label>
                  <select
                    value={grnSupplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.materialGroups.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Invoice / Delivery Note #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DVK-INV-2026-991"
                    value={grnInvoiceNo}
                    onChange={(e) => setGrnInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Construction Item Received
                </label>
                <select
                  value={grnItemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  required
                >
                  {supplierItems.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.subType}) · Current Yard Stock: {it.currentStock} {it.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Received
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={grnQty}
                    onChange={(e) => setGrnQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={grnCostPrice}
                    onChange={(e) => setGrnCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={grnNewSelling}
                    onChange={(e) => setGrnNewSelling(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={grnPaidStatus}
                    onChange={(e) => setGrnPaidStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ON_CREDIT">On Supplier Credit (Adds to Payable Statement)</option>
                    <option value="PAID">Paid Immediately (Cash or Bank Wire)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Consignment Value
                  </label>
                  <div className="px-3 py-2 text-xs font-mono font-bold bg-slate-100 rounded-lg text-slate-800">
                    {formatCurrency(grnCostPrice * grnQty)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offloading & Quality Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50 bundles offloaded, mill test certificate verified"
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                Post Stock Inward & Increment Inventory
              </button>
            </form>
          </div>

          {/* Right 5 Cols: Quick Stock Level Overview */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Current Stock by Manufacturer</h3>
            <p className="text-xs text-slate-500">Live units ready in yard for selected supplier</p>

            <div className="space-y-2 max-h-[460px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {supplierItems.map(item => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.code} · {item.locationRack}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {item.currentStock} {item.unit}
                    </span>
                    <div className="text-[10px] text-slate-500">Sell: {formatCurrency(item.sellingPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PHYSICAL STOCK TAKE */}
      {activeSubTab === 'PHYSICAL_TAKE' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yard Stock Take & Physical Count Balance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit actual physical bags, iron bars, and tile boxes against computer records.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter items to audit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Item & Code</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-center">System Stock</th>
                  <th className="py-2.5 px-3 text-center">Min Reorder</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Physical Count Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory
                  .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.code} · {item.supplierName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.locationRack}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{item.minStockLevel}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatCurrency(item.sellingPrice)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              setSelectedStockTakeItem(item);
                              setActualPhysicalCount(item.currentStock);
                              setTakeReason('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            Conduct Count
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Admin Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: INWARD HISTORY */}
      {activeSubTab === 'INWARD_HISTORY' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Material Inward Consignment Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Goods Received Notes (GRN) received from Devki Steel, Bamburi, Apex, and other manufacturers.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date / GRN #</th>
                  <th className="py-2.5 px-3">Supplier Invoice</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Item & Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Total Inward Bill</th>
                  <th className="py-2.5 px-3 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockInwards.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold font-mono text-slate-900">{entry.grnNo}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(entry.date)}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                      {entry.supplierInvoiceNo}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {entry.supplierName}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{entry.itemName}</div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        +{entry.qtyReceived} {entry.unit}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(entry.costPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(entry.totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.paidStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.paidStatus === 'PAID' ? 'Settled' : 'On Credit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Take Action Modal */}
      {selectedStockTakeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reconcile Physical Stock</h3>
              <button onClick={() => setSelectedStockTakeItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockTakeSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-slate-900">{selectedStockTakeItem.name}</div>
                <div className="flex justify-between text-slate-600">
                  <span>Current System Record:</span>
                  <span className="font-mono font-bold">{selectedStockTakeItem.currentStock} {selectedStockTakeItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Physical Count Verified in Yard
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualPhysicalCount}
                  onChange={(e) => setActualPhysicalCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Discrepancy Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of month physical count verification"
                  value={takeReason}
                  onChange={(e) => setTakeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStockTakeItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Update Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
