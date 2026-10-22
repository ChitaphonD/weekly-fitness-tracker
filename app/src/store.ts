import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from './config';
import {
  CARDIO_TYPES, DEMO_CARDIO, LIB, METRICS, MLAB, TODAY_LABEL,
  type CardioEntry, type LibEntry, type MetricDef, type Tab, type Template, type WeekSummary
} from './data';
import { clone, fmt } from './format';

export type Theme = 'dark' | 'light';
export type Series = (number | null)[];

export interface SetRow { kg: string; reps: string; done: boolean }
export interface SessionEx { name: string; prev: number | null; rpe: number | null; note: string; sets: SetRow[] }

export interface CustomEx { sets: string; reps: string; inc: string; start: string }
export interface Custom { ex: Record<string, CustomEx>; tpls: Template[]; metrics: MetricDef[]; cardio: string[] }

export interface Profile { height: string; birth: string; sex: string; goal: string; target: string; freq: string }

/** Everything that belongs to the currently selected week. */
export interface WeekData {
  week: number;
  hist: Record<string, Series>;
  metrics: Record<string, Series>;
  cur: WeekSummary;
  cardioLog: CardioEntry[];
  cmpA: number;
  cmpB: number;
  session: SessionEx[];
  tpl: string | null;
  checked: boolean;
  body: Record<string, string>;
  strengthEx: string;
  metricKey: string;
}

export type SheetMode = 'exercise' | 'routine' | 'metric' | 'cardio';
export interface Sheet {
  mode: SheetMode; name: string; unit: string; dir: number;
  sets: string; reps: string; inc: string; start: string; picks: string[]; err: string;
}

export interface UiState {
  tab: Tab;
  theme: Theme;
  logMode: 'weight' | 'cardio';
  showPicker: boolean;
  cardio: { type: string; km: string; min: string; kcal: string };
  sheet: Sheet | null;
  cmpMode: 'slider' | 'side';
  pos: number;
  toast: string;
  weekPopup: boolean;
  weekPick: number;
  weekSet: boolean;
}

export type State = UiState & WeekData & { custom: Custom; profile: Profile };

// ---- persistence -----------------------------------------------------------

const CKEY = 'wft-custom-v1';
const WKEY = 'wft-week-v1';
const DKEY = 'wft-data-v1';
const TKEY = 'wft-theme-v1';

const read = <T,>(key: string): T | null => {
  try { const raw = localStorage.getItem(key); return raw == null ? null : JSON.parse(raw) as T; } catch { return null; }
};
const write = (key: string, v: unknown) => { try { localStorage.setItem(key, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* storage unavailable */ } };

const EMPTY_C: Custom = { ex: {}, tpls: [], metrics: [], cardio: [] };
const DEFAULT_PROFILE: Profile = { height: '175', birth: '1995-04-12', sex: 'ชาย', goal: 'ลดน้ำหนัก', target: '72', freq: '4' };

export const buildWeek = (N: number): WeekData => {
  const hist: Record<string, Series> = {}, metrics: Record<string, Series> = {};
  Object.entries(LIB).forEach(([k, v]) => {
    const a: Series = Array(8).fill(null);
    for (let i = 0; i < N - 1; i++) a[i] = v.kg?.[i] ?? null;
    if (N === 8 && v.kg?.[7] != null) a[7] = v.kg[7];
    hist[k] = a;
  });
  Object.entries(METRICS).forEach(([k, v]) => {
    const a: Series = Array(8).fill(null);
    for (let i = 0; i < N - 1; i++) a[i] = v[i];
    metrics[k] = a;
  });
  return {
    week: N, hist, metrics,
    cur: N === 8 ? { w: 2, vol: 9850, min: 118, kcal: 820 } : { w: 0, vol: 0, min: 0, kcal: 0 },
    cardioLog: N === 1 ? [] : DEMO_CARDIO.slice(), cmpA: 0, cmpB: Math.max(0, N - 2),
    session: [], tpl: null, checked: false, body: {}, strengthEx: 'Bench Press', metricKey: 'weight'
  };
};

const WEEK_FIELDS: (keyof WeekData)[] = ['week', 'hist', 'metrics', 'cur', 'cardioLog', 'cmpA', 'cmpB', 'session', 'tpl', 'checked', 'body', 'strengthEx', 'metricKey'];

const initState = (): State => {
  const wk = Number(read<number>(WKEY));
  const week0 = wk >= 1 && wk <= 8 ? wk : null;
  const saved = read<{ week: Partial<WeekData>; profile: Profile }>(DKEY);
  const weekData = week0 && saved?.week?.week === week0 ? { ...buildWeek(week0), ...saved.week } : buildWeek(week0 || 1);
  const theme = read<Theme>(TKEY);
  return {
    tab: CONFIG.defaultTab, theme: theme === 'light' || theme === 'dark' ? theme : CONFIG.theme, logMode: 'weight',
    showPicker: false, cardio: { type: 'วิ่ง', km: '', min: '', kcal: '' },
    custom: { ...EMPTY_C, ...read<Partial<Custom>>(CKEY) }, sheet: null, cmpMode: 'slider', pos: 50,
    profile: { ...DEFAULT_PROFILE, ...saved?.profile },
    toast: '', ...weekData,
    weekPopup: !week0 || CONFIG.alwaysShowWelcome, weekPick: week0 || 1, weekSet: !!week0
  };
};

// ---- derived helpers -------------------------------------------------------

export const libOf = (custom: Custom): Record<string, LibEntry> => {
  const o: Record<string, LibEntry> = { ...LIB };
  Object.entries(custom.ex).forEach(([n, e]) => { o[n] = { reps: +e.reps || 10, sets: +e.sets || 3, inc: +e.inc || 2.5 }; });
  return o;
};

export const mlabOf = (custom: Custom): MetricDef[] => [...MLAB, ...custom.metrics];

const prevOf = (s: State, name: string): number | null => {
  const h = s.hist[name] || [], ci = s.week - 1;
  for (let i = ci - 1; i >= 0; i--) if (h[i] != null) return h[i];
  const c = s.custom.ex[name];
  return c && +c.start ? +c.start : null;
};

const incOf = (s: State, name: string) => {
  const L = libOf(s.custom)[name];
  return CONFIG.weightIncrement && L.inc === 2.5 ? CONFIG.weightIncrement : L.inc;
};

/** New session entry, pre-filled with last week's weight + the weekly increment. */
const mkEx = (s: State, name: string): SessionEx => {
  const L = libOf(s.custom)[name], prev = prevOf(s, name), sugg = prev != null ? prev + incOf(s, name) : '';
  return { name, prev, rpe: null, note: '', sets: Array.from({ length: L.sets }, () => ({ kg: String(sugg), reps: String(L.reps), done: false })) };
};

// ---- hook ------------------------------------------------------------------

export function useTracker() {
  const [s, setS] = useState<State>(initState);
  // Actions read and write through this ref so they can run side effects
  // (toasts, storage) outside of React state updaters.
  const ref = useRef(s);
  const toastTimer = useRef<number>();

  const update = useCallback((fn: (st: State) => State) => { ref.current = fn(ref.current); setS(ref.current); }, []);
  const set = useCallback((patch: Partial<State> | ((st: State) => Partial<State>)) =>
    update(st => ({ ...st, ...(typeof patch === 'function' ? patch(st) : patch) })), [update]);

  // Deferred so it can be called from inside an `update` without being overwritten.
  const showToast = useCallback((t: string) => {
    queueMicrotask(() => set({ toast: t }));
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => set({ toast: '' }), 2400);
  }, [set]);

  // Persist the active week, profile and theme so a reload mid-workout loses nothing.
  useEffect(() => {
    if (!s.weekSet) return;
    const week = Object.fromEntries(WEEK_FIELDS.map(k => [k, s[k]]));
    write(DKEY, { week, profile: s.profile });
  }, [s]);
  useEffect(() => { write(TKEY, s.theme); }, [s.theme]);

  const actions = useMemo(() => {
    const persistCustom = (c: Custom) => write(CKEY, c);
    const updEx = (i: number, fn: (e: SessionEx) => void) =>
      set(st => { const session = clone(st.session); fn(session[i]); return { session }; });
    const setSheet = (patch: Partial<Sheet>) => set(st => ({ sheet: st.sheet && { ...st.sheet, ...patch } }));

    return {
      set, showToast, updEx, setSheet,

      startWeek: () => update(st => {
        const N = st.weekPick;
        write(WKEY, String(N));
        showToast(N === 1 ? 'เริ่มสัปดาห์ที่ 1 แล้ว · ไปที่แท็บบันทึกเพื่อเริ่มฝึก' : `เริ่มที่สัปดาห์ที่ ${N}`);
        return { ...st, ...buildWeek(N), weekPopup: false, weekSet: true, tab: 'dash' };
      }),

      addExercise: (name: string) => set(st => ({ session: [...st.session, mkEx(st, name)], showPicker: false })),
      applyTemplate: (t: Template) => set(st => ({ tpl: t.id, session: t.ex.map(n => mkEx(st, n)), showPicker: false })),
      removeExercise: (i: number) => set(st => ({ session: st.session.filter((_, j) => j !== i) })),

      saveSession: () => update(st => {
        let vol = 0, done = 0;
        const hist = clone(st.hist), ci = st.week - 1;
        st.session.forEach(ex => {
          const d = ex.sets.filter(x => x.done); if (!d.length) return;
          done += d.length; d.forEach(x => { vol += (+x.kg || 0) * (+x.reps || 0); });
          const top = Math.max(...d.map(x => +x.kg || 0));
          hist[ex.name] = hist[ex.name] || Array(8).fill(null);
          hist[ex.name][ci] = Math.max(hist[ex.name][ci] || 0, top);
        });
        if (!done) { showToast('ติ๊ก ✓ เซ็ตที่ทำเสร็จก่อนบันทึก'); return st; }
        const first = st.session.find(e => e.sets.some(x => x.done))!.name;
        showToast(`บันทึกแล้ว · ${done} เซ็ต · ${fmt(vol)} kg`);
        return { ...st, hist, session: [], tpl: null, strengthEx: first, cur: { w: st.cur.w + 1, vol: st.cur.vol + vol, min: st.cur.min + done * 3, kcal: st.cur.kcal + done * 9 } };
      }),

      saveCardio: () => update(st => {
        const c = st.cardio;
        if (!(+c.km) || !(+c.min)) { showToast('กรอกระยะทางและเวลาก่อน'); return st; }
        const kcal = +c.kcal || Math.round(+c.km * 62);
        showToast(`บันทึก ${c.type} ${c.km} km แล้ว`);
        return {
          ...st, cardio: { ...c, km: '', min: '', kcal: '' },
          cardioLog: [{ ...c, kcal: String(kcal), day: TODAY_LABEL }, ...st.cardioLog],
          cur: { ...st.cur, w: st.cur.w + 1, min: st.cur.min + +c.min, kcal: st.cur.kcal + kcal }
        };
      }),

      saveBody: () => update(st => {
        const m = clone(st.metrics), ci = st.week - 1;
        mlabOf(st.custom).forEach(([k]) => {
          const v = parseFloat(st.body[k]);
          m[k] = m[k] || Array(8).fill(null);
          m[k][ci] = isNaN(v) ? (ci > 0 ? m[k][ci - 1] : null) : v;
        });
        showToast(`บันทึกสัดส่วนสัปดาห์ที่ ${st.week} แล้ว`);
        return { ...st, metrics: m, checked: true };
      }),

      openSheet: (mode: SheetMode) => set({ sheet: { mode, name: '', unit: 'cm', dir: -1, sets: '3', reps: '10', inc: '2.5', start: '', picks: [], err: '' } }),

      submitSheet: () => update(st => {
        const sh = st.sheet; if (!sh) return st;
        const name = sh.name.trim(), c = clone(st.custom);
        const err = (m: string) => ({ ...st, sheet: { ...sh, err: m } });
        if (!name) return err('กรุณาตั้งชื่อ');
        let next: State;
        if (sh.mode === 'exercise') {
          if (libOf(st.custom)[name]) return err('มีท่านี้อยู่แล้ว');
          c.ex[name] = { sets: sh.sets, reps: sh.reps, inc: sh.inc, start: sh.start };
          next = { ...st, custom: c, sheet: null };
          if (st.tab === 'log') next = { ...next, session: [...next.session, mkEx(next, name)], showPicker: false };
        } else if (sh.mode === 'routine') {
          if (!sh.picks.length) return err('เลือกอย่างน้อย 1 ท่า');
          c.tpls.push({ id: 'c' + Date.now(), name, ex: sh.picks });
          next = { ...st, custom: c, sheet: null };
        } else if (sh.mode === 'metric') {
          if (mlabOf(st.custom).some(m => m[1] === name)) return err('มีสัดส่วนนี้อยู่แล้ว');
          c.metrics.push(['c' + Date.now(), name, sh.unit, sh.dir]);
          next = { ...st, custom: c, sheet: null };
        } else {
          if ([...CARDIO_TYPES, ...c.cardio].includes(name)) return err('มีประเภทนี้อยู่แล้ว');
          c.cardio.push(name);
          next = { ...st, custom: c, sheet: null, cardio: { ...st.cardio, type: name } };
        }
        persistCustom(c);
        showToast(`เพิ่ม “${name}” แล้ว`);
        return next;
      }),

      removeCustom: (kind: 'ex' | 'tpl' | 'metric' | 'cardio', key: string) => update(st => {
        const c = clone(st.custom);
        if (kind === 'ex') { delete c.ex[key]; c.tpls.forEach(t => { t.ex = t.ex.filter(n => n !== key); }); c.tpls = c.tpls.filter(t => t.ex.length); }
        if (kind === 'tpl') c.tpls = c.tpls.filter(t => t.id !== key);
        if (kind === 'metric') c.metrics = c.metrics.filter(m => m[0] !== key);
        if (kind === 'cardio') c.cardio = c.cardio.filter(x => x !== key);
        persistCustom(c);
        const hist = { ...st.hist }; if (kind === 'ex') delete hist[key];
        return {
          ...st, custom: c, hist, session: kind === 'ex' ? st.session.filter(e => e.name !== key) : st.session,
          metricKey: st.metricKey === key ? 'weight' : st.metricKey, strengthEx: st.strengthEx === key ? 'Bench Press' : st.strengthEx,
          cardio: kind === 'cardio' && st.cardio.type === key ? { ...st.cardio, type: 'วิ่ง' } : st.cardio
        };
      })
    };
  }, [set, update, showToast]);

  return { s, ...actions };
}

export type Tracker = ReturnType<typeof useTracker>;
