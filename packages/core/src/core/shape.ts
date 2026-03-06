import {
    Context,
    ContextPath,
} from '../context';

import {
    BaseElementState,
    Element,
    ElementIntersectionOptions,
    ElementOptions,
} from './element';

export abstract class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState> {

    constructor(type: string, options: ElementOptions<TState>) {
        super(type, options);
    }

}

export type Shape2DOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    autoStroke?: boolean;
    autoFill?: boolean;
    clip?: boolean;
};

export class Shape2D<TState extends BaseElementState = BaseElementState> extends Shape<TState> {

    protected path?: ContextPath;

    public autoStroke: boolean;
    public autoFill: boolean;
    public clip: boolean;

    constructor(type: string, options: Shape2DOptions<TState>) {
        const {
            autoFill = true,
            autoStroke = true,
            clip = false,
            ...elementOptions
        } = options;

        super(type, elementOptions as ElementOptions<TState>);

        this.autoFill = autoFill;
        this.autoStroke = autoStroke;
        this.clip = clip;
    }

    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context || !this.path) {
            return super.intersectsWith(x, y, options);
        }

        const {
            isPointer = false,
        } = options || {};

        const isAnyIntersecting = () => !!(this.path && this.context) && (
            this.context.isPointInStroke(this.path, x, y) ||
            this.context.isPointInPath(this.path, x, y)
        );

        if (!isPointer) {
            return isAnyIntersecting();
        }

        if (this.pointerEvents === 'none') {
            return false;
        }

        if (this.pointerEvents === 'stroke') {
            return !!this.context.isPointInStroke(this.path, x, y);
        }

        if (this.pointerEvents === 'fill') {
            return !!this.context.isPointInPath(this.path, x, y);
        }

        return isAnyIntersecting();
    }

    public render(context: Context, callback?: (path: ContextPath) => void) {
        return super.render(context, () => {
            this.path = context.createPath(this.id);

            callback?.(this.path);

            if (this.path && this.clip) {
                context.clip(this.path);
                return;
            }

            if (this.path && this.autoFill && this.fillStyle) {
                context.fill(this.path);
            }

            if (this.path && this.autoStroke && this.strokeStyle) {
                context.stroke(this.path);
            }
        }, this.clip);
    }

}

export function createShape(...options: ConstructorParameters<typeof Shape2D>) {
    return new Shape2D(...options);
}

export function elementIsShape(value: unknown): value is Shape {
    return value instanceof Shape;
}