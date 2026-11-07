/* Which icon a row gets. Pure, offline, no network. One source: icons/build.mjs inlines this file into the mocks.
   Rule in words: SPEC.md section 8, "Icons". Fields are snapshot-v1 as they are today. */
import map from '../map.json' with { type: 'json' };
import type { IconName } from './icons';

export type IconKind = 'brand' | 'category' | 'neutral';
export interface IconChoice { name: IconName; kind: IconKind }
export interface IconQuery {
  /** TopPayee.name, Item.name, RecurringLine.name, PlanLine.name, Holding.name, GroupLine.name. Cleaned display name, never `raw`. */
  name?: string | null;
  /** Item.group, TopPayee.group or Suggestion.group: "Food" or "Food:Groceries". GroupLine: pass its `name`. */
  group?: string | null;
  /** TopPayee.merchant_id or ReviewItem.merchant_id. Usually null. Only used as a key into `brandOverrides`. */
  merchant_id?: string | null;
  /** TopPayee.confidence. Not Figure.confidence, which never affects an icon. */
  confidence?: 'owner' | 'table' | 'rule' | 'suggested' | 'none' | null;
  /** True for every ReviewItem, and any row the page itself calls unnamed. */
  unnamed?: boolean;
  /** The owner's own merchant_id to brand key table. Lives on the box, never in the repo. */
  brandOverrides?: Record<string, string>;
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const brands: Record<string, { names: string[] }> = map.brands;
const groups: Record<string, string> = map.groups;
const keywords: [string, string][] = map.keywords as [string, string][];
const brandByName = new Map<string, string>();
for (const [key, b] of Object.entries(brands)) for (const n of b.names) brandByName.set(norm(n), key);
const keywordIcon = new Map<string, string>(keywords);

export function iconFor(q: IconQuery): IconChoice {
  const neutral: IconChoice = { name: map.neutral as IconName, kind: 'neutral' };
  const name = norm(q.name ?? '');
  if (q.unnamed || !name || q.confidence === 'none') return neutral;
  /* A suggestion is a guess waiting for the owner, so it may earn a category but never a logo. */
  if (q.confidence !== 'suggested') {
    const own = q.merchant_id ? q.brandOverrides?.[q.merchant_id] : undefined;
    if (own && brands[own]) return { name: own as IconName, kind: 'brand' };
    const known = brandByName.get(name);
    if (known) return { name: known as IconName, kind: 'brand' };
  }
  if (q.group) {
    const hit = groups[q.group] ?? groups[q.group.split(':')[0]];
    if (hit) return { name: hit as IconName, kind: 'category' };
  }
  /* Lines with no group (bills, plans, holdings): whole words of the name, first in table order wins. */
  const words = new Set(name.split(' '));
  for (const [word, icon] of keywordIcon) if (words.has(word)) return { name: icon as IconName, kind: 'category' };
  return neutral;
}
