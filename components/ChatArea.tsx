import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Square, User, Sparkles, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 select-none px-6 text-center">
             <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-blue-500" />
             </div>
             <p className="font-medium mb-1">How can I help you today?</p>
             <p className="text-xs">Select a model and ask to generate code.</p>
          </div>
        ) : (
          messages.filter(m => m.role !== 'system').map((msg, idx) => (
            <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               
              <div
                className={`flex-1 px-4 py-3 rounded-2xl max-w-full text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-100 text-gray-800 rounded-tr-none'
                    : 'bg-white text-gray-800 pl-0'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-blue-600">
                     <Sparkles size={12} />
                     <span>Model</span>
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none prose-slate prose-pre:bg-gray-50 prose-pre:text-gray-700 prose-pre:border prose-pre:border-gray-200">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all duration-200">
           {/* Loading State Overlay */}
           {!isModelSelected && (
              <div className="absolute inset-0 bg-gray-50/90 z-10 rounded-2xl flex items-center justify-center text-gray-500 gap-2 cursor-not-allowed text-xs">
                 <AlertCircle size={14} />
                 <span className="font-medium">Model required</span>
              </div>
           )}

          <div className="flex items-end p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type instructions or paste code..."
              className="w-full max-h-[150px] py-2 px-3 bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
              rows={1}
              disabled={!isModelSelected}
            />
            <div className="pb-0.5 pr-0.5">
              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors flex items-center justify-center"
                  title="Stop generation"
                >
                  <Square size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!input.trim() || !isModelSelected}
                  className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                    input.trim() && isModelSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Run prompt"
                >
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-center text-[10px] text-gray-400 mt-2">
           Local LLMs can be unpredictable.
        </div>
      </div>
    </div>
  );
};