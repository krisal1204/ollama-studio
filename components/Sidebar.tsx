import React from 'react';
import { Plus, MessageSquare, Menu, Database, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  isOpen,
  toggleOpen,
}) => {
  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleOpen}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        <Menu size={20} />
      </button>

      <div 
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transform md:translate-x-0 transition-transform duration-200 fixed md:static inset-y-0 left-0 w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-40`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database className="text-white" size={18} />
          </div>
          <span className="font-bold text-gray-700 text-lg">Ollama Studio</span>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            <span className="font-semibold">Create new</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
           <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent
           </div>
           {sessions.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-400 italic">No history</div>
           )}
          {sessions.map((session) => (
            <div key={session.id} className="relative group">
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="truncate pr-6">{session.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all ${
                  currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
           <p>Local Ollama Interface</p>
           <p className="mt-1">v1.0.0</p>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={toggleOpen}
        />
      )}
    </>
  );
};