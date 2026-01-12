import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { OllamaService } from './services/ollama';
import { ChatMessage, ChatSession, AppSettings, OllamaModel, DEFAULT_SETTINGS } from './types';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ollama_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ollama_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [settingsOpen, setSettingsOpen] = useState(true); // Desktop right panel

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Persistence
  useEffect(() => {
    localStorage.setItem('ollama_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Fetch Models
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    setConnectionError(null);
    try {
      const fetchedModels = await OllamaService.getModels(settings.serverUrl);
      setModels(fetchedModels);
      // Auto select first model if none selected
      if (!settings.model && fetchedModels.length > 0) {
        setSettings(prev => ({ ...prev, model: fetchedModels[0].name }));
      }
    } catch (err) {
      console.error("Model fetch failed:", err);
      setConnectionError('Could not connect to Ollama server.');
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.serverUrl]); // Dependency fixed: only re-fetch if URL changes

  // Initial fetch
  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handlers
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput('');
    // Mobile: close sidebar
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setInput('');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !settings.model) return;

    // Create session if none exists
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(activeSessionId);
    } else {
       // Update title if it's "New Chat"
       const sess = sessions.find(s => s.id === activeSessionId);
       if (sess && sess.title === 'New Chat') {
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {...s, title: input.slice(0, 30)} : s));
       }
    }

    const userMessage: ChatMessage = { role: 'user', content: input };
    
    // Add User Message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    }));
    
    setInput('');
    setIsStreaming(true);

    try {
      const messagesPayload = [
        { role: 'system', content: settings.systemInstruction },
        ...(sessions.find(s => s.id === activeSessionId)?.messages || []),
        userMessage
      ] as ChatMessage[];

      let assistantMessageContent = '';
      
      // Initialize assistant message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { role: 'assistant', content: '' }] };
        }
        return s;
      }));

      await OllamaService.chatStream(
        settings.serverUrl,
        settings.model,
        messagesPayload,
        {
          temperature: settings.temperature,
          top_k: settings.topK,
          top_p: settings.topP,
        },
        (chunk) => {
          assistantMessageContent += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const newMessages = [...s.messages];
              newMessages[newMessages.length - 1] = { 
                role: 'assistant', 
                content: assistantMessageContent 
              };
              return { ...s, messages: newMessages };
            }
            return s;
          }));
        }
      );
    } catch (error) {
      console.error(error);
      // Add error message to chat
       setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { role: 'assistant', content: '**Error**: Failed to generate response. Check connection.' }] };
        }
        return s;
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
     // Currently Ollama API cancellation needs an abort controller, 
     // but for simplicity we just stop updating UI and set streaming false.
     // In a real app, pass AbortSignal to the fetch.
     setIsStreaming(false);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-sm md:text-base">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        toggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white z-20">
           <div className="flex items-center gap-2">
             <div className="md:hidden w-8" /> {/* Spacer for menu button */}
             <span className="font-medium text-gray-700 truncate">
               {currentSession?.title || 'Ollama Studio'}
             </span>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600 hidden sm:block">
                 {settings.model || 'No model selected'}
              </div>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-2 rounded-md transition-colors ${settingsOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Toggle settings"
              >
                 {settingsOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
           </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <ChatArea 
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={handleStop}
            isModelSelected={!!settings.model}
          />
          
          {settingsOpen && (
             <SettingsPanel 
                settings={settings}
                setSettings={setSettings}
                models={models}
                onRefreshModels={fetchModels}
                isLoadingModels={isLoadingModels}
                connectionError={connectionError}
             />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;