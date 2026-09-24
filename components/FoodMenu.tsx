import React, { useEffect, useRef, useState, useMemo } from 'react';
import { menuCategories, formatPrice, type MenuItem } from '../data/menuData';
import { labels, getCategoryLabel, type UILanguage } from '../utils/labels';

interface FoodMenuProps {
  highlightedItem?: string | null;
  matchingItem?: string | null;
  orderedItemIds?: string[];
  onAddItem?: (item: MenuItem) => void;
  lang?: UILanguage;
}

export const FoodMenu: React.FC<FoodMenuProps> = ({ highlightedItem, matchingItem, orderedItemIds = [], onAddItem, lang = 'ar' }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');

  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return menuCategories;
    const q = search.toLowerCase();
    return menuCategories.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.nameAr.includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.descriptionAr.includes(q)
      )
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  useEffect(() => {
    if (!matchingItem || !menuRef.current) return;
    const el = menuRef.current.querySelector(`[data-item-id="${matchingItem}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [matchingItem]);

  useEffect(() => {
    if (!highlightedItem || !menuRef.current) return;
    const el = menuRef.current.querySelector(`[data-item-id="${highlightedItem}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [highlightedItem]);

  return (
    <div className="w-full h-full overflow-y-auto pb-24" ref={menuRef} dir={dir}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
        {/* Search Bar */}
        <div className="relative mb-5">
          <svg className={`${lang === 'ar' ? 'right-3' : 'left-3'} absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 ${lang === 'ar' ? 'pl-10 pr-10 text-right' : 'pr-10 pl-10 text-left'} text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors`}
          />
          {search && (
            <button onClick={() => setSearch('')} className={`${lang === 'ar' ? 'left-3' : 'right-3'} absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2 text-center">{t.menuTitle}</h1>
        <p className="text-gray-500 text-center mb-6 md:mb-8 text-sm md:text-base">{t.menuSubtitle}</p>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t.noResults} "{search}"</p>
          </div>
        )}

        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-8">
            <h2 className={`text-lg font-semibold text-white mb-3 flex items-center gap-2 ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
              {getCategoryLabel(category.id, lang)}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </h2>

            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', direction: 'ltr' }}>
              {category.items.map((item) => {
                const isMatching = matchingItem === item.id;
                const isOrdered = orderedItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    data-item-id={item.id}
                    className={`
                      snap-start shrink-0 w-44 md:w-48 rounded-2xl overflow-hidden border transition-all duration-300 group
                      ${isOrdered
                        ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20 bg-gray-900'
                        : isMatching
                          ? 'border-blue-500/50 shadow-lg shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/30 bg-gray-900'
                          : 'border-gray-800 hover:border-gray-700 hover:shadow-lg hover:shadow-gray-800/50 bg-gray-900'
                      }
                    `}
                  >
                    <div className="relative h-32 overflow-hidden bg-gray-800">
                      <img
                        src={item.image}
                        alt={lang === 'ar' ? item.nameAr : item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-gray-950/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <span className="text-xs font-bold text-white">{formatPrice(item.price, lang)}</span>
                      </div>
                      {isOrdered && (
                        <div className="absolute top-2 right-2 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>

                    <div className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <h3 className="font-semibold text-white text-sm mb-0.5 truncate">{lang === 'ar' ? item.nameAr : item.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-snug mb-2 line-clamp-2">{lang === 'ar' ? item.descriptionAr : item.description}</p>

                      {onAddItem && (
                        <button
                          onClick={() => onAddItem(item)}
                          className={`w-full text-xs font-semibold py-1.5 rounded-lg transition-all active:scale-95 ${
                            isOrdered
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {isOrdered ? t.ordered : t.add}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
