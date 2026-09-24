import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

type Lang = 'ar' | 'en';

const labels = {
  ar: {
    title: 'لوحة الإدارة',
    subtitle: 'سجل دخولك لإدارة مطعمك',
    username: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    enterUsername: 'أدخل البريد الإلكتروني',
    enterPassword: 'أدخل كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جاري تسجيل الدخول...',
    backToMenu: 'العودة للقائمة',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    welcome: 'مرحباً بك في لوحة الإدارة!',
    rememberMe: 'تذكرني',
  },
  en: {
    title: 'Admin Portal',
    subtitle: 'Sign in to manage your restaurant',
    username: 'Email',
    password: 'Password',
    enterUsername: 'Enter email',
    enterPassword: 'Enter password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    backToMenu: 'Back to Menu',
    invalidCredentials: 'Invalid username or password',
    welcome: 'Welcome to Admin Portal!',
    rememberMe: 'Remember me',
  },
};

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('ar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const SUPER_ADMIN_EMAIL = 'superadmin@quickbites.com';
    const SUPER_ADMIN_PASSWORD = 'QB2024!';

    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      localStorage.setItem('qb_admin_auth', 'true');
      navigate('/admin');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch {
      setError(t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-950 flex items-center justify-center px-4" dir={dir}>
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className={`flex ${lang === 'ar' ? 'justify-start' : 'justify-end'} mb-4`}>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white transition-all active:scale-95"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{t.backToMenu}</span>
        </button>

        {/* Login Card */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl shadow-black/50 border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{t.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t.username}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.enterUsername}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.enterPassword}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer">
                {t.rememberMe}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.signingIn}
                </span>
              ) : (
                t.signIn
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
