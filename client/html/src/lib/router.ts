/** Hash routes, so the app works under any path prefix with no server rule and reload never 404s. Group, month and account label may be in a URL (the hash never leaves the phone); a name or amount never. */
import { useEffect, useSyncExternalStore } from 'react';

export type Page = 'today' | 'spend' | 'spending' | 'names' | 'bills' | 'invest' | 'plan' | 'reports' | 'flatmates' | 'sources';
export const PAGES: Page[] = ['today', 'spend', 'spending', 'names', 'bills', 'invest', 'plan', 'reports', 'flatmates', 'sources'];

export interface Route {
  page: Page;
  params: URLSearchParams;
  section: string | null;
  raw: string;
}

/** A card's short label as its link on Bills, the same as the snapshot's `bills.cards[].id`: "Acme Card 0004" -> "acme-card-0004". */
export const cardId = (card: string): string => card.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const cardRoute = (card: string | null | undefined): string => (card ? `bills/${cardId(card)}` : 'bills');

let current = parse(typeof location === 'undefined' ? '' : location.hash);
let entry = 0;
const listeners = new Set<() => void>();

export function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [name, section] = path.split('/');
  const page = (PAGES as string[]).includes(name) ? (name as Page) : 'today';
  return { page, params: new URLSearchParams(query), section: section || null, raw };
}

function publish() {
  current = parse(location.hash);
  listeners.forEach((l) => l());
}

const scrolls = new Map<number, number>();
/** Where each page was last left, so a tab comes back as it was. Memory only. */
const pageScrolls = new Map<Page, number>();
let arrivedByTab = false;
const stateKey = (): number => (history.state && typeof history.state.k === 'number' ? history.state.k : 0);

if (typeof window !== 'undefined') {
  history.scrollRestoration = 'manual';
  if (typeof history.state?.k !== 'number') history.replaceState({ k: 0 }, '');
  entry = stateKey();
  addEventListener('popstate', () => {
    if (history.state?.sheet) return; // Forward onto a closed sheet's entry: the Sheet handles it.
    entry = stateKey();
    if (pendingReplace) {
      history.replaceState({ k: entry }, '', pendingReplace);
      pendingReplace = null;
    }
    publish();
  });
}

export function useRoute(): Route {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current);
}

let nextKey = Date.now();
let sheetConsumer: (() => void) | null = null;
let pendingReplace: string | null = null;
/** The open sheet registers here, so navigating closes it without its own history.back(). */
export function setSheetConsumer(fn: (() => void) | null): void {
  sheetConsumer = fn;
}

/** Pushes a route. Scroll of the page being left is kept, so Back can restore it. */
export function go(path: string, opts: { replace?: boolean; carry?: boolean; tab?: boolean } = {}): void {
  const target = `#/${path.replace(/^#?\/?/, '')}`;
  pageScrolls.set(current.page, scrollY);
  arrivedByTab = !!opts.tab;
  if (history.state?.sheet) {
    sheetConsumer?.();
    scrolls.set(entry, scrollY);
    if (opts.replace) {
      // The change belongs on the page under the sheet: step back onto it, then replace.
      pendingReplace = target;
      history.back();
    } else {
      // Sheet entry becomes the new page, so Back returns to the page under the sheet.
      entry = ++nextKey;
      history.replaceState({ k: entry }, '', target);
      publish();
    }
    return;
  }
  if (target === location.hash) return;
  scrolls.set(entry, scrollY);
  if (opts.replace) {
    history.replaceState({ k: entry }, '', target);
  } else {
    entry = ++nextKey;
    history.pushState({ k: entry }, '', target);
  }
  publish();
}

/** Restores scroll for the entry on Back and Forward, or the named section, or the top. Runs after the page rendered. */
export function useScrollRestore(route: Route, ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const saved = scrolls.get(entry) ?? (arrivedByTab ? pageScrolls.get(route.page) : undefined);
    arrivedByTab = false;
    if (saved !== undefined) scrollTo(0, saved);
    else if (route.section) document.getElementById(route.section)?.scrollIntoView();
    else scrollTo(0, 0);
  }, [route.raw, ready]);
}

/** Same URL, new entry: a sheet that closes on Back. */
export function pushSheetEntry(): void {
  history.pushState({ k: entry, sheet: true }, '');
}
