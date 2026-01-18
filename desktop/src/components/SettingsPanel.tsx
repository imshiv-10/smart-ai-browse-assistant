import { Settings, Sun, Moon, Monitor, Globe, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function SettingsPanel() {
  const { settings, setSettings } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
      </div>

      {/* Theme */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex gap-3">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setSettings({ theme: value as 'light' | 'dark' | 'system' })}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                settings.theme === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon
                className={`w-6 h-6 ${
                  settings.theme === value ? 'text-blue-500' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  settings.theme === value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Backend URL */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Backend Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backend URL
            </label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => setSettings({ backendUrl: e.target.value })}
              className="input"
              placeholder="http://localhost:8000"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The URL of the Smart Browse backend API
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Local LLM URL (Optional)
            </label>
            <input
              type="text"
              value={settings.localLlmUrl}
              onChange={(e) => setSettings({ localLlmUrl: e.target.value })}
              className="input"
              placeholder="http://localhost:1234"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL for local LLM server (e.g., LM Studio, Ollama)
            </p>
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Behavior</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Auto-summarize</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically generate a summary when analyzing a URL
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.autoSummarize}
                onChange={(e) => setSettings({ autoSummarize: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Smart Browse Assistant</strong> v1.0.0
          </p>
          <p>AI-powered webpage analysis and product comparison tool.</p>
          <p className="text-xs">Built with Tauri, React, and TypeScript</p>
        </div>
      </div>
    </div>
  );
}
