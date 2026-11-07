/** Reads the published files: manifest, then the snapshot it names, hash-checked and validated. In memory only: nothing here reaches disk. */
import validate from '../generated/validate-snapshot.js';
import type { Snapshot } from '../generated/snapshot-types';
import { ageWords, dayMonth, istDate } from './format';

export type * from '../generated/snapshot-types';

export const CONTRACT = 'snapshot-v2';

/** Carries a fixed message or a field path, so an error can never show a payload value. */
export class SnapshotError extends Error {
  kind: 'damaged' | 'invalid' | 'version';
  constructor(kind: 'damaged' | 'invalid' | 'version', message: string) {
    super(message);
    this.kind = kind;
  }
}

export function parseSnapshot(raw: unknown): Snapshot {
  if (validate(raw)) return raw as Snapshot;
  const first = validate.errors?.[0];
  const path = (first?.instancePath ?? '').replace(/^\//, '').replace(/\//g, '.') || 'snapshot';
  throw new SnapshotError('invalid', `${path} ${first?.message ?? 'is not valid'}`);
}

export interface Manifest {
  generation?: string;
  generated_at?: string | null;
  files?: Record<string, { path: string; sha256: string; bytes?: number }>;
}

/** The fetch itself failed: no route to the box, such as Tailscale being off. */
export class UnreachableError extends Error {}
/** The box answered, with an error. */
export class ServerError extends Error {}

async function getFile(path: string): Promise<Response> {
  let res: Response;
  try {
    // Relative, so the app works under any prefix. Never served from a cache.
    res = await fetch(path, { cache: 'no-store' });
  } catch {
    throw new UnreachableError('no route');
  }
  if (!res.ok) throw new ServerError(`status ${res.status}`);
  return res;
}

async function getJson(path: string): Promise<unknown> {
  const res = await getFile(path);
  try {
    return await res.json();
  } catch {
    throw new ServerError('unreadable');
  }
}

async function sha256(bytes: ArrayBuffer): Promise<string | null> {
  if (!crypto.subtle) return null; // Insecure origins have no digest; the schema check still runs.
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchManifest(): Promise<Manifest> {
  const manifest = (await getJson('./manifest.json')) as Manifest;
  if (!manifest || typeof manifest !== 'object' || !manifest.files) throw new ServerError('manifest unreadable');
  return manifest;
}

/** The file the manifest names, checked against its hash. The manifest is written last, so this is always one whole build, never a mix. */
export async function fetchSnapshot(manifest: Manifest): Promise<Snapshot> {
  const entry = manifest.files?.[CONTRACT];
  if (!entry) throw new SnapshotError('version', `manifest has no ${CONTRACT}`);
  const res = await getFile(`./${entry.path}`);
  const bytes = await res.arrayBuffer();
  const digest = await sha256(bytes);
  if (digest && digest !== entry.sha256) throw new SnapshotError('damaged', 'the data file does not match its hash');
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new SnapshotError('damaged', 'the data file is not whole');
  }
  const version = (parsed as { meta?: { snapshot_version?: unknown } } | null)?.meta?.snapshot_version;
  if (typeof version === 'number' && version !== 2) throw new SnapshotError('version', 'unknown snapshot version');
  return parseSnapshot(parsed);
}

/** Why the newest build was held back. Absent or unreadable means nothing to say: status is advisory. */
export interface HeldBack { reason: string; asOf: string | null; state: string }
export function readHeldBack(status: unknown): HeldBack | null {
  const s = status as { state?: unknown; reason?: unknown; last_good?: { as_of?: unknown } | null } | null;
  if (!s || (s.state !== 'blocked' && s.state !== 'failed') || typeof s.reason !== 'string') return null;
  return { reason: s.reason, asOf: typeof s.last_good?.as_of === 'string' ? s.last_good.as_of : null, state: s.state };
}

/** status-sources-v1 and status-invariants-v1, by hand. Status is advisory: whatever is absent or malformed reads as nothing to say. */
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const objs = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.map(obj).filter((o): o is Record<string, unknown> => !!o) : []);
const instant = (v: unknown): number | null => {
  const ms = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isNaN(ms) ? null : ms;
};
const isoDay = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);

export const SOURCE_GROUPS = ['messages', 'banks', 'cards', 'invest', 'settings', 'other'] as const;
export type SourceGroup = (typeof SOURCE_GROUPS)[number];
export interface SourceRow { id: string | null; group: SourceGroup; label: string; state: string; line: string | null; whatToDo: string | null; lastAtMs: number | null; lastDate: string | null; connected: boolean }
export type NumberName = 'cash' | 'due' | 'likely_left' | 'spend' | 'invest';
export type Confidence = 'firm' | 'estimate' | 'low' | 'unknown';
export interface NumberTrust { confidence: Confidence; line: string | null }
export interface SetAsideFile { file: string; reason: string | null; whatToDo: string | null; partial: boolean }
export interface Sources { rows: SourceRow[]; numbers: Partial<Record<NumberName, NumberTrust>>; setAside: SetAsideFile[]; smsAtMs: number | null }
export interface Invariants { ran: boolean; total: number; failing: { reason: string | null; count: number }[] }
export interface BoxStatus { held: HeldBack | null; attemptMs: number | null; sources: Sources | null; invariants: Invariants | null }

export function readSources(raw: unknown): Sources | null {
  const s = obj(raw);
  if (!s || !Array.isArray(s.sources)) return null;
  const rows = objs(s.sources).flatMap((r): SourceRow[] => {
    const label = text(r.label);
    if (!label) return [];
    const state = text(r.state) ?? 'ok';
    return [{
      id: text(r.id),
      group: (SOURCE_GROUPS as readonly unknown[]).includes(r.group) ? (r.group as SourceGroup) : 'other',
      label,
      state,
      line: text(r.line),
      whatToDo: text(r.what_to_do),
      lastAtMs: instant(r.last_at),
      lastDate: isoDay(r.last_date),
      connected: r.connected !== false && state !== 'not_connected',
    }];
  });
  const numbers: Sources['numbers'] = {};
  for (const name of ['cash', 'due', 'likely_left', 'spend', 'invest'] as const) {
    const n = obj(obj(s.numbers)?.[name]);
    if (n && (n.confidence === 'firm' || n.confidence === 'estimate' || n.confidence === 'low' || n.confidence === 'unknown')) numbers[name] = { confidence: n.confidence, line: text(n.line) };
  }
  const setAside = objs(s.set_aside).flatMap((f): SetAsideFile[] => {
    const file = text(f.file);
    const reason = text(f.reason);
    return file || reason ? [{ file: file ?? 'A file', reason, whatToDo: text(f.what_to_do), partial: f.set_aside === false }] : [];
  });
  return { rows, numbers, setAside, smsAtMs: instant(obj(s.data_age)?.sms_at) };
}

export function readInvariants(raw: unknown): Invariants | null {
  const s = obj(raw);
  if (!s || !Array.isArray(s.checks)) return null;
  const checks = objs(s.checks);
  return {
    ran: s.state !== 'failed',
    total: checks.length,
    failing: checks.filter((c) => c.ok === false).map((c) => ({ reason: text(c.reason), count: typeof c.count === 'number' ? c.count : 0 })),
  };
}

export function readStatus(raw: unknown): BoxStatus {
  const s = obj(raw);
  return { held: readHeldBack(s), attemptMs: instant(obj(s?.attempt)?.generated_at), sources: readSources(s?.sources), invariants: readInvariants(s?.invariants) };
}

/** Never rejects. Null means no answer, as opposed to an answer with nothing in it. */
export async function fetchStatus(): Promise<BoxStatus | null> {
  try {
    return readStatus(await getJson('./status.json'));
  } catch {
    return null;
  }
}

/** The word a figure carries before the chip rule. Firm carries none. */
export const confidenceWord = (c: Confidence): string | null => (c === 'estimate' ? 'Estimate' : c === 'low' ? 'Low confidence' : c === 'unknown' ? 'Not sure' : null);

/** What a figure itself shows about how sure it is. `onStatement`: share, 0 to 1, of its rupees a bank statement proves; null when it cannot be said. `wide`: its range is wide against the soft cushion. */
export interface Evidence { onStatement: number | null; wide: boolean }

/** Below this share on a statement, a figure rests mostly on bank messages. */
export const MOSTLY_ON_STATEMENT = 0.5;
/** A half-range over this share of the soft cushion is wide: low to high spans more than one soft cushion. */
export const WIDE_OF_SOFT = 0.5;
export const isWide = (halfRange: number, soft: number): boolean => halfRange > WIDE_OF_SOFT * soft;

/**
 * The chip rule, G5 (owner, 2026-11-06, docs/design/till/FROZEN.md). An Estimate chip only where a figure is really uncertain, so it tells figures apart.
 * Low confidence and Not sure always show. Firm never does. Estimate shows only when the figure rests mostly on bank messages outside a statement, or its range is wide;
 * a figure a statement mostly proves, with a narrow or no range, carries no chip. Pages call this through DoubtTag and DoubtNote, never their own test.
 */
export function doubtWord(c: Confidence, e: Evidence): string | null {
  if (c !== 'estimate') return confidenceWord(c);
  return e.wide || (e.onStatement != null && e.onStatement < MOSTLY_ON_STATEMENT) ? 'Estimate' : null;
}

/** Share of rupees on a statement, where parts are a statement figure and what has come since by message. Null with nothing to weigh. */
export function statementPart(parts: { statement: { value: number } | null; since: { value: number } | null }[]): number | null {
  let proven = 0;
  let all = 0;
  for (const p of parts) {
    proven += Math.abs(p.statement?.value ?? 0);
    all += Math.abs(p.statement?.value ?? 0) + Math.abs(p.since?.value ?? 0);
  }
  return all > 0 ? proven / all : null;
}

/** Share of this month's spending a statement proves, 0 to 1. Null when nothing is spent. */
export function spendOnStatement(view: Snapshot): number | null {
  let all = 0;
  let proven = 0;
  for (const d of view.spend.days) {
    if (!d.day.startsWith(view.spend.month)) continue;
    for (const it of d.items) {
      all += Math.abs(it.amount.value);
      if (it.amount.confidence === 'statement') proven += Math.abs(it.amount.value);
    }
  }
  return all > 0 ? proven / all : null;
}

/** The evidence for each named figure, from the snapshot alone. `soft` is the soft cushion in rupees. */
export function evidence(view: Snapshot, name: NumberName, soft: number): Evidence {
  const p = view.position;
  if (name === 'cash') return { onStatement: statementPart([p.cash_parts]), wide: false };
  if (name === 'due') return { onStatement: statementPart(p.owed), wide: false };
  if (name === 'spend') return { onStatement: spendOnStatement(view), wide: false };
  if (name === 'likely_left') {
    const h = view.forecast.likely_left?.spread?.variance;
    return { onStatement: spendOnStatement(view), wide: h != null && isWide(h / 100, soft) };
  }
  const held = view.invest.holdings ?? [];
  const all = held.reduce((t, h) => t + Math.abs(h.value.value), 0);
  return { onStatement: all > 0 ? held.filter((h) => !h.estimated).reduce((t, h) => t + Math.abs(h.value.value), 0) / all : null, wide: false };
}

/** The states that move a figure, so a row in one needs a look. Not connected is honest, not a fault. */
export const LOOK_STATES = ['late', 'stale', 'absent', 'problem'] as const;
/** Connected sources that need a look and say what to do: the only ones the owner can act on. */
export const needsLook = (s: Sources): SourceRow[] => s.rows.filter((r) => r.connected && r.whatToDo && (LOOK_STATES as readonly string[]).includes(r.state));

function dataParts(s: Sources, now: number): { sms: string; statement: string; named: string; smsWhen: string | null; stKind: string | null; stWhen: string | null; old: string[] } {
  const smsWhen = s.smsAtMs == null ? null : ageWords(s.smsAtMs, now) ?? dayMonth(istDate(s.smsAtMs));
  const sms = smsWhen == null ? 'no bank messages yet' : `bank messages ${smsWhen}`;
  const rows = s.rows.filter((r) => (r.group === 'banks' || r.group === 'cards') && r.connected && r.lastDate);
  const banks = rows.filter((r) => r.group === 'banks').map((r) => r.lastDate!).sort();
  const old = rows.filter((r) => r.group === 'cards' && (r.state === 'stale' || r.state === 'late')).map((r) => `${r.label} since ${dayMonth(r.lastDate!)}`);
  const stKind = banks.length ? 'bank statement' : rows.length ? 'card statements' : null;
  const stWhen = banks.length ? dayMonth(banks[banks.length - 1]) : rows.length ? dayMonth(rows.map((r) => r.lastDate!).sort().at(-1)!) : null;
  const statement = stKind ? `, ${stKind} to ${stWhen}` : '';
  const named = old.length ? `. No newer statement for ${old.join(', ')}` : '';
  return { sms, statement, named, smsWhen, stKind, stWhen, old };
}

/** The "About this data" row and its sheet: the dates the old top line showed, as one line and as label and value pairs. */
export function dataAbout(s: Sources, now: number): { line: string; rows: [string, string][]; old: string[] } {
  const p = dataParts(s, now);
  const rows: [string, string][] = [['Bank messages', p.smsWhen ?? 'none yet']];
  if (p.stKind) rows.push([p.stKind === 'bank statement' ? 'Bank statement' : 'Card statements', `to ${p.stWhen}`]);
  return { line: `${p.sms}${p.statement}`, rows, old: p.old };
}

/** Sources' sentence: "Data: bank messages 2 hours ago, bank statement to 2 Nov. No newer statement for Acme Card 0002 since 1 Sep". One old card must not make every statement look old, so it is named apart. */
export function dataLine(s: Sources, now: number): string {
  const p = dataParts(s, now);
  return `Data: ${p.sms}${p.statement}${p.named}`;
}

/** Every page's one short line. Amber only when a source needs the owner, and then it says how many, not which: Sources has the detail, one tap away. */
export function dataBrief(s: Sources, now: number): { text: string; act: number } {
  const p = dataParts(s, now);
  const act = needsLook(s).length;
  if (!act) return { text: `Data: ${p.sms}${p.statement}`, act };
  return { text: `Data: ${p.sms}. ${act === 1 ? 'One source needs' : `${act} sources need`} a look`, act };
}

/** A build that never started writes nothing, so age is the only sign: the attempt's own time, else the manifest's. Null means there is nothing to say. */
export const NO_BUILD_AFTER_MS = 30 * 3600e3;
export function noBuildSince(attemptMs: number | null, manifestMs: number | null, now: number): number | null {
  const last = attemptMs ?? manifestMs;
  return last != null && now - last > NO_BUILD_AFTER_MS ? last : null;
}

/** When the numbers were built, for the date line and the 24-hour check. */
/** Null means the age is unknown: show the as-of date, no time and no stale strip (snapshot-v2.md). */
export function builtAt(manifest: Manifest | null): number | null {
  const ms = manifest?.generated_at ? Date.parse(manifest.generated_at) : NaN;
  return Number.isNaN(ms) ? null : ms;
}
export const staleAfterMs = (snap: Snapshot): number => ((snap.meta as { stale_after_hours?: number }).stale_after_hours ?? 24) * 3600e3;
