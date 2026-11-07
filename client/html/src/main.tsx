import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StoreProvider, useStore } from './lib/store';
import './design/till.css';
import './design/plan.css';
import './design/app.css';
import './design/tight.css';
import './design/spend-tight.css';

/** Android Chrome holds :active back without a touch listener somewhere on the page. */
document.addEventListener('touchstart', () => undefined, { passive: true });

/** A new version arrived: reload, unless a draft is open, in which case say so and let the owner choose. */
function UpdateWatcher() {
  const { draftOpen } = useStore();
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => {
      if (!hadController) return;
      if (draftOpen()) setWaiting(true);
      else location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, [draftOpen]);
  if (!waiting) return null;
  return <div className="statebar plain updatebar" role="status"><span>A new version is ready. Finish this first, it will not interrupt you.</span><button className="tlink" onClick={() => location.reload()}>Reload now</button></div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
      <UpdateWatcher />
    </StoreProvider>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Check for a new version on every open.
  void navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => undefined);
}
