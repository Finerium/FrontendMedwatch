/**
 * Force-directed drug interaction graph. Marked `"use client"` because
 * `react-force-graph-2d` mutates DOM canvases imperatively and uses
 * `requestAnimationFrame` to simulate forces; the underlying library is
 * dynamically imported with `ssr: false` so the server build does not
 * pull in a window reference.
 */
"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { DrugNode, DrugEdge } from "@/data/interactions";
import type { DrugCategory } from "@/data/drugs";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const categoryColorMap: Record<DrugCategory, string> = {
  Analgesic: "#3b82f6",
  Antibiotic: "#22c55e",
  Antihypertensive: "#8b5cf6",
  Antihistamine: "#f59e0b",
  NSAID: "#ef4444",
  Gastrointestinal: "#06b6d4",
  Antidiabetic: "#ec4899",
  Antidepressant: "#f97316",
  Bronchodilator: "#14b8a6",
  Corticosteroid: "#a855f7",
};

/**
 * Pick the edge stroke color for a given severity bucket.
 *
 * @param severity - Severity string from the interaction record.
 * @returns rgba color used as the edge color.
 */
function severityLinkColor(severity: string): string {
  switch (severity) {
    case "Minor":
      return "rgba(34,197,94,0.4)";
    case "Moderate":
      return "rgba(234,179,8,0.4)";
    case "Major":
      return "rgba(239,68,68,0.5)";
    default:
      return "rgba(148,163,184,0.3)";
  }
}

/**
 * Pick the edge stroke width for a given severity bucket.
 *
 * @param severity - Severity string from the interaction record.
 * @returns Stroke width in pixels.
 */
function severityLinkWidth(severity: string): number {
  switch (severity) {
    case "Minor":
      return 1;
    case "Moderate":
      return 2;
    case "Major":
      return 3;
    default:
      return 1;
  }
}

/**
 * Pick the animated particle color for a given severity bucket.
 *
 * @param severity - Severity string from the interaction record.
 * @returns rgba color used for the moving particle.
 */
function severityParticleColor(severity: string): string {
  switch (severity) {
    case "Minor":
      return "rgba(34,197,94,0.8)";
    case "Moderate":
      return "rgba(234,179,8,0.8)";
    case "Major":
      return "rgba(239,68,68,0.9)";
    default:
      return "rgba(148,163,184,0.5)";
  }
}

interface GraphNode extends DrugNode {
  color: string;
  neighbors: string[];
  links: string[];
  x?: number;
  y?: number;
}

// Use a type alias instead of interface so we can add the index signature
type GraphLink = DrugEdge & {
  // react-force-graph may mutate source/target to node objects at runtime
  [key: string]: unknown;
};

interface DrugNetworkProps {
  /** All drug nodes in the graph. */
  nodes: DrugNode[];
  /** All interaction edges between nodes. */
  edges: DrugEdge[];
  /** Notify the parent when a node is clicked. */
  onNodeClick: (node: DrugNode) => void;
  /** Whitelist of drug categories that should remain visible. */
  activeCategories: Set<string>;
}

/**
 * Render the force-directed interaction graph with hover highlights,
 * severity-coded edges, and category-coloured nodes.
 *
 * @param props - See `DrugNetworkProps`.
 */
export function DrugNetwork({
  nodes,
  edges,
  onNodeClick,
  activeCategories,
}: DrugNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { resolvedTheme } = useTheme();

  // ResizeObserver for responsive dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Mark ready after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Configure forces right after graph mounts, and zoom to fit
  useEffect(() => {
    if (!isReady) return;

    // Configure d3 forces for better spread
    const configTimer = setTimeout(() => {
      const fg = graphRef.current;
      if (fg?.d3Force) {
        const charge = fg.d3Force("charge");
        if (charge?.strength) {
          charge.strength(-400);
        }
        const link = fg.d3Force("link");
        if (link?.distance) {
          link.distance(100);
        }
        fg.d3ReheatSimulation?.();
      }
    }, 50);

    // Zoom to fit multiple times to ensure good positioning
    const zoomTimer1 = setTimeout(() => {
      graphRef.current?.zoomToFit?.(400, 60);
    }, 2000);

    const zoomTimer2 = setTimeout(() => {
      graphRef.current?.zoomToFit?.(400, 60);
    }, 4000);

    return () => {
      clearTimeout(configTimer);
      clearTimeout(zoomTimer1);
      clearTimeout(zoomTimer2);
    };
  }, [isReady, activeCategories]);

  // Build filtered graph data
  const graphData = useMemo(() => {
    const filteredNodes: GraphNode[] = nodes
      .filter((n) => activeCategories.has(n.category))
      .map((n, i) => ({
        ...n,
        color: categoryColorMap[n.category],
        neighbors: [] as string[],
        links: [] as string[],
        // Spread nodes in a circle initially for better force layout
        x: Math.cos((2 * Math.PI * i) / nodes.length) * 200,
        y: Math.sin((2 * Math.PI * i) / nodes.length) * 200,
      }));

    const nodeIdSet = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = edges
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((e) => ({ ...e } as GraphLink));

    // Populate neighbor info
    for (const link of filteredLinks) {
      const srcNode = filteredNodes.find((n) => n.id === link.source);
      const tgtNode = filteredNodes.find((n) => n.id === link.target);
      if (srcNode && tgtNode) {
        srcNode.neighbors.push(tgtNode.id);
        tgtNode.neighbors.push(srcNode.id);
        const linkKey = `${link.source}-${link.target}`;
        srcNode.links.push(linkKey);
        tgtNode.links.push(linkKey);
      }
    }

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, edges, activeCategories]);

  // Determine highlighted set
  const highlightedNodes = useMemo(() => {
    if (!hoveredNode) return null;
    const set = new Set<string>([hoveredNode]);
    const node = graphData.nodes.find((n) => n.id === hoveredNode);
    if (node) {
      for (const nId of node.neighbors) {
        set.add(nId);
      }
    }
    return set;
  }, [hoveredNode, graphData.nodes]);

  const highlightedLinks = useMemo(() => {
    if (!hoveredNode) return null;
    const set = new Set<string>();
    for (const link of graphData.links) {
      const srcId =
        typeof link.source === "object"
          ? (link.source as unknown as GraphNode).id
          : link.source;
      const tgtId =
        typeof link.target === "object"
          ? (link.target as unknown as GraphNode).id
          : link.target;
      if (srcId === hoveredNode || tgtId === hoveredNode) {
        set.add(`${srcId}-${tgtId}`);
      }
    }
    return set;
  }, [hoveredNode, graphData.links]);

  const handleNodeHover = useCallback(
    (node: unknown) => {
      const n = node as GraphNode | null;
      setHoveredNode(n?.id ?? null);
    },
    []
  );

  const handleNodeClick = useCallback(
    (node: unknown) => {
      const n = node as GraphNode;
      if (n) onNodeClick(n);
    },
    [onNodeClick]
  );

  const isDark = resolvedTheme === "dark";

  const nodeCanvasObject = useCallback(
    (node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      if (!n.x || !n.y) return;

      const radius = Math.sqrt(n.connections || 1) * 4 + 4;
      const isHighlighted =
        !highlightedNodes || highlightedNodes.has(n.id);
      const isHovered = hoveredNode === n.id;
      const alpha = isHighlighted ? 1 : 0.15;

      // Outer glow
      const glowRadius = isHovered ? radius + 8 : radius + 4;
      const glowAlpha = isHovered ? 0.35 : 0.15;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = hexToRgba(n.color, glowAlpha * alpha);
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = hexToRgba(n.color, alpha);
      ctx.fill();

      // White border
      ctx.strokeStyle = `rgba(255,255,255,${0.3 * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      const fontSize = Math.max(10 / globalScale, 2.5);
      ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const labelColor = isDark
        ? `rgba(248,250,252,${0.9 * alpha})`
        : `rgba(15,23,42,${0.9 * alpha})`;
      ctx.fillStyle = labelColor;
      ctx.fillText(n.name, n.x, n.y + radius + 3);
    },
    [highlightedNodes, hoveredNode, isDark]
  );

  const nodePointerAreaPaint = useCallback(
    (node: unknown, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode;
      if (!n.x || !n.y) return;
      const radius = Math.sqrt(n.connections || 1) * 4 + 4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const linkColorFn = useCallback(
    (link: unknown) => {
      const l = link as GraphLink;
      if (!highlightedLinks) return severityLinkColor(l.severity);
      const srcId =
        typeof l.source === "object"
          ? (l.source as unknown as GraphNode).id
          : l.source;
      const tgtId =
        typeof l.target === "object"
          ? (l.target as unknown as GraphNode).id
          : l.target;
      const key = `${srcId}-${tgtId}`;
      if (highlightedLinks.has(key)) return severityLinkColor(l.severity);
      return isDark ? "rgba(148,163,184,0.05)" : "rgba(148,163,184,0.08)";
    },
    [highlightedLinks, isDark]
  );

  const linkWidthFn = useCallback((link: unknown) => {
    const l = link as GraphLink;
    return severityLinkWidth(l.severity);
  }, []);

  const linkParticlesFn = useCallback((link: unknown) => {
    const l = link as GraphLink;
    return l.severity === "Major" ? 2 : 0;
  }, []);

  const linkParticleColorFn = useCallback((link: unknown) => {
    const l = link as GraphLink;
    return severityParticleColor(l.severity);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isReady && (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          warmupTicks={50}
          cooldownTime={3000}
          d3VelocityDecay={0.3}
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={linkColorFn}
          linkWidth={linkWidthFn}
          linkDirectionalParticles={linkParticlesFn}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleColor={linkParticleColorFn}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onEngineStop={() => {
            graphRef.current?.zoomToFit?.(400, 60);
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      )}
    </div>
  );
}

/**
 * Convert a `#rrggbb` hex string to an `rgba(...)` color with the
 * specified alpha channel.
 *
 * @param hex - Six-digit hex color string including the leading `#`.
 * @param alpha - Alpha 0..1.
 * @returns CSS rgba color string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
