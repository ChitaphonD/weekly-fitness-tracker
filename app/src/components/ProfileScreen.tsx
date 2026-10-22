import { GOALS, SEXES, TODAY } from '../data';
import { wl } from '../format';
import type { Profile, Tracker } from '../store';
import { latestWeight } from './derived';

export function ProfileScreen({ t }: { t: Tracker }) {
  const { s, set } = t, P = s.profile;
  const setP = (k: keyof Profile, v: string) => set(st => ({ profile: { ...st.profile, [k]: v } }));
  const onP = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setP(k, e.target.value);

  const latestW = latestWeight(s);
  const born = new Date(P.birth);
  const age = isNaN(+born) ? '—' : Math.floor((+TODAY - +born) / 31557600000);
  const bmi = latestW && +P.height ? (latestW / Math.pow(+P.height / 100, 2)).toFixed(1) : '—';
  const stats = [{ label: 'อายุ', value: age }, { label: 'BMI', value: bmi }, { label: 'น้ำหนักล่าสุด', value: latestW ?? '—' }];

  return (
    <div className="stack">
      <div style={{ fontSize: 24, fontWeight: 700 }}>โปรไฟล์ &amp; เป้าหมาย</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {stats.map(x => (
          <div key={x.label} style={{ background: 'var(--surface2)', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>{x.label}</span>
            <span style={{ font: '600 18px var(--mono)' }}>{x.value}</span>
          </div>
        ))}
      </div>

      <div className="label" style={{ marginTop: 4 }}>ข้อมูลกายภาพ</div>
      <div className="list">
        <label className="list-row"><span>ส่วนสูง (cm)</span><input type="number" inputMode="decimal" value={P.height} onChange={onP('height')} /></label>
        <label className="list-row"><span>วันเกิด</span><input type="date" value={P.birth} onChange={onP('birth')} /></label>
        <div className="list-row"><span>เพศ</span>
          <div className="seg">
            {SEXES.map(o => <button key={o} className={P.sex === o ? 'on' : ''} style={{ height: 32, padding: '0 12px', fontSize: 13 }} onClick={() => setP('sex', o)}>{o}</button>)}
          </div>
        </div>
      </div>

      <div className="label" style={{ marginTop: 4 }}>เป้าหมายหลัก</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GOALS.map(([g, sub]) => {
          const on = P.goal === g;
          return (
            <button key={g} onClick={() => setP('goal', g)} aria-pressed={on}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, padding: '0 16px', borderRadius: 14, border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`, background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left' }}>
              <span><span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{g}</span><span style={{ fontSize: 11, color: 'var(--mute)' }}>{sub}</span></span>
              <span className={'dot' + (on ? ' on' : '')} />
            </button>
          );
        })}
      </div>

      <div className="label" style={{ marginTop: 4 }}>เป้าหมายเชิงตัวเลข</div>
      <div className="list">
        <label className="list-row"><span>น้ำหนักเป้าหมาย (kg)</span><input type="number" inputMode="decimal" value={P.target} onChange={onP('target')} /></label>
        <label className="list-row"><span>ฝึกต่อสัปดาห์ (ครั้ง)</span><input type="number" inputMode="numeric" value={P.freq} onChange={onP('freq')} /></label>
      </div>
      <button className="list-btn" onClick={() => set({ weekPopup: true, weekPick: s.week })}>
        <span>สัปดาห์ปัจจุบัน</span><span className="mono" style={{ color: 'var(--accent)' }}>{wl(s.week - 1)} ▾</span>
      </button>
      <button className="list-btn" onClick={() => set({ theme: s.theme === 'dark' ? 'light' : 'dark' })}>
        <span>Dark Mode</span><span className="mono mute">{s.theme === 'dark' ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}
