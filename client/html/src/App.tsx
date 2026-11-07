/** The shell: tabs or rail, the data state strip, the page, and an error boundary between them. */
import { Component, Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link, NamedIco, SheetHost } from './ui/kit';
import { FoldRow, useInfo } from './ui/tight';
import { useRoute, useScrollRestore, type Page } from './lib/router';
import { useStore } from './lib/store';
import { dataAbout, dataBrief } from './lib/data';
import { dayLabel, istDate, stampLabel, timeLabel } from './lib/format';
import { FAILURE_WORDS } from './lib/writes';
import { plainReason, Today } from './pages/Today';
import { Spend } from './pages/Spend';
import { Spending } from './pages/Spending';
import { Names } from './pages/Names';
import { Bills } from './pages/Bills';
import { Invest } from './pages/Invest';
import { Plan } from './pages/Plan';
import { Reports, Flatmates } from './pages/Reports';
import { Sources } from './pages/Sources';

const TABS: [string, Page][] = [['Today', 'today'], ['Spend', 'spend'], ['Bills', 'bills'], ['Invest', 'invest'], ['Plan', 'plan']];
const TITLES: Record<Page, string> = { today: 'Today', spend: 'Spend', spending: 'Spending', names: 'Name payees', bills: 'Bills', invest: 'Invest', plan: 'Plan', reports: 'Reports', flatmates: 'Flatmates report', sources: 'Sources' };

const Mark = () => (
  <svg className="mk" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5.3 22V3.7h13.4v9.6H5.3M12.2 13.3 20 22" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <rect x="9.6" y="6.8" width="5.2" height="3.4" fill="currentColor" />
  </svg>
);
export const Brand = () => <span className="brand"><Mark /><span className="wm">Reclaim</span></span>;

/** Outline icons for the tabs: home, pie, receipt, trend, calendar. */
const TAB_PATHS: Record<string, ReactNode> = {
  today: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  spend: <><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>,
  bills: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8H8M16 12H8M13 16H8" /></>,
  invest: <><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></>,
  plan: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M17 14h-6M13 18H7" /></>,
};
const TabIcon = ({ p }: { p: string }) => (
  <span className="tab-ico" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{TAB_PATHS[p]}</svg>
  </span>
);

function Nav({ page }: { page: Page }) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand"><Mark /><span className="wm">Reclaim</span></div>
      {TABS.map(([label, p]) => <Link key={p} to={p} tab aria-current={p === page ? 'page' : undefined}><TabIcon p={p} />{label}</Link>)}
    </nav>
  );
}

/** One strip, reason first. All last numbers stay under it: no spinner or skeleton over money. */
export function ReasonBar() {
  const { refresh, stale, held, noBuildMs, builtMs, reload, snap, sources } = useStore();
  if (!snap) return null;
  const time = builtMs != null ? `${timeLabel(builtMs)} ` : 'last ';
  const when = builtMs != null ? stampLabel(builtMs) : dayLabel(snap.meta.as_of);
  const again = <button className="tlink" onClick={reload}>Try again</button>;
  const q = <i className="m q" aria-hidden="true" />;
  const noBuild = noBuildMs != null ? `No build has run since ${dayLabel(istDate(noBuildMs))}. Check the box.` : null;
  if (refresh === 'updating') return <div className="statebar plain" role="status" data-state="updating"><span>Updating. These are the {time}figures.</span></div>;
  if (refresh === 'unreachable') return <div className="statebar a" role="status" data-state="unreachable">{q}<span>Could not update: can&apos;t reach your home box. Is Tailscale on? These are the {time}figures.</span>{again}</div>;
  if (refresh === 'server') return <div className="statebar a" role="status" data-state="error">{q}<span>Could not update: your box answered with an error. These are the {time}figures.</span>{again}</div>;
  if (refresh === 'damaged') return <div className="statebar a" role="status" data-state="damaged">{q}<span>Could not update: the new numbers arrived damaged and were not used. These are the {time}figures.</span>{again}</div>;
  if (held) return <div className="statebar a" role="status" data-state="blocked">{q}<span>{plainReason(held.reason)} {noBuild ? `${noBuild} ` : ''}These are the {when} figures.</span>{again}</div>;
  if (noBuild) return <div className="statebar a" role="status" data-state="stale">{q}<span>{noBuild} These numbers may be old.</span>{again}</div>;
  if (stale) return <div className="statebar a" role="status" data-state="stale">{q}<span>Last updated {when}. These numbers may be old.</span>{again}</div>;
  const old = sources?.numbers?.likely_left;
  if (old?.confidence === 'low' && old.line) return <div className="statebar a" role="status" data-state="old-data">{q}<span>{plainReason(old.line)} Recent figures are incomplete.</span></div>;
  return null;
}

/** The top data line, only when it is amber: a source needs the owner, and Sources has the detail. Quiet dates live in the About this data row. Absent status says nothing. */
export function DataAge() {
  const { sources, now } = useStore();
  if (!sources) return null;
  const brief = dataBrief(sources, now);
  if (!brief.act) return null;
  return <Link className="note dataline a" to="sources" data-age data-act={brief.act}><i className="m q" aria-hidden="true" />{brief.text}</Link>;
}

/** The last row on every page: the bank-message and statement dates, opening a sheet with them and a way to Sources. */
export function AboutData() {
  const { sources, now } = useStore();
  const show = useInfo();
  if (!sources) return null;
  const about = dataAbout(sources, now);
  const body = (
    <>
      <dl>{about.rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
      {about.old.length ? <p>No newer statement for {about.old.join(', ')}.</p> : null}
      <p>Figures after the statement come from bank messages, so they may still change.</p>
      <p><Link className="tlink" to="sources">See sources</Link></p>
    </>
  );
  return <div className="about" data-about><FoldRow title="About this data" sub={about.line} heading={false} onClick={() => show('About this data', body)} testid="about" /></div>;
}

export function StateBar() {
  return <><ReasonBar /><DataAge /></>;
}

type ThemeChoice = 'system' | 'light' | 'dark';
const THEME_NEXT: Record<ThemeChoice, ThemeChoice> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_WORD: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const THEME_ICON: Record<ThemeChoice, 'monitor' | 'sun' | 'moon'> = { system: 'monitor', light: 'sun', dark: 'moon' };
declare global { interface Window { reclaimTheme?: { get: () => ThemeChoice; set: (choice: ThemeChoice) => void } } }

/** Light, Dark or System. With nothing saved it is Light; public/theme.js applies it before first paint. */
export function ThemeButton() {
  const [choice, setChoice] = useState<ThemeChoice>(() => window.reclaimTheme?.get() ?? 'light');
  const next = THEME_NEXT[choice];
  return (
    <button type="button" className="btn-th" data-theme-choice={choice} aria-label={`Theme: ${THEME_WORD[choice]}. Change to ${THEME_WORD[next]}.`}
      onClick={() => { window.reclaimTheme?.set(next); setChoice(next); }}>
      <NamedIco name={THEME_ICON[choice]} />
    </button>
  );
}

export function PageHeader({ title, action, to }: { title: string; action?: string; to?: string }) {
  return (
    <header className="top">
      <div className="d">{title}</div>
      <span className="top-acts"><ThemeButton /><Link className="btn-q" to={to ?? 'reports'}>{action ?? 'Reports'}</Link></span>
    </header>
  );
}

class Boundary extends Component<{ children: ReactNode; page: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { page: string }) {
    if (prev.page !== this.props.page && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) {
      return (
        <main>
          <h1 className="a">This page could not be shown.</h1>
          <p className="sub">Your numbers are safe. The other pages still work.</p>
          <div className="wrap mt4"><Link className="tlink" to="today">Go to Today</Link></div>
        </main>
      );
    }
    return this.props.children;
  }
}

const PAGE_EL: Record<Page, () => ReactNode> = {
  today: () => <Today />,
  spend: () => <Spend />,
  spending: () => <Spending />,
  names: () => <Names />,
  bills: () => <Bills />,
  invest: () => <Invest />,
  plan: () => <Plan />,
  reports: () => <Reports />,
  flatmates: () => <Flatmates />,
  sources: () => <Sources />,
};

function Loading({ phase, held, onRetry }: { phase: string; held: string | null; onRetry: () => void }) {
  if (phase === 'first') {
    return (
      <main>
        <h1 className="a">Getting your numbers.</h1>
        <p className="sub">This takes a few seconds the first time.</p>
      </main>
    );
  }
  const [title, sub] = phase === 'server' && held
    ? ['Your numbers were held back.', `${plainReason(held)} Nothing is lost.`]
    : phase === 'damaged'
    ? ['Your numbers arrived damaged.', 'They were not used. Nothing is lost.']
    : phase === 'version'
      ? ['This version of Reclaim needs updating.', 'It cannot read the newest numbers. Reopen the app to update it.']
      : phase === 'unreachable'
        ? ['Could not load your numbers.', "Can't reach your home box. Is Tailscale on? Nothing is lost."]
        : ['Could not load your numbers.', 'Your box answered with an error. Nothing is lost: your data is safe there.'];
  return (
    <main>
      <h1 className="a">{title}</h1>
      <p className="sub">{sub}</p>
      <div className="wrap mt4"><button className="bigbtn" onClick={onRetry}>Try again</button></div>
    </main>
  );
}

/** A failed save stays on screen, in memory, with a retry, wherever the owner has gone since. */
function SaveFailBar() {
  const { failure, setFailure } = useStore();
  if (!failure) return null;
  return (
    <div className="savefail savefail-fixed" role="alert" data-save-failed>
      <span><i className="m q" aria-hidden="true" />{FAILURE_WORDS[failure.failure]}</span>
      <span className="savefail-acts"><button onClick={failure.retry}>Try again</button><button onClick={() => setFailure(null)}>Dismiss</button></span>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const { phase, reload, held } = useStore();
  const ready = phase === 'ready';
  useScrollRestore(route, ready);
  useEffect(() => {
    document.title = `Reclaim: ${TITLES[route.page]}`;
  }, [route.page]);
  const focused = route.page === 'names' || route.page === 'flatmates' || route.page === 'sources';
  return (
    <SheetHost>
      {ready ? <Boundary page={route.raw}>{PAGE_EL[route.page]()}{route.page === 'sources' ? null : <AboutData />}</Boundary> : (
        <>
          <header className="top land"><div className="d"><Brand /></div></header>
          <Loading phase={phase} held={held?.reason ?? null} onRetry={reload} />
        </>
      )}
      {route.page === 'names' ? null : <Nav page={focused ? 'today' : route.page === 'spending' ? 'spend' : route.page} />}
      <SaveFailBar />
    </SheetHost>
  );
}
