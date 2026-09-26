import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, type FirestoreMenuItem } from '../../services/menuService';

const CATEGORIES = [
  { id: 'burgers', en: 'Burgers', ar: 'برجر' },
  { id: 'chicken', en: 'Chicken', ar: 'دجاج' },
  { id: 'pizza', en: 'Pizza', ar: 'بيتزا' },
  { id: 'sides', en: 'Sides', ar: 'أطباق جانبية' },
  { id: 'drinks', en: 'Drinks', ar: 'مشروبات' },
  { id: 'desserts', en: 'Desserts', ar: 'حلويات' },
];

const categoryMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const CATEGORY_COLORS: Record<string, string> = {
  burgers: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  chicken: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  pizza: 'bg-red-500/15 text-red-400 border border-red-500/20',
  sides: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  drinks: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  desserts: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
};

interface FormState {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  category: string;
  image: string;
  available: boolean;
}

const emptyForm: FormState = {
  name: '',
  nameAr: '',
  description: '',
  descriptionAr: '',
  price: '',
  category: 'burgers',
  image: '',
  available: true,
};

export function MenuManager() {
  const [items, setItems] = useState<FirestoreMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreMenuItem | null>(null);
  const [editing, setEditing] = useState<FirestoreMenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailable, setFilterAvailable] = useState('all');

  const [deleteAnimating, setDeleteAnimating] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMenuItems();
      setItems(data);
    } catch {
      showToast('error', 'Failed to load menu items / فشل تحميل الأصناف');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter(i => i.available).length;
    const avgPrice = total > 0 ? items.reduce((sum, i) => sum + i.price, 0) / total : 0;
    return { total, categories: 6, available, avgPrice };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.nameAr.includes(searchQuery) ||
        i.description.toLowerCase().includes(q) ||
        i.descriptionAr.includes(searchQuery)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(i => i.category === filterCategory);
    }
    if (filterAvailable === 'available') {
      result = result.filter(i => i.available);
    } else if (filterAvailable === 'unavailable') {
      result = result.filter(i => !i.available);
    }
    return result;
  }, [items, searchQuery, filterCategory, filterAvailable]);

  const grouped = useMemo(() => {
    const map = new Map<string, FirestoreMenuItem[]>();
    for (const item of filteredItems) {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return CATEGORIES
      .map(cat => ({ ...cat, items: map.get(cat.id) || [] }))
      .filter(g => g.items.length > 0);
  }, [filteredItems]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: FirestoreMenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      nameAr: item.nameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      price: String(item.price),
      category: item.category,
      image: item.image,
      available: item.available,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.nameAr.trim() || !form.price.trim()) {
      showToast('error', 'Name and price are required / الاسم والسعر مطلوبان');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      showToast('error', 'Invalid price / سعر غير صالح');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameAr: form.nameAr.trim(),
        description: form.description.trim(),
        descriptionAr: form.descriptionAr.trim(),
        price,
        category: form.category,
        image: form.image.trim(),
        available: form.available,
      };

      if (editing) {
        await updateMenuItem(editing.id, payload);
        showToast('success', 'Item updated / تم تحديث الصنف');
      } else {
        await addMenuItem(payload, items.length);
        showToast('success', 'Item added / تمت إضافة الصنف');
      }
      closeModal();
      await load();
    } catch {
      showToast('error', 'Failed to save item / فشل حفظ الصنف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteAnimating(true);
    try {
      await deleteMenuItem(deleteTarget.id);
      showToast('success', 'Item deleted / تم حذف الصنف');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('error', 'Failed to delete item / فشل حذف الصنف');
    } finally {
      setDeleteAnimating(false);
    }
  };

  const handleToggleAvailable = async (item: FirestoreMenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    } catch {
      showToast('error', 'Failed to update availability / فشل تحديث التوفر');
    }
  };

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toast && (
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg shadow-black/30 border text-sm font-medium backdrop-blur-sm transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.msg}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Menu Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">إدارة القائمة</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 text-sm shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
            <span className="text-emerald-200/70 text-xs hidden md:inline">إضافة صنف</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5 overflow-hidden shadow-lg shadow-black/20 group hover:border-gray-700 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.total}</p>
                <p className="text-gray-500 text-xs md:text-sm">Total Items / إجمالي الأصناف</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5 overflow-hidden shadow-lg shadow-black/20 group hover:border-gray-700 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.categories}</p>
                <p className="text-gray-500 text-xs md:text-sm">Categories / الفئات</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5 overflow-hidden shadow-lg shadow-black/20 group hover:border-gray-700 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.available}</p>
                <p className="text-gray-500 text-xs md:text-sm">Available / متوفر</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-5 overflow-hidden shadow-lg shadow-black/20 group hover:border-gray-700 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.avgPrice.toFixed(0)}</p>
                <p className="text-gray-500 text-xs md:text-sm">Avg Price / متوسط السعر (ر.س)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items... / بحث عن أصناف..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">All Categories / كل الفئات</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.en} / {c.ar}</option>
              ))}
            </select>
            <select
              value={filterAvailable}
              onChange={e => setFilterAvailable(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="all">All Status / الكل</option>
              <option value="available">Available / متوفر</option>
              <option value="unavailable">Unavailable / غير متوفر</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-sm">Loading menu... / تحميل القائمة...</p>
          </div>
        ) : filteredItems.length === 0 && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">No items yet / لا توجد أصناف بعد</h3>
              <p className="text-gray-500 text-sm">Add your first menu item to get started</p>
              <p className="text-gray-600 text-xs mt-0.5">أضف أول صنف في القائمة للبدء</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 text-sm shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first item / أضف صفنك الأول
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">No results found / لا توجد نتائج</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
              <p className="text-gray-600 text-xs mt-0.5">جرّب تعديل البحث أو المرشحات</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700/50">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Image / الصورة</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Name / الاسم</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Category / الفئة</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Price / السعر</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Status / الحالة</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions / الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {grouped.map(cat => (
                      <React.Fragment key={cat.id}>
                        <tr>
                          <td colSpan={6} className="px-6 py-3 bg-gray-800/30">
                            <div className="flex items-center gap-2.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${CATEGORY_COLORS[cat.id] || 'bg-gray-800 text-gray-400'}`}>
                                {cat.en}
                              </span>
                              <span className="text-gray-600 text-xs">{cat.ar}</span>
                              <span className="text-gray-700 text-xs">({cat.items.length})</span>
                            </div>
                          </td>
                        </tr>
                        {cat.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-800/40 transition-colors duration-150 group">
                            <td className="px-6 py-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                                <p className="text-gray-500 text-xs truncate" dir="rtl">{item.nameAr}</p>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${CATEGORY_COLORS[item.category] || 'bg-gray-800 text-gray-400'}`}>
                                {categoryMap[item.category]?.en ?? item.category}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-emerald-400 font-bold text-sm">{item.price.toFixed(2)}</span>
                              <span className="text-gray-600 text-xs ml-1">ر.س</span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => handleToggleAvailable(item)}
                                className="flex items-center gap-2 group/status"
                              >
                                <div className={`relative w-10 h-[22px] rounded-full transition-all duration-200 ${item.available ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                  <span className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.available ? 'translate-x-[18px]' : ''}`} />
                                </div>
                                <span className={`text-xs font-medium transition-colors ${item.available ? 'text-emerald-400' : 'text-gray-500'}`}>
                                  {item.available ? 'Active' : 'Inactive'}
                                </span>
                              </button>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEdit(item)}
                                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all duration-200"
                                  title="Edit / تعديل"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                  title="Delete / حذف"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {grouped.map(cat => (
                <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                  <div className="px-4 py-3 bg-gray-800/30 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${CATEGORY_COLORS[cat.id] || 'bg-gray-800 text-gray-400'}`}>
                        {cat.en}
                      </span>
                      <span className="text-gray-600 text-xs">{cat.ar}</span>
                      <span className="text-gray-700 text-xs ml-auto">{cat.items.length}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-800/50">
                    {cat.items.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-800/30 transition-colors duration-150">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                                <p className="text-gray-500 text-xs truncate" dir="rtl">{item.nameAr}</p>
                              </div>
                              <button
                                onClick={() => handleToggleAvailable(item)}
                                className={`relative w-10 h-[22px] rounded-full transition-all duration-200 shrink-0 ${item.available ? 'bg-emerald-500' : 'bg-gray-700'}`}
                              >
                                <span className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.available ? 'translate-x-[18px]' : ''}`} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-emerald-400 font-bold text-sm">{item.price.toFixed(2)}</span>
                              <span className="text-gray-600 text-xs">ر.س</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[item.category] || 'bg-gray-800 text-gray-400'}`}>
                                {categoryMap[item.category]?.en ?? item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/50">
                          <button
                            onClick={() => openEdit(item)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit / تعديل
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete / حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={closeModal}
          />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40 animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editing ? 'Edit Item' : 'Add New Item'}
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {editing ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Name / الاسم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">English / إنجليزي</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Burger name"
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Arabic / عربي</label>
                    <input
                      type="text"
                      value={form.nameAr}
                      onChange={e => setField('nameAr', e.target.value)}
                      placeholder="اسم البرجر"
                      dir="rtl"
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description / الوصف</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">English / إنجليزي</label>
                    <textarea
                      value={form.description}
                      onChange={e => setField('description', e.target.value)}
                      placeholder="Describe the item..."
                      rows={3}
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Arabic / عربي</label>
                    <textarea
                      value={form.descriptionAr}
                      onChange={e => setField('descriptionAr', e.target.value)}
                      placeholder="وصف الصنف..."
                      dir="rtl"
                      rows={3}
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 resize-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Price & Category */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing & Category / السعر والفئة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (SAR) / السعر (ر.س)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={e => setField('price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">ر.س</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Category / الفئة</label>
                    <select
                      value={form.category}
                      onChange={e => setField('category', e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.en} / {c.ar}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Image / الصورة</h3>
                <input
                  type="url"
                  value={form.image}
                  onChange={e => setField('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                />
                {form.image && (
                  <div className="mt-3 w-full h-40 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Available for order / متوفر للطلب</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle to show or hide this item</p>
                </div>
                <button
                  type="button"
                  onClick={() => setField('available', !form.available)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-200 ${form.available ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.available ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all duration-200"
              >
                Cancel / إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {editing ? 'Update / تحديث' : 'Save / حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !deleteAnimating && setDeleteTarget(null)}
          />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-black/40 animate-fade-in">
            <div className="flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-2xl mx-auto mb-4 border border-red-500/20">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Delete Item? / حذف الصنف؟</h3>
            <p className="text-gray-500 text-sm text-center mb-1">Are you sure you want to delete</p>
            <p className="text-white font-semibold text-center text-sm">{deleteTarget.name}</p>
            <p className="text-gray-500 text-xs text-center mb-6" dir="rtl">{deleteTarget.nameAr}</p>
            <div className="flex gap-3">
              <button
                onClick={() => !deleteAnimating && setDeleteTarget(null)}
                disabled={deleteAnimating}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
              >
                Cancel / إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteAnimating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {deleteAnimating && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Delete / حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}