import { SUMMARY, TICKS, WEEK_RANGE_LABEL } from '../data';
import { fmt, series, sgn, wl } from '../format';
import { mlabOf, type Tracker } from '../store';
import { latestWeight, targetWeight } from './derived';

const W = 320, H = 150;

/** SVG path data for a weekly line chart with an optional target line. */
function lineChart(src: [number, number][], target: number | null) {
  if (!src.length) return { line: '', area: '', lx: -20, ly: -20, targetY: -10 };
  const vals = src.map(p => p[1]), all = target != null ? [...vals, target] : vals;
  let lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad;
  const x = (i: number) => 20 + i * (W - 40) / 7, y = (v: number) => 10 + (H - 24) * (1 - (v - lo) / (hi - lo));
  const pts = src.map(([i, v]) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return {
    line, area: pts.length > 1 ? `${line} L${last[0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z` : '',
    lx: last[0], ly: last[1], targetY: target != null ? y(target) : -10
  };
}

export function Dashboard({ t }: { t: Tracker }) {
  const { s, set } = t, P = s.profile;
  const N = s.week, ci = N - 1, pi = N - 2;

  // goal progress
  const wPts = series(s.metrics.weight, ci);
  const latestW = latestWeight(s), startW = wPts.length ? wPts[0][1] : null, tgt = targetWeight(s);
  const goalP = latestW == null || startW == null ? 0 : Math.max(0, Math.min(1, (startW - latestW) / ((startW - tgt) || 1)));

  // weekly summary tiles
  const prevS = pi >= 0 ? SUMMARY[pi] : null, c = s.cur;
  const dt = (a: number, k: keyof typeof c, unit: string) => {
    if (!prevS) return { delta: 'สัปดาห์แรก', color: 'var(--mute)' };
    const n = a - prevS[k];
    return { delta: `${sgn(n, 0)}${unit} vs ${wl(pi)}`, color: n >= 0 ? 'var(--up)' : 'var(--mute)' };
  };
  const tiles = [
    { label: 'Workouts', value: `${c.w}/${P.freq}`, unit: 'ครั้ง', ...dt(c.w, 'w', '') },
    { label: 'Total Volume', value: fmt(c.vol), unit: 'kg', ...dt(c.vol, 'vol', ' kg') },
    { label: 'Total Time', value: fmt(c.min), unit: 'min', ...dt(c.min, 'min', ' min') },
    { label: 'Calories', value: fmt(c.kcal), unit: 'kcal', ...dt(c.kcal, 'kcal', '') }
  ];

  // volume bars
  const vols = TICKS.map((_, i) => i < ci ? SUMMARY[i].vol : i === ci ? c.vol : null);
  const vmax = Math.max(1, ...vols.filter((v): v is number => v != null));
  const volBars = vols.map((v, i) => v == null ? { h: '0%', bg: 'transparent', label: '' }
    : { h: Math.max(3, v / vmax * 100) + '%', bg: i === ci ? 'var(--accent)' : 'var(--surface2)', label: (v / 1000).toFixed(1) + 'k' });

  // body metric trend
  const ML = mlabOf(s.custom);
  const [mk, , munit, dir] = ML.find(m => m[0] === s.metricKey) || ML[0];
  const mp = series(s.metrics[mk], ci), isW = mk === 'weight';
  const ch = lineChart(mp, isW && mp.length ? tgt : null);
  const mlast = mp.length ? mp[mp.length - 1][1] : null;
  const wk = mp.length > 1 ? mlast! - mp[mp.length - 2][1] : 0, tot = mp.length ? mlast! - mp[0][1] : 0;
  const wkColor = wk * dir > 0 ? 'var(--up)' : wk === 0 ? 'var(--mute)' : 'var(--down)';

  // strength progress
  const exWithData = Object.keys(s.hist).filter(n => series(s.hist[n], ci).length);
  const sx = exWithData.includes(s.strengthEx) ? s.strengthEx : exWithData[0];
  const hp = sx ? series(s.hist[sx], ci) : [];
  let str = { latest: '—' as number | string, delta: '', color: 'var(--mute)', bars: [] as { h: string; label: string | number; bg: string; border: string }[] };
  if (hp.length) {
    const vs = hp.map(p => p[1]), hmax = Math.max(...vs), hmin = Math.min(...vs) * 0.8, rng = (hmax - hmin) || 1;
    const li = hp[hp.length - 1][0], lv = hp[hp.length - 1][1], pv = hp.length > 1 ? hp[hp.length - 2][1] : null, sd = pv != null ? lv - pv : 0;
    str = {
      latest: lv, delta: pv != null ? `${sgn(sd)} kg vs สัปดาห์ก่อน` : 'ครั้งแรก · baseline', color: sd > 0 ? 'var(--up)' : 'var(--mute)',
      bars: TICKS.map((_, i) => {
        const v = i <= ci ? s.hist[sx][i] : null;
        return v != null
          ? { h: ((v - hmin) / rng * 85 + 15) + '%', label: v, bg: i === li ? 'var(--accent)' : 'var(--surface2)', border: 'transparent' }
          : { h: '15%', label: i <= ci ? '—' : '', bg: 'transparent', border: i <= ci ? 'var(--mute)' : 'transparent' };
      })
    };
  }

  // week-over-week comparison table
  const cmpRows = Object.keys(s.hist)
    .filter(n => s.hist[n][ci] != null || (pi >= 0 && s.hist[n][pi] != null))
    .map(n => {
      const k = s.hist[n], cu = k[ci], pr = pi >= 0 ? k[pi] : null, d = cu != null && pr != null ? cu - pr : null;
      return { name: n, prev: pr ?? '—', cur: cu ?? '—', delta: d == null ? '' : sgn(d), color: d != null && d > 0 ? 'var(--up)' : d != null && d < 0 ? 'var(--down)' : 'var(--mute)' };
    });

  return (
    <div className="stack">
      <div className="row-between" style={{ alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <img src="/icon-192.png" alt="" width={48} height={48} style={{ borderRadius: 12, flexShrink: 0 }} />
          <div>
            <button className="week-pill" onClick={() => set({ weekPopup: true, weekPick: s.week })}>
              {'WEEK ' + String(N).padStart(2, '0')} · {WEEK_RANGE_LABEL} <span style={{ color: 'var(--accent)' }}>▾</span>
            </button>
            <div className="h1">ภาพรวมสัปดาห์นี้</div>
          </div>
        </div>
        <button className="theme-btn" onClick={() => set({ theme: s.theme === 'dark' ? 'light' : 'dark' })}>{s.theme === 'dark' ? 'DARK' : 'LIGHT'}</button>
      </div>

      <div className="card" style={{ gap: 10 }}>
        <div className="row-between" style={{ fontSize: 13, color: 'var(--mute)' }}>
          <span>เป้าหมาย · {P.goal}</span><span className="mono">{Math.round(goalP * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ font: '600 30px var(--mono)' }}>{latestW ?? '—'}</span>
          <span style={{ color: 'var(--mute)', fontSize: 14 }}>kg → {tgt || '—'} kg</span>
        </div>
        <div className="progress"><div style={{ width: goalP * 100 + '%' }} /></div>
      </div>

      <div className="grid2">
        {tiles.map(x => (
          <div key={x.label} className="tile">
            <div className="label">{x.label}</div>
            <div style={{ font: '600 22px var(--mono)' }}>{x.value}<span style={{ fontSize: 12, color: 'var(--mute)', marginLeft: 4 }}>{x.unit}</span></div>
            <div style={{ font: '500 11px var(--mono)', color: x.color }}>{x.delta}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between" style={{ alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600 }}>Volume รายสัปดาห์</span>
          <span style={{ font: '500 11px var(--mono)', color: 'var(--mute)' }}>kg · 8 สัปดาห์</span>
        </div>
        <div className="bars" style={{ height: 72 }}>
          {volBars.map((b, i) => <div key={i} style={{ height: b.h, background: b.bg }} />)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {volBars.map((b, i) => <div key={i} style={{ flex: 1, textAlign: 'center', font: '500 10px var(--mono)', color: 'var(--mute)' }}>{b.label}</div>)}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600 }}>แนวโน้มร่างกาย</div>
        <div className="hscroll">
          {ML.map(([k, l]) => <button key={k} className={'chip' + (k === s.metricKey ? ' on' : '')} onClick={() => set({ metricKey: k })}>{l}</button>)}
        </div>
        <div className="row-between" style={{ alignItems: 'flex-end' }}>
          <div><span style={{ font: '600 26px var(--mono)' }}>{mlast ?? '—'}</span><span style={{ fontSize: 13, color: 'var(--mute)', marginLeft: 4 }}>{munit}</span></div>
          <div style={{ textAlign: 'right', font: '500 11px/1.6 var(--mono)' }}>
            <div style={{ color: wkColor }}>{mp.length > 1 ? sgn(wk) : '—'} vs สัปดาห์ก่อน</div>
            <div style={{ color: 'var(--mute)' }}>{mp.length > 1 ? sgn(tot) : '—'} ตั้งแต่เริ่ม</div>
          </div>
        </div>
        {!mp.length ? (
          <div className="empty-note">ยังไม่มีข้อมูล<br />บันทึก Check-in ในแท็บร่างกายเพื่อเริ่มกราฟ</div>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="mfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
                  <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <line x1="20" x2="300" y1={ch.targetY} y2={ch.targetY} style={{ stroke: 'var(--mute)', strokeDasharray: '4 4', opacity: isW ? 0.7 : 0 }} />
              <path d={ch.area} fill="url(#mfill)" />
              <path d={ch.line} style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }} />
              <circle cx={ch.lx} cy={ch.ly} r="5" style={{ fill: 'var(--bg)', stroke: 'var(--accent)', strokeWidth: 2.5 }} />
            </svg>
            <div className="ticks" style={{ padding: '0 10px' }}>{TICKS.map(w => <span key={w}>{w}</span>)}</div>
            {isW && <div style={{ fontSize: 11, color: 'var(--mute)' }}>เส้นประ = น้ำหนักเป้าหมาย {tgt || '—'} kg</div>}
          </>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600 }}>Strength Progress</div>
        {!hp.length ? (
          <div className="empty-note">ยังไม่มีข้อมูลการยก<br />บันทึก Workout แรกเพื่อเริ่มติดตามความแข็งแรง</div>
        ) : (
          <div className="stack-12">
            <div className="hscroll">
              {exWithData.map(n => <button key={n} className={'chip' + (n === sx ? ' on' : '')} style={{ padding: '0 12px', fontSize: 12 }} onClick={() => set({ strengthEx: n })}>{n}</button>)}
            </div>
            <div className="row-between" style={{ alignItems: 'flex-end' }}>
              <div>
                <div className="label">Top set ล่าสุด</div>
                <span style={{ font: '600 26px var(--mono)' }}>{str.latest}</span><span style={{ fontSize: 13, color: 'var(--mute)', marginLeft: 4 }}>kg</span>
              </div>
              <div style={{ font: '600 13px var(--mono)', color: str.color, background: 'var(--surface2)', padding: '6px 10px', borderRadius: 8 }}>{str.delta}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
              {str.bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, height: '100%' }}>
                  <span style={{ font: '500 9px var(--mono)', color: 'var(--mute)' }}>{b.label}</span>
                  <div style={{ width: '100%', height: b.h, background: b.bg, border: `1px dashed ${b.border}`, boxSizing: 'border-box', borderRadius: '5px 5px 2px 2px', transition: 'height .4s' }} />
                </div>
              ))}
            </div>
            <div className="ticks" style={{ padding: '0 4px' }}>{TICKS.map(w => <span key={w}>{w}</span>)}</div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '6px 16px' }}>
        <div className="cmp-row" style={{ padding: '10px 0', font: '500 10px var(--mono)', color: 'var(--mute)' }}>
          <span>ท่า</span><span>{pi >= 0 ? wl(pi) : '—'}</span><span>{wl(ci)}</span><span>Δ</span>
        </div>
        {!cmpRows.length && <div style={{ padding: '14px 0', fontSize: 13, color: 'var(--mute)' }}>ยังไม่มีท่าที่บันทึกในสัปดาห์นี้</div>}
        {cmpRows.map(r => (
          <div key={r.name} className="cmp-row" style={{ padding: '11px 0', fontSize: 13 }}>
            <span>{r.name}</span>
            <span className="mono mute">{r.prev}</span>
            <span className="mono">{r.cur}</span>
            <span style={{ font: '600 12px var(--mono)', color: r.color }}>{r.delta}</span>
          </div>
        ))}
      </div>
      <button className="btn-ghost" onClick={() => set({ tab: 'body' })}>เปรียบเทียบรูป Progress →</button>
    </div>
  );
}
