import {
    BaseElement,
    createElement,
    ElementConstructor,
    ElementDefinition,
    ElementDefinitionOptions,
    ElementRenderFrame,
} from './element';

export type ShapeRenderFunction<TElement extends BaseElement> = (frame: ShapeRenderFrame<TElement>) => void;
export type ShapeDefinition<TElement extends BaseElement> = (...args: Parameters<ElementDefinition<TElement, Path2D>>) => ShapeRenderFunction<TElement>;

export interface ShapeRenderFrame<TElement extends BaseElement> extends ElementRenderFrame<TElement> {
    path: Path2D;
}

export interface ShapeDefinitionOptions<TElement extends BaseElement> extends Omit<ElementDefinitionOptions<TElement>, 'onRender'> {
    autoStroke?: boolean;
    autoFill?: boolean;
}

export function createShape<TElement extends BaseElement>(type: string, definition: ShapeDefinition<TElement>, definitionOptions: ShapeDefinitionOptions<TElement> = {}): ElementConstructor<TElement, Path2D> {
    const {
        autoFill = true,
        autoStroke = true,
        ...elDefinitionOptions
    } = definitionOptions;

    const elConstructor = createElement<TElement, Path2D>(type, (properties, instanceOptions, instance) => {
        const onRender = definition(properties, instanceOptions, instance);

        return frame => {
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
        };
    }, elDefinitionOptions);

    return (properties, options) => {
        const el = elConstructor(properties, options);

        el.clone = () => createShape(type, definition, definitionOptions)(properties, options);

        return el;
    };
}