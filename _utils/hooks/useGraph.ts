/**
 * Graph Hook - Zone Graph Integration.
 * 
 * Manages zone topology operations and updates.
 * Exposes graph queries and mutations to components.
 * 
 * Non-goals:
 * - Real-time updates (event-driven)
 * - Complex path planning (topology only)
 */

import { useCallback } from 'react';
import {
    addEdge,
    addZone,
    createEmptyGraph,
    estimateHomeSize,
    getNeighbors,
    getZone,
    listZones,
    recordTransition,
} from '../services/graph';
import { useTraceStore } from '../state/traceStore';
import type { Zone, ZoneEdge, ZoneTransition } from '../types/domain';

/**
 * Hook for zone graph operations.
 * 
 * Provides read/write access to spatial topology.
 * 
 * Assumptions:
 * - Graph is loaded into store before mutations.
 * - Operations are synchronous (graph is small).
 * 
 * Returns:
 * - Object with query and mutation functions.
 */
export function useGraph() {
  const { zoneGraph, setZoneGraph } = useTraceStore();

  /**
   * Initialize empty graph if none exists.
   */
  const initializeGraph = useCallback(() => {
    if (!zoneGraph) {
      setZoneGraph(createEmptyGraph());
    }
  }, [zoneGraph, setZoneGraph]);

  /**
   * Add a new zone to the graph.
   */
  const addNewZone = useCallback(
    (zone: Zone) => {
      if (!zoneGraph) return;
      const updated = addZone(zoneGraph, zone);
      setZoneGraph(updated);
    },
    [zoneGraph, setZoneGraph],
  );

  /**
   * Add an edge between zones.
   */
  const addNewEdge = useCallback(
    (edge: ZoneEdge) => {
      if (!zoneGraph) return;
      const updated = addEdge(zoneGraph, edge);
      setZoneGraph(updated);
    },
    [zoneGraph, setZoneGraph],
  );

  /**
   * Record a zone transition.
   */
  const recordZoneTransition = useCallback(
    (transition: ZoneTransition) => {
      if (!zoneGraph) return;
      const updated = recordTransition(zoneGraph, transition);
      setZoneGraph(updated);
    },
    [zoneGraph, setZoneGraph],
  );

  /**
   * Get zone by ID.
   */
  const getZoneById = useCallback(
    (zoneId: string) => {
      if (!zoneGraph) return undefined;
      return getZone(zoneGraph, zoneId);
    },
    [zoneGraph],
  );

  /**
   * List all zones with optional stability filter.
   */
  const getAllZones = useCallback(
    (minStability: number = 0) => {
      if (!zoneGraph) return [];
      return listZones(zoneGraph, minStability);
    },
    [zoneGraph],
  );

  /**
   * Get neighboring zones.
   */
  const getZoneNeighbors = useCallback(
    (zoneId: string) => {
      if (!zoneGraph) return [];
      return getNeighbors(zoneGraph, zoneId);
    },
    [zoneGraph],
  );

  /**
   * Get estimated home size.
   */
  const getHomeSize = useCallback(() => {
    if (!zoneGraph) return 'small';
    return estimateHomeSize(zoneGraph);
  }, [zoneGraph]);

  return {
    graph: zoneGraph,
    initializeGraph,
    addNewZone,
    addNewEdge,
    recordZoneTransition,
    getZoneById,
    getAllZones,
    getZoneNeighbors,
    getHomeSize,
  };
}
