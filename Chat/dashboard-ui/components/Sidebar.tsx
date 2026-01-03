import React from 'react';
import { ProjectFile } from '../types';
import { FolderGit2, FileCode, Database, BrainCircuit, Settings } from 'lucide-react';

interface SidebarProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelect: (file: ProjectFile) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ files, selectedFile, onSelect }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'backend': return <Database size={16} className="text-lira-warning" />;
      case 'frontend': return <FileCode size={16} className="text-lira-accent" />;
      case 'core': return <BrainCircuit size={16} className="text-purple-400" />;
      default: return <Settings size={16} className="text-gray-400" />;
    }
  };

  const groupedFiles = files.reduce<Record<string, ProjectFile[]>>((acc, file) => {
    const dir = file.path.split('/')[0];
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(file);
    return acc;
  }, {});

  return (
    <div className="w-64 bg-lira-bg border-r border-lira-surface flex flex-col h-full">
      <div className="p-4 border-b border-lira-surface flex items-center gap-2">
        <FolderGit2 className="text-lira-accent" />
        <span className="font-bold font-mono tracking-tight text-lg">Lira <span className="text-lira-muted text-sm">LDM</span></span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedFiles).map(([dir, dirFiles]) => (
          <div key={dir} className="mb-4">
            <h3 className="text-xs font-bold text-lira-muted uppercase tracking-wider mb-2 px-2">{dir}/</h3>
            <ul className="space-y-1">
              {(dirFiles as ProjectFile[]).map(file => (
                <li key={file.path}>
                  <button
                    onClick={() => onSelect(file)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-mono flex items-center gap-2 transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-lira-accent/10 text-lira-accent border border-lira-accent/20'
                        : 'text-lira-muted hover:bg-lira-surface hover:text-lira-text'
                    }`}
                  >
                    {getIcon(file.type)}
                    <span className="truncate">{file.path.split('/')[1]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;