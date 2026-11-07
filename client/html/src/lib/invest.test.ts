import { describe, expect, it } from 'vitest';
import { realEvents, tickerOf } from '../pages/Invest';

describe('Invest tickers and events', () => {
  it('shows an exchange ticker and leaves ISINs and odd ids out', () => {
    expect(tickerOf('ACMW')).toBe('ACMW');
    expect(tickerOf('zedt')).toBe('ZEDT');
    expect(tickerOf('BRK.B')).toBe('BRK.B');
    expect(tickerOf('INF000ZZ0011')).toBeNull();
    expect(tickerOf('INE000ZZ0012')).toBeNull();
    expect(tickerOf('US0378331005')).toBeNull();
    expect(tickerOf('some fund id')).toBeNull();
    expect(tickerOf('ABCDEFGHIJKLMN')).toBeNull();
    expect(tickerOf(null)).toBeNull();
    expect(tickerOf('')).toBeNull();
  });
  it('drops made-up sample events and keeps the rest', () => {
    const e = (source: string) => ({ date: '2026-03-11', label: source, market: 'India' as const, kind: 'past' as const, source, instrument: null });
    expect(realEvents([e('sample'), e('news'), e('sample')]).map((x) => x.label)).toEqual(['news']);
  });
});
