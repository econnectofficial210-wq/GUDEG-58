import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount } from '../types';
import { ShieldCheck, UserCheck, MapPin, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { accounts, storeInfo, login } = useApp();
  
  const [selectedRole, setSelectedRole] = useState<'KASIR' | 'PEMILIK'>('KASIR');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return accounts.find((a) => a.role === 'KASIR')?.id || accounts[0]?.id || 'usr_kasir_1';
  });
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const filteredAccounts = accounts.filter((a) => a.role === selectedRole);
  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || filteredAccounts[0];

  const handleSelectRole = (role: 'KASIR' | 'PEMILIK') => {
    setSelectedRole(role);
    const target = accounts.find((a) => a.role === role);
    if (target) {
      setSelectedAccountId(target.id);
    }
    setPin('');
    setErrorMessage('');
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + val);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMessage('Harap masukkan password terlebih dahulu');
      return;
    }

    const success = login(selectedAccountId, pin);
    if (!success) {
      setErrorMessage('Password yang dimasukkan salah. Silakan coba lagi.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#112d1b] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-emerald-900/60 bg-[#0d2315]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img 
            src={storeInfo.logoUrl} 
            alt="Logo Gudeg 58" 
            className="w-10 h-10 object-contain drop-shadow" 
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">{storeInfo.name}</h1>
            <p className="text-xs text-amber-300/80 font-medium">{storeInfo.slogan}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-200/80 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium">{storeInfo.address}, {storeInfo.city}</span>
        </div>
      </header>

      {/* Main Login Card - Optimized for Tablet Landscape side-by-side layout */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-8">
        <div className="w-full max-w-4xl md:max-w-4xl lg:max-w-5xl bg-[#143822]/95 border border-emerald-700/40 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 backdrop-blur-md">
          
          {/* Left Column: Brand, Official Logo Image & Role Selection */}
          <div className="md:col-span-1 lg:col-span-6 p-4 sm:p-6 md:p-6 lg:p-7 border-b md:border-b-0 md:border-r border-emerald-800/40 flex flex-col justify-between bg-gradient-to-b from-[#184228] to-[#12331f]">
            <div>
              {/* Logo Box */}
              <div className="flex flex-col items-center text-center mb-4 md:mb-5">
                <div className="p-2 bg-white/5 rounded-2xl border border-emerald-600/30 mb-2 shadow-inner">
                  <img
                    src={storeInfo.logoUrl}
                    alt="Warung Gudeg 58 Magelang"
                    className="w-32 sm:w-40 md:w-36 lg:w-44 h-auto object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  {storeInfo.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-medium mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300">
                    Skylight Plaza Magelang
                  </span>
                  <span>·</span>
                  <span className="text-emerald-200/80">Sistem Kasir POS</span>
                </div>
              </div>

              {/* Role Toggle: Petugas Kasir vs Pemilik */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-emerald-200 uppercase tracking-wider block mb-1.5">
                  Pilih Akses Masuk
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-emerald-950/80 border border-emerald-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('KASIR')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === 'KASIR'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Petugas Kasir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('PEMILIK')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === 'PEMILIK'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pemilik</span>
                  </button>
                </div>
              </div>

              {/* Active Profile Info */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-200 uppercase tracking-wider block">
                  Identitas Pengguna
                </label>
                <div className="p-3 md:p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentAccount?.avatar}
                      alt={currentAccount?.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/60 shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {selectedRole === 'PEMILIK' ? 'Pemilik' : currentAccount?.name}
                      </p>
                      <p className="text-xs text-amber-300/80">
                        {selectedRole === 'PEMILIK' ? 'Pemilik Usaha Gudeg 58' : 'Petugas Kasir Bertugas'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 font-mono">
                    {selectedRole === 'PEMILIK' ? 'Akses Owner' : 'Akses Kasir'}
                  </span>
                </div>
              </div>
            </div>

            {/* Note that name can be changed after login */}
            <div className="mt-4 pt-3 border-t border-emerald-800/40 text-[11px] text-emerald-300/80 flex items-center gap-1.5">
              <span>Nama petugas kasir maupun pemilik dapat diubah kapan pun setelah masuk.</span>
            </div>
          </div>

          {/* Right Column (Disamping Gambar): Secure Password Entry & Touch Keypad */}
          <div className="md:col-span-1 lg:col-span-6 p-4 sm:p-6 md:p-6 lg:p-7 flex flex-col justify-center bg-[#102a19]/95">
            <div className="max-w-xs mx-auto w-full">
              {/* CSS selector 1: Header */}
              <div className="text-center mb-4 md:mb-5">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-1.5">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">Masukkan Password</h3>
                <p className="text-xs text-emerald-300/70 mt-0.5">
                  Otorisasi masuk untuk <strong className="text-amber-300">{selectedRole === 'PEMILIK' ? 'Pemilik' : currentAccount?.name}</strong>
                </p>
              </div>

              {/* CSS selector 2: Password Dots Indicator */}
              <div className="flex justify-center items-center gap-3 mb-4 md:mb-5">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = idx < pin.length;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-amber-400 scale-110 shadow-md shadow-amber-500/40'
                          : 'bg-emerald-950 border border-emerald-700/60'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-3 p-2 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CSS selector 3: Numeric Touch Keypad for Fast POS Login */}
              <div className="grid grid-cols-3 gap-2 md:gap-2.5 mb-4 md:mb-5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-10 md:h-11 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/70 active:bg-amber-500 active:text-slate-950 border border-emerald-700/40 text-base md:text-lg font-bold text-white transition-colors duration-100 flex items-center justify-center font-mono shadow-xs cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-10 md:h-11 rounded-xl bg-emerald-950/50 hover:bg-rose-900/40 active:bg-rose-900/60 border border-emerald-800/40 text-xs font-bold text-rose-300 transition-colors duration-100 flex items-center justify-center cursor-pointer"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 md:h-11 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/70 active:bg-amber-500 active:text-slate-950 border border-emerald-700/40 text-base md:text-lg font-bold text-white transition-colors duration-100 flex items-center justify-center font-mono shadow-xs cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 md:h-11 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/40 text-xs font-bold text-emerald-200 transition-colors duration-100 flex items-center justify-center cursor-pointer"
                >
                  ⌫ HAPUS
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-xs md:text-sm tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk Aplikasi Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full py-3 px-6 text-center text-xs text-emerald-400/60 border-t border-emerald-900/50 bg-[#0b1c11]">
        <p>Warung Gudeg 58 Magelang &copy; {new Date().getFullYear()} · Skylight Plaza Kota Magelang</p>
      </footer>
    </div>
  );
};
