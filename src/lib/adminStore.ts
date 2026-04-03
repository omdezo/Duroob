/**
 * Server-side in-memory store for admin data.
 * Tracks: audit log, chat sessions, trip analytics.
 * Persists only for the lifetime of the server process.
 * Will be replaced by DB queries when DATABASE_URL is configured.
 */

import { DESTINATIONS } from '@/data/destinations';
import type { Destination } from '@/types/destination';

// ── Mutable destinations (copy of static data, editable by admin) ──

let mutableDestinations: Destination[] = [...DESTINATIONS];

export function getDestinations(): Destination[] {
  return mutableDestinations;
}

export function addDestination(dest: Destination): void {
  mutableDestinations.push(dest);
}

export function updateDestination(id: string, updates: Partial<Destination>): Destination | null {
  const idx = mutableDestinations.findIndex(d => d.id === id);
  if (idx === -1) return null;
  mutableDestinations[idx] = { ...mutableDestinations[idx], ...updates };
  return mutableDestinations[idx];
}

export function deleteDestination(id: string): boolean {
  const idx = mutableDestinations.findIndex(d => d.id === id);
  if (idx === -1) return false;
  mutableDestinations.splice(idx, 1);
  return true;
}

// ── Audit Log ──

export interface AuditEntry {
  id: number;
  timestamp: string;
  admin: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
}

let auditLog: AuditEntry[] = [];
let auditCounter = 0;

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  auditLog.unshift({
    ...entry,
    id: ++auditCounter,
    timestamp: new Date().toISOString(),
  });
  // Keep last 1000 entries
  if (auditLog.length > 1000) auditLog = auditLog.slice(0, 1000);
}

export function getAuditLog(limit = 50, offset = 0): { entries: AuditEntry[]; total: number } {
  return {
    entries: auditLog.slice(offset, offset + limit),
    total: auditLog.length,
  };
}

// ── Chat Sessions Tracking ──

export interface ChatSessionRecord {
  id: string;
  userId?: string;
  userName?: string;
  messageCount: number;
  hasPlan: boolean;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

const chatSessions = new Map<string, ChatSessionRecord>();

export function trackChatMessage(sessionId: string, role: string, content: string, hasPlan: boolean, userName?: string): void {
  const existing = chatSessions.get(sessionId);
  if (existing) {
    existing.messageCount++;
    existing.hasPlan = existing.hasPlan || hasPlan;
    existing.lastMessage = content.slice(0, 100);
    existing.updatedAt = new Date().toISOString();
    if (userName) existing.userName = userName;
  } else {
    chatSessions.set(sessionId, {
      id: sessionId,
      userName,
      messageCount: 1,
      hasPlan,
      lastMessage: content.slice(0, 100),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function getChatSessions(): ChatSessionRecord[] {
  return [...chatSessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ── Trip Analytics ──

export interface TripRecord {
  id: number;
  duration: number;
  tier: string;
  regions: string[];
  totalCost: number;
  safetyScore: number;
  enjoymentScore: number;
  overall: string;
  timestamp: string;
}

let tripRecords: TripRecord[] = [];
let tripCounter = 0;

export function trackTrip(data: Omit<TripRecord, 'id' | 'timestamp'>): void {
  tripRecords.unshift({
    ...data,
    id: ++tripCounter,
    timestamp: new Date().toISOString(),
  });
  if (tripRecords.length > 1000) tripRecords = tripRecords.slice(0, 1000);
}

export function getTripAnalytics(): {
  records: TripRecord[];
  total: number;
  avgDuration: number;
  avgCost: number;
  tierDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
} {
  const total = tripRecords.length;
  const avgDuration = total > 0 ? tripRecords.reduce((s, t) => s + t.duration, 0) / total : 0;
  const avgCost = total > 0 ? tripRecords.reduce((s, t) => s + t.totalCost, 0) / total : 0;

  const tierDistribution: Record<string, number> = {};
  const regionDistribution: Record<string, number> = {};
  tripRecords.forEach(t => {
    tierDistribution[t.tier] = (tierDistribution[t.tier] || 0) + 1;
    t.regions.forEach(r => { regionDistribution[r] = (regionDistribution[r] || 0) + 1; });
  });

  return { records: tripRecords.slice(0, 50), total, avgDuration, avgCost, tierDistribution, regionDistribution };
}

// ── Seed initial audit log with sample data ──
addAuditEntry({ admin: 'system', action: 'server_started', targetType: 'system', targetId: '-', details: 'Duroob server initialized' });
