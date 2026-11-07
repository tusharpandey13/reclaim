/* node --test icons/test/iconFor.test.ts */
import test from 'node:test';
import assert from 'node:assert/strict';
import { iconFor } from '../react/iconFor.ts';
const t = (q: Parameters<typeof iconFor>[0], name: string, kind: string) => assert.deepEqual(iconFor(q), { name, kind });
test('brand first, even when a group is present', () => t({ name: 'Swiggy', group: 'Food:Delivery' }, 'swiggy', 'brand'));
test('case and punctuation do not matter', () => t({ name: "  McDonald's " }, 'mcdonalds', 'brand'));
test('whole name only: a brand word inside another name is not that brand', () => t({ name: 'Zara Tailors', group: 'Shopping:Clothing' }, 'shirt', 'category'));
test('no glyph in Simple Icons falls to the category', () => t({ name: 'Amazon', group: 'Shopping:Marketplaces' }, 'package', 'category'));
test('detail group, then top group', () => { t({ name: 'Zed', group: 'Food:Groceries' }, 'shopping-basket', 'category'); t({ name: 'Zed', group: 'Food:Unknown' }, 'utensils', 'category'); });
test('unnamed never gets a logo', () => { t({ name: 'Swiggy', unnamed: true }, 'circle-dashed', 'neutral'); t({ name: 'Swiggy', confidence: 'none', group: 'Food' }, 'circle-dashed', 'neutral'); t({ name: '', group: 'Food' }, 'circle-dashed', 'neutral'); });
test('a suggestion gets its category, not a logo', () => t({ name: 'Swiggy', confidence: 'suggested', group: 'Food' }, 'utensils', 'category'));
test('merchant_id only works through the owner table', () => { t({ name: 'Zed Foods', merchant_id: 'm1', brandOverrides: { m1: 'swiggy' } }, 'swiggy', 'brand'); t({ name: 'Zed Foods', merchant_id: 'm1' }, 'circle-dashed', 'neutral'); t({ name: 'Zed Foods', merchant_id: 'm1', brandOverrides: { m1: 'nonsense' } }, 'circle-dashed', 'neutral'); });
test('group-less lines use whole words', () => { t({ name: 'Card A' }, 'credit-card', 'category'); t({ name: 'Scarf' }, 'circle-dashed', 'neutral'); });
test('Uncategorized is neutral', () => t({ name: 'Zed', group: 'Uncategorized' }, 'circle-dashed', 'neutral'));
