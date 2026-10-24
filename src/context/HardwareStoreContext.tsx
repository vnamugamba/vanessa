import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Customer,
  DayBalancingRecord,
  ExpenseRecord,
  InventoryItem,
  PaymentMethod,
  StatementEntry,
  StockInwardEntry,
  Supplier,
  Transaction,
  UserAccount,
  UserRole,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_DAY_BALANCING,
  INITIAL_EXPENSES,
  INITIAL_HARDWARE_GROUPS,
  INITIAL_INVENTORY,
  INITIAL_STOCK_INWARDS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from '../data/mockHardwareData';

interface HardwareStoreContextType {
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  switchRole: (role: UserRole, enteredPin?: string) => boolean;
  isAdmin: boolean;
  isCashier: boolean;
  isSeller: boolean;

  inventory: InventoryItem[];
  hardwareGroups: string[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  pendingOrders: Transaction[];
  pendingOrdersCount: number;
  dayBalancing: DayBalancingRecord[];
  expenses: ExpenseRecord[];
  stockInwards: StockInwardEntry[];

  // Category & Inventory actions
  addCategory: (categoryName: string) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateItemPrices: (itemId: string, newCost: number, newSelling: number, reason: string) => boolean;
  updateStockLevel: (itemId: string, newStock: number, reason: string) => boolean;
  receiveStockInward: (entry: Omit<StockInwardEntry, 'id'>) => void;

  // Seller Sales Order flow (Unconfirmed -> Cashier Desk)
  createSalesOrder: (orderData: {
    customerId: string;
    customerName: string;
    customerType: string;
    items: {
      item: InventoryItem;
      qty: number;
      unitPrice: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    discountTotal: number;
    grandTotal: number;
    notes?: string;
    siteReference?: string;
  }) => Transaction;

  // Cashier Confirmation flow
  confirmSalesOrder: (
    transactionId: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      amountPaid: number;
      notes?: string;
    }
  ) => Transaction | null;

  cancelSalesOrder: (transactionId: string, reason: string) => boolean;

  // Direct checkout (for Admin or instant Cashier POS)
  processSale: (saleData: {
    customerId: string;
    customerName: string;
    customerType: string;
    items: {
      item: InventoryItem;
      qty: number;
      unitPrice: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    discountTotal: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    siteReference?: string;
  }) => Transaction;
  
  // Admin Transaction management (Edit / Delete / Void)
  deleteTransaction: (transactionId: string, reason: string) => boolean;
  updateTransaction: (transactionId: string, updated: Partial<Transaction>, reason: string) => boolean;

  // Day Balancing
  getDayBalancingRecord: (date: string) => DayBalancingRecord;
  closeDayRegister: (date: string, actualCash: number, notes: string) => void;
  reopenDayRegister: (dayId: string) => void;

  // Expenses & Petty Cash
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'recordedBy'>) => void;

  // Supplier & Customer Ledger / Statements
  addSupplier: (supplier: Omit<Supplier, 'id' | 'outstandingBalance'>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance'>) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: string, ref: string, notes?: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: string, ref: string, notes?: string) => void;
  getCustomerStatement: (customerId: string) => StatementEntry[];
  getSupplierStatement: (supplierId: string) => StatementEntry[];

  // Data reset helper
  resetToSampleData: () => void;
}

const HardwareStoreContext = createContext<HardwareStoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'buildcraft_ug_user_v2',
  INVENTORY: 'buildcraft_ug_inventory_v2',
  GROUPS: 'buildcraft_ug_groups_v2',
  SUPPLIERS: 'buildcraft_ug_suppliers_v2',
  CUSTOMERS: 'buildcraft_ug_customers_v2',
  TRANSACTIONS: 'buildcraft_ug_transactions_v2',
  DAY_BALANCING: 'buildcraft_ug_day_balancing_v2',
  EXPENSES: 'buildcraft_ug_expenses_v2',
  STOCK_INWARDS: 'buildcraft_ug_stock_inwards_v2',
};

export const HardwareStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS[0];
  });

  const [hardwareGroups, setHardwareGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_HARDWARE_GROUPS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_INVENTORY;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SUPPLIERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [dayBalancing, setDayBalancing] = useState<DayBalancingRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAY_BALANCING);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_DAY_BALANCING;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_EXPENSES;
  });

  const [stockInwards, setStockInwards] = useState<StockInwardEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_INWARDS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_STOCK_INWARDS;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(hardwareGroups));
  }, [hardwareGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAY_BALANCING, JSON.stringify(dayBalancing));
  }, [dayBalancing]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_INWARDS, JSON.stringify(stockInwards));
  }, [stockInwards]);

  const isAdmin = currentUser.role === 'ADMIN';
  const isCashier = currentUser.role === 'CASHIER' || currentUser.role === 'ADMIN';
  const isSeller = currentUser.role === 'SELLER';

  const pendingOrders = transactions.filter(t => t.status === 'PENDING_CASHIER');
  const pendingOrdersCount = pendingOrders.length;

  const switchRole = (role: UserRole, enteredPin?: string): boolean => {
    const targetUser = INITIAL_USERS.find(u => u.role === role);
    if (!targetUser) return false;
    
    if (role === 'ADMIN' && enteredPin && enteredPin !== targetUser.pin) {
      return false;
    }
    if (role === 'CASHIER' && enteredPin && enteredPin !== targetUser.pin) {
      return false;
    }
    
    setCurrentUser(targetUser);
    return true;
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    if (!hardwareGroups.includes(trimmed)) {
      setHardwareGroups(prev => [...prev, trimmed]);
    }
  };

  const addItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      priceHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          oldCost: itemData.costPrice,
          newCost: itemData.costPrice,
          oldSelling: itemData.sellingPrice,
          newSelling: itemData.sellingPrice,
          adjustedBy: currentUser.name,
          reason: 'Initial item catalog creation',
        },
      ],
    };

    // If new category not in groups, add it
    if (!hardwareGroups.includes(itemData.group)) {
      setHardwareGroups(prev => [...prev, itemData.group]);
    }

    setInventory(prev => [newItem, ...prev]);
  };

  const updateItemPrices = (
    itemId: string,
    newCost: number,
    newSelling: number,
    reason: string
  ): boolean => {
    if (!isAdmin) return false;

    setInventory(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const historyEntry = {
            date: new Date().toISOString().split('T')[0],
            oldCost: item.costPrice,
            newCost,
            oldSelling: item.sellingPrice,
            newSelling,
            adjustedBy: currentUser.name,
            reason: reason || 'Price adjustment',
          };

          return {
            ...item,
            costPrice: newCost,
            sellingPrice: newSelling,
            lastUpdated: new Date().toISOString().split('T')[0],
            priceHistory: [historyEntry, ...(item.priceHistory || [])],
          };
        }
        return item;
      })
    );
    return true;
  };

  const updateStockLevel = (itemId: string, newStock: number, reason: string): boolean => {
    if (!isAdmin) return false;

    setInventory(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
    return true;
  };

  const receiveStockInward = (entry: Omit<StockInwardEntry, 'id'>) => {
    const newEntry: StockInwardEntry = {
      ...entry,
      id: `grn_${Date.now()}`,
    };

    setStockInwards(prev => [newEntry, ...prev]);

    // Update item stock
    setInventory(prev =>
      prev.map(item => {
        if (item.id === entry.itemId) {
          const updatedCost = entry.costPrice > 0 ? entry.costPrice : item.costPrice;
          const updatedSelling = entry.newSellingPrice && entry.newSellingPrice > 0 
            ? entry.newSellingPrice 
            : item.sellingPrice;

          return {
            ...item,
            currentStock: item.currentStock + entry.qtyReceived,
            costPrice: updatedCost,
            sellingPrice: updatedSelling,
            supplierId: entry.supplierId,
            supplierName: entry.supplierName,
            lastUpdated: entry.date,
          };
        }
        return item;
      })
    );

    // Increase payable to supplier if on credit
    if (entry.paidStatus === 'ON_CREDIT') {
      setSuppliers(prev =>
        prev.map(s => {
          if (s.id === entry.supplierId) {
            return {
              ...s,
              outstandingBalance: s.outstandingBalance + entry.totalCost,
            };
          }
          return s;
        })
      );
    }
  };

  // Seller Counter Sales Order creation (Unconfirmed -> Pending Cashier)
  const createSalesOrder = (orderData: {
    customerId: string;
    customerName: string;
    customerType: string;
    items: {
      item: InventoryItem;
      qty: number;
      unitPrice: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    discountTotal: number;
    grandTotal: number;
    notes?: string;
    siteReference?: string;
  }): Transaction => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let totalCost = 0;
    const transactionItems = orderData.items.map(it => {
      const itemCost = it.item.costPrice * it.qty;
      totalCost += itemCost;
      return {
        itemId: it.item.id,
        code: it.item.code,
        name: it.item.name,
        group: it.item.group,
        unit: it.item.unit,
        qty: it.qty,
        costPriceAtSale: it.item.costPrice,
        unitPrice: it.unitPrice,
        discount: it.discount,
        total: it.total,
      };
    });

    const orderCount = transactions.length + 1;
    const orderNo = `SO-${new Date().getFullYear()}-${String(orderCount + 45).padStart(4, '0')}`;
    const tempInvoiceNo = `INV-PENDING-${String(orderCount + 415).padStart(4, '0')}`;

    const newOrder: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderNo,
      invoiceNo: tempInvoiceNo,
      date: today,
      time,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerType: orderData.customerType,
      items: transactionItems,
      subtotal: orderData.subtotal,
      discountTotal: orderData.discountTotal,
      grandTotal: orderData.grandTotal,
      totalCost,
      grossProfit: orderData.grandTotal - totalCost,
      paymentMethod: 'CASH', // Default until Cashier selects actual payment channel
      amountPaid: 0,
      balanceDue: orderData.grandTotal,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      status: 'PENDING_CASHIER',
      notes: orderData.notes,
      siteReference: orderData.siteReference,
    };

    setTransactions(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // Cashier Desk Payment Confirmation
  const confirmSalesOrder = (
    transactionId: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      amountPaid: number;
      notes?: string;
    }
  ): Transaction | null => {
    const order = transactions.find(t => t.id === transactionId);
    if (!order) return null;

    const balanceDue = Math.max(0, order.grandTotal - paymentData.amountPaid);
    const invoiceCount = transactions.filter(t => t.status === 'CONFIRMED').length + 1;
    const confirmedInvoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceCount + 415).padStart(4, '0')}`;
    const deliveryNoteNo = `DN-UG-${String(invoiceCount + 415).padStart(4, '0')}`;

    const confirmedTx: Transaction = {
      ...order,
      invoiceNo: confirmedInvoiceNo,
      deliveryNoteNo,
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.amountPaid,
      balanceDue,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'CONFIRMED',
      confirmedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      notes: paymentData.notes
        ? `${order.notes ? order.notes + ' | ' : ''}${paymentData.notes}`
        : order.notes,
    };

    // Deduct stock from inventory upon Cashier payment confirmation
    setInventory(prev =>
      prev.map(item => {
        const soldItem = order.items.find(si => si.itemId === item.id);
        if (soldItem) {
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - soldItem.qty),
          };
        }
        return item;
      })
    );

    // If contractor balance remains, update customer account balance
    if (balanceDue > 0 && order.customerId !== 'cust_walkin') {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === order.customerId) {
            return {
              ...c,
              outstandingBalance: c.outstandingBalance + balanceDue,
            };
          }
          return c;
        })
      );
    }

    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? confirmedTx : t))
    );

    return confirmedTx;
  };

  const cancelSalesOrder = (transactionId: string, reason: string): boolean => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId && t.status === 'PENDING_CASHIER') {
          return {
            ...t,
            status: 'VOIDED',
            notes: `Cancelled at Cashier Desk by ${currentUser.name}: ${reason}`,
          };
        }
        return t;
      })
    );
    return true;
  };

  // Direct Sale (Used by Cashier or Admin for direct counter checkout)
  const processSale = (saleData: {
    customerId: string;
    customerName: string;
    customerType: string;
    items: {
      item: InventoryItem;
      qty: number;
      unitPrice: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    discountTotal: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    siteReference?: string;
  }): Transaction => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let totalCost = 0;
    const transactionItems = saleData.items.map(it => {
      const itemCost = it.item.costPrice * it.qty;
      totalCost += itemCost;
      return {
        itemId: it.item.id,
        code: it.item.code,
        name: it.item.name,
        group: it.item.group,
        unit: it.item.unit,
        qty: it.qty,
        costPriceAtSale: it.item.costPrice,
        unitPrice: it.unitPrice,
        discount: it.discount,
        total: it.total,
      };
    });

    const balanceDue = Math.max(0, saleData.grandTotal - saleData.amountPaid);
    const invoiceCount = transactions.length + 1;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceCount + 415).padStart(4, '0')}`;
    const orderNo = `SO-${new Date().getFullYear()}-${String(invoiceCount + 45).padStart(4, '0')}`;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orderNo,
      invoiceNo,
      date: today,
      time,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerType: saleData.customerType,
      items: transactionItems,
      subtotal: saleData.subtotal,
      discountTotal: saleData.discountTotal,
      grandTotal: saleData.grandTotal,
      totalCost,
      grossProfit: saleData.grandTotal - totalCost,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      balanceDue,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'CONFIRMED',
      notes: saleData.notes,
      siteReference: saleData.siteReference,
      deliveryNoteNo: `DN-UG-${String(invoiceCount + 415).padStart(4, '0')}`,
    };

    // Deduct stock
    setInventory(prev =>
      prev.map(item => {
        const soldItem = saleData.items.find(si => si.item.id === item.id);
        if (soldItem) {
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - soldItem.qty),
          };
        }
        return item;
      })
    );

    // Update customer debt balance if credit
    if (balanceDue > 0 && saleData.customerId !== 'cust_walkin') {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              outstandingBalance: c.outstandingBalance + balanceDue,
            };
          }
          return c;
        })
      );
    }

    setTransactions(prev => [newTx, ...prev]);

    return newTx;
  };

  const deleteTransaction = (transactionId: string, reason: string): boolean => {
    if (!isAdmin) return false;

    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status === 'VOIDED') return false;

    // Return stock to inventory
    setInventory(prev =>
      prev.map(item => {
        const txItem = tx.items.find(i => i.itemId === item.id);
        if (txItem) {
          return {
            ...item,
            currentStock: item.currentStock + txItem.qty,
          };
        }
        return item;
      })
    );

    // Reduce customer debt
    if (tx.balanceDue > 0 && tx.customerId !== 'cust_walkin') {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === tx.customerId) {
            return {
              ...c,
              outstandingBalance: Math.max(0, c.outstandingBalance - tx.balanceDue),
            };
          }
          return c;
        })
      );
    }

    // Mark as voided
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId) {
          return {
            ...t,
            status: 'VOIDED',
            notes: `${t.notes ? t.notes + ' | ' : ''}VOIDED by ${currentUser.name}: ${reason}`,
          };
        }
        return t;
      })
    );

    return true;
  };

  const updateTransaction = (
    transactionId: string,
    updated: Partial<Transaction>,
    reason: string
  ): boolean => {
    if (!isAdmin) return false;

    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId) {
          return {
            ...t,
            ...updated,
            status: 'MODIFIED',
            notes: `${t.notes ? t.notes + ' | ' : ''}MODIFIED by ${currentUser.name}: ${reason}`,
          };
        }
        return t;
      })
    );
    return true;
  };

  const getDayBalancingRecord = (targetDate: string): DayBalancingRecord => {
    const existing = dayBalancing.find(d => d.date === targetDate);

    // Compute real-time numbers from sales & expenses on that specific date
    const dayTxs = transactions.filter(t => t.date === targetDate && t.status !== 'VOIDED' && t.status !== 'PENDING_CASHIER');
    let cashSales = 0;
    let mtnMomoSales = 0;
    let airtelMoneySales = 0;
    let bankSales = 0;
    let creditSales = 0;

    dayTxs.forEach(t => {
      if (t.paymentMethod === 'CASH') {
        cashSales += t.amountPaid;
      } else if (t.paymentMethod === 'MTN_MOMO') {
        mtnMomoSales += t.amountPaid;
      } else if (t.paymentMethod === 'AIRTEL_MONEY') {
        airtelMoneySales += t.amountPaid;
      } else if (t.paymentMethod === 'BANK_TRANSFER') {
        bankSales += t.amountPaid;
      } else if (t.paymentMethod === 'CREDIT_ACCOUNT') {
        creditSales += t.balanceDue;
        cashSales += t.amountPaid; // cash deposit at desk
      }
    });

    const dayExpenses = expenses.filter(e => e.date === targetDate && e.paidFrom === 'CASH');
    const totalPaidOutExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const openingCash = existing ? existing.openingCash : 1500000;
    const totalPaidToSuppliersCash = existing ? existing.totalPaidToSuppliersCash : 0;
    const expectedCashInDrawer = openingCash + cashSales - totalPaidOutExpenses - totalPaidToSuppliersCash;

    if (existing) {
      return {
        ...existing,
        totalCashSales: cashSales,
        totalMtnMomoSales: mtnMomoSales,
        totalAirtelMoneySales: airtelMoneySales,
        totalBankSales: bankSales,
        totalCreditSales: creditSales,
        totalPaidOutExpenses,
        expectedCashInDrawer,
        cashVariance: existing.actualCountedCash - expectedCashInDrawer,
      };
    }

    return {
      id: `day_${targetDate.replace(/-/g, '_')}`,
      date: targetDate,
      openingCash,
      totalCashSales: cashSales,
      totalMtnMomoSales: mtnMomoSales,
      totalAirtelMoneySales: airtelMoneySales,
      totalBankSales: bankSales,
      totalCreditSales: creditSales,
      totalPaidOutExpenses,
      totalPaidToSuppliersCash: 0,
      expectedCashInDrawer,
      actualCountedCash: expectedCashInDrawer,
      cashVariance: 0,
      status: 'OPEN',
      notes: 'Active register in progress.',
    };
  };

  const closeDayRegister = (date: string, actualCash: number, notes: string) => {
    const current = getDayBalancingRecord(date);
    const variance = actualCash - current.expectedCashInDrawer;

    const closedRecord: DayBalancingRecord = {
      ...current,
      actualCountedCash: actualCash,
      cashVariance: variance,
      status: 'CLOSED',
      notes,
      closedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      closedBy: currentUser.name,
    };

    setDayBalancing(prev => {
      const filtered = prev.filter(d => d.date !== date);
      return [closedRecord, ...filtered];
    });
  };

  const reopenDayRegister = (dayId: string) => {
    if (!isAdmin) return;
    setDayBalancing(prev =>
      prev.map(d => (d.id === dayId ? { ...d, status: 'OPEN' } : d))
    );
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'recordedBy'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      recordedBy: currentUser.name,
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'outstandingBalance'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `supp_${Date.now()}`,
      outstandingBalance: 0,
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      outstandingBalance: 0,
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: string,
    ref: string,
    notes?: string
  ) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            outstandingBalance: Math.max(0, c.outstandingBalance - amount),
          };
        }
        return c;
      })
    );

    // Record receipt transaction
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === customerId);

    const paymentTx: Transaction = {
      id: `pmt_in_${Date.now()}`,
      invoiceNo: `RCT-${new Date().getFullYear()}-${String(transactions.length + 500).padStart(4, '0')}`,
      date: today,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      customerId,
      customerName: customer ? customer.name : 'Unknown Client',
      customerType: customer ? customer.type : 'CONTRACTOR',
      items: [],
      subtotal: 0,
      discountTotal: 0,
      grandTotal: amount,
      totalCost: 0,
      grossProfit: 0,
      paymentMethod: (paymentMethod as PaymentMethod) || 'MTN_MOMO',
      amountPaid: amount,
      balanceDue: 0,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      status: 'CONFIRMED',
      notes: `Debt Clearance: ${ref} - ${notes || 'Settlement against statement ledger'}`,
    };

    setTransactions(prev => [paymentTx, ...prev]);
  };

  const recordSupplierPayment = (
    supplierId: string,
    amount: number,
    paymentMethod: string,
    ref: string,
    notes?: string
  ) => {
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === supplierId) {
          return {
            ...s,
            outstandingBalance: Math.max(0, s.outstandingBalance - amount),
          };
        }
        return s;
      })
    );

    if (paymentMethod === 'CASH') {
      const today = new Date().toISOString().split('T')[0];
      setDayBalancing(prev =>
        prev.map(d => {
          if (d.date === today) {
            return {
              ...d,
              totalPaidToSuppliersCash: d.totalPaidToSuppliersCash + amount,
              expectedCashInDrawer: d.expectedCashInDrawer - amount,
            };
          }
          return d;
        })
      );
    }
  };

  const getCustomerStatement = (customerId: string): StatementEntry[] => {
    const entries: StatementEntry[] = [];
    let running = 0;

    const customerTxs = transactions
      .filter(t => t.customerId === customerId && t.status !== 'VOIDED')
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

    customerTxs.forEach(tx => {
      if (tx.items.length > 0) {
        running += tx.grandTotal;
        entries.push({
          id: `stmt_inv_${tx.id}`,
          date: tx.date,
          referenceNo: tx.invoiceNo,
          type: 'INVOICE',
          description: `Sale: ${tx.items.map(i => `${i.qty} ${i.unit} ${i.name}`).slice(0, 2).join(', ')}${tx.items.length > 2 ? ` (+${tx.items.length - 2} more)` : ''}`,
          debit: tx.grandTotal,
          credit: 0,
          runningBalance: running,
        });

        if (tx.amountPaid > 0) {
          running -= tx.amountPaid;
          entries.push({
            id: `stmt_pmt_${tx.id}`,
            date: tx.date,
            referenceNo: `REC-${tx.invoiceNo}`,
            type: 'PAYMENT',
            description: `Payment received (${tx.paymentMethod.replace('_', ' ')})`,
            debit: 0,
            credit: tx.amountPaid,
            runningBalance: running,
          });
        }
      } else {
        running -= tx.amountPaid;
        entries.push({
          id: `stmt_rct_${tx.id}`,
          date: tx.date,
          referenceNo: tx.invoiceNo,
          type: 'PAYMENT',
          description: tx.notes || 'Statement Debt Settlement',
          debit: 0,
          credit: tx.amountPaid,
          runningBalance: running,
        });
      }
    });

    return entries.reverse();
  };

  const getSupplierStatement = (supplierId: string): StatementEntry[] => {
    const entries: StatementEntry[] = [];
    let running = 0;

    const supplierInwards = stockInwards
      .filter(s => s.supplierId === supplierId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    supplierInwards.forEach(inw => {
      running += inw.totalCost;
      entries.push({
        id: `supp_inw_${inw.id}`,
        date: inw.date,
        referenceNo: inw.grnNo,
        type: 'PURCHASE_BILL',
        description: `Material Consignment: ${inw.qtyReceived} ${inw.unit} of ${inw.itemName} (Ref: ${inw.supplierInvoiceNo})`,
        debit: inw.totalCost,
        credit: 0,
        runningBalance: running,
      });

      if (inw.paidStatus === 'PAID') {
        running -= inw.totalCost;
        entries.push({
          id: `supp_pmt_${inw.id}`,
          date: inw.date,
          referenceNo: `PAY-${inw.grnNo}`,
          type: 'SUPPLIER_PAYMENT',
          description: `Direct Payment Settlement for ${inw.grnNo}`,
          debit: 0,
          credit: inw.totalCost,
          runningBalance: running,
        });
      }
    });

    return entries.reverse();
  };

  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.DAY_BALANCING);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_INWARDS);

    setInventory(INITIAL_INVENTORY);
    setHardwareGroups(INITIAL_HARDWARE_GROUPS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setDayBalancing(INITIAL_DAY_BALANCING);
    setExpenses(INITIAL_EXPENSES);
    setStockInwards(INITIAL_STOCK_INWARDS);
  };

  return (
    <HardwareStoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        isAdmin,
        isCashier,
        isSeller,
        inventory,
        hardwareGroups,
        suppliers,
        customers,
        transactions,
        pendingOrders,
        pendingOrdersCount,
        dayBalancing,
        expenses,
        stockInwards,
        addCategory,
        addItem,
        updateItemPrices,
        updateStockLevel,
        receiveStockInward,
        createSalesOrder,
        confirmSalesOrder,
        cancelSalesOrder,
        processSale,
        deleteTransaction,
        updateTransaction,
        getDayBalancingRecord,
        closeDayRegister,
        reopenDayRegister,
        addExpense,
        addSupplier,
        addCustomer,
        recordCustomerPayment,
        recordSupplierPayment,
        getCustomerStatement,
        getSupplierStatement,
        resetToSampleData,
      }}
    >
      {children}
    </HardwareStoreContext.Provider>
  );
};

export const useHardwareStore = () => {
  const context = useContext(HardwareStoreContext);
  if (!context) {
    throw new Error('useHardwareStore must be used within HardwareStoreProvider');
  }
  return context;
};
