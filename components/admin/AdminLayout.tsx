import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

type Lang = 'ar' | 'en';

const labels = {
  ar: {
    dashboard: 'لوحة التحكم',
    management: 'الإدارة',
    menu: 'القائمة',
    menuDesc: 'إضافة وتعديل الأصناف',
    ai: 'الذكاء الاصطناعي',
    aiScript: 'سكريبت المحادثة',
    aiScriptDesc: 'تعديل شخصية المساعد',
    conversations: 'المحادثات',
    conversationsDesc: 'سجل المحادثات',
    tools: 'الأدوات',
    qrCodes: 'رموز QR',
    qrCodesDesc: 'إنشاء رموز الطاولات',
    logout: 'تسجيل الخروج',
    loading: 'جاري التحقق...',
    backToSite: 'العودة للموقع',
    superAdmin: 'Super Admin',
  },
  en: {
    dashboard: 'Dashboard',
    management: 'Management',
    menu: 'Menu',
    menuDesc: 'Add & edit items',
    ai: 'AI',
    aiScript: 'AI Script',
    aiScriptDesc: 'Edit assistant personality',
    conversations: 'Conversations',
    conversationsDesc: 'Chat history',
    tools: 'Tools',
    qrCodes: 'QR Codes',
    qrCodesDesc: 'Generate table QRs',
    logout: 'Logout',
    loading: 'Loading...',
    backToSite: 'Back to Site',
    superAdmin: 'Super Admin',
  },
};

interface SidebarItem {
  id: string;
  labelKey: string;
  path: string;
  icon: string;
  group: 'management' | 'ai' | 'tools';
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'menu',
    labelKey: 'menu',
    path: '/admin/menu',
    icon: 'grid',
    group: 'management',
  },
  {
    id: 'ai-script',
    labelKey: 'aiScript',
    path: '/admin/ai-script',
    icon: 'code',
    group: 'ai',
  },
  {
    id: 'conversations',
    labelKey: 'conversations',
    path: '/admin/conversations',
    icon: 'chat',
    group: 'ai',
  },
  {
    id: 'qr',
    labelKey: 'qrCodes',
    path: '/admin/qr',
    icon: 'qr',
    group: 'tools',
  },
];

const SidebarIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = 'w-5 h-5' }) => {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    code: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    chat: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    qr: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
  };
  return <>{icons[icon] || null}</>;
};

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Lang>('ar');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('qb_admin_auth') === 'true') {
      setAuthChecked(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        setAuthChecked(true);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem('qb_admin_auth');
    try {
      await signOut(auth);
    } catch {}
    navigate('/admin/login');
  };

  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isRtl = lang === 'ar';

  if (!authChecked) {
    return (
      <div className="w-full min-h-screen bg-gray-950 flex items-center justify-center" dir={dir}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">{t.loading}</span>
        </div>
      </div>
    );
  }

  const groups = [
    { id: 'management', label: t.management },
    { id: 'ai', label: t.ai },
    { id: 'tools', label: t.tools },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-950 flex" dir={dir}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} z-50 h-full w-72 bg-gray-900/95 backdrop-blur-xl ${isRtl ? 'border-l' : 'border-r'} border-gray-800/50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.dashboard}</h2>
              <p className="text-[11px] text-gray-500">{t.superAdmin}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden mr-auto text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {groups.map((group, gi) => {
            const groupItems = sidebarItems.filter(item => item.group === group.id);
            if (groupItems.length === 0) return null;
            return (
              <div key={group.id} className={gi > 0 ? 'mt-6' : ''}>
                <p className="px-3 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/admin/menu' && location.pathname === '/admin');
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                          <SidebarIcon icon={item.icon} />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block">{isRtl ? labels[lang][item.labelKey as keyof typeof labels['ar']] : labels[lang][item.labelKey as keyof typeof labels['en']]}</span>
                          <span className="block text-[11px] font-normal text-gray-600">
                            {isRtl ? labels[lang][`${item.labelKey}Desc` as keyof typeof labels['ar']] : labels[lang][`${item.labelKey}Desc` as keyof typeof labels['en']]}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800/50 space-y-1">
          <button
            onClick={() => window.open('/', '_blank')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <span>{t.backToSite}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:static">
        {/* Top bar */}
        <header className="shrink-0 bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Quick Bites</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white transition-all active:scale-95"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
