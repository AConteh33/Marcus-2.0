import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

const BASE_URL = 'https://mother-app-9ca4d.web.app';

const labels = {
  en: {
    title: 'QR Code Generator',
    tableNumber: 'Table Number',
    generate: 'Generate',
    generateAll: 'Generate All',
    download: 'Download',
    downloadAll: 'Download All',
    print: 'Print',
    table: 'Table',
    url: 'URL',
    restaurantName: 'Restaurant Name',
    generating: 'Generating...',
    tableLabel: 'Table',
  },
  ar: {
    title: 'مولد رموز QR',
    tableNumber: 'رقم الطاولة',
    generate: 'إنشاء',
    generateAll: 'إنشاء الكل',
    download: 'تحميل',
    downloadAll: 'تحميل الكل',
    print: 'طباعة',
    table: 'طاولة',
    url: 'الرابط',
    restaurantName: 'اسم المطعم',
    generating: 'جاري التوليد...',
    tableLabel: 'طاولة',
  },
};

interface QRItem {
  tableNumber: number;
  dataUrl: string | null;
  loading: boolean;
}

export const QRGenerator: React.FC = () => {
  const [tableCount, setTableCount] = useState<number>(10);
  const [restaurantName, setRestaurantName] = useState('Quick Bites');
  const [qrItems, setQrItems] = useState<Record<number, QRItem>>({});
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isPrinting, setIsPrinting] = useState(false);

  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const generateQR = useCallback(async (tableNumber: number) => {
    setQrItems(prev => ({
      ...prev,
      [tableNumber]: { tableNumber, dataUrl: null, loading: true },
    }));

    try {
      const url = `${BASE_URL}?table=${tableNumber}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
      setQrItems(prev => ({
        ...prev,
        [tableNumber]: { tableNumber, dataUrl, loading: false },
      }));
    } catch {
      setQrItems(prev => ({
        ...prev,
        [tableNumber]: { tableNumber, dataUrl: null, loading: false },
      }));
    }
  }, []);

  const generateAll = useCallback(async () => {
    for (let i = 1; i <= tableCount; i++) {
      await generateQR(i);
    }
  }, [tableCount, generateQR]);

  useEffect(() => {
    generateAll();
  }, []);

  const handleDownload = useCallback((tableNumber: number, dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `table-${tableNumber}-qr.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleDownloadAll = useCallback(async () => {
    for (let i = 1; i <= tableCount; i++) {
      const item = qrItems[i];
      if (item?.dataUrl) {
        handleDownload(i, item.dataUrl);
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }, [qrItems, tableCount, handleDownload]);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 500);
    }, 100);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-950 p-4 md:p-6`} dir={dir}>
      {/* Screen View */}
      <div style={isPrinting ? { display: 'none' } : undefined}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white transition-all"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t.restaurantName}</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Restaurant Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors text-sm"
              />
            </div>

            {/* Table Count */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t.tableNumber}</label>
              <input
                type="number"
                min={1}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors text-sm"
              />
            </div>

            {/* Quick Select */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Quick Select</label>
              <div className="flex gap-2">
                {[5, 10, 20, 30, 50].map(count => (
                  <button
                    key={count}
                    onClick={() => setTableCount(count)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      tableCount === count
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={generateAll}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
              >
                {t.generateAll}
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl border border-gray-700 transition-all active:scale-95 text-sm"
              >
                {t.downloadAll}
              </button>
              <button
                onClick={handlePrint}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-gray-700 transition-all active:scale-95 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* QR Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => {
            const item = qrItems[num];
            return (
              <div key={num} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col items-center">
                <div className="text-sm font-semibold text-white mb-3">
                  {t.tableLabel} {num}
                </div>
                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-3">
                  {item?.loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs text-gray-500">{t.generating}</span>
                    </div>
                  ) : item?.dataUrl ? (
                    <img src={item.dataUrl} alt={`QR Code for Table ${num}`} className="w-44 h-44" />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 text-center mb-3 truncate w-full">
                  {BASE_URL}?table={num}
                </div>
                {item?.dataUrl && (
                  <button
                    onClick={() => handleDownload(num, item.dataUrl!)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 rounded-xl border border-gray-700 transition-all active:scale-95"
                  >
                    {t.download}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Print View */}
      {isPrinting && (
        <div id="qr-print-area" style={{ position: 'absolute', left: 0, top: 0, width: '100%', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => {
              const item = qrItems[num];
              return (
                <div key={num} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid', marginBottom: '16px' }}>
                  {restaurantName && (
                    <div style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', marginBottom: '4px', color: '#000' }}>
                      {restaurantName}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', marginBottom: '8px', color: '#000' }}>
                    {t.tableLabel} {num}
                  </div>
                  {item?.dataUrl && (
                    <img src={item.dataUrl} alt={`Table ${num}`} style={{ width: '128px', height: '128px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
