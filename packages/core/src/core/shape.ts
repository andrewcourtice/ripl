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

    protected hitPath?: ContextPath;

    constructor(type: string, options: ElementOptions<TState>) {
        super(type, options);
    }

    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context) {
            return super.intersectsWith(x, y, options);
        }

        const {
            isPointer = false,
        } = options || {};

        const testPath = this.getTestPath();

        const isAnyIntersecting = () => !!(testPath && this.context) && (
            this.context.isPointInStroke(testPath, x, y) ||
            this.context.isPointInPath(testPath, x, y)
        );

        if (!isPointer) {
            return isAnyIntersecting();
        }

        if (!testPath || this.pointerEvents === 'none') {
            return false;
        }

        if (this.pointerEvents === 'stroke') {
            return !!this.context.isPointInStroke(testPath, x, y);
        }

        if (this.pointerEvents === 'fill') {
            return !!this.context.isPointInPath(testPath, x, y);
        }

        return isAnyIntersecting();
    }

    public resetHitPath(): void {
        this.hitPath = undefined;
    }

    protected getTestPath(): ContextPath | undefined {
        return this.hitPath;
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

    protected override getTestPath(): ContextPath | undefined {
        return this.hitPath || this.path;
    }

    public render(context: Context, callback?: (path: ContextPath) => void) {
        return super.render(context, () => {
            this.path = context.createPath(this.id);

            callback?.(this.path);

            if (this.path) {
                if (!this.hitPath) {
                    this.hitPath = context.createPath(`${this.id}:hit`);
                }

                this.hitPath.addPath(this.path);
            }

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