import {
    EventBus,
    EventMap,
    Renderer,
    Scene,
} from '@ripl/core';

/** Base options for chart components, providing scene and renderer references. */
export interface ChartComponentOptions {
    scene: Scene;
    renderer: Renderer;
}

/** Base class for reusable chart components (axes, grids, legends, etc.) with scene and renderer access. */
export class ChartComponent<TEventMap extends EventMap = EventMap> extends EventBus<TEventMap> {

    protected scene: Scene;
    protected renderer: Renderer;

    protected get context() {
        return this.scene.context;
    }

    constructor({
        scene,
        renderer,
    }: ChartComponentOptions) {
        super();

        this.scene = scene;
        this.renderer = renderer;
    }

}