import { useState, useRef, useEffect } from 'react';

export interface ExampleEntry {
  name: string;
  label: string;
  description: string;
}

export interface GraphSelectorProps {
  graphs: string[];
  activeGraph: string | null;
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
  examples?: ExampleEntry[];
  onLoadExample?: (name: string) => void;
}

export function GraphSelector({ graphs, activeGraph, onSelect, onCreate, onDelete, examples, onLoadExample }: GraphSelectorProps) {
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExamples) return;
    const handler = (e: MouseEvent) => {
      if (!examplesRef.current?.contains(e.target as Node)) setShowExamples(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExamples]);

  const trimmed = newName.trim();
  const isDuplicate = trimmed !== '' && graphs.includes(trimmed);

  const handleCreate = () => {
    if (!trimmed) { setShowInput(false); return; }
    if (isDuplicate) return;
    onCreate(trimmed);
    setNewName('');
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setShowInput(false); setNewName(''); }
  };

  const openInput = () => {
    setShowInput(true);
    // Focus after render
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="flex items-center h-11 px-3 gap-2 bg-panel border-t border-muted shrink-0">
      {/* Tabs — overflow-x-auto only here, so the controls div is never clipped */}
      <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-1">
        {graphs.length === 0 && (
          <span className="text-gray-600 text-xs whitespace-nowrap">No graphs — press + to create one</span>
        )}
        {graphs.map(name => (
          <div
            key={name}
            onClick={() => onSelect(name)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm whitespace-nowrap cursor-pointer transition-colors select-none border ${
              activeGraph === name
                ? 'bg-muted border-accent text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <span>{name}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(name); }}
              className="hover:text-red-400 transition-colors text-gray-400 leading-none -mr-0.5"
              title="Delete graph"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Controls — outside overflow container so the dropdown isn't clipped */}
      <div className="flex items-center gap-1 shrink-0">
        {examples && examples.length > 0 && onLoadExample && (
          <div className="relative" ref={examplesRef}>
            <button
              onClick={() => setShowExamples(v => !v)}
              className="btn"
            >
              Examples
            </button>
            {showExamples && (
              <div className="absolute bottom-full mb-4 right-0 bg-panel border border-muted rounded-lg min-w-max shadow-xl z-20">
                {examples.map(ex => (
                  <button
                    key={ex.name}
                    onClick={() => { onLoadExample(ex.name); setShowExamples(false); }}
                    className="flex flex-col w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm text-gray-200">{ex.label}</span>
                    <span className="text-xs text-gray-500">{ex.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showInput ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCreate}
            placeholder="Graph name"
            className={`bg-muted text-gray-100 placeholder-gray-600 text-sm rounded-lg px-2 py-1 border focus:outline-none w-32 ${isDuplicate ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-accent'}`}
          />
        ) : (
          <button
            onClick={openInput}
            className="btn"
            title="New graph"
          >
            + New
          </button>
        )}
      </div>
    </div>
  );
}
