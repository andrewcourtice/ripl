import {
    computed,
    watchEffect,
} from 'vue';

import type {
    ComputedRef,
} from 'vue';

import {
    useSettings,
} from './use-settings';

/** The concrete theme applied to the panel. */
export type ResolvedTheme = 'dark' | 'light';

/** Handles returned by {@link useTheme}. */
export interface UseTheme {
    /** The theme currently applied, after resolving the `auto` preference. */
    resolvedTheme: ComputedRef<ResolvedTheme>;
}

function getDevtoolsTheme(): ResolvedTheme {
    // chrome.devtools is absent outside a devtools panel (e.g. unit tests).
    if (typeof chrome !== 'undefined' && chrome.devtools?.panels?.themeName === 'dark') {
        return 'dark';
    }

    return 'light';
}

/** Resolves the effective theme from settings and applies it to the document root. */
export function useTheme(): UseTheme {
    const settings = useSettings();

    const resolvedTheme = computed<ResolvedTheme>(() => {
        if (settings.theme.value === 'auto') {
            return getDevtoolsTheme();
        }

        return settings.theme.value;
    });

    watchEffect(() => {
        document.documentElement.dataset.theme = resolvedTheme.value;
    });

    return {
        resolvedTheme,
    };
}
