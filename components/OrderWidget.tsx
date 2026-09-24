import React, { useEffect, useState } from 'react';
import { type OrderItem, formatPrice, calculateOrderTotal } from '../data/menuData';
import { labels, type UILanguage } from '../utils/labels';

interface OrderWidgetProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onConfirmOrder: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  lang?: UILanguage;
}

export const OrderWidget: React.FC<OrderWidgetProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onConfirmOrder,
  isCollapsed,
  onToggle,
  lang = 'ar',
}) => {
  const total = calculateOrderTotal(items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const prevCountRef = React.useRef(itemCount);
  const [bounce, setBounce] = useState(false);

  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  if (isCollapsed) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={onToggle} />
      <div className={`fixed inset-x-4 bottom-20 z-50 md:absolute md:bottom-full md:inset-x-auto md:w-80 bg-gray-900 md:rounded-2xl shadow-2xl shadow-black/50 md:border border-gray-800 overflow-hidden max-h-[60vh] md:max-h-[70vh] rounded-2xl md:rounded-2xl animate-slide-up ${lang === 'ar' ? 'md:left-6' : 'md:right-6'}`} dir={dir}>
        <div className="bg-gray-950 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <button onClick={onToggle} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className={`flex items-center gap-2 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
            {itemCount > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full px-2 py-0.5 border border-emerald-500/30">
                {itemCount} {itemCount === 1 ? t.item : t.items}
              </span>
            )}
            <span className="font-semibold">{t.yourOrder}</span>
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
          </div>
        </div>

        <div className="max-h-64 md:max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              <p>{t.emptyCart}</p>
              <p className="text-sm mt-1 text-gray-600">{t.emptyCartHint}</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.menuItem.id}
                  className={`flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-800 animate-fade-in ${lang === 'ar' ? 'flex-row-reverse' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`flex items-center gap-1 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => item.quantity <= 1 ? onRemoveItem(item.menuItem.id) : onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className={`flex-1 min-w-0 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium text-white truncate">{lang === 'ar' ? item.menuItem.nameAr : item.menuItem.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.menuItem.price, lang)} {t.each}</p>
                  </div>
                  <img src={item.menuItem.image} alt={lang === 'ar' ? item.menuItem.nameAr : item.menuItem.name} className="w-10 h-10 rounded-lg object-cover" />
                  <span className={`text-sm font-bold text-white w-14 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
                    {formatPrice(item.menuItem.price * item.quantity, lang)}
                  </span>
                  <button onClick={() => onRemoveItem(item.menuItem.id)} className="text-gray-500 hover:text-red-400 transition-colors" title={t.delete}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-800 p-4 animate-fade-in">
            <div className={`flex items-center justify-between mb-3 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className="text-xl font-bold text-white">{formatPrice(total, lang)}</span>
              <span className="text-gray-400">{t.total}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onConfirmOrder} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/30">
                {t.confirmOrder}
              </button>
              <button onClick={onClearOrder} className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
                {t.clear}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
