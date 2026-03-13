import { useState, useCallback, useEffect } from 'react';
import type { ServerGraph } from '../api';

export interface ClientGraph {
  name: string;
  data: ServerGraph;
}

const EMPTY_GRAPH: ServerGraph = { nodes: [], edges: [] };
const STORAGE_GRAPHS_KEY = 'pgraph-ui:graphs';
const STORAGE_ACTIVE_KEY = 'pgraph-ui:activeGraph';

function loadGraphs(): ClientGraph[] {
  try {
    const raw = localStorage.getItem(STORAGE_GRAPHS_KEY);
    if (raw) return JSON.parse(raw) as ClientGraph[];
  } catch {
    // ignore malformed data
  }
  return [];
}

function loadActiveGraphName(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function useServerGraphs() {
  const [graphs, setGraphs] = useState<ClientGraph[]>(loadGraphs);
  const [activeGraphName, setActiveGraphName] = useState<string | null>(loadActiveGraphName);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GRAPHS_KEY, JSON.stringify(graphs));
    } catch {
      // ignore quota errors
    }
  }, [graphs]);

  useEffect(() => {
    try {
      if (activeGraphName === null) {
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
      } else {
        localStorage.setItem(STORAGE_ACTIVE_KEY, activeGraphName);
      }
    } catch {
      // ignore quota errors
    }
  }, [activeGraphName]);

  const activeGraph = graphs.find(g => g.name === activeGraphName) ?? null;

  const createGraph = useCallback((name: string) => {
    setGraphs(prev => [...prev, { name, data: { ...EMPTY_GRAPH } }]);
    setActiveGraphName(name);
  }, []);

  const createGraphWithData = useCallback((name: string, data: ServerGraph) => {
    setGraphs(prev => {
      if (prev.some(g => g.name === name)) return prev;
      return [...prev, { name, data }];
    });
    setActiveGraphName(name);
  }, []);

  const deleteGraph = useCallback((name: string) => {
    setGraphs(prev => prev.filter(g => g.name !== name));
    setActiveGraphName(prev => (prev === name ? null : prev));
  }, []);

  const updateGraphData = useCallback((name: string, data: ServerGraph) => {
    setGraphs(prev => prev.map(g => g.name === name ? { ...g, data } : g));
  }, []);

  return {
    graphNames: graphs.map(g => g.name),
    activeGraph,
    activeGraphName,
    setActiveGraph: setActiveGraphName,
    createGraph,
    createGraphWithData,
    deleteGraph,
    updateGraphData,
  };
}
