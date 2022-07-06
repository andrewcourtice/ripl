import {
    BaseElement,
    element,
    ElementConstructor,
    ElementDefinition,
    ElementRenderFrame,
} from './element';

export type ShapeRenderFunction<TElement extends BaseElement> = (context: CanvasRenderingContext2D, path: Path2D, frame: ElementRenderFrame<TElement>) => void;

export interface ShapeDefinition<TElement extends BaseElement> extends Omit<ElementDefinition<TElement>, 'onRender'> {
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
        onRender(context, frame) {
            const {
                state,
            } = frame;

            const path = new Path2D();

            onRender(context, path, frame);

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

        return {
            ...el,
            clone,

            get parent() {
                return el.parent;
            },
            set parent(par) {
                el.parent = par;
            },

            get eventBus() {
                return el.eventBus;
            },
            set eventBus(bus) {
                el.eventBus = bus;
            },
        };
    };
}