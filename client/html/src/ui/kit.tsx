/** Small pieces every page shares. Class names are the frozen ones in design/till.css. */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, iconFor, type IconName, type IconQuery } from '../icons/react';
import map from '../icons/map.json' with { type: 'json' };
import { go, pushSheetEntry, setSheetConsumer } from '../lib/router';

/** A brand comes only from the server's slug, never from a display name. Marking the query as a suggestion turns off iconFor's name match; category and keywords still apply. */
export type RowIcon = Pick<IconQuery, 'name' | 'group' | 'unnamed'> & { brand?: string | null; confidence?: unknown };
export function pickIcon(q: RowIcon): IconName {
  if (q.brand && q.brand in map.brands) return q.brand as IconName;
  return iconFor({ name: q.name, group: q.group, unnamed: q.unnamed, confidence: 'suggested' }).name;
}
/** Icons are decorative and never carry status. */
export function Ico({ q, small }: { q: RowIcon; small?: boolean }) {
  return <i className={`ico${small ? ' s' : ''}`} aria-hidden="true"><Icon name={pickIcon(q)} /></i>;
}
export function UiIco({ name, small }: { name: keyof typeof map.ui; small?: boolean }) {
  return <i className={`ico${small ? ' s' : ''}`} aria-hidden="true"><Icon name={map.ui[name] as IconName} /></i>;
}
export function NamedIco({ name, small }: { name: IconName; small?: boolean }) {
  return <i className={`ico${small ? ' s' : ''}`} aria-hidden="true"><Icon name={name} /></i>;
}

export const N = ({ children, className }: { children: ReactNode; className?: string }) => <span className={`n${className ? ` ${className}` : ''}`}>{children}</span>;

export type ChipStep = 'r1' | 'r2' | 'r3' | 'g1' | 'g2' | 'g3' | 'a' | 'plain' | 'quiet';
/** A status chip: a word, with a mark on status steps. Markers carry data-step for tests that assert meaning, not pixels. */
export function Chip({ step, children, kind }: { step: ChipStep; children: ReactNode; kind?: string }) {
  const marked = step[0] === 'r' || step[0] === 'g' || step === 'a';
  return (
    <span className={`sc ${step}`} data-step={step} data-kind={kind}>
      {marked ? <i className="m" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function Link({ to, className, children, tab, ...rest }: { to: string; className?: string; children: ReactNode; tab?: boolean; 'aria-label'?: string; 'aria-current'?: 'page' | 'date'; style?: React.CSSProperties; [data: `data-${string}`]: string | number | undefined }) {
  return (
    <a
      href={`#/${to}`}
      className={className}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        go(to, { tab });
      }}
    >
      {children}
    </a>
  );
}

/** Native dialog: Esc, focus trap and focus return for free. Back closes it. */
export function Sheet({ open, onClose, children, label, className }: { open: boolean; onClose: () => void; children: ReactNode; label?: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pushed = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      pushSheetEntry();
      pushed.current = true;
      setSheetConsumer(() => {
        pushed.current = false;
        setSheetConsumer(null);
        closeRef.current();
      });
    }
    if (!open && d.open) {
      d.close();
    }
    if (!open && pushed.current) {
      pushed.current = false;
      setSheetConsumer(null);
      history.back();
    }
  }, [open]);
  useEffect(() => {
    const onPop = () => {
      if (pushed.current) {
        pushed.current = false;
        closeRef.current();
      }
    };
    addEventListener('popstate', onPop);
    return () => {
      removeEventListener('popstate', onPop);
      if (pushed.current) {
        pushed.current = false;
        history.back();
      }
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      onClose={() => closeRef.current()}
      onClick={(e) => {
        if (e.target === ref.current) closeRef.current();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}

/** One sheet at a time on a page. Pages render <SheetHost/>, anything can call open(). Kind 'info' is the explanation sheet of ui/tight.tsx. */
export type SheetKind = 'info';
interface SheetApi { open: (node: ReactNode, label?: string, kind?: SheetKind) => void; close: () => void }
const SheetCtx = createContext<SheetApi>({ open: () => undefined, close: () => undefined });
export const useSheet = () => useContext(SheetCtx);
export function SheetHost({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null);
  const [label, setLabel] = useState<string | undefined>();
  const [kind, setKind] = useState<SheetKind | undefined>();
  const api = useRef<SheetApi>({ open: (n, l, k) => { setNode(n); setLabel(l); setKind(k); }, close: () => setNode(null) });
  return (
    <SheetCtx.Provider value={api.current}>
      {children}
      <Sheet open={node != null} onClose={() => setNode(null)} label={label} className={node != null ? kind : undefined}>{node}</Sheet>
    </SheetCtx.Provider>
  );
}
export function CloseButton({ label = 'Close' }: { label?: string }) {
  const { close } = useSheet();
  return <button className="close" onClick={close}>{label}</button>;
}

/** Tap-to-read: chart taps write to a text line, so a tooltip never holds the only copy of a value. */
export function Read({ text, tone, narrow, id }: { text: ReactNode | null; tone?: string; narrow?: boolean; id?: string }) {
  return <div id={id} className={`read${tone ? ` ${tone}` : ''}${narrow ? ' narrow' : ''}`} hidden={text == null} aria-live="polite">{text}</div>;
}

/** Content width of an element, so chart text is drawn at real pixels at every width. */
export function useWidth<T extends HTMLElement>(fallback = 340, remount?: unknown): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const c = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
      if (inner > 0) setW(Math.round(inner));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [remount]);
  return [ref, w];
}

/** Desktop places a few sections in another column. One element in one place at each width, so phone order and tab order stay what they were. */
export function useWide(): boolean {
  const query = '(min-width:1000px)';
  const [wide, setWide] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/** Empty, first-load and failed answers: a sentence, then one way forward. Never a spinner over money. */
export function Answer({ title, sub, button, onButton, children }: { title: ReactNode; sub?: ReactNode; button?: string; onButton?: () => void; children?: ReactNode }) {
  return (
    <>
      <h1 className="a">{title}</h1>
      {sub ? <p className="sub">{sub}</p> : null}
      {button ? <div className="wrap mt4"><button className="bigbtn" onClick={onButton}>{button}</button></div> : null}
      {children}
    </>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export const Hl = ({ children }: { children: ReactNode }) => <span className="hl">{children}</span>;

/** A row's name with its status chip on the same line. */
export const NameChip = ({ name, chip, beside }: { name: ReactNode; chip?: ReactNode; beside?: boolean }) => <span className={beside ? 'nm beside' : 'nm'}><b>{name}</b>{chip ? <> {chip}</> : null}</span>;

/** A row with an icon column, a name and an optional sub-line, in the frozen .icr grid. */
export function IconRow({ q, name, sub, ui }: { q?: RowIcon; ui?: keyof typeof map.ui; name: ReactNode; sub?: ReactNode }) {
  return (
    <span className="icr">
      {ui ? <UiIco name={ui} /> : <Ico q={q ?? {}} />}
      <b>{name}</b>
      {sub != null ? <small className={typeof sub === 'object' ? 'chipline' : undefined}>{sub}</small> : null}
    </span>
  );
}

export function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));
}
