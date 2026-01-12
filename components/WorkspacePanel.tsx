import React, { useState, useEffect } from 'react';
import { FileCode, Folder, Copy, Check, Download, Play, Code as CodeIcon, Eye, AlertTriangle } from 'lucide-react';
import { ProjectFile } from '../types';
import JSZip from 'jszip';
import { Sandpack } from "@codesandbox/sandpack-react";

interface WorkspacePanelProps {
  files: ProjectFile[];
  onUpdateFile?: (path: string, content: string) => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ files, onUpdateFile }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);

  // Auto-select first file
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

  const handleDownload = async () => {
    if (files.length === 0) return;
    
    const zip = new JSZip();
    files.forEach(file => {
      // Remove leading slash if present to avoid empty top folder
      const cleanPath = file.path.replace(/^\//, '');
      zip.file(cleanPath, file.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ollama-project.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const renderPreview = () => {
    if (files.length === 0) return null;

    // Detect if this is likely a React/Node project or Static HTML
    const hasPackageJson = files.some(f => f.path === 'package.json' || f.path === '/package.json');
    const hasIndexHtml = files.some(f => f.path === 'index.html' || f.path === '/index.html');

    // SANDPACK FOR REACT/NODE
    if (hasPackageJson) {
      try {
        // Convert our ProjectFile[] to Sandpack's files object format
        const sandpackFiles: Record<string, any> = {};
        files.forEach(f => {
          // Sandpack expects paths to start with / typically, or relative to root
          let path = f.path;
          if (!path.startsWith('/')) path = '/' + path;
          sandpackFiles[path] = { code: f.content };
        });

        // Add a default entry file if main is missing
        if (!sandpackFiles['/App.js'] && !sandpackFiles['/App.tsx'] && !sandpackFiles['/src/App.tsx'] && !sandpackFiles['/index.js']) {
           // This helps avoid sandpack crashing if no entry point is found
        }

        return (
          <div className="h-full w-full">
             <Sandpack 
               template="react"
               theme="light"
               files={sandpackFiles}
               options={{
                 showNavigator: true,
                 showTabs: false, // We use our own file tree
                 editorHeight: '100%',
                 showConsole: true,
                 showConsoleButton: true,
                 externalResources: ["https://cdn.tailwindcss.com"]
               }}
               customSetup={{ 
                 dependencies: { 
                   "lucide-react": "latest",
                   "react-router-dom": "latest" 
                  } 
               }}
             />
          </div>
        );
      } catch (e) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
            <AlertTriangle size={32} className="mb-2" />
            <p>Preview Error</p>
          </div>
        );
      }
    }

    // STATIC HTML PREVIEW
    if (hasIndexHtml) {
       const indexFile = files.find(f => f.path === 'index.html' || f.path === '/index.html');
       if (!indexFile) return <div>No index.html found</div>;

       const blob = new Blob([indexFile.content], { type: 'text/html' });
       const url = URL.createObjectURL(blob);

       return (
         <iframe 
           src={url} 
           className="w-full h-full bg-white"
           title="Preview"
           sandbox="allow-scripts allow-modals"
         />
       );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
        <Play size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-600">No Preview Available</h3>
        <p className="max-w-xs mt-2 text-sm">
          Add an <code>index.html</code> or a <code>package.json</code> to enable preview.
        </p>
      </div>
    );
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
    <div className="flex-1 flex flex-col h-full bg-white border-l border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="h-10 border-b border-gray-200 flex items-center justify-between px-3 bg-gray-50/50">
         <div className="flex bg-gray-200/50 p-1 rounded-lg">
            <button
               onClick={() => setActiveTab('code')}
               className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
               <CodeIcon size={14} />
               Code
            </button>
            <button
               onClick={() => setActiveTab('preview')}
               className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
               <Eye size={14} />
               Preview & Run
            </button>
         </div>

         <div className="flex items-center gap-2">
            <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Download as ZIP"
            >
                <Download size={14} />
                Download
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'code' ? (
          <>
            {/* File Tree Sidebar */}
            <div className="w-56 flex flex-col border-r border-gray-200 bg-gray-50">
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

            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {activeFile ? (
                <>
                  <div className="h-8 flex items-center justify-between px-4 border-b border-gray-100 bg-white">
                    <span className="font-mono text-xs text-gray-500">{activeFile.path}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy content"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={activeFile.content}
                      onChange={(e) => onUpdateFile && onUpdateFile(activeFile.path, e.target.value)}
                      className="w-full h-full p-4 font-mono text-sm leading-relaxed resize-none outline-none text-gray-800"
                      spellCheck={false}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Select a file to edit
                </div>
              )}
            </div>
          </>
        ) : (
          // Preview Tab
          <div className="flex-1 bg-gray-100 relative overflow-hidden">
             {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
};