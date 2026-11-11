import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatNumber, formatRupiah, formatDateIndo } from '../utils/formatters';
import { exportOrdersToExcel } from '../utils/excelExport';
import { 
  ShieldCheck, 
  DollarSign, 
  Percent, 
  Wallet, 
  Users, 
  Download, 
  Save, 
  Store, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Receipt,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';

export const OwnerDashboard: React.FC = () => {
  const { orders, menuItems, storeInfo, updateStoreInfo, resetToDefaultData } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'this_month' | 'all'>('this_month');
  const [storeAddressInput, setStoreAddressInput] = useState(storeInfo.address);
  const [storePhoneInput, setStorePhoneInput] = useState(storeInfo.phone);
  const [storeSloganInput, setStoreSloganInput] = useState(storeInfo.slogan);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Filter completed orders
  const validOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    return orders.filter((o) => {
      if (o.status === 'CANCELLED') return false;
      if (dateFilter === 'today') return o.date === todayStr;
      if (dateFilter === 'this_month') return o.date.startsWith(currentMonthStr);
      return true;
    });
  }, [orders, dateFilter]);

  // Financial Calculations
  const grossRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.total, 0);
  }, [validOrders]);

  const totalCostHPP = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.totalCost, 0);
  }, [validOrders]);

  const estimatedProfit = grossRevenue - totalCostHPP;
  const profitMarginPercent = grossRevenue > 0 ? ((estimatedProfit / grossRevenue) * 100).toFixed(1) : '0';

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let tunai = 0;
    let qris = 0;
    let debit = 0;
    let transfer = 0;

    validOrders.forEach((o) => {
      if (o.paymentMethod === 'TUNAI') tunai += o.total;
      else if (o.paymentMethod === 'QRIS') qris += o.total;
      else if (o.paymentMethod === 'DEBIT') debit += o.total;
      else if (o.paymentMethod === 'TRANSFER') transfer += o.total;
    });

    return { tunai, qris, debit, transfer, nonTunai: qris + debit + transfer };
  }, [validOrders]);

  // Cashier Performance Analysis
  const cashierStats = useMemo(() => {
    const map = new Map<string, { name: string; orderCount: number; revenue: number; cashCollected: number }>();

    validOrders.forEach((o) => {
      const c = map.get(o.cashierId) || {
        name: o.cashierName,
        orderCount: 0,
        revenue: 0,
        cashCollected: 0,
      };
      c.orderCount += 1;
      c.revenue += o.total;
      if (o.paymentMethod === 'TUNAI') {
        c.cashCollected += o.total;
      }
      map.set(o.cashierId, c);
    });

    return Array.from(map.values());
  }, [validOrders]);

  // Order Type Breakdown
  const orderTypeStats = useMemo(() => {
    let dineIn = 0;
    let takeAway = 0;
    let delivery = 0;
    let ojol = 0;

    validOrders.forEach((o) => {
      if (o.orderType === 'DINE_IN') dineIn += 1;
      else if (o.orderType === 'TAKE_AWAY') takeAway += 1;
      else if (o.orderType === 'DELIVERY') delivery += 1;
      else if (o.orderType === 'OJOL') ojol += 1;
    });

    return { dineIn, takeAway, delivery, ojol, total: validOrders.length };
  }, [validOrders]);

  // Export to Excel (.xls) Function
  const handleExportXls = () => {
    exportOrdersToExcel(validOrders, storeInfo, `Laporan_Keuangan_Gudeg58_${dateFilter}`);
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreInfo({
      address: storeAddressInput.trim(),
      phone: storePhoneInput.trim(),
      slogan: storeSloganInput.trim(),
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="flex-1 bg-[#f7f6f0] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner for Owner */}
        <div className="bg-gradient-to-r from-[#143f23] via-[#1a4f2d] to-[#0f2e1a] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Dasbor Eksekutif Pemilik Warung Gudeg 58
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Akses Owner
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Laporan laba bersih, rekonsiliasi setoran kas kasir, omzet real-time Skylight Plaza Magelang.
              </p>
            </div>
          </div>

          {/* Date Filter & Export Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === 'today' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:text-amber-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('this_month')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === 'this_month' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:text-amber-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dateFilter === 'all' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:text-amber-200'
                }`}
              >
                Semua
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sinkronkan laporan pembukuan ke Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleExportXls}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh Laporan Keuangan dalam format Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor File Penjualan (.xls)</span>
            </button>
          </div>
        </div>

        {/* Total Penjualan (Omzet) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Penjualan (Omzet)
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono tabular-nums">
              {formatRupiah(grossRevenue)}
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Penerimaan dari <strong>{validOrders.length} transaksi</strong> nota sah
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-xs text-slate-500 block font-medium">Status Toko</span>
            <span className="text-sm font-bold text-[#143f23]">Warung Gudeg 58</span>
            <span className="text-xs text-slate-400 block mt-0.5">Skylight Plaza Magelang</span>
          </div>
        </div>

        {/* 2-Column Split: Rekonsiliasi Kas Kasir & Performa Kasir */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7-cols: Rekonsiliasi Uang Fisik vs Digital (QRIS) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rekonsiliasi Kas Masuk & Saldo Setoran
                </h3>
                <p className="text-xs text-slate-500">
                  Pemilik dapat memverifikasi fisik uang tunai di laci kasir vs transfer otomatis.
                </p>
              </div>
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Uang Tunai di Laci Kasir */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
                  <span>Uang Tunai Fisik di Laci</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-mono">
                    Wajib Disetor
                  </span>
                </div>
                <div className="text-xl font-extrabold text-amber-950 font-mono tabular-nums">
                  {formatRupiah(paymentBreakdown.tunai)}
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Total uang cash yang harus diterima pemilik dari shift kasir hari ini.
                </p>
              </div>

              {/* Uang Digital Masuk Rekening (QRIS / EDC / Transfer) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
                  <span>Non-Tunai (QRIS & EDC)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full font-mono">
                    Otomatis Masuk Bank
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#143f23] font-mono tabular-nums">
                  {formatRupiah(paymentBreakdown.nonTunai)}
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  QRIS: {formatRupiah(paymentBreakdown.qris)} · EDC: {formatRupiah(paymentBreakdown.debit)}
                </p>
              </div>
            </div>

            {/* Performance table by Cashier */}
            <div className="pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Performa & Setoran Tiap Kasir
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {cashierStats.map((c, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.orderCount} transaksi diselesaikan</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-900">{formatRupiah(c.revenue)}</p>
                      <p className="text-[11px] text-amber-800 font-mono">
                        Setoran Tunai: <strong>{formatRupiah(c.cashCollected)}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 5-cols: Tipe Pesanan & Pengaturan Gerai */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tipe Pesanan Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Distribusi Jalur Penjualan
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Dine In (Makan di Tempat Skylight Plaza)</span>
                  <span className="font-bold font-mono text-slate-900">{orderTypeStats.dineIn} nota</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Take Away (Besek & Bungkus Pulang)</span>
                  <span className="font-bold font-mono text-slate-900">{orderTypeStats.takeAway} nota</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Delivery Kantor & Katering</span>
                  <span className="font-bold font-mono text-slate-900">{orderTypeStats.delivery} nota</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-700 font-medium">Ojek Online (Gojek / Grab / ShopeeFood)</span>
                  <span className="font-bold font-mono text-slate-900">{orderTypeStats.ojol} nota</span>
                </div>
              </div>
            </div>

            {/* Pengaturan Toko Warung Gudeg 58 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#143f23]" />
                <h3 className="text-base font-bold text-slate-900">
                  Informasi Resmi Gerai
                </h3>
              </div>

              {saveSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Informasi gerai berhasil diperbarui!</span>
                </div>
              )}

              <form onSubmit={handleSaveStoreInfo} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Alamat Gerai (Tampil di Nota & PDF)
                  </label>
                  <input
                    type="text"
                    value={storeAddressInput}
                    onChange={(e) => setStoreAddressInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#143f23]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor Telepon / WhatsApp Gerai
                  </label>
                  <input
                    type="text"
                    value={storePhoneInput}
                    onChange={(e) => setStorePhoneInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#143f23]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Slogan Resmi Gudeg 58
                  </label>
                  <input
                    type="text"
                    value={storeSloganInput}
                    onChange={(e) => setStoreSloganInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#143f23]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#143f23] hover:bg-[#1a4f2d] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Info Gerai
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};
