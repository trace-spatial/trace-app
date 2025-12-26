/**
 * Core domain types for Trace.
 * 
 * Defines all immutable, type-safe structures that flow through the system.
 * These types ensure clarity and enable testability across sensing, graphing, and inference engines.
 * 
 * Non-goals:
 * - Dynamic extensions (types are fixed at compile time)
 * - Nested serialization (keep flat and bounded)
 * - Mutable defaults (all frozen)
 */

/**
 * A single motion sample from the IMU sensor.
 * Represents one snapshot of inertial data at a specific timestamp.
 */
export interface MotionSample {
  timestamp: number; // milliseconds since epoch
  accelX: number; // m/s² gravity-adjusted
  accelY: number;
  accelZ: number;
  gyroX: number; // rad/s
  gyroY: number;
  gyroZ: number;
  magneticX: number; // normalized -1 to 1
  magneticY: number;
  magneticZ: number;
  confidence: number; // 0-1, sensor reliability
}

/**
 * A detected step event from motion processing.
 * Indicates when the user took a step with estimated parameters.
 */
export interface StepEvent {
  timestamp: number;
  stepLengthM: number; // estimated length in meters
  heading: number; // degrees 0-360
  confidence: number; // 0-1, detection confidence
}

/**
 * A detected zone boundary crossing.
 * Indicates when the user transitioned between two spatial regions.
 */
export interface ZoneTransition {
  timestamp: number;
  fromZoneId: string | null; // null if initial zone
  toZoneId: string;
  kinematicSignature: {
    stepsTaken: number;
    turnAngleDegrees: number;
    transitionDurationMs: number;
  };
}

/**
 * An attentional disruption event.
 * Marks moments when the user's cognition or attention was likely interrupted.
 */
export interface DisruptionEvent {
  timestamp: number;
  type: 'call' | 'notification' | 'acceleration' | 'pause' | 'manual';
  severity: number; // 0-1, how severe the disruption
  description: string; // human-readable reason
}

/**
 * A compressed movement episode.
 * Aggregates all motion data for a continuous period into a compact representation.
 * Designed for battery efficiency and local storage.
 */
export interface MovementEpisode {
  episodeId: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  stepCount: number;
  turns: number;
  totalDistanceM: number;
  averageHeading: number;
  confidence: number;
  events: {
    steps: StepEvent[];
    transitions: ZoneTransition[];
    disruptions: DisruptionEvent[];
  };
}

/**
 * An environmental fingerprint snapshot.
 * Captures non-visual environmental signals at a zone boundary.
 */
export interface EnvironmentFingerprint {
  timestamp: number;
  wifiRSSI: Record<string, number>; // BSSID -> signal strength
  bleBeacons: Record<string, number>; // UUID -> distance estimate
  magneticAnomaly: {
    x: number;
    y: number;
    z: number;
  };
  soundSignature: {
    dominantFrequency: number; // Hz
    noiseFloor: number; // dB
  };
}

/**
 * A semantic zone in the user's environment.
 * Represents a distinct spatial region identified by environmental fingerprints.
 */
export interface Zone {
  zoneId: string;
  label: string; // e.g., "Kitchen Island", "Bedroom Door"
  embedding: number[]; // compressed fingerprint vector
  stability: number; // 0-1, how consistent this zone is
  lastSeenTime: number;
  frequency: number; // how many times visited
  notes?: string;
}

/**
 * A topological edge connecting two zones.
 * Encodes the kinematic signature of transitions between zones.
 */
export interface ZoneEdge {
  fromZoneId: string;
  toZoneId: string;
  kinematicSignature: {
    medianSteps: number;
    medianTurnAngle: number;
    medianTransitionDurationMs: number;
  };
  weight: number; // 0-1, transition frequency
  lastUsedTime: number;
}

/**
 * The complete topological graph of the user's environment.
 * Lightweight, privacy-preserving representation of space.
 */
export interface ZoneGraph {
  graphId: string;
  createdTime: number;
  lastUpdatedTime: number;
  zones: Zone[];
  edges: ZoneEdge[];
  metadata: {
    versionId: number;
    estimatedHomeSize: string; // "small" | "medium" | "large"
    zoneCount: number;
  };
}

/**
 * Behavioral scoring indices computed by CEBE-X.
 * Quantify different aspects of user behavior and attention.
 */
export interface BehavioralScores {
  csi: number; // Cognitive Stability Index (0-1, higher = more stable)
  bls: number; // Boundary Likelihood Score (0-1, higher = likely zone boundary)
  ads: number; // Attentional Disruption Score (0-1, higher = disrupted)
  timestamp: number;
}

/**
 * A ranked candidate zone for a lost object query.
 * Represents a probable location with confidence and reasoning.
 */
export interface CandidateZone {
  zoneId: string;
  zoneName: string;
  probability: number; // 0-1, inferred probability
  confidence: number; // 0-1, system confidence in estimate
  reasoning: {
    disruptionEvent?: DisruptionEvent;
    routineMatch: string; // explanation
    timeOfDay: string;
  };
  searchRadius: 'tight' | 'moderate' | 'wide'; // UI guidance
}

/**
 * A user query about where they left an object.
 * Triggers CEBE-X inference to produce ranked candidates.
 */
export interface LossQuery {
  queryId: string;
  objectType: string; // "keys", "wallet", "phone", etc.
  lastSeen: number; // timestamp
  timeWindow: number; // milliseconds to search back
  createdTime: number;
  candidates: CandidateZone[];
  status: 'pending' | 'complete';
}

/**
 * A user account with personalization state.
 * Lightweight profile for per-user calibration.
 */
export interface UserProfile {
  userId: string;
  name: string;
  createdTime: number;
  preferences: {
    allowBackgroundProcessing: boolean;
    allowOptionalPermissions: boolean;
    darkMode: boolean;
  };
  objectPriors: Record<string, string>; // object type -> preferred zone label
  homeLocationZoneId?: string;
}

/**
 * A collaborative sharing session.
 * Allows one user to locate an object in another user's space.
 */
export interface CollaborativeSession {
  sessionId: string;
  hostUserId: string;
  guestUserId: string;
  createdTime: number;
  expiresTime: number;
  status: 'pending' | 'active' | 'completed' | 'expired';
  encryptedGuestTrace?: string; // encrypted movement vector
  encryptedHostGraph?: string; // encrypted zone graph
}

/**
 * Application state for a single query or session.
 * Minimal, focused state for UI reactivity.
 */
export interface AppState {
  user: UserProfile;
  currentEpisode: MovementEpisode | null;
  zoneGraph: ZoneGraph | null;
  recentQuery: LossQuery | null;
  collaborationSession: CollaborativeSession | null;
  batteryLevel: number; // 0-100
  motionActive: boolean;
  lastUpdate: number;
}
