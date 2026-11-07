import validate from './generated/validate-snapshot.js';
import type { Snapshot } from './generated/snapshot-types';

export type * from './generated/snapshot-types';

/** Carries only the field path, so an error can never show a payload value. */
export class SnapshotError extends Error {}

/** Checks the whole shape with the precompiled validator. Throws SnapshotError naming the first bad field. */
export function parseSnapshot(raw: unknown): Snapshot {
  if (validate(raw)) return raw as Snapshot;
  const first = validate.errors?.[0];
  const path = (first?.instancePath ?? '').replace(/^\//, '').replace(/\//g, '.') || 'snapshot';
  throw new SnapshotError(`${path} ${first?.message ?? 'is not valid'}`);
}

export interface PublishEntry {
  path: string;
  sha256: string;
}

/** Why the newest build was held back, for the one line on Home. Absent or unreadable means nothing to say. */
export interface HeldBack {
  reason: string;
  asOf: string | null;
}

const CONTRACT = 'snapshot-v1';

async function json(path: string): Promise<unknown> {
  // Relative, so the app works wherever it is hosted. Never served from a cache.
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

async function sha256(bytes: ArrayBuffer): Promise<string | null> {
  if (!crypto.subtle) return null; // Insecure origins have no digest; the schema check still runs.
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The file the manifest names, checked against its hash. The manifest is written last, so this is always one whole build. */
export async function fetchSnapshot(): Promise<unknown> {
  const manifest = (await json('./manifest.json')) as { files?: Record<string, PublishEntry> };
  const entry = manifest.files?.[CONTRACT];
  if (!entry) throw new SnapshotError(`manifest has no ${CONTRACT}`);
  const res = await fetch(`./${entry.path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const bytes = await res.arrayBuffer();
  const digest = await sha256(bytes);
  if (digest && digest !== entry.sha256) throw new SnapshotError('the data file does not match its hash');
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function readHeldBack(status: unknown): HeldBack | null {
  const s = status as { state?: unknown; reason?: unknown; last_good?: { as_of?: unknown } | null } | null;
  if (!s || (s.state !== 'blocked' && s.state !== 'failed') || typeof s.reason !== 'string') return null;
  return { reason: s.reason, asOf: typeof s.last_good?.as_of === 'string' ? s.last_good.as_of : null };
}

export async function fetchHeldBack(): Promise<HeldBack | null> {
  try {
    return readHeldBack(await json('./status.json'));
  } catch {
    return null; // The numbers still stand; only the note is lost.
  }
}
