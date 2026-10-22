import { useEffect, useRef } from 'react';
import { ICONS, type Tab } from './data';
import { useTracker } from './store';
import { Dashboard } from './components/Dashboard';
import { LogScreen } from './components/LogScreen';
import { BodyScreen } from './components/BodyScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { CustomSheet, WeekPopup } from './components/Overlays';

const TABS: [Tab, string][] = [['dash', 'ภาพรวม'], ['log', 'บันทึก'], ['body', 'ร่างกาย'], ['profile', 'โปรไฟล์']];

export function App() {
  const t = useTracker(), { s } = t;
  const scroll = useRef<HTMLDivElement>(null);

  // Jump (not smooth-scroll) to the top when the tab or log mode changes.
  useEffect(() => {
    const el = scroll.current; if (!el) return;
    el.style.scrollBehavior = 'auto'; el.scrollTop = 0; el.style.scrollBehavior = '';
  }, [s.tab, s.logMode]);

  // Match the browser chrome to the theme.
  useEffect(() => {
    document.body.style.background = s.theme === 'dark' ? '#0a0b0a' : '#e6e4de';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', s.theme === 'dark' ? '#111311' : '#f5f4f0');
  }, [s.theme]);

  return (
    <div className="page" data-theme={s.theme}>
      <div className="page-head"><span>Weekly Progress Tracker</span></div>
      <div className="device">
        <main ref={scroll} className="scroll">
          {s.tab === 'dash' && <Dashboard t={t} />}
          {s.tab === 'log' && <LogScreen t={t} />}
          {s.tab === 'body' && <BodyScreen t={t} />}
          {s.tab === 'profile' && <ProfileScreen t={t} />}
        </main>

        {s.sheet && <CustomSheet t={t} sheet={s.sheet} />}
        {s.weekPopup && <WeekPopup t={t} />}
        {s.toast && <div className="toast" role="status">{s.toast}</div>}

        <nav className="tabbar">
          {TABS.map(([id, label]) => (
            <button key={id} className={s.tab === id ? 'on' : ''} aria-current={s.tab === id ? 'page' : undefined} onClick={() => t.set({ tab: id })}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[id]} /></svg>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
