import { useState, useRef } from 'react';
import * as api from '../api';
import type { ServerGraph } from '../api';
import type { ClientGraph } from '../hooks/useServerGraphs';
import { CloseButton } from './CloseButton';

interface QueryHistoryItem {
  id: number;
  query: string;
  response: string | null;
  timestamp: Date;
  isLoading: boolean;
  isError: boolean;
  isMutation: boolean;
}

export interface QueryPanelProps {
  activeGraph: ClientGraph | null;
  onHighlightPath: (nodeIds: string[], edgeIds: string[]) => void;
  onClearHighlight: () => void;
  onMutation: (data: ServerGraph) => void;
  onClose?: () => void;
}

let nextId = 1;

export function QueryPanel({ activeGraph, onHighlightPath: _onHighlightPath, onClearHighlight, onMutation, onClose }: QueryPanelProps) {
  const [query, setQuery] = useState('');
  const [historyMap, setHistoryMap] = useState<Record<string, QueryHistoryItem[]>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const graphName = activeGraph?.name ?? null;
  const history = graphName ? (historyMap[graphName] ?? []) : [];

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || !activeGraph) return;

    const name = activeGraph.name;
    const id = nextId++;
    setHistoryMap(prev => ({
      ...prev,
      [name]: [
        { id, query: trimmed, response: null, timestamp: new Date(), isLoading: true, isError: false, isMutation: false },
        ...(prev[name] ?? []),
      ],
    }));
    setQuery('');
    textareaRef.current?.focus();

    try {
      const data = await api.query(activeGraph.data, trimmed) as { kind: string; data: unknown };
      if (data.kind === 'mutation') {
        onMutation(data.data as ServerGraph);
      }
      setHistoryMap(prev => ({
        ...prev,
        [name]: (prev[name] ?? []).map(h =>
          h.id === id
            ? { ...h, isLoading: false, isMutation: data.kind === 'mutation', response: JSON.stringify(data.data, null, 2) }
            : h,
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setHistoryMap(prev => ({
        ...prev,
        [name]: (prev[name] ?? []).map(h =>
          h.id === id ? { ...h, isLoading: false, response: `Error: ${message}`, isError: true } : h,
        ),
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const disabled = !query.trim() || !activeGraph;

  return (
    <div className="flex flex-col h-full border-l border-muted bg-panel">
      <div className="px-4 py-3 border-b border-muted shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-widest">Query</h2>
        {onClose && <CloseButton onClick={onClose} />}
      </div>
      <div className="p-4 flex flex-col gap-2 border-b border-muted shrink-0">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeGraph ? 'Enter a query…' : 'Select a graph first…'}
          disabled={!activeGraph}
          rows={4}
          className="w-full bg-muted text-gray-100 placeholder-gray-600 text-sm rounded-lg p-3 resize-none border border-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-40"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-1 bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Submit
          </button>
          <button
            onClick={onClearHighlight}
            disabled={disabled}
            className="bg-muted hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 text-sm rounded-lg px-3 py-2 transition-colors"
            title="Clear path highlight"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-600">⌘/Ctrl + Enter to submit</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {history.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">No queries yet</p>
        )}
        {history.map(item => (
          <div
            key={item.id}
            className="bg-muted rounded-lg p-3 text-sm border border-muted/50 flex flex-col gap-1"
          >
            <span className="text-xs text-gray-600 tabular-nums">{item.timestamp.toLocaleTimeString()}</span>
            <p className={`font-medium wrap-break-word ${item.isError ? 'text-red-400' : 'text-accent'}`}>{item.query}</p>
            {item.isLoading ? (
              <p className="text-gray-500 animate-pulse">Processing…</p>
            ) : item.isError ? (
              <pre className="text-red-400/70 text-xs wrap-break-word whitespace-pre-wrap">{item.response}</pre>
            ) : item.isMutation ? (
              <p className="text-gray-600 text-xs italic">Graph updated.</p>
            ) : item.response ? (
              <pre className="text-gray-300 text-xs whitespace-pre-wrap overflow-y-auto max-h-48 mt-1">{item.response}</pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
