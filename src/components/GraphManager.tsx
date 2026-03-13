import { useState } from 'react';

export interface GraphManagerProps {
  graphs: string[];
  activeGraph: string | null;
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
}

export function GraphManager({ graphs, activeGraph, onSelect, onCreate, onDelete }: GraphManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
    setShowForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setShowForm(false); setNewName(''); }
  };

  return (
    <div className="flex flex-col border-b border-muted shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Graphs</h2>
        <button
          onClick={() => { setShowForm(v => !v); setNewName(''); }}
          className="text-gray-400 hover:text-white text-lg leading-none transition-colors"
          title="New graph"
        >
          {showForm ? '−' : '+'}
        </button>
      </div>

      {showForm && (
        <div className="px-3 pb-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Graph name"
            className="flex-1 bg-muted text-gray-100 placeholder-gray-600 text-xs rounded-lg p-2 border border-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors"
          >
            Create
          </button>
        </div>
      )}

      <div className="flex flex-col max-h-36 overflow-y-auto">
        {graphs.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-3 px-4">No graphs — press + to create one</p>
        )}
        {graphs.map(name => (
          <div
            key={name}
            onClick={() => onSelect(name)}
            className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-800/60 transition-colors ${
              activeGraph === name ? 'bg-muted text-white' : 'text-gray-400'
            }`}
          >
            <span className="text-sm truncate">{name}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(name); }}
              className="hover:text-red-400 ml-2 shrink-0 text-gray-400 leading-none transition-colors"
              title="Delete graph"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
