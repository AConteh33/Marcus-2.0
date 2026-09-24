import React, { useState, useEffect } from 'react';
import { getAIConfig, saveAIConfig, type AIConfig } from '../../services/configService';
import { getFoodOrderSystemPrompt } from '../../prompts/foodOrderPrompt';

const DEFAULT_PROMPT = getFoodOrderSystemPrompt();

export const AIScriptEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasChanges = prompt !== originalPrompt;

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const config = await getAIConfig();
      if (config) {
        setPrompt(config.systemPrompt);
        setOriginalPrompt(config.systemPrompt);
        setLastUpdated(config.updatedAt);
      } else {
        setPrompt(DEFAULT_PROMPT);
        setOriginalPrompt(DEFAULT_PROMPT);
        setLastUpdated(null);
      }
    } catch {
      setPrompt(DEFAULT_PROMPT);
      setOriginalPrompt(DEFAULT_PROMPT);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      await saveAIConfig({ systemPrompt: prompt, updatedAt: now });
      setOriginalPrompt(prompt);
      setLastUpdated(now);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPrompt(originalPrompt);
    setError('');
  };

  const handleReset = async () => {
    setPrompt(DEFAULT_PROMPT);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">AI Script</h1>
          <p className="text-gray-500 text-sm">سكريبت الذكاء الاصطناعي</p>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
                <span className="mx-1">|</span>
                آخر تحديث: {new Date(lastUpdated).toLocaleDateString('ar-SA')}
              </span>
            )}
            {hasChanges && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
                <span className="text-amber-400/60">| تغييرات غير محفوظة</span>
              </span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
          >
            Reset to Default
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Editor Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">System Prompt</h2>
              <p className="text-xs text-gray-500 mt-0.5">النظام الأساسي</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={!hasChanges}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-700"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="p-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[400px] bg-gray-800/50 text-gray-200 text-sm leading-relaxed p-4 rounded-xl border border-transparent focus:border-emerald-500/30 focus:outline-none resize-y font-mono placeholder-gray-600"
              placeholder="Enter system prompt..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">معاينة</p>
          </div>
          <div className="p-5">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-2">What the AI reads:</p>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed break-words">{prompt || 'No prompt set.'}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
