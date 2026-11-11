import { jsPDF } from 'jspdf';
import { Order, StoreInfo } from '../types';
import { formatNumber, formatRupiah } from './formatters';

// Helper to convert an image URL to base64 DataURL
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = imageUrl;
    } catch {
      resolve(null);
    }
  });
}

export async function generateReceiptPdf(order: Order, store: StoreInfo): Promise<void> {
  // 80mm thermal receipt size in pt: ~226pt width (approx 80mm), variable height
  // Calculate dynamic height based on item count
  const estimatedHeight = Math.max(220, 160 + order.items.length * 12 + 100);
  
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, estimatedHeight],
  });

  const pageWidth = 80;
  let y = 8;

  // Try embedding logo
  try {
    const logoData = await getBase64ImageFromUrl(store.logoUrl);
    if (logoData) {
      // center 28mm wide logo
      const logoWidth = 28;
      const logoHeight = 18;
      const x = (pageWidth - logoWidth) / 2;
      doc.addImage(logoData, 'PNG', x, y, logoWidth, logoHeight);
      y += logoHeight + 4;
    }
  } catch (err) {
    console.warn('Could not embed logo in PDF:', err);
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 63, 35); // Emerald Green
  doc.text(store.name, pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 100, 20); // Warm gold
  doc.text(`"${store.slogan}"`, pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(store.address, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(store.locationDetail, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`${store.city} · WA: ${store.phone}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Divider
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Order Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);

  doc.text(`No. Nota : ${order.id}`, 5, y);
  doc.text(`Tipe : ${order.orderType}`, 75, y, { align: 'right' });
  y += 3.5;

  doc.text(`Waktu    : ${order.date} ${order.time}`, 5, y);
  if (order.tableNumber) {
    doc.text(`Meja : ${order.tableNumber}`, 75, y, { align: 'right' });
  }
  y += 3.5;

  doc.text(`Kasir    : ${order.cashierName}`, 5, y);
  if (order.customerName) {
    doc.text(`Pelanggan: ${order.customerName}`, 75, y, { align: 'right' });
  }
  y += 4;

  // Divider
  doc.line(5, y, 75, y);
  y += 4;

  // Items List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Item Menu', 5, y);
  doc.text('Total', 75, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  order.items.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    // Truncate name if long
    const itemName = item.name.length > 30 ? item.name.substring(0, 28) + '...' : item.name;
    doc.text(itemName, 5, y);
    doc.text(formatRupiah(item.subtotal), 75, y, { align: 'right' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    const detailLine = `${item.quantity}x @ ${formatNumber(item.price)}${item.notes ? ` (${item.notes})` : ''}`;
    doc.text(detailLine, 8, y);
    y += 4;
  });

  // Divider
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);

  doc.text('Subtotal:', 40, y);
  doc.text(formatRupiah(order.subtotal), 75, y, { align: 'right' });
  y += 3.8;

  if (order.discountAmount > 0) {
    doc.setTextColor(190, 40, 40);
    doc.text(`Diskon (${order.discountPercentage}%):`, 40, y);
    doc.text(`-${formatRupiah(order.discountAmount)}`, 75, y, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    y += 3.8;
  }

  if (order.taxAmount > 0) {
    doc.text(`PB1 (${order.taxPercentage}%):`, 40, y);
    doc.text(formatRupiah(order.taxAmount), 75, y, { align: 'right' });
    y += 3.8;
  }

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 63, 35);
  doc.text('TOTAL AKHIR:', 30, y);
  doc.text(formatRupiah(order.total), 75, y, { align: 'right' });
  y += 5;

  // Payment method info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);

  doc.text(`Metode: ${order.paymentMethod}`, 40, y);
  y += 3.8;

  if (order.paymentMethod === 'TUNAI' && order.cashReceived) {
    doc.text('Tunai Diterima:', 40, y);
    doc.text(formatRupiah(order.cashReceived), 75, y, { align: 'right' });
    y += 3.8;

    doc.text('Kembalian:', 40, y);
    doc.text(formatRupiah(order.change || 0), 75, y, { align: 'right' });
    y += 4;
  }

  // Solid line
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(5, y, 75, y);
  y += 5;

  // Footer notes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(store.footerNote, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Simpan struk ini sebagai bukti pembayaran sah', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`www.gudeg58magelang.com`, pageWidth / 2, y, { align: 'center' });

  // Save the PDF
  const filename = `Struk_Gudeg58_${order.id}.pdf`;
  doc.save(filename);
}

export function generateWhatsAppReceiptText(order: Order, store: StoreInfo): string {
  let text = `*${store.name}*\n`;
  text += `"${store.slogan}"\n`;
  text += `📍 ${store.address}, ${store.city}\n`;
  text += `------------------------------------\n`;
  text += `No. Nota : ${order.id}\n`;
  text += `Tanggal  : ${order.date} ${order.time}\n`;
  text += `Kasir    : ${order.cashierName}\n`;
  text += `Tipe     : ${order.orderType}${order.tableNumber ? ` (Meja ${order.tableNumber})` : ''}\n`;
  if (order.customerName) text += `Customer : ${order.customerName}\n`;
  text += `------------------------------------\n`;
  text += `*PESANAN:*\n`;

  order.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.name}\n`;
    text += `   ${item.quantity}x @ ${formatNumber(item.price)} = ${formatRupiah(item.subtotal)}\n`;
    if (item.notes) text += `   (Catatan: ${item.notes})\n`;
  });

  text += `------------------------------------\n`;
  text += `Subtotal : ${formatRupiah(order.subtotal)}\n`;
  if (order.discountAmount > 0) {
    text += `Diskon (${order.discountPercentage}%) : -${formatRupiah(order.discountAmount)}\n`;
  }
  if (order.taxAmount > 0) {
    text += `Pajak PB1 (${order.taxPercentage}%) : ${formatRupiah(order.taxAmount)}\n`;
  }
  text += `*TOTAL    : ${formatRupiah(order.total)}*\n`;
  text += `Bayar    : ${order.paymentMethod}\n`;
  if (order.paymentMethod === 'TUNAI' && order.cashReceived) {
    text += `Diterima : ${formatRupiah(order.cashReceived)}\n`;
    text += `Kembali  : ${formatRupiah(order.change || 0)}\n`;
  }
  text += `------------------------------------\n`;
  text += `${store.footerNote}\n`;
  return encodeURIComponent(text);
}
