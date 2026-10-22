import { useEffect } from 'react';
import { libOf, type Sheet, type Tracker } from '../store';

/** Close on Escape while an overlay is open. */
function useEscape(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, active]);
}

const SHEET_COPY: Record<Sheet['mode'], [string, string, string]> = {
  routine: ['บันทึกโปรแกรม', 'ชื่อโปรแกรม', 'เช่น คุณเอ · Push Day'],
  exercise: ['เพิ่มท่าฝึกใหม่', 'ชื่อท่า', 'เช่น Hip Thrust'],
  metric: ['เพิ่มสัดส่วนที่จะวัด', 'ชื่อสัดส่วน', 'เช่น น่อง, คอ, % ไขมัน'],
  cardio: ['เพิ่มประเภท Cardio', 'ชื่อกิจกรรม', 'เช่น ว่ายน้ำ, กระโดดเชือก']
};

/** Bottom sheet for creating custom exercises (and routines / metrics / cardio types). */
export function CustomSheet({ t, sheet }: { t: Tracker; sheet: Sheet }) {
  const close = () => t.set({ sheet: null });
  useEscape(close);
  const [title, nameLabel, namePh] = SHEET_COPY[sheet.mode];
  const nums: [keyof Sheet, string][] = [['sets', 'Sets'], ['reps', 'Reps'], ['inc', 'เพิ่มต่อสัปดาห์ (kg)'], ['start', 'น้ำหนักเริ่มต้น (kg)']];
  const lib = Object.keys(libOf(t.s.custom));

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={close} />
      <form className="sheet" role="dialog" aria-modal="true" aria-label={title} onSubmit={e => { e.preventDefault(); t.submitSheet(); }}>
        <div className="grabber" />
        <div className="row-between" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
          <button type="button" className="close-x" aria-label="ปิด" onClick={close}>×</button>
        </div>
        <label className="field">
          <span className="label">{nameLabel}</span>
          <input type="text" autoFocus placeholder={namePh} value={sheet.name} onChange={e => t.setSheet({ name: e.target.value, err: '' })}
            style={{ font: '600 18px var(--sans)' }} />
        </label>
        {sheet.mode === 'exercise' && (
          <>
            <div className="grid2">
              {nums.map(([k, l]) => (
                <label key={k} className="field">
                  <span className="label">{l}</span>
                  <input type="number" inputMode="decimal" placeholder={k === 'start' ? 'ไม่บังคับ' : ''} value={sheet[k] as string}
                    onChange={e => t.setSheet({ [k]: e.target.value })} style={{ fontSize: 22 }} />
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.5 }}>ถ้าใส่น้ำหนักเริ่มต้น ระบบจะใช้เป็นค่าอ้างอิงของสัปดาห์ก่อน และเติมน้ำหนักแนะนำให้ทันที</div>
          </>
        )}
        {sheet.mode === 'routine' && (
          <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.5 }}>เก็บท่า จำนวนเซ็ต น้ำหนัก และ reps ที่กรอกไว้ตอนนี้ · ใช้ชื่อเดิมเพื่ออัปเดตโปรแกรม</div>
        )}
        {sheet.mode === 'routine' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lib.map(n => {
              const on = sheet.picks.includes(n);
              return <button type="button" key={n} className={'chip' + (on ? ' on' : '')} style={{ fontSize: 12, padding: '0 12px' }}
                onClick={() => t.setSheet({ picks: on ? sheet.picks.filter(x => x !== n) : [...sheet.picks, n], err: '' })}>{n}</button>;
            })}
          </div>
        )}
        {sheet.mode === 'metric' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div className="seg">{['cm', 'kg', '%', 'mm'].map(u => <button type="button" key={u} className={sheet.unit === u ? 'on' : ''} onClick={() => t.setSheet({ unit: u })}>{u}</button>)}</div>
            <div className="seg">{([[-1, 'ลดลง = ดี'], [1, 'เพิ่มขึ้น = ดี']] as const).map(([d, l]) => <button type="button" key={d} className={sheet.dir === d ? 'on' : ''} onClick={() => t.setSheet({ dir: d })}>{l}</button>)}</div>
          </div>
        )}
        {sheet.err && <div style={{ fontSize: 13, color: 'var(--down)' }}>{sheet.err}</div>}
        <button type="submit" className="btn-primary">{sheet.mode === 'routine' ? `บันทึกโปรแกรม · ${sheet.picks.length} ท่า` : 'เพิ่ม'}</button>
      </form>
    </div>
  );
}

/** First-launch (and later "change week") picker. */
export function WeekPopup({ t }: { t: Tracker }) {
  const { s, set } = t, wp = s.weekPick;
  const close = () => { if (s.weekSet) set({ weekPopup: false }); };
  useEscape(close, s.weekSet);
  const title = s.weekSet ? 'เปลี่ยนสัปดาห์' : 'เริ่มต้นใช้งาน';

  return (
    <div className="modal-wrap">
      <div className="scrim" onClick={close} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        {s.weekSet && <button className="close-x" aria-label="ปิด" onClick={close} style={{ position: 'absolute', top: 10, right: 10 }}>×</button>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '500 11px var(--mono)', color: 'var(--accent)', letterSpacing: '.06em' }}>WEEKLY PROGRESS TRACKER</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--mute)', textWrap: 'pretty' } as React.CSSProperties}>เลือกสัปดาห์ที่คุณกำลังฝึกอยู่ ระบบจะใช้เป็นจุดเริ่มต้นในการเทียบ progress ทุกสัปดาห์</div>
        </div>
        <button className={'w1' + (wp === 1 ? ' on' : '')} aria-pressed={wp === 1} onClick={() => set({ weekPick: 1 })}>
          <span style={{ font: '600 40px/1 var(--mono)', color: 'var(--accent)' }}>01</span>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>สัปดาห์ที่ 1</span>
            <span style={{ fontSize: 12, color: 'var(--mute)' }}>เริ่มต้นใหม่ · ยังไม่มีข้อมูล</span>
          </span>
          <span className={'dot' + (wp === 1 ? ' on' : '')} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="label">หรือ ต่อจากสัปดาห์ที่</div>
          <div className="week-opts">
            {[2, 3, 4, 5, 6, 7, 8].map(n => <button key={n} className={wp === n ? 'on' : ''} aria-pressed={wp === n} onClick={() => set({ weekPick: n })}>{n}</button>)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.5 }}>สัปดาห์ 2–8 จะเติมข้อมูลตัวอย่างของสัปดาห์ก่อนหน้าไว้ให้ดู</div>
        </div>
        {s.weekSet && <div style={{ fontSize: 12, color: 'var(--down)' }}>การเปลี่ยนสัปดาห์จะล้างบันทึกของสัปดาห์ปัจจุบัน</div>}
        <button className="btn-primary" style={{ height: 54, fontSize: 16 }} onClick={t.startWeek}>{wp === 1 ? 'เริ่มสัปดาห์ที่ 1' : `เริ่มที่สัปดาห์ที่ ${wp}`}</button>
      </div>
    </div>
  );
}
