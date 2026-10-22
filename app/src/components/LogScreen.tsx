import { CARDIO_TYPES, TODAY_LABEL, TPLS } from '../data';
import { fmt, sgn } from '../format';
import { libOf, type Tracker } from '../store';

export function LogScreen({ t }: { t: Tracker }) {
  const { s, set } = t;
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">{TODAY_LABEL}</div>
        <div className="h1">บันทึกการฝึก</div>
      </div>
      <div className="mode-switch">
        {([['weight', 'Weight Training'], ['cardio', 'Cardio']] as const).map(([k, l]) => (
          <button key={k} className={s.logMode === k ? 'on' : ''} onClick={() => set({ logMode: k })}>{l}</button>
        ))}
      </div>
      {s.logMode === 'weight' ? <WeightLog t={t} /> : <CardioLog t={t} />}
    </div>
  );
}

function WeightLog({ t }: { t: Tracker }) {
  const { s, set, updEx } = t;
  const LB = libOf(s.custom);
  const inSession = s.session.map(e => e.name);
  const sessionVol = s.session.reduce((a, ex) => a + ex.sets.filter(x => x.done).reduce((b, x) => b + (+x.kg || 0) * (+x.reps || 0), 0), 0);
  const customEx = Object.entries(s.custom.ex);

  return (
    <div className="stack-12">
      <div className="label">Quick Routine</div>
      <div className="hscroll" style={{ gap: 8, scrollPadding: '0 16px', margin: '0 -12px 0 -16px' }}>
        {[...TPLS, ...s.custom.tpls].map(tp => (
          <button key={tp.id} className={'tpl' + (s.tpl === tp.id ? ' on' : '')} onClick={() => t.applyTemplate(tp)}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{tp.name}</span>
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>{tp.ex.length} ท่า</span>
          </button>
        ))}
      </div>

      {!s.session.length && (
        <div style={{ padding: '28px 16px', border: '1px dashed var(--line)', borderRadius: 16, textAlign: 'center', color: 'var(--mute)', fontSize: 13, lineHeight: 1.6 }}>
          เลือก Routine ด้านบน หรือเพิ่มท่าเอง<br />ระบบจะดึงน้ำหนัก/Reps ของสัปดาห์ก่อนมาให้อัตโนมัติ
        </div>
      )}

      {s.session.map((ex, i) => {
        const L = LB[ex.name] || { reps: '', sets: '' };
        const top = Math.max(...ex.sets.map(x => +x.kg || 0)), d = ex.prev != null ? top - ex.prev : null;
        const dLabel = d == null ? 'สัปดาห์แรก · ใช้เป็น baseline' : d > 0 ? `${sgn(d)} kg จากสัปดาห์ก่อน` : d === 0 ? 'เท่าเดิม · ลองเพิ่ม 1 rep' : `${sgn(d)} kg (deload)`;
        const dColor = d == null ? 'var(--mute)' : d > 0 ? 'var(--up)' : d === 0 ? 'var(--mute)' : 'var(--down)';
        return (
          <div key={ex.name} className="ex-card">
            <div className="row-between" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{ex.name}</div>
                <div style={{ font: '500 11px var(--mono)', color: 'var(--mute)', marginTop: 3 }}>
                  สัปดาห์ก่อน · {ex.prev != null ? `${ex.prev} kg × ${L.reps} × ${L.sets} เซ็ต` : 'ท่าใหม่ · ยังไม่มีข้อมูล'}
                </div>
              </div>
              <button aria-label={`ลบ ${ex.name}`} onClick={() => t.removeExercise(i)} style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: 'var(--mute)', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div className="row-between" style={{ alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 10, padding: '8px 10px', fontSize: 12 }}>
              <span className="mute">Progressive overload</span>
              <span style={{ font: '600 12px var(--mono)', color: dColor }}>{dLabel}</span>
            </div>
            <div className="set-grid" style={{ font: '500 10px var(--mono)', color: 'var(--mute)', padding: '0 2px' }}><span>SET</span><span>KG</span><span>REPS</span><span /></div>
            {ex.sets.map((st, j) => (
              <div key={j} className="set-grid" style={{ opacity: st.done ? 1 : 0.92 }}>
                <span style={{ font: '600 13px var(--mono)', color: 'var(--mute)', textAlign: 'center' }}>{j + 1}</span>
                <input className="set-input" type="number" inputMode="decimal" aria-label={`เซ็ต ${j + 1} น้ำหนัก`} value={st.kg}
                  onChange={e => { const v = e.target.value; updEx(i, x => { x.sets[j].kg = v; }); }} />
                <input className="set-input" type="number" inputMode="numeric" aria-label={`เซ็ต ${j + 1} จำนวนครั้ง`} value={st.reps}
                  onChange={e => { const v = e.target.value; updEx(i, x => { x.sets[j].reps = v; }); }} />
                <button className={'check' + (st.done ? ' on' : '')} aria-pressed={st.done} aria-label={`เซ็ต ${j + 1} เสร็จ`}
                  onClick={() => updEx(i, x => { x.sets[j].done = !x.sets[j].done; })}>✓</button>
              </div>
            ))}
            <button onClick={() => updEx(i, x => { x.sets.push({ ...x.sets[x.sets.length - 1], done: false }); })}
              style={{ height: 38, borderRadius: 10, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--mute)', font: '500 13px var(--sans)', cursor: 'pointer' }}>+ เพิ่มเซ็ต</button>
            <div className="row-between" style={{ fontSize: 12, color: 'var(--mute)' }}><span>RPE · ความเหนื่อย</span><span className="mono">{ex.rpe ? `${ex.rpe}/10` : '—'}</span></div>
            <div className="rpe">
              {Array.from({ length: 10 }, (_, r) => r + 1).map(n => (
                <button key={n} className={ex.rpe === n ? 'on' : ''} onClick={() => updEx(i, x => { x.rpe = n; })}>{n}</button>
              ))}
            </div>
            <input className="note-input" type="text" placeholder="Notes เช่น ฟอร์มดี, ไหล่ตึงนิดหน่อย" value={ex.note}
              onChange={e => { const v = e.target.value; updEx(i, x => { x.note = v; }); }} />
          </div>
        );
      })}

      <button className="btn-dashed" onClick={() => set({ showPicker: !s.showPicker })}>+ เพิ่มท่า</button>
      {s.showPicker && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button onClick={() => t.openSheet('exercise')} style={{ height: 36, padding: '0 14px', borderRadius: 99, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', font: '600 12px var(--sans)', cursor: 'pointer' }}>+ สร้างท่าใหม่</button>
            {Object.keys(LB).filter(n => !inSession.includes(n)).map(n => (
              <button key={n} className="pick-chip" onClick={() => t.addExercise(n)}>{n}</button>
            ))}
          </div>
          {customEx.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--mute)', padding: '2px 0 4px' }}>ท่าที่สร้างเอง</div>
              {customEx.map(([n, e]) => (
                <div key={n} className="row-between" style={{ alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                    <div style={{ font: '500 10px var(--mono)', color: 'var(--mute)' }}>{`${e.sets}×${e.reps} · +${e.inc} kg/สัปดาห์`}</div>
                  </div>
                  <button onClick={() => t.removeCustom('ex', n)} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--down)', font: '500 12px var(--sans)', cursor: 'pointer' }}>ลบ</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {s.session.length > 0 && (
        <button className="btn-primary" onClick={t.saveSession}>บันทึก Workout · {fmt(sessionVol)} kg</button>
      )}
    </div>
  );
}

function CardioLog({ t }: { t: Tracker }) {
  const { s, set } = t, cc = s.cardio;
  const setC = (k: 'km' | 'min' | 'kcal') => (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; set(st => ({ cardio: { ...st.cardio, [k]: v } })); };
  const paceN = +cc.km && +cc.min ? +cc.min / +cc.km : 0;
  let pace = '–:––';
  if (paceN) {
    let m = Math.floor(paceN), sec = Math.round((paceN % 1) * 60);
    if (sec === 60) { m += 1; sec = 0; }
    pace = `${m}:${String(sec).padStart(2, '0')}`;
  }
  const fields = [
    { k: 'km' as const, label: 'ระยะทาง (km)', ph: '0.0' },
    { k: 'min' as const, label: 'เวลา (min)', ph: '0' },
    { k: 'kcal' as const, label: 'Calories (kcal)', ph: +cc.km ? String(Math.round(+cc.km * 62)) : 'auto' }
  ];
  return (
    <div className="stack-12">
      <div style={{ display: 'flex', gap: 6 }}>
        {[...CARDIO_TYPES, ...s.custom.cardio].map(ty => (
          <button key={ty} className={'chip' + (cc.type === ty ? ' on' : '')} style={{ flex: 1, height: 40 }}
            onClick={() => set(st => ({ cardio: { ...st.cardio, type: ty } }))}>{ty}</button>
        ))}
      </div>
      <div className="grid2">
        {fields.map(f => (
          <label key={f.k} className="field">
            <span className="label">{f.label}</span>
            <input type="number" inputMode="decimal" placeholder={f.ph} value={cc[f.k]} onChange={setC(f.k)} />
          </label>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface2)', borderRadius: 14, padding: 12 }}>
          <span className="label">Pace</span>
          <span style={{ font: '600 24px var(--mono)' }}>{pace}</span>
        </div>
      </div>
      <button className="btn-primary" onClick={t.saveCardio}>บันทึก Cardio</button>
      <div className="label" style={{ marginTop: 6 }}>ล่าสุด</div>
      {s.cardioLog.map((c, i) => (
        <div key={i} className="row-between" style={{ alignItems: 'center', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{c.type}</div><div style={{ fontSize: 11, color: 'var(--mute)' }}>{c.day}</div></div>
          <div style={{ font: '500 12px/1.6 var(--mono)', textAlign: 'right' }}>{c.km} km · {c.min} min<br /><span className="mute">{c.kcal} kcal</span></div>
        </div>
      ))}
    </div>
  );
}
