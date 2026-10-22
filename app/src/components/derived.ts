import { series } from '../format';
import type { State } from '../store';

/** Most recent recorded body weight up to the current week. */
export const latestWeight = (s: State): number | null => {
  const pts = series(s.metrics.weight, s.week - 1);
  return pts.length ? pts[pts.length - 1][1] : null;
};

/** Target weight from the profile, falling back to the latest weight. */
export const targetWeight = (s: State): number => parseFloat(s.profile.target) || latestWeight(s) || 0;
