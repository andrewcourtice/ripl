import {
    createElement,
} from './element';

import type {
    BaseElement,
    ElementConstructor,
    ShapeDefinition,
    ShapeDefinitionOptions,
} from './types';

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