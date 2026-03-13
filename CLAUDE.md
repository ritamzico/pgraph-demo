# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev        # start dev server (Vite HMR)
bun run build  # tsc type-check + Vite production build
bun run lint   # ESLint over all *.ts / *.tsx files
bun run preview # serve the production build locally
```

There are no tests yet. TypeScript strict-mode (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`) acts as a first-pass correctness check; run `bun run build` to surface type errors without producing output.

## Architecture

This is a single-page probabilistic graph visualizer. The stack is React 19 + TypeScript + Tailwind v4 (via `@tailwindcss/vite` — no `tailwind.config.js`, configuration goes in CSS using `@theme`).

### Data model (`src/types/graph.ts`)

The core types are `GraphNode` (id, x/y canvas position, optional properties bag) and `GraphEdge` (id, sourceId, targetId, `probability: 0–1`, optional properties bag). Both `GraphState.nodes` and `GraphState.edges` are `Map<string, …>` so any single-item read/write is O(1) — important because graph state is expected to update frequently from backend responses.

`HighlightedPath` (`{ nodeIds: Set<string>; edgeIds: Set<string> }`) is the mechanism for rendering optimal paths returned by queries. It lives in `App` state and is passed into `GraphCanvas`.

### State management (`src/hooks/useGraph.ts`)

`useGraph` wraps a `useReducer` with `GraphAction` discriminated-union actions. Always mutate via `dispatch` (or the convenience `moveNode` / `setGraph` wrappers). `SET_GRAPH` replaces the entire graph in one dispatch — use this when the backend returns a new graph snapshot. `REMOVE_NODE` cascades to delete connected edges.

### Graph canvas (`src/components/GraphCanvas.tsx`)

Rendered as a plain SVG that fills its container. All node/edge positions are in *canvas coordinates*; the SVG `<g>` applies `translate(tx, ty) scale(ts)` to map them to screen space.

**Interaction model — avoid stale closure bugs:**
- `dragRef` (a `useRef`) stores the active drag state; global `mousemove`/`mouseup` listeners are attached once in a `useEffect` and read from the ref, so they never capture stale React state.
- `transformRef` mirrors the `transform` state for the same reason — the drag handler needs the current scale without re-registering on every render.
- The wheel zoom handler is also attached via `addEventListener` (non-passive) rather than the React synthetic event so `preventDefault()` works.

Cursors are updated by direct DOM mutation (`svgRef.current.style.cursor`) to avoid triggering re-renders mid-drag.

### Query panel (`src/components/QueryPanel.tsx`)

Maintains its own local history of `QueryHistoryItem[]`. The backend call is stubbed — the full integration point is the `handleSubmit` function; replace the `setTimeout` mock with a real `fetch`, then call `onHighlightPath(data.path.nodeIds, data.path.edgeIds)` when the response includes a path.

### Wiring (`src/App.tsx`)

`App` owns `highlightedPath` state and passes `onHighlightPath` / `onClearHighlight` down to `QueryPanel`, and `highlightedPath` down to `GraphCanvas`. This keeps highlight logic in one place and easy to extend (e.g. animating transitions, showing multiple paths).
