import {
    BaseElement,
    element,
    ElementConstructor,
    ElementDefinition,
    ElementRenderFrame,
} from './element';

export type ShapeRenderFunction<TElement extends BaseElement> = (frame: ShapeRenderFrame<TElement>) => void;

export interface ShapeRenderFrame<TElement extends BaseElement> extends ElementRenderFrame<TElement> {
    path: Path2D;
}

export interface ShapeDefinition<TElement extends BaseElement> extends Omit<ElementDefinition<TElement, Path2D>, 'onRender'> {
    autoStroke?: boolean;
    autoFill?: boolean;
    onRender: ShapeRenderFunction<TElement>;
}

export function shape<TElement extends BaseElement>(definition: ShapeDefinition<TElement>): ElementConstructor<TElement> {
    const {
        autoFill = true,
        autoStroke = true,
        onRender,
        ...elementDefinition
    } = definition;

    const elConstructor = element<TElement>({
        ...elementDefinition,
        onRender(frame) {
            const {
                context,
                state,
            } = frame;

            const path = new Path2D();

            onRender({
                ...frame,
                path,
            });

            if (autoStroke && state.strokeStyle) {
                context.stroke(path);
            }

            if (autoFill && state.fillStyle) {
                context.fill(path);
            }

            return path;
        },
    });

    return (properties, options) => {
        const el = elConstructor(properties, options);

        const clone = () => shape(definition)(properties, options);

        return Object.assign(el, {
            clone,
        });
    };
}