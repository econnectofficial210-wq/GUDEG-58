import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, Category } from '../types';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  Search, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Paket Gudeg',
  'Besek & Kendil',
  'Lauk Tambahan',
  'Minuman Tradisional',
  'Camilan & Tambahan',
];

export const MenuManagement: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, resetToDefaultData, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Paket Gudeg');
  const [price, setPrice] = useState<number>(30000);
  const [costPrice, setCostPrice] = useState<number>(15000);
  const [stock, setStock] = useState<number>(50);
  const [unit, setUnit] = useState<string>('porsi');
  const [image, setImage] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setCategory('Paket Gudeg');
    setPrice(35000);
    setCostPrice(18000);
    setStock(50);
    setUnit('porsi');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80');
    setIsAvailable(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setCategory(item.category);
    setPrice(item.price);
    setCostPrice(item.costPrice);
    setStock(item.stock);
    setUnit(item.unit || 'porsi');
    setImage(item.image);
    setIsAvailable(item.isAvailable);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle local JPG / PNG file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/webp')) {
      setFormError('Format file harus berupa gambar JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran gambar maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImage(result);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama menu harus diisi');
      return;
    }
    if (price <= 0) {
      setFormError('Harga jual harus lebih dari 0');
      return;
    }
    if (!image) {
      setFormError('Gambar menu wajib diisi (bisa upload file JPG/PNG atau link URL)');
      return;
    }

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        description: description.trim(),
        category,
        price,
        costPrice,
        stock,
        unit,
        image,
        isAvailable,
      });
    } else {
      addMenuItem({
        name: name.trim(),
        description: description.trim(),
        category,
        price,
        costPrice,
        stock,
        unit,
        image,
        isAvailable,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, itemName: string) => {
    if (window.confirm(`Yakin ingin menghapus menu "${itemName}" dari daftar?`)) {
      deleteMenuItem(id);
    }
  };

  return (
    <div className="flex-1 bg-[#f7f6f0] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Menu & Foto
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {menuItems.length} Menu Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kasir dan Admin dapat mengubah harga, ketersediaan, serta mengganti foto menu dalam format JPG/PNG.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-[#143f23] hover:bg-[#1a4f2d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama menu atau deskripsi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['Semua', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#143f23] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Foto Menu (JPG/PNG)</th>
                  <th className="py-3.5 px-4">Nama & Kategori</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-right">HPP Modal</th>
                  <th className="py-3.5 px-4 text-center">Stok</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Terjual</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Thumbnail image */}
                    <td className="py-3 px-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </td>

                    {/* Name & Details */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</div>
                      <div className="text-[10px] text-amber-700 font-semibold mt-1">
                        Kategori: {item.category} · Satuan: {item.unit || 'porsi'}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono tabular-nums text-sm">
                      {formatRupiah(item.price)}
                    </td>

                    {/* Cost / HPP */}
                    <td className="py-3 px-4 text-right text-slate-600 font-mono tabular-nums">
                      {formatRupiah(item.costPrice)}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        item.stock > 10 ? 'bg-emerald-50 text-emerald-700' :
                        item.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {item.stock}
                      </span>
                    </td>

                    {/* Availability toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => updateMenuItem({ ...item, isAvailable: !item.isAvailable })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {item.isAvailable ? 'Tersedia' : 'Habis'}
                      </button>
                    </td>

                    {/* Sold count */}
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {formatNumber(item.soldCount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-[#143f23] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Menu & Ganti Foto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Add / Edit Menu with JPG/PNG Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#143f23] text-white">
              <h3 className="font-bold text-base">
                {editingItem ? 'Edit Menu & Foto Gudeg 58' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo Upload Section (JPG / PNG) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Foto Menu (JPG atau PNG)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Image Preview Box */}
                  <div className="sm:col-span-4 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center relative group">
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400 text-xs">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span>Belum ada foto</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="sm:col-span-8 space-y-2">
                    {/* Native File Input for JPG/PNG */}
                    <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Pilih Foto dari Perangkat (JPG / PNG)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input */}
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Atau masukkan link gambar (URL)..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-[#143f23]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Mendukung foto makanan asli format .jpg, .png, .webp (Maksimal 5MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Nasi Gudeg Komplit 58"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23] focus:outline-hidden"
                  required
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori Menu
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Satuan Porsi
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="porsi / besek / kendil / gelas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                  />
                </div>
              </div>

              {/* Price & Cost (HPP) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Harga Jual Pelanggan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step={1000}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    HPP Modal Bahan (Rp)
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    min={0}
                    step={1000}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                  />
                </div>
              </div>

              {/* Stock & Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stok Tersedia
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Status Ketersediaan
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAvailable(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        isAvailable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Tersedia
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAvailable(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        !isAvailable
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Habis
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deskripsi Menu & Komposisi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan isi porsi, rasa, rempah, atau catatan kemasan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#143f23]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#143f23] hover:bg-[#1a4f2d] rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
