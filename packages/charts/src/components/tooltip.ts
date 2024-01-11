import {
    BaseElementState,
    Context,
    Element,
    Shape,
    ShapeOptions
} from '@ripl/core';

export type TooltipAnchor = 'left'
| 'top-left'
| 'top'
| 'top-right'
| 'right'
| 'bototm-right'
| 'bottom'
| 'bottom-left';

export interface TooltipState extends BaseElementState {
    x: number;
    y: number;
    content: string;
    padding?: number;
    margin?: number;
    visible?: boolean;
    anchor?: TooltipAnchor;
}

export class Tooltip extends Shape<TooltipState> {

    get x() {
        return this.getStateValue('x');
    }

    set x(value) {
        this.setStateValue('x', value);
    }

    get y() {
        return this.getStateValue('y');
    }

    set y(value) {
        this.setStateValue('y', value);
    }

    get content() {
        return this.getStateValue('content');
    }

    set content(value) {
        this.setStateValue('content', value);
    }

    get padding() {
        return this.getStateValue('padding');
    }

    set padding(value) {
        this.setStateValue('padding', value);
    }

    get margin() {
        return this.getStateValue('margin');
    }

    set margin(value) {
        this.setStateValue('margin', value);
    }

    constructor(options: ShapeOptions<TooltipState>) {
        super('tooltip', options);
    }

    public render(context: Context): void {
        return super.render(context, path => {
            const {
                x,
                y,
                content,
                padding,
                margin
            } = this;
            
            const {
                width
            } = context.measureText(this.content);

            path.roundRect(x, y, )
            const text = context.createText({
                content: this.
            })
        });
    }

}