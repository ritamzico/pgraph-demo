import { useReducer, useCallback } from 'react';
import type { GraphState, GraphAction, GraphNode, GraphEdge } from '../types/graph';

function buildInitialState(): GraphState {
  return {
    nodes: new Map(),
    edges: new Map(),
  };
}

function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'SET_GRAPH':
      return {
        nodes: new Map(action.nodes.map(n => [n.id, n])),
        edges: new Map(action.edges.map(e => [e.id, e])),
      };

    case 'ADD_NODE': {
      const nodes = new Map(state.nodes);
      nodes.set(action.node.id, action.node);
      return { ...state, nodes };
    }

    case 'MOVE_NODE': {
      const node = state.nodes.get(action.id);
      if (!node) return state;
      const nodes = new Map(state.nodes);
      nodes.set(action.id, { ...node, x: action.x, y: action.y });
      return { ...state, nodes };
    }

    case 'REMOVE_NODE': {
      const nodes = new Map(state.nodes);
      nodes.delete(action.id);
      // Cascade-delete connected edges
      const edges = new Map(state.edges);
      for (const [id, edge] of edges) {
        if (edge.sourceId === action.id || edge.targetId === action.id) {
          edges.delete(id);
        }
      }
      return { nodes, edges };
    }

    case 'ADD_EDGE': {
      const edges = new Map(state.edges);
      edges.set(action.edge.id, action.edge);
      return { ...state, edges };
    }

    case 'UPDATE_EDGE': {
      const edge = state.edges.get(action.id);
      if (!edge) return state;
      const edges = new Map(state.edges);
      edges.set(action.id, { ...edge, ...action.updates });
      return { ...state, edges };
    }

    case 'REMOVE_EDGE': {
      const edges = new Map(state.edges);
      edges.delete(action.id);
      return { ...state, edges };
    }

    default:
      return state;
  }
}

export function useGraph() {
  const [graph, dispatch] = useReducer(graphReducer, undefined, buildInitialState);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_NODE', id, x, y });
  }, []);

  const setGraph = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    dispatch({ type: 'SET_GRAPH', nodes, edges });
  }, []);

  return { graph, dispatch, moveNode, setGraph };
}
