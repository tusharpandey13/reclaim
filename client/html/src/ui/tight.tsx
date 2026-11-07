/** The Tight redesign's shared pieces: the explanation sheet and its (i), the stat, the folded row and the range chooser. Styles are in design/tight.css. */
import type { ReactNode } from 'react';
import { Chip, Link, useSheet } from './kit';

/** An explanation in the shared sheet: a bottom sheet with a grab handle on phones, a centred card on desktop. Closes on × and on the backdrop. */
export function InfoSheet({ title, children }: { title: ReactNode; children: ReactNode }) {
  const { close } = useSheet();
  return (
    <>
      <i className="info-grab" aria-hidden="true" />
      <div className="info-head"><h2>{title}</h2><button type="button" className="info-x" aria-label="Close" onClick={close}>×</button></div>
      <div className="info-body">{children}</div>
    </>
  );
}

/** Opens an InfoSheet from anywhere: useInfo()(title, body). */
export function useInfo(): (title: string, body: ReactNode) => void {
  const { open } = useSheet();
  return (title, body) => open(<InfoSheet title={title}>{body}</InfoSheet>, title, 'info');
}

const InfoMark = () => (
  <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
    <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="8" cy="4.9" r="1" fill="currentColor" />
    <rect x="7.3" y="6.9" width="1.4" height="4.6" rx=".7" fill="currentColor" />
  </svg>
);

/** The (i): a 20 px drawn mark that opens `children` in an InfoSheet titled `title`. Safe inside a link or a tappable row. */
export function InfoButton({ title, children, label = 'More about this' }: { title: string; children: ReactNode; label?: string }) {
  const show = useInfo();
  return (
    <button type="button" className="info-i" aria-label={label} data-info={title} onClick={(e) => { e.preventDefault(); e.stopPropagation(); show(title, children); }}>
      <InfoMark />
    </button>
  );
}

/** Heading text with the (i) glued to its last word, so the mark never wraps onto a line alone. */
export function WithInfo({ text, title, children, label }: { text: string; title: string; children: ReactNode; label?: string }) {
  const cut = text.trimEnd().lastIndexOf(' ');
  return <>{cut > 0 ? text.slice(0, cut + 1) : ''}<span className="nw">{text.slice(cut + 1)}<InfoButton title={title} label={label}>{children}</InfoButton></span></>;
}

/** The outline calendar with the period inside: a day ("18"), a month ("NOV"), "Y" for a year, "30" for 30 days. `big` for a hero figure. */
export function CalIcon({ text, label, big }: { text: string; label: string; big?: boolean }) {
  const size = text.length >= 3 ? 7.2 : big ? 11.5 : text.length === 1 ? 10 : 9.5;
  return (
    <span className={`st-cal${big ? ' big' : ''}`} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2.5" />
        <path d="M8 2v4M16 2v4M3 9.5h18" />
        <text x="12" y="16.4" dominantBaseline="central" textAnchor="middle" stroke="none" fill="currentColor" fontFamily="Words, sans-serif" fontWeight="700" fontSize={size}>{text}</text>
      </svg>
    </span>
  );
}

export type StatStatus = 'above' | 'below' | 'usual';
const STATUS_CHIP: Record<StatStatus, ['r2' | 'g1' | 'quiet', string]> = { above: ['r2', 'Above'], below: ['g1', 'Below'], usual: ['quiet', 'Usual'] };

/**
 * A figure, its period as a calendar, its status chip, and an optional small word tag: "₹83k [30] Above usual ₹44k–₹78k". No arrows.
 * `chip` replaces the status chip when the page has its own (Invest's "Up 16.9%").
 */
export function Stat({ value, period, periodLabel, status, chip, tag, big, testid }: { value: ReactNode; period: string; periodLabel: string; status?: StatStatus; chip?: ReactNode; tag?: ReactNode; big?: boolean; testid?: string }) {
  const s = status ? STATUS_CHIP[status] : null;
  return (
    <span className="stat" data-stat={testid} data-status={status}>
      <span className="stat-v">{value}</span>
      <CalIcon text={period} label={periodLabel} big={big} />
      {chip ?? (s ? <Chip step={s[0]} kind="stat">{s[1]}</Chip> : null)}
      {tag != null ? <span className="st-tag">{tag}</span> : null}
    </span>
  );
}

/**
 * A full-width row for a section folded away: its title and a chevron. A link with `to` (its title an h2 unless heading is false), else a button.
 * A run of them starts with a section gap after the content above.
 */
export function FoldRow({ title, sub, to, onClick, heading = true, testid }: { title: ReactNode; sub?: ReactNode; to?: string; onClick?: () => void; heading?: boolean; testid?: string }) {
  const t = heading && to != null ? <h2 className="frow-t">{title}</h2> : <b className="frow-t">{title}</b>; // A button holds no heading.
  const inner = <><span className="frow-m">{t}{sub != null ? <small className="frow-s">{sub}</small> : null}</span><span className="frow-c" aria-hidden="true">›</span></>;
  if (to != null) return <Link className="frow" to={to} data-row={testid}>{inner}</Link>;
  return <button type="button" className="frow" onClick={onClick} data-row={testid}>{inner}</button>;
}

export interface RangeOption { id: string; label: string }
/**
 * The range chooser, presentational: a stepper ‹ label › over a segmented control. The page owns the state.
 * Leave onPrev or onNext out to disable that arrow.
 */
export function RangeChooser({ label, onPrev, onNext, prevLabel = 'Earlier', nextLabel = 'Later', options, value, onPick, testid }: { label: ReactNode; onPrev?: () => void; onNext?: () => void; prevLabel?: string; nextLabel?: string; options: RangeOption[]; value: string; onPick: (id: string) => void; testid?: string }) {
  return (
    <div className="range" data-range={testid}>
      <div className="range-step">
        <button type="button" aria-label={prevLabel} onClick={onPrev} disabled={!onPrev}>‹</button>
        <b aria-live="polite">{label}</b>
        <button type="button" aria-label={nextLabel} onClick={onNext} disabled={!onNext}>›</button>
      </div>
      <div className="range-seg" role="group" aria-label="Range">
        {options.map((o) => <button type="button" key={o.id} aria-pressed={o.id === value} data-range-id={o.id} onClick={() => onPick(o.id)}>{o.label}</button>)}
      </div>
    </div>
  );
}
