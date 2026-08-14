import {
    objectForEach,
} from '@ripl/utilities';

import type {
    App,
    Component,
} from 'vue';

/**
 * Registers components on an app, skipping any name already taken.
 *
 * The guard is what lets the Ripl plugins compose. Each returns a fresh object, so Vue's own
 * plugin de-duplication — which is by object identity — never fires, and an adapter plugin that
 * installs the core components would otherwise re-register every one of them and warn for each.
 *
 * @param app - The app to register on.
 * @param components - The components to register, keyed by the name to register them under.
 */
export function registerComponents(app: App, components: Record<string, unknown>): void {
    objectForEach(components, (name, component) => {
        if (!app.component(name as string)) {
            app.component(name as string, component as Component);
        }
    });
}
