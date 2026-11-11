import React, { useState } from 'react';
import { Order, StoreInfo } from '../types';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { generateReceiptPdf, generateWhatsAppReceiptText } from '../utils/pdfReceipt';
import { 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  X, 
  Receipt, 
  MapPin, 
  Phone,
  FileText
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order;
  store: StoreInfo;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  store,
  onClose,
  onNewOrder,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateReceiptPdf(order, store);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppReceiptText(order, store);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header bar of the modal (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-[#143f23] text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">Struk Pembayaran Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-emerald-900/40 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 bg-slate-100 max-h-[70vh] overflow-y-auto flex justify-center">
          
          {/* Thermal Receipt Paper Layout (Target for print and visual view) */}
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-md border border-neutral-300 text-slate-900 font-mono text-xs leading-relaxed"
          >
            {/* Header: Logo, Name, Address */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400">
              <div className="flex justify-center mb-2">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-24 h-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-base font-bold tracking-tight text-neutral-900 font-sans uppercase">
                {store.name}
              </h2>
              <p className="text-[10px] text-neutral-600 italic font-sans mb-1">
                "{store.slogan}"
              </p>
              <p className="text-[10px] text-neutral-600 font-sans">
                {store.address}
              </p>
              <p className="text-[10px] text-neutral-600 font-sans">
                {store.locationDetail}
              </p>
              <p className="text-[10px] text-neutral-600 font-sans">
                {store.city} · Telp/WA: {store.phone}
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{order.date} {order.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe Order:</span>
                <span className="font-bold">
                  {order.orderType === 'DINE_IN' ? `Dine In (Meja ${order.tableNumber || '-'})` :
                   order.orderType === 'TAKE_AWAY' ? 'Bungkus (Take Away)' :
                   order.orderType === 'DELIVERY' ? 'Delivery Pesanan' : 'Ojek Online'}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-neutral-400">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="py-1 font-semibold text-neutral-700">Item</th>
                    <th className="py-1 text-center font-semibold text-neutral-700">Qty</th>
                    <th className="py-1 text-right font-semibold text-neutral-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1.5 pr-1">
                        <div className="font-medium text-neutral-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          @{formatNumber(item.price)}
                          {item.notes && <span className="block italic text-amber-700">({item.notes})</span>}
                        </div>
                      </td>
                      <td className="py-1.5 text-center font-semibold text-neutral-800">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 text-right font-medium text-neutral-900 tabular-nums">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Calculations */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal:</span>
                <span className="tabular-nums font-medium">{formatRupiah(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon ({order.discountPercentage}%):</span>
                  <span className="tabular-nums">-{formatRupiah(order.discountAmount)}</span>
                </div>
              )}

              {order.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Pajak Restoran PB1 ({order.taxPercentage}%):</span>
                  <span className="tabular-nums font-medium">{formatRupiah(order.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-300">
                <span>TOTAL:</span>
                <span className="tabular-nums text-[#143f23]">{formatRupiah(order.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>

              {order.paymentMethod === 'TUNAI' && order.cashReceived && (
                <>
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span className="tabular-nums">{formatRupiah(order.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-neutral-900">
                    <span>Kembalian:</span>
                    <span className="tabular-nums text-emerald-700">{formatRupiah(order.change || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-1 font-sans">
              <p className="font-medium text-neutral-800">{store.footerNote}</p>
              <p>Terima kasih atas kunjungannya</p>
              <p className="text-[9px] text-neutral-400 font-mono mt-1">
                Layanan Pelanggan: {store.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Cetak Thermal, Simpan PDF Digital, WhatsApp, Transaksi Baru) */}
        <div className="print:hidden p-4 bg-white border-t border-slate-200 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Cetak Nota Thermal */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#143f23] hover:bg-[#1a4f2d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Nota</span>
            </button>

            {/* 2. Simpan Struk Digital dalam format PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Simpan PDF'}</span>
            </button>

            {/* 3. Kirim ke WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNewOrder}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Selesai & Transaksi Baru (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
