import React, { useState, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ToolController } from './tools/toolController';
import { AddToOrderTool, RemoveFromOrderTool, UpdateOrderItemTool, ClearOrderTool, GetOrderSummaryTool, ListMenuTool } from './tools/foodOrderTools';
import { PlaceOrderTool, CancelOrderTool } from './tools/confirmCancelTools';
import { EndSessionTool } from './tools/endSessionTool';
import { SetLanguageTool, type UILanguage } from './tools/setLanguageTool';
import { FoodMenu } from './components/FoodMenu';
import { OrderWidget } from './components/OrderWidget';
import { TranscriptView } from './components/TranscriptView';
import { TextInput } from './components/TextInput';
import type { OrderItem, MenuItem } from './data/menuData';
import { calculateOrderTotal, formatPrice, menuCategories } from './data/menuData';
import { labels } from './utils/labels';

const AdminLogin = lazy(() => import('./components/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const MenuManager = lazy(() => import('./components/admin/MenuManager').then(m => ({ default: m.MenuManager })));
const AIScriptEditor = lazy(() => import('./components/admin/AIScriptEditor').then(m => ({ default: m.AIScriptEditor })));
const ConversationLog = lazy(() => import('./components/admin/ConversationLog').then(m => ({ default: m.ConversationLog })));
const QRGenerator = lazy(() => import('./components/admin/QRGenerator').then(m => ({ default: m.QRGenerator })));

function CustomerApp() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [widgetCollapsed, setWidgetCollapsed] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('ar');

  const orderItemsRef = useRef(orderItems);
  orderItemsRef.current = orderItems;

  const lastLogoTapRef = useRef(0);

  const t = labels[uiLanguage];

  const updateOrder = useCallback((updater: (prev: OrderItem[]) => OrderItem[]) => {
    setOrderItems(prev => {
      const next = updater(prev);
      if (next.length > prev.length) {
        setWidgetCollapsed(false);
      }
      return next;
    });
  }, []);

  const getOrder = useCallback(() => orderItemsRef.current, []);

  const removeItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.filter(o => o.menuItem.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(itemId); return; }
    setOrderItems(prev => prev.map(o => o.menuItem.id === itemId ? { ...o, quantity } : o));
  }, [removeItem]);

  const clearOrder = useCallback(() => { setOrderItems([]); setOrderConfirmed(false); }, []);

  const confirmOrder = useCallback(() => { setOrderConfirmed(true); setOrderItems([]); setWidgetCollapsed(true); setTimeout(() => setOrderConfirmed(false), 5000); }, []);

  const handleLanguageChange = useCallback((lang: UILanguage) => {
    setUiLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toolController = useMemo(() => {
    const controller = new ToolController();
    controller.register(new AddToOrderTool(updateOrder));
    controller.register(new RemoveFromOrderTool(updateOrder));
    controller.register(new UpdateOrderItemTool(updateOrder));
    controller.register(new ClearOrderTool(updateOrder));
    controller.register(new GetOrderSummaryTool(getOrder));
    controller.register(new ListMenuTool());
    controller.register(new PlaceOrderTool(confirmOrder, getOrder));
    controller.register(new CancelOrderTool(clearOrder, getOrder));
    controller.register(new EndSessionTool());
    controller.register(new SetLanguageTool(handleLanguageChange));
    return controller;
  }, [updateOrder, getOrder, confirmOrder, clearOrder, handleLanguageChange]);

  const addThought = useCallback(() => {}, []);

  const geminiLive = useGeminiLive(toolController, addThought);

  const {
    orbState,
    transcripts,
    currentUserTranscript,
    currentAiTranscript,
    connect,
    disconnect,
    sendText,
    activeToolUsage,
    clearConversationHistory,
  } = geminiLive;

  const isReadyForTextInput = useMemo(() =>
    orbState === 'listening' || orbState === 'idle' || orbState === 'processing' || orbState === 'speaking' || orbState === 'connecting',
    [orbState]
  );

  const total = useMemo(() => calculateOrderTotal(orderItems), [orderItems]);
  const itemCount = useMemo(() => orderItems.reduce((s, i) => s + i.quantity, 0), [orderItems]);

  const matchingItem = useMemo(() => {
    if (!currentAiTranscript) return null;
    const text = currentAiTranscript.toLowerCase().trim();

    const similarity = (a: string, b: string): number => {
      if (a === b) return 1;
      if (a.length === 0 || b.length === 0) return 0;
      const longer = a.length > b.length ? a : b;
      const shorter = a.length > b.length ? b : a;
      if (longer.includes(shorter)) return shorter.length / longer.length;
      let matches = 0;
      for (const ch of shorter) {
        if (longer.includes(ch)) matches++;
      }
      return matches / longer.length;
    };

    let bestId: string | null = null;
    let bestScore = 0;

    for (const cat of menuCategories) {
      for (const item of cat.items) {
        const name = item.name.toLowerCase();
        const nameAr = item.nameAr;
        if (text.includes(name) || text.includes(nameAr)) return item.id;
        const words = text.split(/\s+/);
        for (const word of words) {
          const score = Math.max(similarity(word, name), similarity(word, nameAr));
          if (score > bestScore) {
            bestScore = score;
            bestId = item.id;
          }
        }
      }
    }

    return bestScore >= 0.7 ? bestId : null;
  }, [currentAiTranscript]);

  const orderedItemIds = useMemo(() => orderItems.map(o => o.menuItem.id), [orderItems]);

  const handleConnect = () => {
    if (orbState === 'disconnected') {
      connect();
    } else if (orbState === 'idle' || orbState === 'listening' || orbState === 'speaking' || orbState === 'processing') {
      disconnect();
    }
  };

  const handleTextSubmit = (text: string) => {
    if (sendText) sendText(text);
  };

  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    setOrderItems(prev => {
      const existing = prev.find(o => o.menuItem.id === item.id);
      if (existing) {
        return prev.map(o => o.menuItem.id === item.id ? { ...o, quantity: o.quantity + quantity } : o);
      }
      return [...prev, { menuItem: item, quantity }];
    });
    setWidgetCollapsed(false);
    setHighlightedItem(item.id);
    setTimeout(() => setHighlightedItem(null), 2000);
  }, []);

  const dir = uiLanguage === 'ar' ? 'rtl' : 'ltr';

  if (orderConfirmed) {
    return (
      <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center px-4" dir={dir}>
        <div className="text-6xl mb-6 animate-bounce-in">
          <svg className="w-16 h-16 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.orderConfirmed}</h1>
        <p className="text-gray-400 mb-6">{t.thankYou}</p>
        <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 text-right">
          <h2 className="text-lg font-semibold text-white mb-3">{t.orderSummary}</h2>
          {orderItems.map(item => (
            <div key={item.menuItem.id} className="flex justify-between py-1">
              <span className="text-white font-medium">{formatPrice(item.menuItem.price * item.quantity, uiLanguage)}</span>
              <span className="text-gray-300">{uiLanguage === 'ar' ? item.menuItem.nameAr : item.menuItem.name} x{item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-white">{formatPrice(total, uiLanguage)}</span>
            <span className="font-bold text-white">{t.total}</span>
          </div>
        </div>
        <button onClick={clearOrder} className="mt-6 px-8 py-3 bg-white hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors">
          {t.newOrder}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col overflow-hidden" dir={dir}>
      <div className="shrink-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {itemCount > 0 && (
            <div className="bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full px-3 py-1 border border-emerald-500/30">
              {formatPrice(total, uiLanguage)} · {itemCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <h1
            className="text-xl md:text-2xl font-bold text-white tracking-tight cursor-pointer select-none"
            onClick={() => {
              const now = Date.now();
              if (now - lastLogoTapRef.current < 400) {
                navigate('/admin/login');
              }
              lastLogoTapRef.current = now;
            }}
          >
            Quick Bites
          </h1>
          <button
            onClick={() => handleLanguageChange(uiLanguage === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white transition-all active:scale-95"
          >
            {uiLanguage === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {orbState !== 'disconnected' && (
        <div className="shrink-0 bg-gray-900/50 border-b border-gray-800 px-4 py-2 text-center">
          <span className="text-sm text-gray-400">
            {orbState === 'listening' ? t.listening :
             orbState === 'speaking' ? t.speaking :
             orbState === 'processing' ? t.processing :
             orbState === 'connecting' ? t.connecting : ''}
          </span>
        </div>
      )}

      {(currentUserTranscript || currentAiTranscript) && (
        <div className={`shrink-0 bg-gray-900/50 border-b border-gray-800 px-4 py-3 ${uiLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
          {currentUserTranscript && (
            <p className="text-sm text-gray-300">
              {uiLanguage === 'ar' ? <>{currentUserTranscript}<span className="font-medium text-white"> :{t.you}</span></> : <><span className="font-medium text-white">{t.you}: </span>{currentUserTranscript}</>}
            </p>
          )}
          {currentAiTranscript && (
            <p className="text-sm text-emerald-400 mt-1">
              {uiLanguage === 'ar' ? <>{currentAiTranscript}<span className="font-medium text-emerald-300"> :{t.ai}</span></> : <><span className="font-medium text-emerald-300">{t.ai}: </span>{currentAiTranscript}</>}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <FoodMenu highlightedItem={highlightedItem} matchingItem={matchingItem} orderedItemIds={orderedItemIds} onAddItem={addItem} lang={uiLanguage} />
        </div>
      </div>

      {isPanelVisible && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsPanelVisible(false)} />
          <div className="fixed inset-x-4 top-20 bottom-20 md:inset-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 md:max-h-[70vh] z-50 bg-gray-900 rounded-2xl shadow-2xl shadow-black/50 border border-gray-800 flex flex-col overflow-hidden animate-fade-in md:left-1/2 md:right-auto" dir={dir}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-white">{t.chatTitle}</span>
              <button onClick={() => setIsPanelVisible(false)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <TranscriptView
                transcripts={transcripts}
                currentUserTranscript={currentUserTranscript}
                currentAiTranscript={currentAiTranscript}
                onClearConversationHistory={clearConversationHistory}
                lang={uiLanguage}
              />
            </div>
            <div className="p-3 border-t border-gray-800 shrink-0">
              <TextInput onSubmit={handleTextSubmit} isReady={isReadyForTextInput} isTtsEnabled={true} onTtsToggle={() => {}} placeholder={t.searchPlaceholder} />
            </div>
          </div>
        </>
      )}

      <OrderWidget
        items={orderItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearOrder={clearOrder}
        onConfirmOrder={confirmOrder}
        isCollapsed={widgetCollapsed}
        onToggle={() => setWidgetCollapsed(!widgetCollapsed)}
        lang={uiLanguage}
      />

      <div className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 px-6 py-3 flex items-center justify-around" dir={dir}>
        <button
          onClick={() => setWidgetCollapsed(!widgetCollapsed)}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${!widgetCollapsed ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{uiLanguage === 'ar' ? 'السلة' : 'Cart'}</span>
        </button>

        <button
          onClick={handleConnect}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            orbState === 'listening' ? 'text-emerald-400' :
            orbState === 'speaking' ? 'text-blue-400' :
            orbState === 'processing' ? 'text-amber-400' :
            'text-gray-500 hover:text-white'
          }`}
        >
          <div className={`w-14 h-14 -mt-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            orbState === 'listening'
              ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse-ring'
              : orbState === 'speaking'
                ? 'bg-blue-500 shadow-blue-500/50'
                : orbState === 'processing'
                  ? 'bg-amber-500 shadow-amber-500/50'
                  : orbState === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-600 border-2 border-gray-500'
          }`}>
            {orbState === 'listening' ? (
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 bg-white rounded-full animate-sound-bar-1" style={{ height: '18px' }} />
                <span className="w-0.5 bg-white rounded-full animate-sound-bar-2" style={{ height: '24px' }} />
                <span className="w-0.5 bg-white rounded-full animate-sound-bar-3" style={{ height: '12px' }} />
                <span className="w-0.5 bg-white rounded-full animate-sound-bar-4" style={{ height: '20px' }} />
                <span className="w-0.5 bg-white rounded-full animate-sound-bar-5" style={{ height: '16px' }} />
              </div>
            ) : orbState === 'speaking' ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : orbState === 'processing' ? (
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">
            {orbState === 'listening' ? t.talk :
             orbState === 'speaking' ? t.speaking :
             orbState === 'processing' ? t.processing :
             orbState === 'connecting' ? t.connecting :
             t.voice}
          </span>
        </button>

        <button
          onClick={() => setIsPanelVisible(!isPanelVisible)}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isPanelVisible ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-medium">{t.chat}</span>
        </button>
      </div>
    </div>
  );
}

const Loading = () => (
  <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<MenuManager />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="ai-script" element={<AIScriptEditor />} />
            <Route path="conversations" element={<ConversationLog />} />
            <Route path="qr" element={<QRGenerator />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
