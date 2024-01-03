import {
    Context,
    Path,
} from './context';

import {
    BaseElementState,
    Element,
    ElementIntersectionOptions,
    ElementOptions,
} from './element';

export type ShapeOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    autoStroke?: boolean;
    autoFill?: boolean;
}

export class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState> {

    protected path?: Path;

    public autoStroke: boolean;
    public autoFill: boolean;

    constructor(type: string, options: ShapeOptions<TState>) {
        const {
            autoFill = true,
            autoStroke = true,
            ...elementOptions
        } = options;

        super(type, elementOptions as ElementOptions<TState>);

        this.autoFill = autoFill;
        this.autoStroke = autoStroke;
    }

    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context) {
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

        if (!this.path || this.pointerEvents === 'none') {
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

    public render(context: Context, callback?: (path: Path) => void) {
        return super.render(context, () => {
            this.path = context.createPath();

            callback?.(this.path);

            if (this.path && this.autoStroke && this.strokeStyle) {
                context.stroke(this.path);
            }

            if (this.path && this.autoFill && this.fillStyle) {
                context.fill(this.path);
            }
        });
    }

}

export function createShape(...options: ConstructorParameters<typeof Shape>) {
    return new Shape(...options);
}

export function elementIsShape(value: unknown): value is Shape {
    return value instanceof Shape;
}