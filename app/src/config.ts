import type { Tab } from './data';

/**
 * App-level options (the "Tweaks" from the design prototype).
 * Override at build time with Vite env vars, e.g. VITE_DEFAULT_TAB=log.
 */
const env = import.meta.env;

export const CONFIG = {
  /** Theme used on first launch, before the user toggles it. */
  theme: (env.VITE_THEME === 'light' ? 'light' : 'dark') as 'dark' | 'light',
  /** Tab shown when the app opens. */
  defaultTab: (['dash', 'log', 'body', 'profile'].includes(env.VITE_DEFAULT_TAB) ? env.VITE_DEFAULT_TAB : 'dash') as Tab,
  /** Suggested weekly increase for exercises whose default step is 2.5 kg. */
  weightIncrement: Number(env.VITE_WEIGHT_INCREMENT) || 2.5,
  /** Show the week picker on every launch (useful for demos). */
  alwaysShowWelcome: env.VITE_ALWAYS_SHOW_WELCOME === 'true'
};
