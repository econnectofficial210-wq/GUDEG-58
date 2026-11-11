import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, Category, OrderType, Order } from '../types';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  UtensilsCrossed, 
  Package, 
  Truck, 
  Edit3, 
  X, 
  CreditCard, 
  Tag
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Semua',
  'Paket Gudeg',
  'Besek & Kendil',
  'Lauk Tambahan',
  'Minuman Tradisional',
  'Camilan & Tambahan',
];

const PRESET_TABLES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'VIP'];

export const PosMain: React.FC = () => {
  const { 
    menuItems, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    updateCartNotes, 
    removeFromCart, 
    clearCart,
    orderType, 
    setOrderType,
    tableNumber, 
    setTableNumber,
    customerName, 
    setCustomerName,
    discountPercentage, 
    setDiscountPercentage,
    taxPercentage, 
    setTaxPercentage,
    storeInfo 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  
  // Note edit modal state
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [noteInputValue, setNoteInputValue] = useState<string>('');

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercentage) / 100);
  }, [subtotal, discountPercentage]);

  const afterDiscount = subtotal - discountAmount;

  const taxAmount = useMemo(() => {
    return Math.round((afterDiscount * taxPercentage) / 100);
  }, [afterDiscount, taxPercentage]);

  const grandTotal = afterDiscount + taxAmount;
  const totalItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  // Handle open note modal
  const handleOpenNoteModal = (itemId: string, name: string, currentNote?: string) => {
    setEditingNoteItem({ id: itemId, name, notes: currentNote || '' });
    setNoteInputValue(currentNote || '');
  };

  const handleSaveNote = () => {
    if (editingNoteItem) {
      updateCartNotes(editingNoteItem.id, noteInputValue.trim());
      setEditingNoteItem(null);
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setIsPaymentModalOpen(false);
    setCompletedOrder(order);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f7f6f0]">
      
      {/* LEFT PANE: Search, Category Tabs, Menu Grid (approx 65% width) */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-y-auto">
        
        {/* Top Control Bar: Search & Category Buttons */}
        <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu gudeg, besek, lauk, minuman..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#143f23] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs (Segmented functional controls) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = cat === 'Semua' 
                ? menuItems.length 
                : menuItems.filter((m) => m.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#143f23] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredMenu.map((item) => {
            const inCart = cart.find((c) => c.menuItem.id === item.id);
            const isOutOfStock = !item.isAvailable || item.stock <= 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isOutOfStock) addToCart(item);
                }}
                className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between text-left select-none ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 cursor-not-allowed'
                    : inCart
                    ? 'border-[#143f23] ring-2 ring-[#143f23]/20 shadow-md cursor-pointer hover:border-amber-500'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md cursor-pointer'
                }`}
              >
                {/* Image Container with measured overlay */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback icon placeholder if photo link fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Category subtle label on image */}
                  <div className="absolute top-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {item.category}
                  </div>

                  {/* Stock or Cart Indicator */}
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                      Stok Habis
                    </div>
                  ) : inCart ? (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-md shadow-md">
                      {inCart.quantity} di keranjang
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-[#143f23] p-1.5 rounded-full shadow-md">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Price and Stock strip */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-[#143f23] font-mono tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium">
                      Sisa: <strong className="text-slate-700 font-mono">{item.stock}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMenu.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <UtensilsCrossed className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-600">Menu tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Cart & Checkout Ticket (approx 35% width, max-w-md on desktop) */}
      <div className="w-full md:w-[350px] lg:w-[420px] bg-white flex flex-col border-t md:border-t-0 md:border-l border-slate-200 shadow-lg shrink-0">
        
        {/* Ticket Header: Order Type & Table Selection */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
          
          {/* Order Type Tabs */}
          <div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  orderType === 'DINE_IN'
                    ? 'bg-white text-[#143f23] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dine In</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('TAKE_AWAY')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  orderType === 'TAKE_AWAY'
                    ? 'bg-white text-[#143f23] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bungkus</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  orderType === 'DELIVERY'
                    ? 'bg-white text-[#143f23] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('OJOL')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  orderType === 'OJOL'
                    ? 'bg-white text-[#143f23] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Ojol</span>
              </button>
            </div>
          </div>

          {/* Table / Customer details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {orderType === 'DINE_IN' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nomor Meja:
                </label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-[#143f23]"
                >
                  {PRESET_TABLES.map((tbl) => (
                    <option key={tbl} value={tbl}>
                      Meja {tbl}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nomor Order / Antrean:
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: A-12"
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#143f23]"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Nama Pelanggan (opsional):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Mas Danang"
                className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#143f23]"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Sentuh atau klik menu di sebelah kiri untuk menambahkan pesanan.
              </p>
            </div>
          ) : (
            cart.map((c) => {
              const itemTotal = c.menuItem.price * c.quantity;
              return (
                <div key={c.menuItem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {c.menuItem.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {formatRupiah(c.menuItem.price)} / {c.menuItem.unit || 'porsi'}
                    </p>

                    {/* Note pill if note exists */}
                    {c.notes ? (
                      <button
                        type="button"
                        onClick={() => handleOpenNoteModal(c.menuItem.id, c.menuItem.name, c.notes)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span className="italic truncate max-w-[150px]">{c.notes}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenNoteModal(c.menuItem.id, c.menuItem.name)}
                        className="mt-1 text-[10px] text-slate-400 hover:text-slate-700 underline block"
                      >
                        + Catatan (opsional)
                      </button>
                    )}
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums mb-1">
                      {formatRupiah(itemTotal)}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(c.menuItem.id, c.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-white rounded transition-colors text-xs font-bold"
                      >
                        {c.quantity === 1 ? <Trash2 className="w-3 h-3 text-rose-600" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(c.menuItem.id, c.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-white rounded transition-colors text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Calculations & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            
            {/* Quick Discount & Tax Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Diskon:</span>
                <div className="flex gap-1 ml-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercentage(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        discountPercentage === pct
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-600 font-medium">PB1 (10%):</span>
                <button
                  type="button"
                  onClick={() => setTaxPercentage(taxPercentage === 10 ? 0 : 10)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    taxPercentage === 10
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  {taxPercentage === 10 ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs border-t border-slate-200 pt-2 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemCount} item):</span>
                <span className="tabular-nums font-mono">{formatRupiah(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon Promo ({discountPercentage}%):</span>
                  <span className="tabular-nums font-mono">-{formatRupiah(discountAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak Restoran PB1 ({taxPercentage}%):</span>
                  <span className="tabular-nums font-mono">{formatRupiah(taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Bayar:</span>
                <span className="tabular-nums font-mono text-[#143f23] text-lg">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* Bottom Buttons: Clear & Checkout */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="py-3 px-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
                title="Batalkan Seluruh Pesanan"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="col-span-3 py-3 px-4 bg-gradient-to-r from-[#143f23] to-[#1c5530] hover:from-[#184c2a] hover:to-[#22663a] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Bayar Sekarang · {formatRupiah(grandTotal)}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Note Editing Modal */}
      {editingNoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900">Catatan Pesanan</h4>
              <button
                onClick={() => setEditingNoteItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-semibold">{editingNoteItem.name}</p>

            <textarea
              value={noteInputValue}
              onChange={(e) => setNoteInputValue(e.target.value)}
              placeholder="Contoh: Krecek pedas banget, kuah areh dipisah, jangan pakai bawang goreng..."
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#143f23] focus:bg-white focus:outline-hidden"
              autoFocus
            />

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#143f23] hover:bg-[#1a4f2d] rounded-xl"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Post-order Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          store={storeInfo}
          onClose={() => setCompletedOrder(null)}
          onNewOrder={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
};
