import { useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { hydrate, queueSave } from './cloud';
import { CONFIG } from './config';
import { ICONS, type Tab } from './data';
import { useTracker } from './store';
import { Dashboard } from './components/Dashboard';
import { LogScreen } from './components/LogScreen';
import { BodyScreen } from './components/BodyScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { CustomSheet, WeekPopup } from './components/Overlays';
import { LoginScreen } from './components/LoginScreen';

const TABS: [Tab, string][] = [['dash', 'ภาพรวม'], ['log', 'บันทึก'], ['body', 'ร่างกาย'], ['profile', 'โปรไฟล์']];

/** Signs the user in, loads their cloud data, then shows the tracker. */
export function Root() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [ready, setReady] = useState<string | null>(null), [err, setErr] = useState('');
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) { setReady(null); return; }
    let live = true; setErr('');
    hydrate(user.uid).then(() => { if (live) setReady(user.uid); }, () => { if (live) setErr('โหลดข้อมูลไม่สำเร็จ · ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'); });
    return () => { live = false; };
  }, [user]);

  if (user && ready === user.uid) return <App key={user.uid} uid={user.uid} />;
  return (
    <Frame theme={/^(light|dark)$/.test(localStorage.getItem('wft-theme-v1') ?? '') ? localStorage.getItem('wft-theme-v1')! : CONFIG.theme}>
      <main className="scroll">
        {user === null ? <LoginScreen /> : (
          <div className="stack" style={{ paddingTop: 80, alignItems: 'center', color: 'var(--mute)', fontSize: 14 }}>
            {err ? <>{err}<button className="btn-dashed" style={{ padding: '0 20px' }} onClick={() => location.reload()}>ลองใหม่</button></> : 'กำลังโหลด…'}
          </div>
        )}
      </main>
    </Frame>
  );
}

const Frame = ({ theme, children }: { theme: string; children: ReactNode }) => (
  <div className="page" data-theme={theme}>
    <div className="page-head"><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><img src="/favicon.png" alt="" width={20} height={20} />Weekly Progress Tracker</span></div>
    <div className="device">{children}</div>
  </div>
);

export function App({ uid }: { uid: string }) {
  const t = useTracker(), { s } = t;

  // The tracker persists to localStorage first; mirror that to Firestore.
  useEffect(() => { queueSave(uid); }, [s, uid]);
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
    <Frame theme={s.theme}>
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
    </Frame>
  );
}
