import { getAccessToken } from './googleAuth';
import { Order, MenuItem, StoreInfo } from '../types';

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  ordersCount: number;
  totalRevenue: number;
  updatedAt: string;
}

const DEFAULT_SHEET_TITLE = 'Warung Gudeg 58 - Pembukuan & Laporan Penjualan (Magelang)';

/**
 * Sync all orders, best sellers, and financial summary to Google Sheets.
 * Requires user confirmation prior to calling this function.
 */
export const syncToGoogleSheets = async (
  orders: Order[],
  menuItems: MenuItem[],
  storeInfo: StoreInfo
): Promise<SyncResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Sesi Google belum terhubung. Silakan login dengan Google.');
  }

  // 1. Search for existing spreadsheet in user's Drive
  let spreadsheetId: string | null = null;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${DEFAULT_SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      spreadsheetId = searchData.files[0].id;
    }
  }

  // 2. If not found, create new spreadsheet
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: DEFAULT_SHEET_TITLE,
        },
        sheets: [
          { properties: { title: 'Riwayat Transaksi' } },
          { properties: { title: 'Menu Terlaris' } },
          { properties: { title: 'Ringkasan Finansial' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
  } else {
    // Ensure all required sheets exist in existing spreadsheet
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const existingTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties?.title);
      const neededTitles = ['Riwayat Transaksi', 'Menu Terlaris', 'Ringkasan Finansial'];
      const sheetsToAdd = neededTitles.filter((t) => !existingTitles.includes(t));

      if (sheetsToAdd.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: sheetsToAdd.map((title) => ({
              addSheet: { properties: { title } },
            })),
          }),
        });
      }
    }
  }

  if (!spreadsheetId) {
    throw new Error('Gagal mendapatkan ID Spreadsheet.');
  }

  // 3. Prepare Tab 1: Riwayat Transaksi Data
  const orderHeaders = [
    'No. Nota',
    'Tanggal',
    'Waktu (WIB)',
    'Petugas Kasir',
    'Tipe Pesanan',
    'Meja / Pelanggan',
    'Daftar Menu & Qty',
    'Total Porsi',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Total Bayar (Rp)',
    'Metode Pembayaran',
    'Status Nota',
  ];

  const orderRows = orders.map((o) => {
    const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemList = o.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ');
    const detailCustomer = o.orderType === 'DINE_IN' 
      ? `Meja ${o.tableNumber || '-'}${o.customerName ? ` (${o.customerName})` : ''}`
      : (o.customerName || '-');

    return [
      o.id,
      o.date,
      o.time,
      o.cashierName,
      o.orderType === 'DINE_IN' ? 'Makan di Tempat' : o.orderType === 'TAKE_AWAY' ? 'Bungkus' : o.orderType === 'DELIVERY' ? 'Delivery' : 'Ojol',
      detailCustomer,
      itemList,
      totalQty,
      o.subtotal,
      o.discountAmount || 0,
      o.total,
      o.paymentMethod,
      o.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan',
    ];
  });

  // 4. Prepare Tab 2: Menu Terlaris Data
  const orderItemMap = new Map<string, { qty: number; rev: number }>();
  orders.forEach((o) => {
    if (o.status !== 'CANCELLED') {
      o.items.forEach((item) => {
        const cur = orderItemMap.get(item.id) || { qty: 0, rev: 0 };
        cur.qty += item.quantity;
        cur.rev += item.subtotal;
        orderItemMap.set(item.id, cur);
      });
    }
  });

  const bestSellerHeaders = [
    'Peringkat',
    'Nama Menu',
    'Kategori',
    'Harga Satuan (Rp)',
    'Total Terjual (Porsi)',
    'Total Omset (Rp)',
  ];

  const sortedMenuItems = [...menuItems].sort((a, b) => {
    const statA = orderItemMap.get(a.id)?.qty || 0;
    const statB = orderItemMap.get(b.id)?.qty || 0;
    return statB - statA;
  });

  const bestSellerRows = sortedMenuItems.map((item, index) => {
    const stat = orderItemMap.get(item.id) || { qty: 0, rev: 0 };
    return [
      `#${index + 1}`,
      item.name,
      item.category,
      item.price,
      stat.qty,
      stat.rev,
    ];
  });

  // 5. Prepare Tab 3: Ringkasan Finansial Data
  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const totalPortions = validOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const avgPerOrder = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  const financialHeaders = ['Indikator Pembukuan', 'Nilai / Keterangan'];
  const financialRows = [
    ['Nama Usaha', storeInfo.name],
    ['Slogan Usaha', storeInfo.slogan],
    ['Alamat Lengkap', `${storeInfo.address}, ${storeInfo.locationDetail}, ${storeInfo.city}`],
    ['Nomor Kontak / WhatsApp', storeInfo.phone],
    ['Total Transaksi Sah', validOrders.length],
    ['Total Nota Dibatalkan', orders.length - validOrders.length],
    ['Total Omzet Penjualan (Rp)', totalRevenue],
    ['Total Diskon Diberikan (Rp)', totalDiscounts],
    ['Rata-rata per Nota (Rp)', avgPerOrder],
    ['Total Seluruh Porsi Terjual', totalPortions],
    ['Waktu Sinkronisasi Terakhir', new Date().toLocaleString('id-ID')],
    ['Disinkronkan oleh Aplikasi', 'KASIR GUDEG 58 Cloud POS'],
  ];

  // 6. Clear and Update Values via BatchUpdate
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Riwayat Transaksi'!A1",
        values: [orderHeaders, ...orderRows],
      },
      {
        range: "'Menu Terlaris'!A1",
        values: [bestSellerHeaders, ...bestSellerRows],
      },
      {
        range: "'Ringkasan Finansial'!A1",
        values: [financialHeaders, ...financialRows],
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Gagal memperbarui data Google Spreadsheet.');
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetTitle: DEFAULT_SHEET_TITLE,
    ordersCount: orders.length,
    totalRevenue,
    updatedAt: new Date().toLocaleTimeString('id-ID'),
  };
};
