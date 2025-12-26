/**
 * Inference Service - CEBE-X Cognitive Engine.
 * 
 * Translates traces and zones into behavioral scores and ranked loss-probability distributions.
 * Transforms motion and space into "where did I likely place X?".
 * 
 * Non-goals:
 * - Complex ML models (stay rule-based and transparent)
 * - Continuous inference (event-driven only)
 * - Cloud processing (all on-device)
 */

import type {
  BehavioralScores,
  CandidateZone,
  LossQuery,
  MovementEpisode,
  ZoneGraph,
  DisruptionEvent,
} from '../types/domain';

/**
 * Compute Cognitive Stability Index.
 * 
 * Measures how focused and stable the user's attention was during a time window.
 * Higher score = more stable cognition; lower score = likely distracted.
 * 
 * Assumptions:
 * - Disruptions are reliably detected.
 * - Time windows are continuous.
 * 
 * Returns:
 * - CSI as float 0-1.
 */
function computeCSI(disruptions: DisruptionEvent[]): number {
  if (disruptions.length === 0) return 1.0;

  // Average severity of disruptions, inverted to get stability.
  const avgSeverity = disruptions.reduce((sum, d) => sum + d.severity, 0) / disruptions.length;
  return Math.max(0, 1.0 - avgSeverity);
}

/**
 * Compute Boundary Likelihood Score.
 * 
 * Measures how likely the user is near a zone boundary (likely place to set something down).
 * 
 * Assumptions:
 * - Zone transitions indicate boundary proximity.
 * - Recent transitions increase score.
 * 
 * Returns:
 * - BLS as float 0-1.
 */
function computeBLS(timeSinceLastTransition: number, totalTransitions: number): number {
  // Decay with time; zones visited more often have higher BLS.
  const recencyDecay = Math.exp(-(timeSinceLastTransition / (60 * 1000))); // 60s half-life
  const frequencyBoost = Math.min(1.0, totalTransitions / 5); // Cap at 5 visits
  return Math.min(1.0, (recencyDecay + frequencyBoost) / 2);
}

/**
 * Compute Attentional Disruption Score.
 * 
 * Measures how disrupted the user was at a specific moment in time.
 * Tied to specific events like calls, notifications, sudden motion changes.
 * 
 * Assumptions:
 * - Events are timestamped and typed.
 * - Severity scales linearly with likelihood of memory loss.
 * 
 * Returns:
 * - ADS as float 0-1.
 */
function computeADS(event: DisruptionEvent | undefined): number {
  if (!event) return 0;
  return event.severity;
}

/**
 * Rank candidate zones for a lost object query.
 * 
 * Takes a loss query and produces ranked zones based on behavioral scores,
 * routine matching, and time-of-day heuristics.
 * 
 * Assumptions:
 * - Episode and graph are recent and accurate.
 * - Object priors are optional but informative.
 * - Time windows are bounded (24 hours max).
 * 
 * Returns:
 * - Array of ranked CandidateZones with confidence and reasoning.
 */
export function rankCandidateZones(
  query: LossQuery,
  episode: MovementEpisode,
  graph: ZoneGraph,
  objectPriors?: Record<string, string>,
): CandidateZone[] {
  if (!episode || !graph || graph.zones.length === 0) {
    return [];
  }

  // Prefer zones visited recently within the time window.
  const candidates: CandidateZone[] = graph.zones
    .filter((zone) => zone.lastSeenTime >= query.lastSeen - query.timeWindow)
    .map((zone) => {
      // Find disruption events in this zone's time window.
      const disruptions = episode.events.disruptions.filter(
        (d) => d.timestamp >= zone.lastSeenTime - 10000 && d.timestamp <= zone.lastSeenTime,
      );

      // Compute scores.
      const csi = computeCSI(disruptions);
      const bls = computeBLS(Date.now() - zone.lastSeenTime, zone.frequency);
      const ads = disruptions.length > 0 ? disruptions[0].severity : 0;

      // Weighted probability: favor disruption and boundary presence.
      const probability = 0.4 * ads + 0.35 * bls + 0.25 * (1.0 - csi);

      // Confidence: high if multiple signals align.
      const signalCount = (csi < 0.5 ? 1 : 0) + (bls > 0.5 ? 1 : 0) + (ads > 0.3 ? 1 : 0);
      const confidence = Math.min(1.0, signalCount / 3);

      // Search radius guidance based on confidence.
      let searchRadius: 'tight' | 'moderate' | 'wide' = 'moderate';
      if (confidence > 0.7) searchRadius = 'tight';
      if (confidence < 0.4) searchRadius = 'wide';

      return {
        zoneId: zone.zoneId,
        zoneName: zone.label,
        probability,
        confidence,
        reasoning: {
          disruptionEvent: disruptions.length > 0 ? disruptions[0] : undefined,
          routineMatch: `Zone visited ${zone.frequency} times, confidence ${(zone.stability * 100).toFixed(0)}%`,
          timeOfDay: new Date(zone.lastSeenTime).toLocaleTimeString(),
        },
        searchRadius,
      };
    });

  // Apply object priors if available.
  if (objectPriors?.[query.objectType]) {
    const priorZone = objectPriors[query.objectType];
    candidates.forEach((candidate) => {
      if (candidate.zoneName === priorZone) {
        candidate.probability = Math.min(1.0, candidate.probability * 1.2);
        candidate.confidence = Math.min(1.0, candidate.confidence * 1.1);
      }
    });
  }

  // Sort by probability descending.
  candidates.sort((a, b) => b.probability - a.probability);

  return candidates;
}

/**
 * Compute behavioral scores for a time window.
 * 
 * Aggregates CSI, BLS, and ADS for a continuous period.
 * 
 * Assumptions:
 * - Episode covers the requested time window.
 * - Scores are bounded 0-1.
 * 
 * Returns:
 * - BehavioralScores object.
 */
export function computeBehavioralScores(episode: MovementEpisode): BehavioralScores {
  const avgDisruptions = episode.events.disruptions.length / (episode.durationMs / (60 * 1000)); // per minute
  const csi = computeCSI(episode.events.disruptions);
  const bls = computeBLS(Date.now() - episode.endTime, episode.events.transitions.length);
  const ads = episode.events.disruptions.length > 0 ? episode.events.disruptions[0].severity : 0;

  return {
    csi: Math.max(0, Math.min(1.0, csi)),
    bls: Math.max(0, Math.min(1.0, bls)),
    ads: Math.max(0, Math.min(1.0, ads)),
    timestamp: Date.now(),
  };
}
