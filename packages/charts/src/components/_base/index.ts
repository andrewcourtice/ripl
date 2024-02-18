import {
    EventBus,
    EventMap,
    Renderer,
    Scene,
} from '@ripl/core';

export interface ChartComponentOptions {
    scene: Scene;
    renderer: Renderer;
}

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