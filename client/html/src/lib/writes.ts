/** The app's writes: one POST to the box, in memory, never queued on the phone. Contract: docs/contracts/app-write-v1.md. */

export type WriteFailure = 'offline' | 'identity' | 'refused' | 'off' | 'full' | 'server';

export class WriteError extends Error {
  failure: WriteFailure;
  constructor(failure: WriteFailure) {
    super(failure);
    this.failure = failure;
  }
}

/** Plain words for a failed save. A failed save stays on screen with these and a retry; nothing is kept on disk. */
export const FAILURE_WORDS: Record<WriteFailure, string> = {
  offline: 'Not saved. There is no connection to your box.',
  identity: 'Not saved. Your box could not confirm this is you.',
  refused: 'Not saved. Your box refused this entry.',
  off: 'Not saved. Saving is switched off on your box.',
  full: 'Not saved. The store on your box is full.',
  server: 'Not saved. Your box had a problem.',
};

export interface WriteResult { duplicate: boolean; changedElsewhere: boolean }

const failureFor = (status: number): WriteFailure => {
  if (status === 401 || status === 403) return 'identity';
  if (status === 503) return 'off';
  if (status === 507) return 'full';
  if (status >= 400 && status < 500) return 'refused';
  return 'server';
};

export async function post(route: 'corrections' | 'plan-events', body: object, timeoutMs = 20000): Promise<WriteResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`./api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', credentials: 'same-origin', signal: ctrl.signal });
  } catch {
    throw new WriteError('offline');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new WriteError(failureFor(res.status));
  let out: { ok?: boolean; duplicate?: boolean; changed_elsewhere?: boolean } = {};
  try {
    out = await res.json();
  } catch {
    throw new WriteError('server');
  }
  if (!out.ok) throw new WriteError('server');
  return { duplicate: !!out.duplicate, changedElsewhere: !!out.changed_elsewhere };
}

export type ReadResult = { ok: true; lines: Record<string, unknown>[]; seq: number } | { ok: false };

/** What the box holds. Failure is not an error: the page falls back to what the snapshot carries, and saving says so if it fails too. */
export async function readLines(route: 'corrections' | 'plan-events'): Promise<ReadResult> {
  try {
    const res = await fetch(`./api/${route}`, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return { ok: false };
    const out = (await res.json()) as { ok?: boolean; lines?: unknown; seq?: unknown };
    if (!out.ok || !Array.isArray(out.lines)) return { ok: false };
    return { ok: true, lines: out.lines as Record<string, unknown>[], seq: typeof out.seq === 'number' ? out.seq : out.lines.length };
  } catch {
    return { ok: false };
  }
}

export interface CorrectionLine { id: string; at: string; key: string; scope: 'one' | 'similar'; merchant?: string; group?: string; treatment?: string; revoke?: undefined }
export interface RevokeLine { id: string; at: string; revoke: string }

export const nowIso = (): string => new Date().toISOString();
