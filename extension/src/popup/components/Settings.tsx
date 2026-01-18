import { useState, useEffect } from 'react';
import { ApiClient } from '@/shared/api';
import type { Settings as SettingsType } from '@/shared/types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => Promise<void>;
}

export function Settings({ settings, onUpdate }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [localLLMStatus, setLocalLLMStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check service status
  useEffect(() => {
    const checkStatus = async () => {
      const apiClient = new ApiClient(localSettings);

      // Check local LLM
      setLocalLLMStatus('checking');
      const localOk = await apiClient.checkLocalLLMHealth();
      setLocalLLMStatus(localOk ? 'online' : 'offline');

      // Check backend
      setBackendStatus('checking');
      const backendOk = await apiClient.checkBackendHealth();
      setBackendStatus(backendOk ? 'online' : 'offline');
    };

    checkStatus();
  }, [localSettings.localLLMUrl, localSettings.backendUrl]);

  const handleChange = (key: keyof SettingsType, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localSettings);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  const StatusIndicator = ({ status }: { status: 'checking' | 'online' | 'offline' }) => (
    <span className={`inline-flex items-center gap-1 text-xs ${
      status === 'online' ? 'text-green-600 dark:text-green-400' :
      status === 'offline' ? 'text-red-600 dark:text-red-400' :
      'text-gray-500 dark:text-gray-400'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-green-500' :
        status === 'offline' ? 'bg-red-500' :
        'bg-gray-400 animate-pulse'
      }`}></span>
      {status === 'checking' ? 'Checking...' : status}
    </span>
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {/* LLM Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            LLM Configuration
          </h3>

          {/* Use Local LLM Toggle */}
          <div className="card p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use Local LLM
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Use LM Studio for quick responses
                </p>
              </div>
              <button
                onClick={() => handleChange('useLocalLLM', !localSettings.useLocalLLM)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.useLocalLLM ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.useLocalLLM ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Local LLM URL */}
          <div className="card p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Local LLM URL
              </label>
              <StatusIndicator status={localLLMStatus} />
            </div>
            <input
              type="text"
              value={localSettings.localLLMUrl}
              onChange={(e) => handleChange('localLLMUrl', e.target.value)}
              placeholder="http://localhost:1234"
              className="input text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              LM Studio API endpoint
            </p>
          </div>

          {/* Backend URL */}
          <div className="card p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Backend URL
              </label>
              <StatusIndicator status={backendStatus} />
            </div>
            <input
              type="text"
              value={localSettings.backendUrl}
              onChange={(e) => handleChange('backendUrl', e.target.value)}
              placeholder="http://localhost:8000"
              className="input text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Python backend server
            </p>
          </div>

          {/* Local LLM Threshold */}
          <div className="card p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Local LLM Threshold
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={localSettings.localLLMThreshold}
              onChange={(e) => handleChange('localLLMThreshold', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1k chars</span>
              <span>{localSettings.localLLMThreshold.toLocaleString()} chars</span>
              <span>10k chars</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Use local LLM for content shorter than this threshold
            </p>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Appearance
          </h3>
          <div className="card p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleChange('theme', theme)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    localSettings.theme === theme
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {theme === 'light' && '☀️'} {theme === 'dark' && '🌙'} {theme === 'system' && '💻'}
                  <span className="ml-1 capitalize">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Behavior */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Behavior
          </h3>

          <div className="card p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-summarize
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Automatically generate summaries
                </p>
              </div>
              <button
                onClick={() => handleChange('autoSummarize', !localSettings.autoSummarize)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.autoSummarize ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoSummarize ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="card p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Chat History Length
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={localSettings.maxHistoryLength}
              onChange={(e) => handleChange('maxHistoryLength', parseInt(e.target.value))}
              className="input text-sm w-24"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum number of chat sessions to store
            </p>
          </div>
        </section>

        {/* Save Button */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary w-full"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {/* Version info */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          Smart Browse Assistant v1.0.0
        </div>
      </div>
    </div>
  );
}
