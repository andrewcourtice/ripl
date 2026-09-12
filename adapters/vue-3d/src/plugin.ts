import {
    RiplCamera,
} from './components/camera';

import {
    RiplContext3D,
} from './components/context';

import {
    RiplBezierSurface,
    RiplCone,
    RiplCube,
    RiplCylinder,
    RiplGroup3D,
    RiplMesh,
    RiplParametric,
    RiplPlane,
    RiplSphere,
    RiplTorus,
} from './components/elements';

import {
    RiplAmbientLight,
    RiplDirectionalLight,
    RiplHemisphereLight,
    RiplPointLight,
    RiplSpotLight,
} from './components/lights';

import {
    createRipl,
    registerComponents,
} from '@ripl/vue';

import type {
    Plugin,
} from 'vue';

/**
 * Every component the plugin registers, keyed by the name it is registered under.
 *
 * The two names carrying `3D` are registered twice. Vue resolves a kebab-case tag by camelizing it,
 * so `<ripl-context-3d>` looks for `RiplContext3d` and would not find `RiplContext3D` — the alias
 * is what makes the kebab-case form work alongside the PascalCase one.
 */
const COMPONENTS: Record<string, unknown> = {
    RiplContext3d: RiplContext3D,
    RiplGroup3d: RiplGroup3D,
    RiplAmbientLight,
    RiplBezierSurface,
    RiplCamera,
    RiplCone,
    RiplContext3D,
    RiplCube,
    RiplCylinder,
    RiplDirectionalLight,
    RiplGroup3D,
    RiplHemisphereLight,
    RiplMesh,
    RiplParametric,
    RiplPlane,
    RiplPointLight,
    RiplSphere,
    RiplSpotLight,
    RiplTorus,
};

/**
 * Creates the Vue plugin that registers every Ripl 3D component globally, along with the core
 * components from `@ripl/vue` that a 3D scene needs — `<ripl-scene>`, `<ripl-renderer>` and
 * `<ripl-transition>`.
 *
 * Applying `createRipl()` as well, in either order, is harmless: a name already registered is
 * skipped rather than re-registered.
 *
 * @returns A plugin to pass to `app.use()`.
 * @example
 * import { createRipl3D } from '@ripl/vue-3d';
 *
 * createApp(App).use(createRipl3D()).mount('#app');
 */
export function createRipl3D(): Plugin {
    return {
        install(app) {
            app.use(createRipl());
            registerComponents(app, COMPONENTS);
        },
    };
}
