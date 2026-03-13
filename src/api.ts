const API_BASE = import.meta.env.VITE_API_ENDPOINT as string;

export interface ServerGraph {
  nodes: Array<{ id: string; props?: Record<string, unknown> }>;
  edges: Array<{ id: string; from: string; to: string; probability: number; props?: Record<string, unknown> }>;
}

export async function query(graph: ServerGraph, dsl: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph, dsl }),
  });
  const data: unknown = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}
