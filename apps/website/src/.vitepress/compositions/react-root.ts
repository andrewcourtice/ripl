import {
    createElement,
} from 'react';

import {
    createRoot,
} from 'react-dom/client';

import type {
    ComponentType,
} from 'react';

import type {
    Root,
} from 'react-dom/client';

import {
    onBeforeUnmount,
    onMounted,
    watchEffect,
} from 'vue';

import type {
    Ref,
} from 'vue';

/**
 * Mounts a React component into a Vue-owned element and re-renders it whenever the reactive props
 * change, so a React demo can sit inside the site's own example chrome.
 *
 * @param mount - The element to render the React tree into.
 * @param component - The React component to render.
 * @param props - Reads the props to render with; re-run whenever its reactive sources change.
 */
export function useReactRoot<TProps extends Record<string, unknown>>(
    mount: Ref<HTMLElement | undefined>,
    component: ComponentType<TProps>,
    props: () => TProps
): void {
    let root: Root | undefined;

    onMounted(() => {
        if (!mount.value) {
            return;
        }

        root = createRoot(mount.value);

        watchEffect(() => root?.render(createElement(component, props())));
    });

    onBeforeUnmount(() => {
        root?.unmount();
        root = undefined;
    });
}
