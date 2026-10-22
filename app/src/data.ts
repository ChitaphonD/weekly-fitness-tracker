// Seed data and static configuration for the tracker.
// Weeks are 1-based in the UI (W01–W08) and 0-based in arrays.

export const WEEKS = 8;
export const TICKS = Array.from({ length: WEEKS }, (_, i) => `W${i + 1}`);
export const TODAY = new Date('2026-10-22');
export const TODAY_LABEL = 'พฤ. 22 ต.ค.';
export const WEEK_RANGE_LABEL = '19–25 ต.ค.';

export interface LibEntry { reps: number; sets: number; inc: number; kg?: number[] }

/** Built-in exercise library with 8 weeks of sample top-set weights. */
export const LIB: Record<string, LibEntry> = {
  'Bench Press': { kg: [60, 62.5, 62.5, 65, 65, 67.5, 67.5], reps: 8, sets: 3, inc: 2.5 },
  'Incline DB Press': { kg: [20, 20, 22, 22, 22, 24, 24], reps: 10, sets: 3, inc: 2 },
  'Cable Fly': { kg: [12.5, 12.5, 15, 15, 15, 17.5, 17.5], reps: 12, sets: 3, inc: 2.5 },
  'Triceps Pushdown': { kg: [20, 22.5, 22.5, 25, 25, 25, 27.5], reps: 12, sets: 3, inc: 2.5 },
  'Squat': { kg: [80, 82.5, 85, 85, 87.5, 90, 92.5, 95], reps: 6, sets: 4, inc: 2.5 },
  'Romanian Deadlift': { kg: [70, 70, 72.5, 75, 75, 77.5, 80, 80], reps: 8, sets: 3, inc: 2.5 },
  'Leg Press': { kg: [140, 150, 150, 160, 160, 170, 170, 180], reps: 10, sets: 3, inc: 10 },
  'Deadlift': { kg: [100, 102.5, 105, 107.5, 110, 112.5, 115], reps: 5, sets: 3, inc: 5 },
  'Lat Pulldown': { kg: [50, 52.5, 52.5, 55, 55, 57.5, 57.5], reps: 10, sets: 3, inc: 2.5 },
  'Barbell Row': { kg: [55, 57.5, 57.5, 60, 60, 62.5, 62.5], reps: 8, sets: 3, inc: 2.5 }
};

export interface TplSet { kg: string; reps: string }
/** `sets` is saved for routines made from a logged session, so applying them restores kg/reps per set. */
export interface Template { id: string; name: string; ex: string[]; sets?: Record<string, TplSet[]> }

export const TPLS: Template[] = [
  { id: 'chest', name: 'Chest Day', ex: ['Bench Press', 'Incline DB Press', 'Cable Fly', 'Triceps Pushdown'] },
  { id: 'leg', name: 'Leg Day', ex: ['Squat', 'Romanian Deadlift', 'Leg Press'] },
  { id: 'pull', name: 'Pull Day', ex: ['Deadlift', 'Lat Pulldown', 'Barbell Row'] }
];

export const METRICS: Record<string, number[]> = {
  weight: [78.4, 78.1, 77.6, 77.5, 77.0, 76.7, 76.3],
  chest: [100, 100, 100.5, 101, 101, 101.5, 102],
  waist: [86, 85.5, 85, 84.5, 84, 83.5, 83],
  hip: [98, 98, 97.5, 97.5, 97, 97, 96.5],
  arm: [34, 34, 34.5, 34.5, 35, 35, 35.5],
  thigh: [56, 56, 56.5, 56.5, 57, 57, 57.5]
};

/** [key, label, unit, direction] — direction −1 means "lower is better". */
export type MetricDef = [string, string, string, number];

export const MLAB: MetricDef[] = [
  ['weight', 'น้ำหนัก', 'kg', -1], ['chest', 'อก', 'cm', 1], ['waist', 'เอว', 'cm', -1],
  ['hip', 'สะโพก', 'cm', -1], ['arm', 'แขน', 'cm', 1], ['thigh', 'ขา', 'cm', 1]
];

export interface WeekSummary { w: number; vol: number; min: number; kcal: number }

export const SUMMARY: WeekSummary[] = [
  { w: 3, vol: 12400, min: 190, kcal: 1650 }, { w: 4, vol: 14100, min: 228, kcal: 1980 }, { w: 3, vol: 13250, min: 205, kcal: 1720 },
  { w: 4, vol: 15600, min: 246, kcal: 2140 }, { w: 4, vol: 16050, min: 252, kcal: 2210 }, { w: 3, vol: 15200, min: 236, kcal: 1960 },
  { w: 4, vol: 17300, min: 268, kcal: 2390 }
];

export const CARDIO_TYPES = ['วิ่ง', 'ปั่นจักรยาน', 'เดินเร็ว'];

export interface CardioEntry { type: string; km: string; min: string; kcal: string; day: string }

export const DEMO_CARDIO: CardioEntry[] = [
  { type: 'วิ่ง', km: '5.2', min: '29', kcal: '340', day: 'อ. 20 ต.ค.' },
  { type: 'ปั่นจักรยาน', km: '14', min: '35', kcal: '310', day: 'ส. 17 ต.ค.' }
];

export const GOALS: [string, string][] = [
  ['ลดน้ำหนัก', 'เน้น calorie deficit + cardio'],
  ['สร้างกล้ามเนื้อ', 'เน้น progressive overload'],
  ['เพิ่มความอึด', 'เน้น cardio และ volume']
];

export const SEXES = ['ชาย', 'หญิง', 'อื่นๆ'];

export const ICONS = {
  dash: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  log: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
  body: 'M12 4a2 2 0 1 0 0 .01M8 21l1-8-3-4 6 1 6-1-3 4 1 8',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'
};

export type Tab = keyof typeof ICONS;
