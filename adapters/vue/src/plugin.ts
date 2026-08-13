import {
    objectForEach,
} from '@ripl/utilities';

import {
    RiplContext,
} from './components/context';

import {
    RiplArc,
    RiplCircle,
    RiplEllipse,
    RiplGroup,
    RiplImage,
    RiplLine,
    RiplPath,
    RiplPolygon,
    RiplPolyline,
    RiplRect,
    RiplText,
} from './components/elements';

import {
    RiplRenderer,
} from './components/renderer';

import {
    RiplScene,
} from './components/scene';

import {
    RiplTransition,
} from './components/transition';

import type {
    Component,
    Plugin,
} from 'vue';

/** Every component the plugin registers, keyed by the name it is registered under. */
const COMPONENTS: Record<string, unknown> = {
    RiplArc,
    RiplCircle,
    RiplContext,
    RiplEllipse,
    RiplGroup,
    RiplImage,
    RiplLine,
    RiplPath,
    RiplPolygon,
    RiplPolyline,
    RiplRect,
    RiplRenderer,
    RiplScene,
    RiplText,
    RiplTransition,
};

/**
 * Creates the Vue plugin that registers every Ripl component globally, so templates can use
 * `<ripl-circle>` and `<RiplCircle>` without importing them.
 *
 * Components can equally be imported one at a time; the plugin is a convenience, not a requirement.
 *
 * @returns A plugin to pass to `app.use()`.
 * @example
 * import { createRipl } from '@ripl/vue';
 *
 * createApp(App).use(createRipl()).mount('#app');
 */
export function createRipl(): Plugin {
    return {
        install(app) {
            objectForEach(COMPONENTS, (name, component) => {
                app.component(name as string, component as Component);
            });
        },
    };
}
