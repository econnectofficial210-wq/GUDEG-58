export type Category = 
  | 'Semua'
  | 'Paket Gudeg'
  | 'Besek & Kendil'
  | 'Lauk Tambahan'
  | 'Minuman Tradisional'
  | 'Camilan & Tambahan';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan) untuk hitung laba pemilik
  category: Category;
  image: string; // URL or base64 data URL (jpg/png)
  isAvailable: boolean;
  stock: number;
  soldCount: number;
  unit?: string; // porsi, besek, kendil, gelas
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY' | 'OJOL';

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'DEBIT' | 'TRANSFER';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  image?: string;
  category: Category;
}

export interface Order {
  id: string;
  orderNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  cashierName: string;
  cashierId: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  status: 'COMPLETED' | 'CANCELLED';
}

export type UserRole = 'KASIR' | 'PEMILIK';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  pin: string;
  avatar: string;
  shiftTitle: string;
}

export interface StoreInfo {
  name: string;
  brand: string;
  slogan: string;
  address: string;
  locationDetail: string;
  city: string;
  phone: string;
  logoUrl: string;
  footerNote: string;
  qrisName: string;
  taxRate: number; // e.g. 0 or 10
}
