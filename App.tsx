import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { OllamaService } from './services/ollama';
import { ChatMessage, ChatSession, AppSettings, OllamaModel, DEFAULT_SETTINGS, ProjectFile } from './types';
import { PanelRightOpen, PanelRightClose, Code, Layout } from 'lucide-react';

const App: React.FC = () => {
  // State
  // STORAGE KEY UPDATED TO v2 TO ENSURE FRESH DEFAULTS ARE LOADED
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ollama_settings_v2');
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
  const [settingsOpen, setSettingsOpen] = useState(false); // Settings panel toggler
  const [viewMode, setViewMode] = useState<'both' | 'chat_only' | 'code_only'>('both');

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Workspace State
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Persistence
  useEffect(() => {
    localStorage.setItem('ollama_settings_v2', JSON.stringify(settings));
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
      if (!settings.model && fetchedModels.length > 0) {
        setSettings(prev => ({ ...prev, model: fetchedModels[0].name }));
      }
    } catch (err: any) {
      console.warn("Ollama connection failed:", err.message);
      setConnectionError(err.message || 'Could not connect to Ollama server.');
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.serverUrl]);

  useEffect(() => {
    fetchModels();
  }, []);

  // File Parsing Logic
  useEffect(() => {
    if (!currentSession) {
      setProjectFiles([]);
      return;
    }

    const lastMsg = currentSession.messages[currentSession.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      const files: ProjectFile[] = [];
      const content = lastMsg.content;
      
      // 1. Find all complete files using regex
      const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
      
      let match;
      while ((match = fileRegex.exec(content)) !== null) {
        const path = match[1];
        const fileContent = match[2].trim();
        
        const existingIndex = files.findIndex(f => f.path === path);
        const newFile = { path, content: fileContent, language: 'typescript' };
        
        if (existingIndex >= 0) {
          files[existingIndex] = newFile;
        } else {
          files.push(newFile);
        }
      }

      // 2. Handle incomplete file at the end (streaming)
      // Match the last <file tag. If it appears AFTER the last </file> tag, it is incomplete.
      const lastOpenTag = content.lastIndexOf('<file path="');
      const lastCloseTag = content.lastIndexOf('</file>');
      
      if (lastOpenTag > lastCloseTag && lastOpenTag !== -1) {
          const remainder = content.slice(lastOpenTag);
          const pathMatch = remainder.match(/<file\s+path="([^"]+)">/);
          if (pathMatch) {
              const path = pathMatch[1];
              // Content is everything after the opening tag
              const fileContent = remainder.slice(pathMatch[0].length);
              
              const existingIndex = files.findIndex(f => f.path === path);
              const newFile = { path, content: fileContent, language: 'typescript' };
              
              if (existingIndex >= 0) {
                files[existingIndex] = newFile;
              } else {
                files.push(newFile);
              }
          }
      }
      
      if (files.length > 0) {
        setProjectFiles(files);
      }
    }
  }, [currentSession, isStreaming]);

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
    setProjectFiles([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setInput('');
    setProjectFiles([]); // clear temporarily
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !settings.model) return;

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
       const sess = sessions.find(s => s.id === activeSessionId);
       if (sess && sess.title === 'New Chat') {
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {...s, title: input.slice(0, 30)} : s));
       }
    }

    const userMessage: ChatMessage = { role: 'user', content: input };
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    }));
    
    setInput('');
    setIsStreaming(true);

    try {
      // Ensure system instructions are always first
      const messagesPayload = [
        { role: 'system', content: settings.systemInstruction },
        ...(sessions.find(s => s.id === activeSessionId)?.messages || []),
        userMessage
      ] as ChatMessage[];

      let assistantMessageContent = '';
      
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
       setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { role: 'assistant', content: '**Error**: Failed to generate response. Check connection settings.' }] };
        }
        return s;
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
     setIsStreaming(false);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-sm md:text-base font-sans">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        toggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white z-20 shrink-0">
           <div className="flex items-center gap-2">
             <div className="md:hidden w-8" /> 
             <span className="font-medium text-gray-700 truncate">
               {currentSession?.title || 'Ollama Studio'}
             </span>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-gray-100 p-0.5 rounded-lg mr-2">
                <button 
                  onClick={() => setViewMode('chat_only')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'chat_only' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Chat
                </button>
                <button 
                   onClick={() => setViewMode('both')}
                   className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'both' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Split
                </button>
                <button 
                   onClick={() => setViewMode('code_only')}
                   className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'code_only' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Project
                </button>
              </div>

              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600 hidden sm:block border border-gray-200">
                 {settings.model || 'No model selected'}
              </div>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-2 rounded-md transition-colors ${settingsOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Settings"
              >
                 {settingsOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
           </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Chat Pane */}
          <div className={`${
            viewMode === 'code_only' ? 'hidden' : 
            viewMode === 'chat_only' ? 'w-full' : 
            'w-[35%] min-w-[320px] max-w-[600px] border-r border-gray-200'
          } flex flex-col transition-all duration-300`}>
            <ChatArea 
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              onStop={handleStop}
              isModelSelected={!!settings.model}
            />
          </div>

          {/* Workspace Pane */}
          <div className={`${
            viewMode === 'chat_only' ? 'hidden' : 
            'flex-1'
          } flex flex-col transition-all duration-300`}>
             <WorkspacePanel files={projectFiles} />
          </div>
          
          {/* Settings Pane (Overlay or Push) */}
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