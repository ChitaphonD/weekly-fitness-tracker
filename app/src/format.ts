export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Signed number with a true minus sign; ± for zero. Trailing ".0" is dropped. */
export const sgn = (n: number, d = 1) =>
  (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toFixed(d).replace(/\.0+$/, '');

/** Week label, 0-based index → "W01". */
export const wl = (i: number) => 'W' + String(i + 1).padStart(2, '0');

/** Non-null points of a weekly series up to and including index `upto`. */
export const series = (arr: (number | null)[] | undefined, upto: number): [number, number][] =>
  (arr || []).slice(0, upto + 1).map((v, i) => [i, v] as [number, number | null])
    .filter((p): p is [number, number] => p[1] != null);
