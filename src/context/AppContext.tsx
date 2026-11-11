import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MenuItem, 
  CartItem, 
  Order, 
  StoreInfo, 
  UserAccount, 
  UserRole, 
  OrderType, 
  PaymentMethod 
} from '../types';
import { 
  INITIAL_STORE_INFO, 
  INITIAL_ACCOUNTS, 
  INITIAL_MENU, 
  INITIAL_ORDERS 
} from '../data/initialData';

interface AppContextType {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  storeInfo: StoreInfo;
  menuItems: MenuItem[];
  orders: Order[];
  cart: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  discountPercentage: number;
  taxPercentage: number;
  activeTab: 'pos' | 'menu' | 'history' | 'dashboard' | 'owner';
  
  // Navigation & Auth
  setCurrentUser: (user: UserAccount | null) => void;
  setActiveTab: (tab: 'pos' | 'menu' | 'history' | 'dashboard' | 'owner') => void;
  login: (accountId: string, pin: string) => boolean;
  logout: () => void;
  
  // Cart Actions
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: string) => void;
  setCustomerName: (name: string) => void;
  setDiscountPercentage: (discount: number) => void;
  setTaxPercentage: (tax: number) => void;
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  updateCartNotes: (itemId: string, notes: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  
  // Order Checkout & History Management
  completeOrder: (paymentMethod: PaymentMethod, cashReceived?: number) => Order;
  updateOrder: (updatedOrder: Order) => void;
  deleteOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  
  // Menu Management
  addMenuItem: (itemData: Omit<MenuItem, 'id' | 'soldCount'>) => MenuItem;
  updateMenuItem: (updatedItem: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  
  // Account management
  updateAccountName: (newName: string) => void;
  
  // Store Settings
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'gudeg58_user_session',
  ACCOUNTS: 'gudeg58_user_accounts',
  MENU: 'gudeg58_menu_items',
  ORDERS: 'gudeg58_orders',
  STORE: 'gudeg58_store_info',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Accounts state persisted in localStorage
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure cashier PIN is 6601
        return parsed.map((a: UserAccount) => a.role === 'KASIR' ? { ...a, pin: '6601' } : a);
      }
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  // Current user starts as null to display the login screen first
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE);
      return saved ? JSON.parse(saved) : INITIAL_STORE_INFO;
    } catch {
      return INITIAL_STORE_INFO;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [activeTab, setActiveTab] = useState<'pos' | 'menu' | 'history' | 'dashboard' | 'owner'>('pos');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [customerName, setCustomerName] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
    } catch (e) {
      console.error(e);
    }
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(storeInfo));
    } catch (e) {
      console.error(e);
    }
  }, [storeInfo]);

  // Auth functions
  const login = (accountId: string, pin: string): boolean => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc && acc.pin === pin) {
      setCurrentUser(acc);
      if (acc.role === 'PEMILIK') {
        setActiveTab('owner');
      } else {
        setActiveTab('pos');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    clearCart();
  };

  // Cart Management
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, quantity: qty } : c))
    );
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercentage(0);
    setCustomerName('');
  };

  // Order Completion
  const completeOrder = (paymentMethod: PaymentMethod, cashReceived?: number): Order => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const todayOrdersCount = orders.filter((o) => o.date === dateStr).length + 1;
    const paddedOrderNum = String(todayOrdersCount).padStart(4, '0');
    const orderId = `GDG-${dateStr.replace(/-/g, '')}-${paddedOrderNum}`;

    let subtotal = 0;
    let totalCost = 0;

    const orderItems = cart.map((c) => {
      const itemSub = c.menuItem.price * c.quantity;
      const itemCost = c.menuItem.costPrice * c.quantity;
      subtotal += itemSub;
      totalCost += itemCost;

      return {
        id: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price,
        costPrice: c.menuItem.costPrice,
        quantity: c.quantity,
        subtotal: itemSub,
        notes: c.notes,
        image: c.menuItem.image,
        category: c.menuItem.category,
      };
    });

    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = Math.round((afterDiscount * taxPercentage) / 100);
    const grandTotal = afterDiscount + taxAmount;
    const profit = grandTotal - totalCost;

    let change = 0;
    if (paymentMethod === 'TUNAI' && cashReceived) {
      change = Math.max(0, cashReceived - grandTotal);
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber: todayOrdersCount,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      cashierName: currentUser?.name || 'Kasir Gudeg 58',
      cashierId: currentUser?.id || 'usr_kasir_1',
      orderType,
      tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
      customerName: customerName.trim() || undefined,
      items: orderItems,
      subtotal,
      discountPercentage,
      discountAmount,
      taxPercentage,
      taxAmount,
      total: grandTotal,
      totalCost,
      profit,
      paymentMethod,
      cashReceived: paymentMethod === 'TUNAI' ? cashReceived : undefined,
      change: paymentMethod === 'TUNAI' ? change : undefined,
      status: 'COMPLETED',
    };

    // Update menu soldCount & stock
    setMenuItems((prev) =>
      prev.map((menu) => {
        const cartItem = cart.find((c) => c.menuItem.id === menu.id);
        if (cartItem) {
          return {
            ...menu,
            soldCount: menu.soldCount + cartItem.quantity,
            stock: Math.max(0, menu.stock - cartItem.quantity),
          };
        }
        return menu;
      })
    );

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Clear cart
    clearCart();

    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Menu Management
  const addMenuItem = (itemData: Omit<MenuItem, 'id' | 'soldCount'>): MenuItem => {
    const newItem: MenuItem = {
      ...itemData,
      id: `menu_${Date.now()}`,
      soldCount: 0,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    // Also update cart if item is currently in cart
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === updatedItem.id
          ? { ...c, menuItem: updatedItem }
          : c
      )
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    setCart((prev) => prev.filter((c) => c.menuItem.id !== id));
  };

  const updateAccountName = (newName: string) => {
    if (!currentUser || !newName.trim()) return;
    const cleanName = newName.trim();
    
    // Update accounts list
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentUser.id ? { ...acc, name: cleanName } : acc))
    );

    // Update active user session
    setCurrentUser((prev) => (prev ? { ...prev, name: cleanName } : null));
  };

  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    setStoreInfo((prev) => ({ ...prev, ...info }));
  };

  const resetToDefaultData = () => {
    setMenuItems(INITIAL_MENU);
    setOrders(INITIAL_ORDERS);
    setStoreInfo(INITIAL_STORE_INFO);
    setAccounts(INITIAL_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.MENU);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.STORE);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        accounts,
        storeInfo,
        menuItems,
        orders,
        cart,
        orderType,
        tableNumber,
        customerName,
        discountPercentage,
        taxPercentage,
        activeTab,
        setCurrentUser,
        setActiveTab,
        login,
        logout,
        setOrderType,
        setTableNumber,
        setCustomerName,
        setDiscountPercentage,
        setTaxPercentage,
        addToCart,
        updateCartQuantity,
        updateCartNotes,
        removeFromCart,
        clearCart,
        completeOrder,
        updateOrder,
        deleteOrder,
        cancelOrder,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        updateAccountName,
        updateStoreInfo,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
