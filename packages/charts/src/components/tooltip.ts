import {
    ChartComponent, ChartComponentOptions,
} from './_base';

import {
    BaseElementState,
    Context,
    Element,
    Shape,
    ShapeOptions,
} from '@ripl/core';


export type TooltipAnchor = 'left'
| 'top-left'
| 'top'
| 'top-right'
| 'right'
| 'bototm-right'
| 'bottom'
| 'bottom-left';

export interface TooltipOptions extends ChartComponentOptions {
    x: number;
    y: number;
    content: string;
    padding?: number;
    margin?: number;
    visible?: boolean;
    anchor?: TooltipAnchor;
}

export class Tooltip extends ChartComponent {

    public x: number;
    public y: number;
    public content: string;
    public padding?: number;
    public margin?: number;
    public visible?: boolean;
    public anchor?: TooltipAnchor;

    constructor(options: TooltipOptions) {
        const {
            scene,
            renderer,
        } = options || {};

        super({
            scene,
            renderer,
        });
    }

    public show(x: number, y: number, content: string) {

    }

}