/**
 * Inference Hook - CEBE-X Integration.
 * 
 * Exposes inference engine to React components.
 * Handles async ranking and caching of results.
 * 
 * Non-goals:
 * - Streaming results (batch only)
 * - Real-time inference (query-driven)
 */

import { useCallback, useState } from 'react';
import { computeBehavioralScores, rankCandidateZones } from '../services/inference';
import { useTraceStore } from '../state/traceStore';
import type { BehavioralScores, CandidateZone, LossQuery } from '../types/domain';

interface UseInferenceState {
  isRunning: boolean;
  candidates: CandidateZone[];
  scores: BehavioralScores | null;
  error: string | null;
}

/**
 * Hook for loss object inference.
 * 
 * Manages the full query-to-results flow using CEBE-X.
 * 
 * Assumptions:
 * - Episode and graph exist in store.
 * - Query is well-formed with valid time windows.
 * - Ranking is fast (< 500ms).
 * 
 * Returns:
 * - State object with candidates, scores, and error handling.
 */
export function useInference() {
  const { currentEpisode, zoneGraph, user } = useTraceStore();
  const [state, setState] = useState<UseInferenceState>({
    isRunning: false,
    candidates: [],
    scores: null,
    error: null,
  });

  /**
   * Run inference for a loss query.
   * 
   * Asynchronously ranks zones and computes behavioral scores.
   * Updates state with results or error.
   */
  const inferLossLocation = useCallback(
    async (query: LossQuery) => {
      if (!currentEpisode || !zoneGraph) {
        setState({
          isRunning: false,
          candidates: [],
          scores: null,
          error: 'Episode or graph not loaded',
        });
        return;
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      try {
        // Run ranking with object priors.
        const candidates = rankCandidateZones(
          query,
          currentEpisode,
          zoneGraph,
          user?.objectPriors,
        );

        // Compute behavioral scores for the episode.
        const scores = computeBehavioralScores(currentEpisode);

        setState({
          isRunning: false,
          candidates,
          scores,
          error: null,
        });
      } catch (err) {
        setState({
          isRunning: false,
          candidates: [],
          scores: null,
          error: err instanceof Error ? err.message : 'Unknown inference error',
        });
      }
    },
    [currentEpisode, zoneGraph, user],
  );

  return {
    ...state,
    inferLossLocation,
  };
}
