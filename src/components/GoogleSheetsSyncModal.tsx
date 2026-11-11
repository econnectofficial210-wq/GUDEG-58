import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from '../services/googleAuth';
import { syncToGoogleSheets, SyncResult } from '../services/googleSheetsService';
import { formatRupiah } from '../utils/formatters';
import { User } from 'firebase/auth';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  Layers, 
  Calendar,
  DollarSign
} from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { orders, menuItems, storeInfo } = useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sync flow states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mandatory Confirmation Dialog State (as per Workspace integration guidelines)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(!!token);
      },
      () => {
        setCurrentUser(null);
        setHasToken(false);
      }
    );

    // Initial check
    getAccessToken().then((token) => {
      setHasToken(!!token);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setHasToken(true);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setHasToken(false);
      setSyncResult(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Triggers user confirmation modal first
  const handleRequestSync = () => {
    if (!hasToken) {
      handleSignIn();
      return;
    }
    setErrorMessage(null);
    setShowConfirmDialog(true);
  };

  // Executes after explicit user confirmation
  const handleConfirmAndSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setErrorMessage(null);

    try {
      const result = await syncToGoogleSheets(orders, menuItems, storeInfo);
      setSyncResult(result);
    } catch (err: any) {
      console.error('Sync failed:', err);
      if (err.message && err.message.includes('AUTH_REQUIRED')) {
        setHasToken(false);
        setErrorMessage('Sesi Google telah kedaluwarsa. Silakan masuk kembali.');
      } else {
        setErrorMessage(err.message || 'Terjadi kesalahan saat menyinkronkan data ke Google Sheets.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#143f23] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400 rounded-lg text-slate-950">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Integrasi Google Sheets Gudeg 58
              </h3>
              <p className="text-[11px] text-emerald-200">
                Sinkronisasi pembukuan & riwayat nota ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Account Connection Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            {hasToken && currentUser ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
                      {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {currentUser.displayName || 'Pengguna Google'}
                      </p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Terhubung
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Putuskan Akun Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ganti Akun</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Hubungkan Akun Google Anda
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                    Masuk dengan akun Google untuk menyinkronkan data penjualan Warung Gudeg 58 langsung ke Google Drive & Sheets Anda.
                  </p>
                </div>

                {/* Standard Google Sign In Button Styled */}
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs text-xs font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sync Information & Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#143f23]" />
              <span>Data yang Akan Disinkronkan:</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Riwayat Transaksi</span>
                <span className="font-bold text-slate-900 font-mono text-xs">{orders.length} Nota Kasir</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Menu Dagangan</span>
                <span className="font-bold text-slate-900 font-mono text-xs">{menuItems.length} Ragam Menu</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Total Omzet Masuk</span>
                <span className="font-bold text-[#143f23] font-mono text-xs">
                  {formatRupiah(orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Struktur Spreadsheet</span>
                <span className="font-bold text-amber-700 text-xs">3 Lembar Kerja (Tabs)</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              * Spreadsheet otomatis dibuat di Google Drive Anda dengan 3 tab: <strong>Riwayat Transaksi</strong>, <strong>Menu Terlaris</strong>, dan <strong>Ringkasan Finansial</strong>.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {syncResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h5 className="font-bold text-xs">Sinkronisasi Berhasil!</h5>
              </div>
              <p className="text-[11px] text-emerald-700">
                Data berhasil diperbarui di Google Spreadsheet pada pukul {syncResult.updatedAt} WIB.
              </p>
              <div className="pt-1">
                <a
                  href={syncResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#143f23] hover:bg-[#1a4f2d] text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka di Google Sheets</span>
                </a>
              </div>
            </div>
          )}

          {/* Main Action Button */}
          <div>
            <button
              type="button"
              onClick={handleRequestSync}
              disabled={isSyncing || isSigningIn}
              className="w-full py-3 bg-[#143f23] hover:bg-[#1a4f2d] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Sedang Menyinkronkan ke Google Sheets...'
                  : hasToken
                  ? 'Sinkronkan Sekarang ke Google Sheets'
                  : 'Hubungkan Google & Sinkronkan'}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* MANDATORY USER CONFIRMATION MODAL BEFORE MUTATING SPREADSHEET */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="p-2 bg-emerald-100 text-[#143f23] rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Konfirmasi Akses Google Sheets</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan memperbarui atau membuat file spreadsheet berjudul:
              <br />
              <strong className="text-slate-900 block mt-1 font-mono text-[11px] bg-slate-100 p-2 rounded-lg">
                Warung Gudeg 58 - Pembukuan & Laporan Penjualan (Magelang)
              </strong>
              di Google Drive Anda dengan data <strong className="text-slate-800">{orders.length} transaksi</strong> dan <strong className="text-slate-800">{menuItems.length} menu dagangan</strong>.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSync}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#143f23] hover:bg-[#1a4f2d] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
