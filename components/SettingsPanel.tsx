import React from 'react';
import { Sliders, Settings, HelpCircle, AlertTriangle } from 'lucide-react';
import { AppSettings, OllamaModel } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  models: OllamaModel[];
  onRefreshModels: () => void;
  isLoadingModels: boolean;
  connectionError: string | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  setSettings,
  models,
  onRefreshModels,
  isLoadingModels,
  connectionError,
}) => {
  const handleChange = (field: keyof AppSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Sliders size={18} />
          Run settings
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Model
          </label>
          <div className="relative">
            <select
              value={settings.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              disabled={isLoadingModels}
            >
              <option value="" disabled>Select a model</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.details.parameter_size})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <button 
            onClick={onRefreshModels}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
          >
             {isLoadingModels ? 'Refreshing...' : 'Refresh Models'}
          </button>
        </div>

        {/* Server Configuration */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ollama Server URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.serverUrl}
              onChange={(e) => handleChange('serverUrl', e.target.value)}
              placeholder="http://192.168.1.20:11434"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {connectionError && (
             <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 space-y-2">
                <div className="flex gap-2 items-start font-medium">
                   <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                   <span>Connection Failed</span>
                </div>
                <div className="pl-6 space-y-1">
                   <p>{connectionError}</p>
                   <div className="pt-1 border-t border-red-100 mt-1">
                      <p className="font-semibold text-red-700">Possible fixes:</p>
                      <ul className="list-disc pl-4 space-y-1 text-red-700/80">
                         <li>Ensure Ollama is running</li>
                         <li>Check URL (default: http://192.168.1.20:11434)</li>
                         <li>Allow browser connections (CORS):</li>
                      </ul>
                      <code className="block mt-1 bg-red-100 p-1.5 rounded font-mono text-[10px] break-all select-all">
                        OLLAMA_ORIGINS="*" ollama serve
                      </code>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                System Instructions
              </label>
           </div>
           <textarea
             value={settings.systemInstruction}
             onChange={(e) => handleChange('systemInstruction', e.target.value)}
             className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
             placeholder="Give the model context, a persona, or rules to follow..."
           />
        </div>

        {/* Parameters */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase">Temperature</label>
              <span className="text-xs text-gray-700">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase">Top K</label>
              <span className="text-xs text-gray-700">{settings.topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={settings.topK}
              onChange={(e) => handleChange('topK', parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase">Top P</label>
              <span className="text-xs text-gray-700">{settings.topP}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
           <a href="https://github.com/ollama/ollama/blob/main/docs/faq.md" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
              <HelpCircle size={14} />
              Ollama Documentation
           </a>
        </div>
      </div>
    </div>
  );
};