/**
 * Trace Store - Application state management.
 * 
 * Centralizes all mutable state using Zustand for performance and predictability.
 * Mutations are explicit and named; all state changes are logged for debugging.
 * 
 * Non-goals:
 * - Complex derived state (keep selectors simple)
 * - Real-time subscriptions (event-driven only)
 * - Persistence via async (use IndexedDB manually if needed)
 */

import { create } from 'zustand';
import type {
    CollaborativeSession,
    LossQuery,
    MovementEpisode,
    UserProfile,
    ZoneGraph
} from '../types/domain';

interface TraceStore {
  // State
  user: UserProfile | null;
  currentEpisode: MovementEpisode | null;
  zoneGraph: ZoneGraph | null;
  recentQuery: LossQuery | null;
  collaborationSession: CollaborativeSession | null;
  batteryLevel: number;
  motionActive: boolean;
  lastUpdate: number;
  permissionsGranted: {
    motionFitness: boolean;
    backgroundProcessing: boolean;
  };

  // Setters - explicit, named mutations
  initializeUser: (user: UserProfile) => void;
  updateBatteryLevel: (level: number) => void;
  setMotionActive: (active: boolean) => void;
  setCurrentEpisode: (episode: MovementEpisode | null) => void;
  setZoneGraph: (graph: ZoneGraph | null) => void;
  setRecentQuery: (query: LossQuery | null) => void;
  setCollaborationSession: (session: CollaborativeSession | null) => void;
  setPermission: (type: 'motionFitness' | 'backgroundProcessing', granted: boolean) => void;
  reset: () => void;
}

const initialState = {
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
};

/**
 * Trace app state store.
 * 
 * Assumptions:
 * - Only one user session at a time.
 * - State mutations are synchronous.
 * - Persistence is handled externally.
 * 
 * Returns:
 * - Getter and setter functions for all state values.
 */
export const useTraceStore = create<TraceStore>((set) => ({
  ...initialState,

  initializeUser: (user: UserProfile) =>
    set({ user, lastUpdate: Date.now() }),

  updateBatteryLevel: (level: number) =>
    set({ batteryLevel: Math.max(0, Math.min(100, level)), lastUpdate: Date.now() }),

  setMotionActive: (active: boolean) =>
    set({ motionActive: active, lastUpdate: Date.now() }),

  setCurrentEpisode: (episode: MovementEpisode | null) =>
    set({ currentEpisode: episode, lastUpdate: Date.now() }),

  setZoneGraph: (graph: ZoneGraph | null) =>
    set({ zoneGraph: graph, lastUpdate: Date.now() }),

  setRecentQuery: (query: LossQuery | null) =>
    set({ recentQuery: query, lastUpdate: Date.now() }),

  setCollaborationSession: (session: CollaborativeSession | null) =>
    set({ collaborationSession: session, lastUpdate: Date.now() }),

  setPermission: (type: 'motionFitness' | 'backgroundProcessing', granted: boolean) =>
    set((state) => ({
      permissionsGranted: {
        ...state.permissionsGranted,
        [type]: granted,
      },
      lastUpdate: Date.now(),
    })),

  reset: () => set(initialState),
}));
