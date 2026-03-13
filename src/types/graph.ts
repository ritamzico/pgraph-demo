export interface GraphNode {
  id: string;
  x: number;
  y: number;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** Value from 0 to 1 */
  probability: number;
  properties?: Record<string, unknown>;
}

export interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

/** Node and edge IDs belonging to an optimal path to highlight in the graph. */
export interface HighlightedPath {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

export type GraphAction =
  | { type: 'SET_GRAPH'; nodes: GraphNode[]; edges: GraphEdge[] }
  | { type: 'ADD_NODE'; node: GraphNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'ADD_EDGE'; edge: GraphEdge }
  | { type: 'UPDATE_EDGE'; id: string; updates: Partial<Omit<GraphEdge, 'id'>> }
  | { type: 'REMOVE_EDGE'; id: string };
