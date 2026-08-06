import {
    ref,
    watch,
} from 'vue';

import type {
    Ref,
} from 'vue';

/** The panel's top-level views. */
export type PanelTab = 'elements' | 'events';

/** The panel's active-tab state. */
export interface UseTabs {
    /** The currently active tab, persisted across panel sessions. */
    activeTab: Ref<PanelTab>;
}

const STORAGE_KEY = 'ripl-devtools:active-tab';

const TABS: PanelTab[] = [
    'elements',
    'events',
];

function readTab(): PanelTab {
    const stored = localStorage.getItem(STORAGE_KEY) as PanelTab | null;

    return stored && TABS.includes(stored) ? stored : 'elements';
}

let tabs: UseTabs | undefined;

/** Returns the singleton active-tab state for the panel. */
export function useTabs(): UseTabs {
    if (tabs) {
        return tabs;
    }

    const activeTab = ref(readTab());

    watch(activeTab, value => localStorage.setItem(STORAGE_KEY, value));

    tabs = {
        activeTab,
    };

    return tabs;
}
