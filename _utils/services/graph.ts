/**
 * Graph Service - Zone Mapper.
 * 
 * Manages topological zone graph and zone transitions.
 * Builds and maintains privacy-preserving spatial scaffold without images.
 * 
 * Non-goals:
 * - Detailed geometry (topology only)
 * - Real-time updates (event-driven clustering)
 * - External storage (local IndexedDB only)
 */

import type { Zone, ZoneEdge, ZoneGraph, ZoneTransition } from '../types/domain';

/**
 * Create an empty zone graph.
 * 
 * Assumptions:
 * - Graph is initialized once per home/location.
 * - Zones are added incrementally over time.
 * 
 * Returns:
 * - Empty ZoneGraph with current timestamp.
 */
export function createEmptyGraph(): ZoneGraph {
  return {
    graphId: `graph_${Date.now()}`,
    createdTime: Date.now(),
    lastUpdatedTime: Date.now(),
    zones: [],
    edges: [],
    metadata: {
      versionId: 1,
      estimatedHomeSize: 'small',
      zoneCount: 0,
    },
  };
}

/**
 * Add a zone to the graph.
 * 
 * Validates that zone is unique by ID and initializes default values.
 * 
 * Assumptions:
 * - Zone ID is globally unique within the graph.
 * - Embedding is pre-computed (not done here).
 * 
 * Returns:
 * - Updated graph with new zone added.
 */
export function addZone(graph: ZoneGraph, zone: Zone): ZoneGraph {
  if (graph.zones.some((z) => z.zoneId === zone.zoneId)) {
    return graph; // Duplicate, ignore.
  }

  return {
    ...graph,
    zones: [...graph.zones, zone],
    metadata: {
      ...graph.metadata,
      zoneCount: graph.zones.length + 1,
    },
    lastUpdatedTime: Date.now(),
  };
}

/**
 * Add or update an edge between zones.
 * 
 * Merges kinematic signatures if edge already exists (weighted average).
 * 
 * Assumptions:
 * - Both zones exist in the graph.
 * - Kinematic signature is computed from movement data.
 * 
 * Returns:
 * - Updated graph with edge added/updated.
 */
export function addEdge(graph: ZoneGraph, edge: ZoneEdge): ZoneGraph {
  const existingEdgeIndex = graph.edges.findIndex(
    (e) => e.fromZoneId === edge.fromZoneId && e.toZoneId === edge.toZoneId,
  );

  let newEdges: ZoneEdge[];
  if (existingEdgeIndex >= 0) {
    // Merge: weighted average of signatures and update weight.
    const existing = graph.edges[existingEdgeIndex];
    newEdges = graph.edges.map((e, idx) =>
      idx === existingEdgeIndex
        ? {
            ...existing,
            kinematicSignature: {
              medianSteps: Math.round(
                (existing.kinematicSignature.medianSteps + edge.kinematicSignature.medianSteps) / 2,
              ),
              medianTurnAngle: (existing.kinematicSignature.medianTurnAngle +
                edge.kinematicSignature.medianTurnAngle) /
                2,
              medianTransitionDurationMs: Math.round(
                (existing.kinematicSignature.medianTransitionDurationMs +
                  edge.kinematicSignature.medianTransitionDurationMs) /
                  2,
              ),
            },
            weight: Math.min(1.0, existing.weight + edge.weight * 0.1),
            lastUsedTime: Date.now(),
          }
        : e,
    );
  } else {
    newEdges = [...graph.edges, edge];
  }

  return {
    ...graph,
    edges: newEdges,
    lastUpdatedTime: Date.now(),
  };
}

/**
 * Record a zone transition.
 * 
 * Logs the transition and updates edges in the graph if applicable.
 * 
 * Assumptions:
 * - Transition is timestamped and has a valid kinematic signature.
 * - Both zones exist in the graph.
 * 
 * Returns:
 * - Updated graph reflecting the transition.
 */
export function recordTransition(
  graph: ZoneGraph,
  transition: ZoneTransition,
): ZoneGraph {
  const edge: ZoneEdge = {
    fromZoneId: transition.fromZoneId || 'entry',
    toZoneId: transition.toZoneId,
    kinematicSignature: {
      medianSteps: transition.kinematicSignature.stepsTaken,
      medianTurnAngle: transition.kinematicSignature.turnAngleDegrees,
      medianTransitionDurationMs: transition.kinematicSignature.transitionDurationMs,
    },
    weight: 1.0,
    lastUsedTime: transition.timestamp,
  };

  return addEdge(graph, edge);
}

/**
 * Get zone by ID.
 * 
 * Assumptions:
 * - Zone ID exists (caller validates).
 * 
 * Returns:
 * - Zone object or undefined if not found.
 */
export function getZone(graph: ZoneGraph, zoneId: string): Zone | undefined {
  return graph.zones.find((z) => z.zoneId === zoneId);
}

/**
 * List all zones, optionally filtered by minimum stability.
 * 
 * Useful for UI listing and validation checks.
 * 
 * Assumptions:
 * - Stability threshold is 0-1.
 * 
 * Returns:
 * - Filtered array of zones, sorted by frequency descending.
 */
export function listZones(graph: ZoneGraph, minStability: number = 0): Zone[] {
  return graph.zones
    .filter((z) => z.stability >= minStability)
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get all neighbors of a zone (directly connected via edges).
 * 
 * Useful for navigation and spatial understanding.
 * 
 * Assumptions:
 * - Zone exists in graph.
 * 
 * Returns:
 * - Array of neighbor zone IDs, sorted by weight descending.
 */
export function getNeighbors(graph: ZoneGraph, zoneId: string): string[] {
  const outgoing = graph.edges
    .filter((e) => e.fromZoneId === zoneId)
    .sort((a, b) => b.weight - a.weight);

  return outgoing.map((e) => e.toZoneId);
}

/**
 * Estimate home size based on zone count and connectivity.
 * 
 * Heuristic for UI guidance and battery decisions.
 * 
 * Assumptions:
 * - Zone count correlates with home size.
 * - Edges indicate spatial complexity.
 * 
 * Returns:
 * - Size estimate: 'small' | 'medium' | 'large'.
 */
export function estimateHomeSize(graph: ZoneGraph): 'small' | 'medium' | 'large' {
  const zoneCount = graph.zones.length;
  if (zoneCount < 5) return 'small';
  if (zoneCount < 15) return 'medium';
  return 'large';
}
