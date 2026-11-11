import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, User, Store, ShieldCheck, Edit3, Check, X, FileSpreadsheet } from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';

export const PosHeader: React.FC = () => {
  const { currentUser, storeInfo, activeTab, setActiveTab, logout, updateAccountName } = useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  const displayName = currentUser?.role === 'PEMILIK' 
    ? (currentUser.name || 'Pemilik')
    : (currentUser?.name || 'Petugas Kasir');

  const handleOpenEditName = () => {
    setNewNameInput(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim()) {
      updateAccountName(newNameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-5 py-3 border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-xs">
        {/* Zone 1: Brand Wordmark & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('pos')} 
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <img
              src={storeInfo.logoUrl}
              alt="Warung Gudeg 58"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#143f23] whitespace-nowrap shrink-0">
                {storeInfo.name}
              </span>
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                Skylight Plaza Magelang
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'pos'
                ? 'text-[#143f23] font-bold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kasir Penjualan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'menu'
                ? 'text-[#143f23] font-bold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kelola Menu & Foto
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'history'
                ? 'text-[#143f23] font-bold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Nota
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#143f23] font-bold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perkembangan & Terlaris
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'owner'
                ? 'text-[#143f23] font-bold border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Dasbor Pemilik</span>
          </button>
        </nav>

        {/* Zone 3: Active User Profile, Ubah Nama, Google Sheets & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSheetsModalOpen(true)}
            title="Integrasi Google Sheets & Drive"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-neutral-200">
            <img
              src={currentUser?.avatar}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/50"
            />
            <div className="text-left text-xs leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-slate-800">{displayName}</p>
                <button
                  type="button"
                  onClick={handleOpenEditName}
                  title="Ubah Nama Pengguna"
                  className="text-slate-400 hover:text-[#143f23] transition-colors p-0.5"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-slate-500 text-[10px]">
                {currentUser?.role === 'PEMILIK' ? 'Pemilik' : 'Petugas Kasir'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Keluar / Ganti Akun"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Modal Sinkronisasi Google Sheets */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Modal Ubah Nama Pengguna (Kasir & Pemilik) */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#143f23] text-white">
              <h4 className="font-bold text-sm">
                Ubah Nama {currentUser?.role === 'PEMILIK' ? 'Pemilik' : 'Petugas Kasir'}
              </h4>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 text-slate-300 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Nama {currentUser?.role === 'PEMILIK' ? 'Pemilik Usaha' : 'Kasir Bertugas'}:
                </label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  placeholder={currentUser?.role === 'PEMILIK' ? 'Pemilik' : 'Contoh: Siti, Budi, Hendra'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#143f23] focus:outline-hidden"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Nama ini akan langsung tercetak di struk nota transaksi baru.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#143f23] hover:bg-[#1a4f2d] rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Nama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
