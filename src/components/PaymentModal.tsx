import React, { useState, useMemo } from 'react';
import { PaymentMethod, Order } from '../types';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Building2, 
  X, 
  Check, 
  AlertCircle,
  Receipt
} from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onOrderSuccess }) => {
  const { cart, completeOrder, storeInfo, discountPercentage, taxPercentage } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [cashInput, setCashInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Calculate bill totals
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

  const cashReceived = parseFloat(cashInput.replace(/\D/g, '')) || 0;
  const change = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = paymentMethod !== 'TUNAI' || cashReceived >= grandTotal;

  // Preset cash shortcuts
  const cashShortcuts = useMemo(() => {
    const list: number[] = [grandTotal]; // Uang Pas
    const denominations = [50000, 100000, 150000, 200000, 300000, 500000];
    denominations.forEach((val) => {
      if (val > grandTotal && !list.includes(val)) {
        list.push(val);
      }
    });
    return list.slice(0, 5);
  }, [grandTotal]);

  const handleSelectShortcut = (amount: number) => {
    setCashInput(amount.toString());
    setErrorMessage('');
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'TUNAI' && cashReceived < grandTotal) {
      setErrorMessage(`Uang tunai kurang sebesar ${formatRupiah(grandTotal - cashReceived)}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#eab308', '#16a34a', '#ca8a04', '#15803d'],
        });
      } catch {
        // Safe confetti fallback
      }

      const completed = completeOrder(paymentMethod, paymentMethod === 'TUNAI' ? cashReceived : grandTotal);
      onOrderSuccess(completed);
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan saat memproses pembayaran');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#143f23] text-white">
          <div>
            <h3 className="font-bold text-base tracking-wide">Penyelesaian Pembayaran</h3>
            <p className="text-xs text-amber-300">Warung Gudeg 58 · Skylight Plaza Magelang</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-emerald-900/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Total Tag Display */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider block mb-1">
              Total yang Harus Dibayar
            </span>
            <span className="text-3xl font-extrabold text-[#143f23] tabular-nums font-mono">
              {formatRupiah(grandTotal)}
            </span>
            <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-amber-800/80">
              <span>{cart.reduce((s, c) => s + c.quantity, 0)} item pesanan</span>
              {discountAmount > 0 && <span>· Diskon {discountPercentage}%</span>}
              {taxAmount > 0 && <span>· Termasuk PB1 {taxPercentage}%</span>}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TUNAI');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-[#143f23] text-white border-[#143f23] shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-amber-400" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('QRIS');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'bg-[#143f23] text-white border-[#143f23] shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-amber-400" />
                <span>QRIS 58</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('DEBIT');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'DEBIT'
                    ? 'bg-[#143f23] text-white border-[#143f23] shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-amber-400" />
                <span>Debit EDC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TRANSFER');
                  setErrorMessage('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-[#143f23] text-white border-[#143f23] shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5 mb-1 text-amber-400" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Dynamic Payment Body */}
          {paymentMethod === 'TUNAI' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nominal Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => {
                      setCashInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder={grandTotal.toString()}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#143f23] focus:bg-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Nominal Shortcuts */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                  Tombol Cepat Uang Pas & Pecahan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cashShortcuts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleSelectShortcut(amount)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium font-mono transition-colors ${
                        amount === grandTotal
                          ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold hover:bg-amber-200'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {amount === grandTotal ? `Uang Pas (${formatNumber(amount)})` : formatNumber(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Change / Kembalian Box */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-900 block">
                    Uang Kembalian:
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {cashReceived < grandTotal
                      ? 'Menunggu input nominal cukup'
                      : 'Harap serahkan kepada pelanggan'}
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
                  {formatRupiah(change)}
                </span>
              </div>
            </div>
          ) : paymentMethod === 'QRIS' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                {/* Simulated QRIS code visual representation */}
                <div className="w-36 h-36 bg-slate-900 mx-auto rounded p-2 flex flex-col items-center justify-between text-white text-[10px]">
                  <div className="w-full flex justify-between">
                    <div className="w-8 h-8 border-2 border-white rounded-xs p-1"><div className="w-full h-full bg-white"/></div>
                    <div className="w-8 h-8 border-2 border-white rounded-xs p-1"><div className="w-full h-full bg-white"/></div>
                  </div>
                  <div className="font-bold tracking-widest text-[11px] text-amber-400">QRIS 58</div>
                  <div className="w-full flex justify-between">
                    <div className="w-8 h-8 border-2 border-white rounded-xs p-1"><div className="w-full h-full bg-white"/></div>
                    <span className="text-[9px] text-slate-300">MAGELANG</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{storeInfo.qrisName}</p>
                <p className="text-[11px] text-slate-500">Mendukung GoPay, OVO, Dana, ShopeePay, BCA & Livin</p>
              </div>
            </div>
          ) : paymentMethod === 'DEBIT' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <CreditCard className="w-10 h-10 text-emerald-700 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Mesin EDC Mandiri / BCA Gudeg 58</p>
              <p className="text-[11px] text-slate-500">Gesek atau tap kartu debit pelanggan di mesin kasir lalu masukkan PIN.</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-800">Rekening Transfer Resmi Gudeg 58:</p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <p className="flex justify-between"><span>Bank BCA:</span> <strong className="font-mono">122-0958-580</strong></p>
                <p className="flex justify-between"><span>Bank Mandiri:</span> <strong className="font-mono">136-00-5858-995</strong></p>
                <p className="text-slate-500 text-[10px]">A.N: WARUNG GUDEG 58 MAGELANG</p>
              </div>
            </div>
          )}

          {/* Error notification if any */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={isProcessing || !isCashSufficient}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              isCashSufficient && !isProcessing
                ? 'bg-[#143f23] hover:bg-[#1a4f2d] text-white shadow-emerald-950/20 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5 text-amber-400" />
            <span>
              {isProcessing
                ? 'Memproses Nota...'
                : paymentMethod === 'TUNAI'
                ? `Selesaikan Transaksi & Cetak Nota`
                : `Konfirmasi Pembayaran ${paymentMethod}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
