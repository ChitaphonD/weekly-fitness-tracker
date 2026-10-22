import type { CSSProperties } from 'react';
import { TICKS } from '../data';
import { sgn, wl } from '../format';
import { mlabOf, type Tracker } from '../store';
import { PhotoSlot } from './PhotoSlot';

export function BodyScreen({ t }: { t: Tracker }) {
  const { s, set } = t;
  const N = s.week, ci = N - 1, pi = N - 2;
  const slider = s.cmpMode === 'slider';

  const slots = [s.cmpA, ...(s.cmpB !== s.cmpA ? [s.cmpB] : [])].map((i, n) => {
    const isB = n === 1;
    const style: CSSProperties = slider
      ? { left: 0, width: '100%', zIndex: isB ? 2 : 1, clipPath: isB ? `inset(0 0 0 ${s.pos}%)` : 'none' }
      : { left: isB ? '50%' : 0, width: '50%', zIndex: 1, padding: isB ? '0 0 0 1px' : '0 1px 0 0' };
    return { i, isB, style };
  });

  const m = s.metrics;
  const wa = m.weight[s.cmpA], wb = m.weight[s.cmpB], xa = m.waist[s.cmpA], xb = m.waist[s.cmpB];
  const photoDiff = s.cmpA !== s.cmpB && wa != null && wb != null
    ? `W${s.cmpA + 1} → W${s.cmpB + 1}: ${sgn(wb - wa)} kg` + (xa != null && xb != null ? `, เอว ${sgn(xb - xa)} cm` : '')
    : 'รูปจะเทียบได้เมื่อมีอย่างน้อย 2 สัปดาห์';

  const weekPicker = (k: 'cmpA' | 'cmpB') => (
    <div className="week-grid">
      {TICKS.slice(0, N).map((tk, i) => (
        <button key={tk} className={i === s[k] ? 'on' : ''} onClick={() => set({ [k]: i })}>{tk.replace('W', '')}</button>
      ))}
    </div>
  );

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">WEEKLY CHECK-IN · {wl(ci)}</div>
        <div className="h1">สัดส่วนร่างกาย</div>
      </div>
      <div className="grid2">
        {mlabOf(s.custom).map(([k, l, u]) => {
          const last = pi >= 0 ? (m[k] || [])[pi] ?? '—' : '—';
          return (
            <label key={k} className="field" style={{ gap: 4 }}>
              <span className="row-between label"><span>{l}</span><span className="mono">{u}</span></span>
              <input type="number" inputMode="decimal" placeholder={String(last)} value={s.body[k] ?? ''}
                onChange={e => { const v = e.target.value; set(st => ({ body: { ...st.body, [k]: v } })); }} />
              <span style={{ font: '500 10px var(--mono)', color: 'var(--mute)' }}>สัปดาห์ก่อน {last}</span>
            </label>
          );
        })}
      </div>
      <button className="btn-primary" onClick={t.saveBody}>{s.checked ? 'อัปเดต Check-in สัปดาห์นี้' : 'บันทึก Check-in สัปดาห์นี้'}</button>

      <div className="card" style={{ padding: 14 }}>
        <div className="row-between" style={{ alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Progress Photos</span>
          <div className="seg">
            {([['slider', 'Slider'], ['side', 'Side by side']] as const).map(([k, l]) => (
              <button key={k} className={s.cmpMode === k ? 'on' : ''} onClick={() => set({ cmpMode: k })}>{l}</button>
            ))}
          </div>
        </div>
        <div className="photo-frame">
          {slots.map(({ i, isB, style }) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, boxSizing: 'border-box', ...style }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <PhotoSlot id={`progress-w${i + 1}`} placeholder={`อัปโหลดรูป ${TICKS[i]}`} controlsSide={isB ? 'right' : 'left'} />
              </div>
              <span className="photo-tag" style={{ left: isB && slider ? 'calc(100% - 46px)' : 10 }}>{TICKS[i]}</span>
            </div>
          ))}
          {slider && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: s.pos + '%', width: 2, marginLeft: -1, background: '#fff', zIndex: 5, pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(0,0,0,.2)' }} />
          )}
        </div>
        {slider && (
          <input type="range" min={0} max={100} value={s.pos} aria-label="ตำแหน่งแถบเทียบรูป" onChange={e => set({ pos: +e.target.value })} style={{ width: '100%' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 36 }} className="label">ก่อน</span>{weekPicker('cmpA')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 36 }} className="label">หลัง</span>{weekPicker('cmpB')}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.5 }}>แตะหรือลากรูปลงในช่องเพื่ออัปโหลดรูปของสัปดาห์นั้น · {photoDiff}</div>
      </div>
    </div>
  );
}
