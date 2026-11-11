import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { exportOrdersToExcel } from '../utils/excelExport';
import { 
  DollarSign, 
  Award, 
  PieChart as PieIcon, 
  TrendingUp, 
  FileSpreadsheet,
  Calendar,
  Sparkles
} from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';

// Palette of distinctive culinary colors for all menu items
const PIE_COLORS = [
  '#15803d', '#ca8a04', '#b45309', '#0369a1', '#4338ca', 
  '#be185d', '#047857', '#e11d48', '#d97706', '#65a30d',
  '#0284c7', '#7c3aed', '#9333ea', '#c026d3', '#ea580c', 
  '#0d9488', '#4b5563', '#16a34a', '#854d0e', '#0f766e'
];

interface PieSliceData {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  percent: number;
  color: string;
  startPercent: number;
  endPercent: number;
  image: string;
}

export const SalesDashboard: React.FC = () => {
  const { orders, menuItems, storeInfo } = useApp();

  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [hoveredSlice, setHoveredSlice] = useState<PieSliceData | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Filter valid completed orders
  const validOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return orders.filter((order) => {
      if (order.status === 'CANCELLED') return false;

      if (dateRange === 'today') {
        return order.date === todayStr;
      }
      if (dateRange === '7days') {
        const past7Days = new Date();
        past7Days.setDate(past7Days.getDate() - 7);
        return order.timestamp >= past7Days.getTime();
      }
      if (dateRange === '30days') {
        const past30Days = new Date();
        past30Days.setDate(past30Days.getDate() - 30);
        return order.timestamp >= past30Days.getTime();
      }
      return true;
    });
  }, [orders, dateRange]);

  // Total Penjualan
  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.total, 0);
  }, [validOrders]);

  // Calculate Sales per Menu Item across all dagangan
  const { menuPieData, bestSellersList } = useMemo(() => {
    // Map existing orders revenue by menu item id
    const orderItemMap = new Map<string, { quantity: number; revenue: number }>();
    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cur = orderItemMap.get(item.id) || { quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.subtotal;
        orderItemMap.set(item.id, cur);
      });
    });

    // Build data for ALL menu items in dagangan
    let runningRevenueTotal = 0;
    const allItems = menuItems.map((menu, idx) => {
      const orderStat = orderItemMap.get(menu.id);
      const quantity = orderStat ? orderStat.quantity : 0;
      const revenue = orderStat ? orderStat.revenue : 0;
      runningRevenueTotal += revenue;

      return {
        id: menu.id,
        name: menu.name,
        category: menu.category,
        quantity,
        revenue,
        image: menu.image,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      };
    });

    // Active items or proportional fallback
    const activeItems = allItems.filter((i) => i.revenue > 0);
    const pieSource = activeItems.length > 0 ? activeItems : allItems.slice(0, 8).map(i => ({ ...i, revenue: 1000 }));
    const pieTotal = pieSource.reduce((acc, i) => acc + i.revenue, 0);

    let cumulativePercent = 0;
    const slices: PieSliceData[] = pieSource.map((item) => {
      const percent = (item.revenue / pieTotal);
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      const endPercent = cumulativePercent;

      return {
        ...item,
        percent: percent * 100,
        startPercent,
        endPercent,
      };
    });

    // Best sellers sorted descending by revenue/quantity
    const sortedBest = [...allItems].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.revenue - a.revenue;
    });

    return {
      menuPieData: slices,
      bestSellersList: sortedBest.filter((i) => i.quantity > 0 || i.revenue > 0),
    };
  }, [validOrders, menuItems]);

  // SVG Helper to calculate coordinate on circle
  const getCoordinates = (percent: number, radius: number, cx = 160, cy = 160) => {
    const angle = (percent - 0.25) * 2 * Math.PI;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const activeSliceInfo = hoveredSlice || (menuPieData.length > 0 ? menuPieData[0] : null);

  const handleExportXls = () => {
    exportOrdersToExcel(validOrders, storeInfo, `Laporan_Penjualan_Gudeg58_${dateRange}`);
  };

  return (
    <div className="flex-1 bg-[#f7f6f0] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CSS selector 1: Top Header & Range Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Dashboard Penjualan & Terlaris
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Warung Gudeg 58
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ringkasan total penjualan, menu terlaris, dan grafik pay distribusi seluruh menu dagangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setDateRange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === 'today'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === '7days'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === '30days'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Google Sheets Sync Button */}
            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sinkronkan data pembukuan & menu terlaris ke Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Google Sheets</span>
            </button>

            {/* Export File Riwayat Penjualan format .xls */}
            <button
              type="button"
              onClick={handleExportXls}
              className="px-3 py-2 bg-[#143f23] hover:bg-[#1a4f2d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh Riwayat Penjualan dalam format Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Ekspor Excel (.xls)</span>
            </button>
          </div>
        </div>

        {/* 1. TOTAL PENJUALAN CARD */}
        <div className="bg-gradient-to-r from-[#143f23] via-[#1a4f2d] to-[#0f2e1a] text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Total Penjualan ({dateRange === 'today' ? 'Hari Ini' : dateRange === '7days' ? '7 Hari Terakhir' : dateRange === '30days' ? '30 Hari' : 'Semua Waktu'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 font-mono">
                {validOrders.length} Nota Sah
              </span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tabular-nums text-white mt-1.5 tracking-tight">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-xs text-emerald-200/90 mt-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Omzet bersih kasir Warung Gudeg 58 · Skylight Plaza Kota Magelang</span>
            </p>
          </div>

          <div className="sm:border-l sm:border-emerald-700/60 sm:pl-6 text-left sm:text-right shrink-0">
            <span className="text-xs text-emerald-200 block font-medium">Rata-rata per Nota</span>
            <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">
              {validOrders.length > 0 ? formatRupiah(Math.round(totalRevenue / validOrders.length)) : 'Rp 0'}
            </span>
            <span className="text-[11px] text-emerald-300/80 block mt-1">
              Total {validOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0)} porsi terjual
            </span>
          </div>
        </div>

        {/* 2. GRAFIK PAY (PIE / DONUT CHART) SELURUH MENU DAGANGAN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Grafik Pay (Pie Chart) Seluruh Menu Dagangan
                </h3>
                <p className="text-xs text-slate-500">
                  Visual diagram lingkaran persentase kontribusi seluruh menu terhadap omzet
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {menuItems.length} Ragam Menu Dagangan
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual SVG Donut / Pie Chart */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
              <div className="relative w-[290px] h-[290px] sm:w-[320px] sm:h-[320px] select-none">
                <svg viewBox="0 0 320 320" className="w-full h-full transform hover:scale-102 transition-transform duration-200">
                  {menuPieData.map((slice) => {
                    const isHovered = hoveredSlice?.id === slice.id;
                    const outerRadius = isHovered ? 145 : 138;
                    const innerRadius = 78;

                    if (slice.percent >= 99.9) {
                      return (
                        <circle
                          key={slice.id}
                          cx="160"
                          cy="160"
                          r="138"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="60"
                          onMouseEnter={() => setHoveredSlice(slice)}
                          className="cursor-pointer transition-all"
                        />
                      );
                    }

                    const startOuter = getCoordinates(slice.startPercent, outerRadius);
                    const endOuter = getCoordinates(slice.endPercent, outerRadius);
                    const endInner = getCoordinates(slice.endPercent, innerRadius);
                    const startInner = getCoordinates(slice.startPercent, innerRadius);
                    const largeArcFlag = slice.endPercent - slice.startPercent > 0.5 ? 1 : 0;

                    const pathData = [
                      `M ${startOuter.x} ${startOuter.y}`,
                      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
                      `L ${endInner.x} ${endInner.y}`,
                      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
                      'Z',
                    ].join(' ');

                    return (
                      <path
                        key={slice.id}
                        d={pathData}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredSlice(slice)}
                        className="cursor-pointer transition-all duration-150 hover:opacity-95"
                      />
                    );
                  })}
                </svg>

                {/* Central Readout */}
                <div className="absolute inset-0 m-auto w-[150px] h-[150px] rounded-full bg-white shadow-inner border border-slate-100 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
                  {activeSliceInfo ? (
                    <>
                      <span className="text-[10px] font-bold text-slate-500 uppercase line-clamp-1">
                        {activeSliceInfo.category}
                      </span>
                      <span className="text-sm font-extrabold text-[#143f23] line-clamp-1 leading-tight my-0.5">
                        {activeSliceInfo.name}
                      </span>
                      <span className="text-xs font-mono font-black text-amber-600 tabular-nums">
                        {activeSliceInfo.percent.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 mt-0.5">
                        {formatRupiah(activeSliceInfo.revenue)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-slate-400">TOTAL PENJUALAN</span>
                      <span className="text-xs font-mono font-black text-[#143f23] mt-0.5">
                        {formatRupiah(totalRevenue)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Sentuh atau sorot potongan grafik pay untuk melihat rincian tiap menu.
              </p>
            </div>

            {/* Interactive Menu Dagangan Legend */}
            <div className="lg:col-span-7 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs font-bold text-slate-600">
                <span>Seluruh Menu Dagangan</span>
                <span>Porsi & Persentase</span>
              </div>

              <div className="space-y-1.5">
                {menuPieData.map((item) => {
                  const isHovered = hoveredSlice?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredSlice(item)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer text-xs ${
                        isHovered
                          ? 'bg-white shadow-xs border border-amber-300 ring-1 ring-amber-300'
                          : 'hover:bg-white/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.category} · {formatRupiah(item.revenue)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 block tabular-nums">
                          {item.percent.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.quantity} porsi
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* 3. MENU TERLARIS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Menu Terlaris Gudeg 58
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Diurutkan Berdasarkan Penjualan Tertinggi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bestSellersList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center col-span-3">
                Belum ada transaksi pada periode yang dipilih.
              </p>
            ) : (
              bestSellersList.slice(0, 9).map((item, idx) => {
                const maxQty = bestSellersList[0]?.quantity || 1;
                const percentBar = Math.round((item.quantity / maxQty) * 100);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200/90 hover:shadow-xs transition-all flex items-start gap-3"
                  >
                    {/* Rank Badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 font-black' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </div>

                    {/* Food Photo */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                        {item.category}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#143f23]">
                          {formatRupiah(item.revenue)}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {item.quantity} porsi
                        </span>
                      </div>

                      {/* Mini Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1.5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-[#143f23] h-full rounded-full"
                          style={{ width: `${percentBar}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
