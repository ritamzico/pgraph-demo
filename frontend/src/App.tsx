import { useState, useEffect, useRef } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { GraphSelector } from './components/GraphSelector';
import { QueryPanel } from './components/QueryPanel';
import { DocPanel } from './components/DocPanel';
import { useGraph } from './hooks/useGraph';
import { useServerGraphs } from './hooks/useServerGraphs';
import { EXAMPLE_GRAPHS } from './data/exampleGraphs';
import type { ServerGraph } from './api';
import type { GraphNode, GraphEdge, HighlightedPath } from './types/graph';

// Must stay in sync with NODE_RADIUS in GraphCanvas.tsx
const MIN_NODE_DIST = 80; // 2 * NODE_RADIUS + comfortable gap

function nodeDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Spiral outward from (cx, cy) to find the nearest position that doesn't
 *  overlap any position in `occupied`. Mutates `occupied` to reserve the spot. */
function findFreePosition(
  occupied: Array<{ x: number; y: number }>,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const isFree = (p: { x: number; y: number }) =>
    occupied.every(o => nodeDist(o, p) >= MIN_NODE_DIST);

  if (isFree({ x: cx, y: cy })) return { x: cx, y: cy };

  for (let ring = 1; ring <= 20; ring++) {
    const r = ring * MIN_NODE_DIST;
    const count = Math.max(6, Math.round((2 * Math.PI * r) / MIN_NODE_DIST));
    for (let j = 0; j < count; j++) {
      const angle = (2 * Math.PI * j) / count;
      const p = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      if (isFree(p)) return p;
    }
  }

  return { x: cx, y: cy };
}

/** Convert ServerGraph nodes/edges into canvas-ready GraphState arrays.
 *  Existing nodes keep their current canvas positions; new nodes are placed
 *  in the nearest non-overlapping position around the canvas centre. */
function toCanvasGraph(
  sg: ServerGraph,
  existingNodes: Map<string, GraphNode>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const cx = 500;
  const cy = 320;

  // Seed occupied list with all current canvas positions so new nodes
  // don't land on top of nodes that already exist.
  const occupied: Array<{ x: number; y: number }> = [...existingNodes.values()];

  const nodes: GraphNode[] = sg.nodes.map(node => {
    const existing = existingNodes.get(node.id);
    if (existing) return { id: node.id, x: existing.x, y: existing.y, properties: node.props };
    const pos = findFreePosition(occupied, cx, cy);
    occupied.push(pos); // reserve spot so subsequent new nodes don't collide
    return { id: node.id, x: pos.x, y: pos.y, properties: node.props };
  });

  const edges: GraphEdge[] = sg.edges.map(e => ({
    id: e.id,
    sourceId: e.from,
    targetId: e.to,
    probability: e.probability,
  }));

  return { nodes, edges };
}

function App() {
  const { graph, moveNode, setGraph } = useGraph();
  const [highlightedPath, setHighlightedPath] = useState<HighlightedPath | undefined>();
  const [showDocs, setShowDocs] = useState(false);
  const [showQuery, setShowQuery] = useState(false);
  const { graphNames, activeGraph, activeGraphName, setActiveGraph, createGraph, createGraphWithData, deleteGraph, updateGraphData } = useServerGraphs();

  // Always reflects the latest canvas node positions without being a reactive dep
  const graphNodesRef = useRef(graph.nodes);
  graphNodesRef.current = graph.nodes;

  // Cmd/Ctrl + 1-9 to switch graphs by index
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const digit = parseInt(e.key, 10);
      if (isNaN(digit) || digit < 1 || digit > 9) return;
      const name = graphNames[digit - 1];
      if (name !== undefined) {
        e.preventDefault();
        setActiveGraph(name);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graphNames, setActiveGraph]);

  // Sync active graph data into the canvas whenever the selection or its data changes
  useEffect(() => {
    if (!activeGraph) {
      setGraph([], []);
    } else {
      const { nodes, edges } = toCanvasGraph(activeGraph.data, graphNodesRef.current);
      setGraph(nodes, edges);
    }
  }, [activeGraph, setGraph]);

  const handleHighlightPath = (nodeIds: string[], edgeIds: string[]) => {
    setHighlightedPath({ nodeIds: new Set(nodeIds), edgeIds: new Set(edgeIds) });
  };

  const handleClearHighlight = () => {
    setHighlightedPath(undefined);
  };

  const queryPanelProps = {
    activeGraph,
    onHighlightPath: handleHighlightPath,
    onClearHighlight: handleClearHighlight,
    onMutation: (data: ServerGraph) => activeGraphName && updateGraphData(activeGraphName, data),
  };

  return (
    <div className="flex h-screen w-screen bg-base overflow-hidden">
      {/* Canvas area + bottom graph selector */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        <div className="flex-1 min-h-0">
          <GraphCanvas
            graph={graph}
            onMoveNode={moveNode}
            highlightedPath={highlightedPath}
          />
        </div>
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <a
            href="https://github.com/ritamzico/pgraph"
            target="_blank"
            rel="noopener noreferrer"
            className="btn p-1.5"
            title="View on GitHub"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button
            onClick={() => setShowQuery(v => !v)}
            className="btn md:hidden"
          >
            {showQuery ? 'Close' : 'Query'}
          </button>
          <button
            onClick={() => setShowDocs(v => !v)}
            className="btn"
            title="Toggle DSL reference"
          >
            {showDocs ? 'Hide Docs' : 'Docs'}
          </button>
        </div>
        <GraphSelector
          graphs={graphNames}
          activeGraph={activeGraphName}
          onSelect={setActiveGraph}
          onCreate={createGraph}
          onDelete={deleteGraph}
          examples={EXAMPLE_GRAPHS}
          onLoadExample={name => {
            const ex = EXAMPLE_GRAPHS.find(e => e.name === name);
            if (ex) createGraphWithData(ex.name, ex.data);
          }}
        />
      </div>

      {/* DocPanel */}
      <div
        className="hidden md:block shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: showDocs ? '24rem' : 0 }}
      >
        <div className="w-96 h-full border-l border-muted">
          <DocPanel onClose={() => setShowDocs(false)} />
        </div>
      </div>

      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${showDocs ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowDocs(false)} />
        <div className={`absolute inset-y-0 right-0 w-full max-w-sm bg-panel border-l border-muted transition-transform duration-300 ${showDocs ? 'translate-x-0' : 'translate-x-full'}`}>
          <DocPanel onClose={() => setShowDocs(false)} />
        </div>
      </div>

      {/* QueryPanel */}
      <div className="hidden md:flex w-px bg-panel shrink-0" />
      <div className="hidden md:block w-80 shrink-0">
        <QueryPanel {...queryPanelProps} />
      </div>

      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-in-out ${showQuery ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '65vh' }}
      >
        <QueryPanel {...queryPanelProps} onClose={() => setShowQuery(false)} />
      </div>
    </div>
  );
}

export default App;
