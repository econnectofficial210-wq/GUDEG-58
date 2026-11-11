import { Order, StoreInfo } from '../types';
import { formatRupiah, formatNumber } from './formatters';

export function exportOrdersToExcel(orders: Order[], store: StoreInfo, filenamePrefix = 'Laporan_Penjualan_Gudeg58'): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.xls`;

  // Calculate summary totals
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'CANCELLED' ? sum + o.total : sum, 0);
  const totalCost = orders.reduce((sum, o) => o.status !== 'CANCELLED' ? sum + o.totalCost : sum, 0);
  const totalProfit = totalRevenue - totalCost;
  const completedCount = orders.filter(o => o.status !== 'CANCELLED').length;

  let tableRows = '';
  orders.forEach((order, idx) => {
    const isCancelled = order.status === 'CANCELLED';
    const itemsSummary = order.items.map(i => `${i.name} (${i.quantity}x)`).join(', ');
    const bgStyle = isCancelled ? 'background-color: #ffe4e6; color: #9f1239;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;');

    tableRows += `
      <tr style="${bgStyle}">
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px 8px;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\@';">${order.id}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${order.date}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${order.time}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${order.cashierName}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${order.orderType}${order.tableNumber ? ` (Meja ${order.tableNumber})` : ''}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${order.customerName || '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${itemsSummary}</td>
        <td style="text-align: right; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.subtotal}</td>
        <td style="text-align: right; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.discountAmount}</td>
        <td style="text-align: right; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.taxAmount}</td>
        <td style="text-align: right; font-weight: bold; color: #143f23; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.total}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #d1d5db; padding: 6px 8px;">${order.paymentMethod}</td>
        <td style="text-align: right; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.totalCost}</td>
        <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #d1d5db; padding: 6px 8px; mso-number-format:'\\#\\,\\#\\#0';">${order.profit}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px 8px; font-weight: bold; color: ${isCancelled ? '#b91c1c' : '#15803d'};">
          ${isCancelled ? 'Dibatalkan' : 'Selesai'}
        </td>
      </tr>
    `;
  });

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Riwayat Penjualan Gudeg 58</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1f2937; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #143f23; color: #ffffff; font-weight: bold; border: 1px solid #143f23; padding: 8px 10px; text-align: left; }
        td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 10pt; }
        .header-title { font-size: 16pt; font-weight: bold; color: #143f23; }
        .header-subtitle { font-size: 11pt; color: #4b5563; font-style: italic; }
        .summary-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="16" class="header-title">${store.name} - MAGELANG</td>
        </tr>
        <tr>
          <td colspan="16" class="header-subtitle">${store.address}, ${store.city} · Telp/WA: ${store.phone}</td>
        </tr>
        <tr>
          <td colspan="16" style="color: #6b7280; font-size: 10pt;">Laporan Riwayat Penjualan Sah · Tanggal Ekspor: ${dateStr}</td>
        </tr>
        <tr><td colspan="16"></td></tr>
        
        <!-- Summary Cards in Excel -->
        <tr>
          <td colspan="3" class="summary-box" style="padding: 10px; color: #065f46;">TOTAL OMZET PENJUALAN:</td>
          <td colspan="2" class="summary-box" style="padding: 10px; text-align: right; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0'; color: #143f23;">${totalRevenue}</td>
          <td colspan="3" class="summary-box" style="padding: 10px; color: #065f46;">ESTIMASI LABA BERSIH:</td>
          <td colspan="3" class="summary-box" style="padding: 10px; text-align: right; font-size: 12pt; mso-number-format:'\\#\\,\\#\\#0'; color: #047857;">${totalProfit}</td>
          <td colspan="3" class="summary-box" style="padding: 10px; color: #065f46;">TOTAL NOTA SELESAI:</td>
          <td colspan="2" class="summary-box" style="padding: 10px; text-align: center; font-size: 12pt; color: #143f23;">${completedCount} Nota</td>
        </tr>
        <tr><td colspan="16"></td></tr>

        <!-- Table Header -->
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">No</th>
            <th style="width: 130px;">No. Nota</th>
            <th style="width: 90px;">Tanggal</th>
            <th style="width: 70px;">Jam</th>
            <th style="width: 110px;">Petugas Kasir</th>
            <th style="width: 100px;">Tipe Order</th>
            <th style="width: 110px;">Pelanggan</th>
            <th style="width: 280px;">Rincian Item Menu</th>
            <th style="text-align: right; width: 95px;">Subtotal (Rp)</th>
            <th style="text-align: right; width: 85px;">Diskon (Rp)</th>
            <th style="text-align: right; width: 85px;">PB1 (Rp)</th>
            <th style="text-align: right; width: 110px; background-color: #0f341d;">Total Bayar (Rp)</th>
            <th style="text-align: center; width: 90px;">Metode</th>
            <th style="text-align: right; width: 95px;">HPP Modal (Rp)</th>
            <th style="text-align: right; width: 95px;">Laba (Rp)</th>
            <th style="text-align: center; width: 85px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
