import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DiffViewerProps {
  originalContent: string;
  newContent: string;
  filePath: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  newContent,
  filePath,
}) => {
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'py': return 'python';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  const computeDiff = (original: string, modified: string): DiffLine[] => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const diff: DiffLine[] = [];
    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';

      if (originalLine === modifiedLine) {
        if (originalLine.trim() || modifiedLine.trim()) { // Só adiciona linhas não vazias
          diff.push({
            type: 'unchanged',
            content: originalLine,
            lineNumber: i + 1
          });
        }
      } else {
        if (originalLine) {
          diff.push({
            type: 'removed',
            content: originalLine,
            lineNumber: i + 1
          });
        }
        if (modifiedLine) {
          diff.push({
            type: 'added',
            content: modifiedLine,
            lineNumber: i + 1
          });
        }
      }
    }

    return diff;
  };

  const diffLines = computeDiff(originalContent, newContent);
  const language = getLanguage(filePath);

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderLeft: '3px solid #22c55e'
        };
      case 'removed':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444',
          textDecoration: 'line-through',
          opacity: 0.7
        };
      default:
        return {};
    }
  };

  return (
    <div style={{ border: '1px solid #38bdf8', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        backgroundColor: '#0f172a',
        padding: '8px 16px',
        borderBottom: '1px solid #38bdf8',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#38bdf8'
      }}>
        🔍 Comparação: {filePath}
      </div>

      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px'
      }}>
        {diffLines.map((line, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '20px',
              ...getLineStyle(line.type)
            }}
          >
            <span style={{
              width: '40px',
              textAlign: 'right',
              paddingRight: '8px',
              color: '#64748b',
              fontSize: '12px',
              userSelect: 'none'
            }}>
              {line.lineNumber}
            </span>

            <span style={{
              width: '20px',
              textAlign: 'center',
              fontSize: '12px',
              userSelect: 'none'
            }}>
              {line.type === 'added' && '+'}
              {line.type === 'removed' && '-'}
              {line.type === 'unchanged' && ' '}
            </span>

            <div style={{ flex: 1, padding: '2px 0' }}>
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '0 8px',
                  background: 'transparent',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
                showLineNumbers={false}
                wrapLines={true}
                wrapLongLines={true}
              >
                {line.content || ' '}
              </SyntaxHighlighter>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: '#0f172a',
        padding: '8px 16px',
        borderTop: '1px solid #38bdf8',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ color: '#22c55e' }}>+ {diffLines.filter(l => l.type === 'added').length} adicionadas</span>
          <span style={{ color: '#ef4444' }}>- {diffLines.filter(l => l.type === 'removed').length} removidas</span>
          <span style={{ color: '#64748b' }}>≡ {diffLines.filter(l => l.type === 'unchanged').length} inalteradas</span>
        </div>
      </div>
    </div>
  );
};
