import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderType, PaymentMethod } from '../types';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import { exportOrdersToExcel } from '../utils/excelExport';
import { 
  Search, 
  Receipt, 
  Printer, 
  Download, 
  Calendar, 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Package, 
  Ban, 
  CheckCircle,
  Eye,
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';

export const TransactionHistory: React.FC = () => {
  const { orders, storeInfo, cancelOrder, updateOrder, deleteOrder, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Password Authorization State for Edit & Delete (Password: 6808)
  const [authAction, setAuthAction] = useState<{ type: 'EDIT' | 'DELETE'; order: Order } | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editOrderType, setEditOrderType] = useState<OrderType>('DINE_IN');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [editStatus, setEditStatus] = useState<'COMPLETED' | 'CANCELLED'>('COMPLETED');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchMethod = methodFilter === 'ALL' || o.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [orders, searchQuery, methodFilter, statusFilter]);

  // Request handlers that enforce password authorization (6808)
  const handleRequestEdit = (order: Order) => {
    setAuthAction({ type: 'EDIT', order });
    setAuthPassword('');
    setAuthError('');
  };

  const handleRequestDelete = (order: Order) => {
    setAuthAction({ type: 'DELETE', order });
    setAuthPassword('');
    setAuthError('');
  };

  // Password verification
  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authAction) return;

    if (authPassword === '6808') {
      const targetOrder = authAction.order;
      const actionType = authAction.type;
      setAuthAction(null);
      setAuthPassword('');
      setAuthError('');

      if (actionType === 'EDIT') {
        setEditingOrder(targetOrder);
        setEditCustomerName(targetOrder.customerName || '');
        setEditTableNumber(targetOrder.tableNumber || '');
        setEditOrderType(targetOrder.orderType);
        setEditPaymentMethod(targetOrder.paymentMethod);
        setEditStatus(targetOrder.status);
      } else if (actionType === 'DELETE') {
        deleteOrder(targetOrder.id);
      }
    } else {
      setAuthError('Password salah. Akses ditolak.');
      setAuthPassword('');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const updated: Order = {
      ...editingOrder,
      customerName: editCustomerName.trim() || undefined,
      tableNumber: editOrderType === 'DINE_IN' ? (editTableNumber.trim() || '01') : undefined,
      orderType: editOrderType,
      paymentMethod: editPaymentMethod,
      status: editStatus,
    };

    updateOrder(updated);
    setEditingOrder(null);
  };

  const handleExportXls = () => {
    exportOrdersToExcel(filteredOrders, storeInfo, 'Riwayat_Penjualan_Gudeg58');
  };

  return (
    <div className="flex-1 bg-[#f7f6f0] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Riwayat Nota & Transaksi Kasir
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold font-mono">
                {orders.length} Transaksi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar seluruh nota penjualan Warung Gudeg 58, cetak ulang struk thermal, edit pesanan, dan ekspor ke Excel (.xls).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              title="Sinkronkan data riwayat transaksi langsung ke Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Sinkron Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleExportXls}
              className="px-3.5 py-2.5 bg-[#143f23] hover:bg-[#1a4f2d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              title="Ekspor seluruh riwayat penjualan ke format Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Ekspor File Penjualan (.xls)</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. nota, nama kasir, nama pelanggan, menu..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Payment Method filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">Semua Metode Bayar</option>
              <option value="TUNAI">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
              <option value="DEBIT">Debit EDC</option>
              <option value="TRANSFER">Transfer</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="COMPLETED">Selesai (Sah)</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">No. Nota</th>
                  <th className="py-3.5 px-4">Waktu & Tanggal</th>
                  <th className="py-3.5 px-4">Tipe & Kasir</th>
                  <th className="py-3.5 px-4">Rincian Item</th>
                  <th className="py-3.5 px-4 text-center">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Bayar</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isCancelled = order.status === 'CANCELLED';
                  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {order.id}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{order.date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.time} WIB</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {order.orderType === 'DINE_IN' ? `Dine In (Meja ${order.tableNumber || '-'})` :
                           order.orderType === 'TAKE_AWAY' ? 'Bungkus' :
                           order.orderType === 'DELIVERY' ? 'Delivery' : 'Ojol'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Kasir: {order.cashierName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total {totalItems} porsi
                          {order.customerName && ` · Pelanggan: ${order.customerName}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-700">
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(order.total)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isCancelled ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </td>

                      {/* Aksi: Struk, Edit, Hapus (dengan otorisasi password) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {/* 1. Lihat Struk */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1.5 bg-[#143f23] hover:bg-[#1a4f2d] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Lihat Struk & Cetak / Download PDF"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Struk</span>
                        </button>

                        {/* 2. Menu Edit Nota (Memerlukan Otorisasi Password) */}
                        <button
                          type="button"
                          onClick={() => handleRequestEdit(order)}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Edit Rincian Nota (Perlu Password)"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* 3. Menu Hapus Nota (Memerlukan Otorisasi Password) */}
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(order)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Hapus Nota Permanen (Perlu Password)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ada nota transaksi yang sesuai dengan filter.
            </div>
          )}
        </div>

      </div>

      {/* Modal Otorisasi Password untuk Edit & Hapus (Password Rahasia) */}
      {authAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#143f23] text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Otorisasi Akses Riwayat</h4>
              </div>
              <button
                onClick={() => setAuthAction(null)}
                className="p-1 text-slate-300 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPassword} className="p-5 space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-full mb-2 ${
                  authAction.type === 'DELETE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {authAction.type === 'DELETE' ? <Trash2 className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <h5 className="font-bold text-sm text-slate-900">
                  {authAction.type === 'DELETE' ? 'Konfirmasi Hapus Nota' : 'Konfirmasi Edit Nota'}
                </h5>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan password otorisasi untuk melakukan {authAction.type === 'DELETE' ? 'penghapusan' : 'perubahan'} pada nota <strong className="font-mono text-slate-800">#{authAction.order.id}</strong>.
                </p>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Password Input (No hint displayed anywhere) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Password Otorisasi
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Masukkan password..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:bg-white focus:ring-2 focus:ring-[#143f23] focus:outline-hidden"
                    autoFocus
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthAction(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    authAction.type === 'DELETE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#143f23] hover:bg-[#1a4f2d]'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Lanjutkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi Nota */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#143f23] text-white">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Edit Data Nota #{editingOrder.id}</h4>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 text-slate-300 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Order Metadata summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal/Jam:</span>
                  <span className="font-mono font-medium">{editingOrder.date} {editingOrder.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir:</span>
                  <span className="font-medium">{editingOrder.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Transaksi:</span>
                  <span className="font-mono font-bold text-[#143f23]">{formatRupiah(editingOrder.total)}</span>
                </div>
              </div>

              {/* Tipe Pesanan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tipe Pesanan
                </label>
                <select
                  value={editOrderType}
                  onChange={(e) => setEditOrderType(e.target.value as OrderType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                >
                  <option value="DINE_IN">Dine In (Makan di Tempat)</option>
                  <option value="TAKE_AWAY">Take Away (Bungkus / Besek)</option>
                  <option value="DELIVERY">Delivery Kantor / Pesanan</option>
                  <option value="OJOL">Ojek Online (Gojek / Grab / ShopeeFood)</option>
                </select>
              </div>

              {/* Nomor Meja jika Dine In */}
              {editOrderType === 'DINE_IN' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Meja
                  </label>
                  <input
                    type="text"
                    value={editTableNumber}
                    onChange={(e) => setEditTableNumber(e.target.value)}
                    placeholder="Contoh: 01, 02, VIP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                  />
                </div>
              )}

              {/* Nama Pelanggan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Pelanggan (opsional)
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder="Nama customer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                >
                  <option value="TUNAI">Tunai (Cash)</option>
                  <option value="QRIS">QRIS Gudeg 58</option>
                  <option value="DEBIT">Debit EDC</option>
                  <option value="TRANSFER">Transfer Rekening</option>
                </select>
              </div>

              {/* Status Transaksi */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Status Transaksi
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'COMPLETED' | 'CANCELLED')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                >
                  <option value="COMPLETED">Selesai (Sah)</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#143f23] hover:bg-[#1a4f2d] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Struk Modal */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          store={storeInfo}
          onClose={() => setSelectedOrder(null)}
          onNewOrder={() => setSelectedOrder(null)}
        />
      )}

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};
