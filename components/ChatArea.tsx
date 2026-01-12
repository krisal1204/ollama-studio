import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Square, User, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop: () => void;
  isModelSelected: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  isModelSelected,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 select-none">
             <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-blue-500" />
             </div>
             <p className="text-lg font-medium">Start your story</p>
             <p className="text-sm">Configure a model on the right to begin</p>
          </div>
        ) : (
          messages.filter(m => m.role !== 'system').map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
               {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                     <Sparkles size={16} className="text-blue-600" />
                  </div>
               )}
               
              <div
                className={`flex-1 max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-gray-100 text-gray-800 rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none'
                }`}
              >
                <div className="prose prose-sm md:prose-base max-w-none prose-slate">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                     <User size={16} className="text-gray-600" />
                  </div>
               )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto relative bg-white rounded-3xl border border-gray-300 shadow-lg focus-within:shadow-xl focus-within:border-blue-400 transition-all duration-200">
           {/* Loading State Overlay if no model selected */}
           {!isModelSelected && (
              <div className="absolute inset-0 bg-gray-50/80 z-10 rounded-3xl flex items-center justify-center text-gray-500 gap-2 cursor-not-allowed">
                 <AlertCircle size={18} />
                 <span className="text-sm font-medium">Select a model to start chatting</span>
              </div>
           )}

          <div className="flex items-end p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your prompt here..."
              className="w-full max-h-[200px] py-3 px-4 bg-transparent border-none outline-none resize-none text-gray-700 placeholder-gray-400"
              rows={1}
              disabled={!isModelSelected || (isStreaming && false)} // Allow typing while streaming? Usually no.
            />
            <div className="pb-1 pr-1">
              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center justify-center"
                  title="Stop generation"
                >
                  <Square size={20} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!input.trim() || !isModelSelected}
                  className={`p-3 rounded-full transition-colors flex items-center justify-center ${
                    input.trim() && isModelSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Run prompt"
                >
                  <Play size={20} fill="currentColor" className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 mt-2">
           Ollama Studio can make mistakes. Check model details.
        </div>
      </div>
    </div>
  );
};