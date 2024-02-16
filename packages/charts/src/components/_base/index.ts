import {
    Renderer,
    Scene,
} from '@ripl/core';

export interface ChartComponentOptions {
    scene: Scene;
    renderer: Renderer;
}

export class ChartComponent {

    protected scene: Scene;
    protected renderer: Renderer;

    protected get context() {
        return this.scene.context;
    }

    constructor({
        scene,
        renderer,
    }: ChartComponentOptions) {
        this.scene = scene;
        this.renderer = renderer;
    }

}