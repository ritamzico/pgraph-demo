import { useRef, useState, useEffect } from 'react';
import type { GraphNode, GraphState, HighlightedPath } from '../types/graph';

const NODE_RADIUS = 26;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

type DragState =
  | {
      type: 'pan';
      startScreenX: number;
      startScreenY: number;
      panStartX: number;
      panStartY: number;
    }
  | {
      type: 'node';
      startScreenX: number;
      startScreenY: number;
      nodeId: string;
      nodeStartX: number;
      nodeStartY: number;
    };

interface GraphCanvasProps {
  graph: GraphState;
  onMoveNode: (id: string, x: number, y: number) => void;
  highlightedPath?: HighlightedPath;
}

export function GraphCanvas({ graph, onMoveNode, highlightedPath }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Refs allow event handlers attached via addEventListener to always see fresh values
  const transformRef = useRef(transform);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Wheel zoom — must be non-passive to call preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setTransform(t => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor));
        const r = newScale / t.scale;
        return { x: cx - (cx - t.x) * r, y: cy - (cy - t.y) * r, scale: newScale };
      });
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, []);

  // Global mousemove/mouseup so dragging continues outside the SVG element
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (d.type === 'pan') {
        setTransform(t => ({
          ...t,
          x: d.panStartX + (cx - d.startScreenX),
          y: d.panStartY + (cy - d.startScreenY),
        }));
      } else {
        const { scale } = transformRef.current;
        onMoveNode(
          d.nodeId,
          d.nodeStartX + (cx - d.startScreenX) / scale,
          d.nodeStartY + (cy - d.startScreenY) / scale,
        );
      }
    };

    const onMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        if (svgRef.current) svgRef.current.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMoveNode]);

  const handleBgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const rect = svgRef.current!.getBoundingClientRect();
    dragRef.current = {
      type: 'pan',
      startScreenX: e.clientX - rect.left,
      startScreenY: e.clientY - rect.top,
      panStartX: transformRef.current.x,
      panStartY: transformRef.current.y,
    };
    svgRef.current!.style.cursor = 'grabbing';
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const rect = svgRef.current!.getBoundingClientRect();
    dragRef.current = {
      type: 'node',
      startScreenX: e.clientX - rect.left,
      startScreenY: e.clientY - rect.top,
      nodeId: node.id,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
    svgRef.current!.style.cursor = 'grabbing';
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const { x: tx, y: ty, scale: ts } = transform;

  // Dot grid pattern values — dots appear at 40-canvas-unit intervals,
  // shifting correctly with pan and zoom.
  const tileSize = 40 * ts;
  const dotX = ((tx % tileSize) + tileSize) % tileSize;
  const dotY = ((ty % tileSize) + tileSize) % tileSize;

  const nodes = Array.from(graph.nodes.values());
  const edges = Array.from(graph.edges.values());

  return (
    <div className="relative w-full h-full">
      {/* HUD */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <button
          onClick={resetView}
          className="btn pointer-events-auto backdrop-blur-sm"
        >
          Reset view
        </button>
        <div className="bg-panel text-gray-500 text-xs px-3 py-1.5 rounded-md border border-muted backdrop-blur-sm tabular-nums">
          {nodes.length}n · {edges.length}e · {Math.round(ts * 100)}%
        </div>
      </div>

      {hoveredNodeId && (() => {
        const hoveredNode = graph.nodes.get(hoveredNodeId);
        if (!hoveredNode?.properties) return null;
        const entries = Object.entries(hoveredNode.properties);
        const sx = tx + hoveredNode.x * ts;
        const sy = ty + hoveredNode.y * ts;
        return (
          <div
            className="absolute z-20 pointer-events-none bg-panel border border-muted rounded-md px-3 py-2 text-xs text-gray-300 shadow-lg"
            style={{ left: sx + NODE_RADIUS * ts + 8, top: sy - 8 }}
          >
            {entries.map(([key, val]) => {
              const typed = val as { kind?: string; value?: unknown };
              const display = typed?.value !== undefined ? String(typed.value) : JSON.stringify(val);
              return (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-500">{key}</span>
                  <span>{display}</span>
                </div>
              );
            })}
          </div>
        );
      })()}

      <svg
        ref={svgRef}
        className="w-full h-full select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={handleBgMouseDown}
      >
        <defs>
          <pattern
            id="dot-grid"
            width={tileSize}
            height={tileSize}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={dotX} cy={dotY} r={1.5} fill="#1E293B" />
          </pattern>

          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#1E293B" />
          </marker>
          <marker id="arrow-hl" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="url(#dot-grid)" />

        {/* Graph layer — all positions are in canvas (graph) coordinates */}
        <g transform={`translate(${tx}, ${ty}) scale(${ts})`}>
          {/* Edges rendered beneath nodes */}
          {edges.map(edge => {
            const src = graph.nodes.get(edge.sourceId);
            const tgt = graph.nodes.get(edge.targetId);
            if (!src || !tgt || edge.sourceId === edge.targetId) return null;

            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Skip if nodes are too close to render a visible arrow
            if (dist < NODE_RADIUS * 2 + 16) return null;

            const nx = dx / dist;
            const ny = dy / dist;
            const x1 = src.x + nx * NODE_RADIUS;
            const y1 = src.y + ny * NODE_RADIUS;
            const x2 = tgt.x - nx * (NODE_RADIUS + 8);
            const y2 = tgt.y - ny * (NODE_RADIUS + 8);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            const isHl = highlightedPath?.edgeIds.has(edge.id) ?? false;

            return (
              <g key={edge.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isHl ? '#f59e0b' : '#1E293B'}
                  strokeWidth={isHl ? 2.5 : 1.5}
                  strokeOpacity={isHl ? 1 : 0.4 + edge.probability * 0.6}
                  markerEnd={`url(#${isHl ? 'arrow-hl' : 'arrow'})`}
                />
                {/* Edge ID — closer offset, perpendicular to edge */}
                <text
                  x={mx - ny * 10}
                  y={my + nx * 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill={isHl ? '#fcd34d' : '#9ca3af'}
                  style={{ userSelect: 'none' }}
                >
                  {edge.id}
                </text>
                {/* Probability — further offset */}
                <text
                  x={mx - ny * 22}
                  y={my + nx * 22}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill={isHl ? '#fcd34d' : '#6b7280'}
                  style={{ userSelect: 'none' }}
                >
                  {edge.probability.toFixed(2)}
                </text>
                {/* Invisible wider hit area for future edge interactions */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth={12}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isHl = highlightedPath?.nodeIds.has(node.id) ?? false;
            const label = node.properties?.label;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => handleNodeMouseDown(e, node)}
                onMouseEnter={() => node.properties && setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: 'grab' }}
              >
                {/* Drop shadow */}
                <circle r={NODE_RADIUS + 2} fill="black" fillOpacity={0.25} cy={2} />
                {/* Body */}
                <circle
                  r={NODE_RADIUS}
                  style={{ fill: isHl ? '#b45309' : 'var(--color-accent)', stroke: isHl ? '#fbbf24' : 'var(--color-accent)' }}
                  strokeWidth={2}
                  strokeOpacity={isHl ? 1 : 0.5}
                />
                {/* Node ID below the circle */}
                <text
                  y={NODE_RADIUS + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={isHl ? '#fcd34d' : '#e5e7eb'}
                  style={{ userSelect: 'none' }}
                >
                  {node.id}
                </text>
                {/* Optional label from properties — below the ID */}
                {label !== undefined && (
                  <text
                    y={NODE_RADIUS + 28}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill={isHl ? '#fcd34d' : '#9ca3af'}
                    style={{ userSelect: 'none' }}
                  >
                    {String(label)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
