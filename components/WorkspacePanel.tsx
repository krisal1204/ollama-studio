import React, { useState, useEffect } from 'react';
import { FileCode, Folder, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { ProjectFile } from '../types';

interface WorkspacePanelProps {
  files: ProjectFile[];
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-select the first file if none selected or if files change
  useEffect(() => {
    if (files.length > 0 && (!selectedFile || !files.find(f => f.path === selectedFile))) {
      setSelectedFile(files[0].path);
    }
  }, [files, selectedFile]);

  const activeFile = files.find(f => f.path === selectedFile);

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-l border-gray-200 text-gray-400 p-8 text-center">
        <Folder size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-600">Project Workspace</h3>
        <p className="max-w-xs mt-2 text-sm">
          Generated files will appear here. Ask the model to "create an app" or "generate files" to see the result.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full bg-white border-l border-gray-200 overflow-hidden">
      {/* File Tree Sidebar */}
      <div className="w-64 flex flex-col border-r border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200 font-medium text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Folder size={14} />
          Project Files ({files.length})
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                selectedFile === file.path
                  ? 'bg-white text-blue-600 border-l-2 border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'
              }`}
            >
              <FileCode size={16} className={selectedFile === file.path ? 'text-blue-500' : 'text-gray-400'} />
              <span className="truncate font-mono text-xs">{file.path}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeFile ? (
          <>
            <div className="h-10 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
              <span className="font-mono text-sm text-gray-600">{activeFile.path}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy code"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex-1 overflow-auto relative">
              <pre className="min-h-full p-4 text-sm font-mono leading-relaxed tab-4">
                <code>{activeFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a file to view content
          </div>
        )}
      </div>
    </div>
  );
};