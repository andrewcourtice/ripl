import {
    ref,
    watch,
} from 'vue';

import type {
    Ref,
} from 'vue';

/** The user's theme override: follow the devtools theme, or force light/dark. */
export type ThemePreference = 'auto' | 'dark' | 'light';

/** Persisted panel settings. */
export interface DevtoolsSettings {
    /** The theme override. */
    theme: Ref<ThemePreference>;
    /** Selected-element inspect poll rate, in Hz. */
    pollRate: Ref<number>;
}

const THEME_STORAGE_KEY = 'ripl-devtools:theme';
const POLL_RATE_STORAGE_KEY = 'ripl-devtools:poll-rate';

const THEME_PREFERENCES: ThemePreference[] = [
    'auto',
    'dark',
    'light',
];

/** The selectable inspect poll rates, in Hz. */
export const POLL_RATES = [2, 4, 8];

const DEFAULT_POLL_RATE = 4;

function readTheme(): ThemePreference {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;

    return stored && THEME_PREFERENCES.includes(stored) ? stored : 'auto';
}

function readPollRate(): number {
    const stored = Number.parseInt(localStorage.getItem(POLL_RATE_STORAGE_KEY) ?? '', 10);

    return POLL_RATES.includes(stored) ? stored : DEFAULT_POLL_RATE;
}

let settings: DevtoolsSettings | undefined;

/** Returns the singleton persisted settings for the panel. */
export function useSettings(): DevtoolsSettings {
    if (settings) {
        return settings;
    }

    const theme = ref(readTheme());
    const pollRate = ref(readPollRate());

    watch(theme, value => localStorage.setItem(THEME_STORAGE_KEY, value));
    watch(pollRate, value => localStorage.setItem(POLL_RATE_STORAGE_KEY, value.toString()));

    settings = {
        theme,
        pollRate,
    };

    return settings;
}
