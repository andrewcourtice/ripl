import {
    defineElement,
} from './element';

import type {
    BaseElementAttrs,
    BaseElementState,
    ElementConstructor,
    ShapeDefinition,
    ShapeDefinitionOptions,
    ShapeInstance,
} from './types';

export function defineShape<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs, TExtension extends Record<PropertyKey, any> = {}>(
    type: string,
    definition: ShapeDefinition<TState, TAttrs, TExtension>,
    definitionOptions: ShapeDefinitionOptions<TState> = {}
): ElementConstructor<TState, TAttrs, TExtension> {
    const {
        autoFill = true,
        autoStroke = true,
        ...elDefinitionOptions
    } = definitionOptions;

    return defineElement<TState, TAttrs, TExtension>(type, elInstance => {
        let path: Path2D | undefined;

        const shapeInstance = {
            ...elInstance,
            setBoundingBoxHandler: handler => {
                elInstance.setBoundingBoxHandler(data => handler({
                    ...data,
                    path,
                }));
            },
            setIntersectionHandler: handler => {
                elInstance.setIntersectionHandler((point, data) => handler(point, {
                    ...data,
                    path,
                }));
            },
        } as ShapeInstance<TState, TAttrs, TExtension>;

        const {
            setIntersectionHandler,
        } = shapeInstance;

        // Set the default intersection handler
        setIntersectionHandler(([x, y], { context, isPointer }) => {
            const isAnyIntersecting = () => !!path && (context.isPointInStroke(path, x, y) || context.isPointInPath(path, x, y));

            if (!isPointer) {
                return isAnyIntersecting();
            }

            const {
                pointerEvents,
            } = shapeInstance.attrs;

            if (!path || pointerEvents === 'none') {
                return false;
            }

            if (pointerEvents === 'stroke') {
                return context.isPointInStroke(path, x, y);
            }

            if (pointerEvents === 'fill') {
                return context.isPointInPath(path, x, y);
            }

            return isAnyIntersecting();
        });

        const onRender = definition(shapeInstance);

        return frame => {
            const {
                context,
                state,
            } = frame;

            onRender({
                ...frame,

                // Only create a path if the shape requests it
                get path() {
                    return (path = new Path2D(), path);
                },
            });

            if (path && autoStroke && state.strokeStyle) {
                context.stroke(path);
            }

            if (path && autoFill && state.fillStyle) {
                context.fill(path);
            }
        };
    }, elDefinitionOptions);
}