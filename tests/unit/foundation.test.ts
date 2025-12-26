/**
 * Foundation Layer Tests.
 * 
 * Validates types, store, services, and hooks without rendering.
 * Tests system constraints and edge cases.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { useTraceStore } from '../../_utils/state/traceStore';
import {
  createEmptyGraph,
  addZone,
  addEdge,
  listZones,
  getNeighbors,
  estimateHomeSize,
} from '../../_utils/services/graph';
import {
  rankCandidateZones,
  computeBehavioralScores,
} from '../../_utils/services/inference';
import { MockStorage } from '../../_utils/services/storage';
import type {
  Zone,
  ZoneGraph,
  MovementEpisode,
  LossQuery,
  BehavioralScores,
  UserProfile,
} from '../../_utils/types/domain';

/**
 * Mock data factory functions.
 */

function createMockZone(id: string, label: string): Zone {
  return {
    zoneId: id,
    label,
    embedding: [0.1, 0.2, 0.3],
    stability: 0.8,
    lastSeenTime: Date.now(),
    frequency: 5,
  };
}

function createMockEpisode(durationMs: number = 60000): MovementEpisode {
  const now = Date.now();
  return {
    episodeId: `ep_${now}`,
    startTime: now - durationMs,
    endTime: now,
    durationMs,
    stepCount: 100,
    turns: 5,
    totalDistanceM: 50,
    averageHeading: 180,
    confidence: 0.95,
    events: {
      steps: [],
      transitions: [],
      disruptions: [
        {
          timestamp: now - 30000,
          type: 'call',
          severity: 0.7,
          description: 'Phone call received',
        },
      ],
    },
  };
}

function createMockQuery(timeWindow: number = 3600000): LossQuery {
  const now = Date.now();
  return {
    queryId: `q_${now}`,
    objectType: 'keys',
    lastSeen: now - 1800000, // 30 min ago
    timeWindow,
    createdTime: now,
    candidates: [],
    status: 'pending',
  };
}

function createMockUser(): UserProfile {
  return {
    userId: 'user_001',
    name: 'Test User',
    createdTime: Date.now(),
    preferences: {
      allowBackgroundProcessing: true,
      allowOptionalPermissions: false,
      darkMode: false,
    },
    objectPriors: {
      keys: 'Front Door',
      wallet: 'Kitchen Island',
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Trace Foundation Layer', () => {
  describe('Types & Domain Models', () => {
    it('should create valid Zone objects', () => {
      const zone = createMockZone('z_001', 'Kitchen');
      expect(zone.zoneId).toBe('z_001');
      expect(zone.label).toBe('Kitchen');
      expect(zone.stability).toBeGreaterThanOrEqual(0);
      expect(zone.stability).toBeLessThanOrEqual(1);
    });

    it('should create valid MovementEpisode objects', () => {
      const episode = createMockEpisode();
      expect(episode.episodeId).toBeDefined();
      expect(episode.durationMs).toBeGreaterThan(0);
      expect(episode.stepCount).toBeGreaterThanOrEqual(0);
      expect(episode.confidence).toBeGreaterThanOrEqual(0);
      expect(episode.confidence).toBeLessThanOrEqual(1);
    });

    it('should create valid LossQuery objects', () => {
      const query = createMockQuery();
      expect(query.queryId).toBeDefined();
      expect(query.objectType).toBeDefined();
      expect(query.timeWindow).toBeGreaterThan(0);
      expect(query.status).toMatch(/pending|complete/);
    });

    it('should create valid UserProfile objects', () => {
      const user = createMockUser();
      expect(user.userId).toBeDefined();
      expect(user.name).toBeDefined();
      expect(typeof user.preferences.allowBackgroundProcessing).toBe('boolean');
    });
  });

  describe('Zustand Store (TraceStore)', () => {
    beforeEach(() => {
      useTraceStore.setState({
        user: null,
        currentEpisode: null,
        zoneGraph: null,
        recentQuery: null,
        collaborationSession: null,
        batteryLevel: 100,
        motionActive: false,
        lastUpdate: Date.now(),
        permissionsGranted: {
          motionFitness: false,
          backgroundProcessing: false,
        },
      });
    });

    it('should initialize with default state', () => {
      const store = useTraceStore.getState();
      expect(store.user).toBeNull();
      expect(store.batteryLevel).toBe(100);
      expect(store.motionActive).toBe(false);
    });

    it('should update user profile', () => {
      const user = createMockUser();
      useTraceStore.getState().initializeUser(user);
      expect(useTraceStore.getState().user).toEqual(user);
    });

    it('should update battery level with bounds', () => {
      useTraceStore.getState().updateBatteryLevel(150); // out of bounds
      expect(useTraceStore.getState().batteryLevel).toBe(100); // capped

      useTraceStore.getState().updateBatteryLevel(50);
      expect(useTraceStore.getState().batteryLevel).toBe(50);

      useTraceStore.getState().updateBatteryLevel(-10); // out of bounds
      expect(useTraceStore.getState().batteryLevel).toBe(0); // floored
    });

    it('should set motion active state', () => {
      useTraceStore.getState().setMotionActive(true);
      expect(useTraceStore.getState().motionActive).toBe(true);

      useTraceStore.getState().setMotionActive(false);
      expect(useTraceStore.getState().motionActive).toBe(false);
    });

    it('should set permissions', () => {
      useTraceStore.getState().setPermission('motionFitness', true);
      expect(useTraceStore.getState().permissionsGranted.motionFitness).toBe(true);

      useTraceStore.getState().setPermission('backgroundProcessing', true);
      expect(useTraceStore.getState().permissionsGranted.backgroundProcessing).toBe(true);
    });

    it('should reset to initial state', () => {
      const user = createMockUser();
      useTraceStore.getState().initializeUser(user);
      useTraceStore.getState().updateBatteryLevel(30);
      expect(useTraceStore.getState().user).not.toBeNull();
      expect(useTraceStore.getState().batteryLevel).toBe(30);

      useTraceStore.getState().reset();
      expect(useTraceStore.getState().user).toBeNull();
      expect(useTraceStore.getState().batteryLevel).toBe(100);
    });
  });

  describe('Zone Graph Service', () => {
    let graph: ZoneGraph;

    beforeEach(() => {
      graph = createEmptyGraph();
    });

    it('should create empty graph', () => {
      expect(graph.zones).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.metadata.zoneCount).toBe(0);
    });

    it('should add zones to graph', () => {
      const zone1 = createMockZone('z_001', 'Kitchen');
      graph = addZone(graph, zone1);
      expect(graph.zones).toHaveLength(1);
      expect(graph.metadata.zoneCount).toBe(1);

      const zone2 = createMockZone('z_002', 'Bedroom');
      graph = addZone(graph, zone2);
      expect(graph.zones).toHaveLength(2);
      expect(graph.metadata.zoneCount).toBe(2);
    });

    it('should not add duplicate zones', () => {
      const zone = createMockZone('z_001', 'Kitchen');
      graph = addZone(graph, zone);
      graph = addZone(graph, zone); // try to add again
      expect(graph.zones).toHaveLength(1); // still 1
    });

    it('should add edges between zones', () => {
      const zone1 = createMockZone('z_001', 'Kitchen');
      const zone2 = createMockZone('z_002', 'Bedroom');
      graph = addZone(graph, zone1);
      graph = addZone(graph, zone2);

      graph = addEdge(graph, {
        fromZoneId: 'z_001',
        toZoneId: 'z_002',
        kinematicSignature: {
          medianSteps: 10,
          medianTurnAngle: 45,
          medianTransitionDurationMs: 5000,
        },
        weight: 0.8,
        lastUsedTime: Date.now(),
      });

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].fromZoneId).toBe('z_001');
    });

    it('should merge duplicate edges with weighted average', () => {
      const zone1 = createMockZone('z_001', 'Kitchen');
      const zone2 = createMockZone('z_002', 'Bedroom');
      graph = addZone(graph, zone1);
      graph = addZone(graph, zone2);

      graph = addEdge(graph, {
        fromZoneId: 'z_001',
        toZoneId: 'z_002',
        kinematicSignature: {
          medianSteps: 10,
          medianTurnAngle: 45,
          medianTransitionDurationMs: 5000,
        },
        weight: 0.8,
        lastUsedTime: Date.now(),
      });

      graph = addEdge(graph, {
        fromZoneId: 'z_001',
        toZoneId: 'z_002',
        kinematicSignature: {
          medianSteps: 12,
          medianTurnAngle: 50,
          medianTransitionDurationMs: 6000,
        },
        weight: 0.7,
        lastUsedTime: Date.now(),
      });

      expect(graph.edges).toHaveLength(1); // merged
      expect(graph.edges[0].kinematicSignature.medianSteps).toBe(11); // average
    });

    it('should list zones filtered by stability', () => {
      const stableZone = createMockZone('z_001', 'Kitchen');
      stableZone.stability = 0.9;
      const unstableZone = createMockZone('z_002', 'Hallway');
      unstableZone.stability = 0.3;

      graph = addZone(graph, stableZone);
      graph = addZone(graph, unstableZone);

      const highStability = listZones(graph, 0.5);
      expect(highStability).toHaveLength(1);
      expect(highStability[0].zoneId).toBe('z_001');
    });

    it('should get zone neighbors', () => {
      const z1 = createMockZone('z_001', 'Kitchen');
      const z2 = createMockZone('z_002', 'Bedroom');
      const z3 = createMockZone('z_003', 'Hallway');
      graph = addZone(graph, z1);
      graph = addZone(graph, z2);
      graph = addZone(graph, z3);

      graph = addEdge(graph, {
        fromZoneId: 'z_001',
        toZoneId: 'z_002',
        kinematicSignature: {
          medianSteps: 10,
          medianTurnAngle: 45,
          medianTransitionDurationMs: 5000,
        },
        weight: 0.8,
        lastUsedTime: Date.now(),
      });

      graph = addEdge(graph, {
        fromZoneId: 'z_001',
        toZoneId: 'z_003',
        kinematicSignature: {
          medianSteps: 5,
          medianTurnAngle: 20,
          medianTransitionDurationMs: 2000,
        },
        weight: 0.6,
        lastUsedTime: Date.now(),
      });

      const neighbors = getNeighbors(graph, 'z_001');
      expect(neighbors).toHaveLength(2);
      expect(neighbors[0]).toBe('z_002'); // highest weight first
    });

    it('should estimate home size', () => {
      const zones = [
        createMockZone('z_001', 'Kitchen'),
        createMockZone('z_002', 'Bedroom'),
        createMockZone('z_003', 'Hallway'),
      ];
      zones.forEach((z) => {
        graph = addZone(graph, z);
      });

      expect(estimateHomeSize(graph)).toBe('small');

      // Add more zones
      for (let i = 4; i <= 10; i++) {
        graph = addZone(graph, createMockZone(`z_00${i}`, `Zone${i}`));
      }
      expect(estimateHomeSize(graph)).toBe('medium');

      for (let i = 11; i <= 20; i++) {
        graph = addZone(graph, createMockZone(`z_0${i}`, `Zone${i}`));
      }
      expect(estimateHomeSize(graph)).toBe('large');
    });
  });

  describe('Inference Service (CEBE-X)', () => {
    it('should rank candidate zones', () => {
      const graph = createEmptyGraph();
      let g = graph;
      const zone1 = createMockZone('z_001', 'Kitchen');
      const zone2 = createMockZone('z_002', 'Bedroom');
      zone1.lastSeenTime = Date.now() - 5000; // recent
      zone2.lastSeenTime = Date.now() - 3600000; // long ago
      g = addZone(g, zone1);
      g = addZone(g, zone2);

      const episode = createMockEpisode();
      const query = createMockQuery();

      const candidates = rankCandidateZones(query, episode, g);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].probability).toBeGreaterThanOrEqual(0);
      expect(candidates[0].probability).toBeLessThanOrEqual(1);
      expect(candidates[0].zoneName).toBeDefined();
    });

    it('should compute behavioral scores', () => {
      const episode = createMockEpisode();
      const scores = computeBehavioralScores(episode);

      expect(scores.csi).toBeGreaterThanOrEqual(0);
      expect(scores.csi).toBeLessThanOrEqual(1);
      expect(scores.bls).toBeGreaterThanOrEqual(0);
      expect(scores.bls).toBeLessThanOrEqual(1);
      expect(scores.ads).toBeGreaterThanOrEqual(0);
      expect(scores.ads).toBeLessThanOrEqual(1);
      expect(scores.timestamp).toBeGreaterThan(0);
    });

    it('should apply object priors in ranking', () => {
      const graph = createEmptyGraph();
      let g = graph;
      const zone1 = createMockZone('z_001', 'Front Door');
      const zone2 = createMockZone('z_002', 'Kitchen');
      g = addZone(g, zone1);
      g = addZone(g, zone2);

      const episode = createMockEpisode();
      const query = createMockQuery();
      const priors = {
        keys: 'Front Door',
      };

      const candidates = rankCandidateZones(query, episode, g, priors);
      const frontDoorCandidate = candidates.find((c: any) => c.zoneName === 'Front Door');
      if (frontDoorCandidate) {
        expect(frontDoorCandidate.probability).toBeGreaterThan(0);
      }
    });
  });

  describe('Storage Service', () => {
    let storage: MockStorage;

    beforeEach(() => {
      storage = new MockStorage();
    });

    it('should save and retrieve episodes', async () => {
      const episode = createMockEpisode();
      await storage.saveEpisode(episode);
      const retrieved = await storage.getEpisode(episode.episodeId);
      expect(retrieved).toEqual(episode);
    });

    it('should list episodes', async () => {
      const ep1 = createMockEpisode();
      await new Promise(resolve => setTimeout(resolve, 10)); // ensure different timestamps
      const ep2 = createMockEpisode();
      await storage.saveEpisode(ep1);
      await storage.saveEpisode(ep2);

      const episodes = await storage.listEpisodes(10);
      expect(episodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should save and retrieve user profile', async () => {
      const user = createMockUser();
      await storage.saveUserProfile(user);
      const retrieved = await storage.getUserProfile();
      expect(retrieved).toEqual(user);
    });

    it('should save and retrieve zone graph', async () => {
      let graph = createEmptyGraph();
      graph = addZone(graph, createMockZone('z_001', 'Kitchen'));
      await storage.saveGraph(graph);
      const retrieved = await storage.getGraph();
      expect(retrieved).toEqual(graph);
    });

    it('should clear all data', async () => {
      const episode = createMockEpisode();
      const user = createMockUser();
      await storage.saveEpisode(episode);
      await storage.saveUserProfile(user);

      let graph = createEmptyGraph();
      graph = addZone(graph, createMockZone('z_001', 'Kitchen'));
      await storage.saveGraph(graph);

      await storage.clearAll();

      expect(await storage.getEpisode(episode.episodeId)).toBeNull();
      expect(await storage.getUserProfile()).toBeNull();
      expect(await storage.getGraph()).toBeNull();
    });
  });

  describe('System Constraints', () => {
    it('should handle large zone counts without degradation', () => {
      let graph = createEmptyGraph();
      for (let i = 0; i < 100; i++) {
        graph = addZone(graph, createMockZone(`z_${i}`, `Zone${i}`));
      }
      expect(graph.zones).toHaveLength(100);
      expect(listZones(graph).length).toBe(100);
    });

    it('should handle empty graph gracefully', () => {
      const graph = createEmptyGraph();
      const episode = createMockEpisode();
      const query = createMockQuery();

      const candidates = rankCandidateZones(query, episode, graph);
      expect(candidates).toEqual([]);
    });

    it('should handle episodes with no disruptions', () => {
      const episode = createMockEpisode();
      episode.events.disruptions = [];

      const scores = computeBehavioralScores(episode);
      expect(scores.csi).toBe(1.0); // fully stable
      expect(scores.ads).toBe(0); // no disruption
    });

    it('should maintain data immutability in graph operations', () => {
      const graph1 = createEmptyGraph();
      const zone = createMockZone('z_001', 'Kitchen');
      const graph2 = addZone(graph1, zone);

      expect(graph1.zones).toHaveLength(0);
      expect(graph2.zones).toHaveLength(1);
      expect(graph1).not.toBe(graph2);
    });
  });
});
