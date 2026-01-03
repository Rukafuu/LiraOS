import React from 'react';
import { ProjectFile } from '../types';

interface CodeEditorProps {
  file: ProjectFile | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-lira-muted opacity-50 h-full">
        <div className="w-16 h-16 border-2 border-dashed border-lira-muted rounded-lg mb-4 flex items-center justify-center">
           <span className="text-2xl">?</span>
        </div>
        <p>No file selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-lira-surface shadow-2xl overflow-hidden">
        {/* Editor Header */}
        <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-black">
            <span className="text-sm text-gray-300 font-mono">{file.path}</span>
            <span className="text-xs text-gray-500">{file.type.toUpperCase()}</span>
        </div>

        {/* Editor Content - Simplified without syntax highlighting */}
        <div className="flex-1 overflow-auto p-4">
            <pre className="text-gray-300 font-mono text-sm leading-6 whitespace-pre-wrap">
                {file.content.split('\n').map((line, i) => (
                    <div key={i} className="table-row">
                        <span className="table-cell text-gray-600 select-none text-right pr-4 w-8">{i + 1}</span>
                        <span className="table-cell whitespace-pre-wrap">{line}</span>
                    </div>
                ))}
            </pre>
        </div>

        {/* File Description Footer */}
        <div className="bg-[#007acc] text-white px-4 py-1 text-xs font-medium">
            MEM_MAP: {file.description}
        </div>
    </div>
  );
};

export default CodeEditor;
