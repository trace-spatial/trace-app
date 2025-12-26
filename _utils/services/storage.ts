/**
 * Storage Service - Local persistence.
 * 
 * Manages on-device storage of episodes, graphs, and user state.
 * Fully private; data never leaves the device by default.
 * 
 * Non-goals:
 * - Cloud sync (not done here)
 * - Encryption (assumed by native module)
 * - Complex queries (simple key-value access only)
 */

import type {
    CollaborativeSession,
    LossQuery,
    MovementEpisode,
    UserProfile,
    ZoneGraph,
} from '../types/domain';

/**
 * Storage interface for abstraction.
 * Implemented by native module or IndexedDB.
 */
export interface IStorage {
  // Episode storage
  saveEpisode: (episode: MovementEpisode) => Promise<void>;
  getEpisode: (episodeId: string) => Promise<MovementEpisode | null>;
  listEpisodes: (limit: number) => Promise<MovementEpisode[]>;
  deleteEpisode: (episodeId: string) => Promise<void>;

  // Graph storage
  saveGraph: (graph: ZoneGraph) => Promise<void>;
  getGraph: () => Promise<ZoneGraph | null>;
  updateGraph: (graph: ZoneGraph) => Promise<void>;

  // User profile storage
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;

  // Query history
  saveQuery: (query: LossQuery) => Promise<void>;
  getQuery: (queryId: string) => Promise<LossQuery | null>;
  listQueries: (limit: number) => Promise<LossQuery[]>;

  // Collaboration sessions
  saveSession: (session: CollaborativeSession) => Promise<void>;
  getSession: (sessionId: string) => Promise<CollaborativeSession | null>;
  listActiveSessions: () => Promise<CollaborativeSession[]>;

  // Utilities
  clearAll: () => Promise<void>;
  getStorageSize: () => Promise<number>;
}

/**
 * Mock in-memory storage for testing.
 * 
 * Replaces native storage during development.
 * Non-goals: persistence across app restarts.
 */
export class MockStorage implements IStorage {
  private episodes: Map<string, MovementEpisode> = new Map();
  private graph: ZoneGraph | null = null;
  private userProfile: UserProfile | null = null;
  private queries: Map<string, LossQuery> = new Map();
  private sessions: Map<string, CollaborativeSession> = new Map();

  async saveEpisode(episode: MovementEpisode): Promise<void> {
    this.episodes.set(episode.episodeId, episode);
  }

  async getEpisode(episodeId: string): Promise<MovementEpisode | null> {
    return this.episodes.get(episodeId) || null;
  }

  async listEpisodes(limit: number): Promise<MovementEpisode[]> {
    return Array.from(this.episodes.values()).slice(-limit);
  }

  async deleteEpisode(episodeId: string): Promise<void> {
    this.episodes.delete(episodeId);
  }

  async saveGraph(graph: ZoneGraph): Promise<void> {
    this.graph = graph;
  }

  async getGraph(): Promise<ZoneGraph | null> {
    return this.graph;
  }

  async updateGraph(graph: ZoneGraph): Promise<void> {
    this.graph = graph;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    this.userProfile = profile;
  }

  async getUserProfile(): Promise<UserProfile | null> {
    return this.userProfile;
  }

  async saveQuery(query: LossQuery): Promise<void> {
    this.queries.set(query.queryId, query);
  }

  async getQuery(queryId: string): Promise<LossQuery | null> {
    return this.queries.get(queryId) || null;
  }

  async listQueries(limit: number): Promise<LossQuery[]> {
    return Array.from(this.queries.values()).slice(-limit);
  }

  async saveSession(session: CollaborativeSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async getSession(sessionId: string): Promise<CollaborativeSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async listActiveSessions(): Promise<CollaborativeSession[]> {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'active' && s.expiresTime > now,
    );
  }

  async clearAll(): Promise<void> {
    this.episodes.clear();
    this.graph = null;
    this.userProfile = null;
    this.queries.clear();
    this.sessions.clear();
  }

  async getStorageSize(): Promise<number> {
    // Rough estimate for testing.
    return (
      JSON.stringify(Array.from(this.episodes.values())).length +
      JSON.stringify(this.graph).length +
      JSON.stringify(this.userProfile).length +
      JSON.stringify(Array.from(this.queries.values())).length
    );
  }
}

/**
 * Global storage instance.
 * Replaced by native module in production.
 */
export let storage: IStorage = new MockStorage();

/**
 * Set storage implementation (for testing or native binding).
 */
export function setStorage(impl: IStorage) {
  storage = impl;
}
