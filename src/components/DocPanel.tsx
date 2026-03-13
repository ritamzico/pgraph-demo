import { useEffect, useState } from 'react';
import { CloseButton } from './CloseButton';

const DSL_DOCS_URL = 'https://raw.githubusercontent.com/ritamzico/pgraph/refs/heads/main/docs/dsl.md';

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-gray-200">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-muted/60 px-1 rounded text-accent text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="text-gray-400 italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => k++;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={key()} className="bg-muted rounded-lg p-3 my-2 overflow-x-auto text-xs text-gray-200 font-mono leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      i++;
      continue;
    }

    // Table (separator rows contain only |, -, :, space)
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(l => !/^[\|\-\:\s]+$/.test(l));
      const [header, ...body] = rows;
      const parseRow = (row: string) => row.split('|').slice(1, -1).map(c => c.trim());
      nodes.push(
        <table key={key()} className="w-full text-sm my-3 border-collapse">
          <thead>
            <tr>
              {parseRow(header).map((cell, j) => (
                <th key={j} className="text-left px-2 py-1 text-gray-400 border-b border-muted font-medium whitespace-nowrap">
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {parseRow(row).map((cell, j) => (
                  <td key={j} className="px-2 py-1 text-gray-300 border-b border-muted/40 text-xs align-top">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key()} className="text-xl font-bold text-gray-100 mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key()} className="text-sm font-semibold text-accent mt-6 mb-2 uppercase tracking-wider">{renderInline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key()} className="text-sm font-semibold text-gray-200 mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
      i++;
      continue;
    }

    if (line.trim() === '---') {
      nodes.push(<hr key={key()} className="border-muted my-4" />);
      i++;
      continue;
    }

    // Bullet list — collect consecutive items
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key()} className="list-disc list-inside space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-gray-300">{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim()) {
      nodes.push(
        <p key={key()} className="text-sm text-gray-300 my-1 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }

    i++;
  }

  return nodes;
}

interface DocPanelProps {
  onClose: () => void;
}

export function DocPanel({ onClose }: DocPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DSL_DOCS_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(text => { if (!cancelled) setContent(text); })
      .catch(err => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="px-4 py-3 border-b border-muted flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-widest">DSL Reference</h2>
        <CloseButton onClick={onClose} title="Close docs" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!content && !error && (
          <p className="text-gray-600 text-sm text-center mt-8 animate-pulse">Loading docs…</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center mt-8">Failed to load docs: {error}</p>
        )}
        {content && renderMarkdown(content)}
      </div>
    </div>
  );
}
