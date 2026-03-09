import {
    Element,
    ElementEventMap,
} from './element';

import {
    Context,
    createContext,
    typeIsContext,
} from '../context';

import {
    createFrameBuffer,
} from '../animation';

import {
    Group,
    GroupOptions,
} from './group';

import {
    arrayForEach,
} from '@ripl/utilities';

export interface SceneEventMap extends ElementEventMap {
    resize: null;
}

export interface SceneOptions extends GroupOptions {
    renderOnResize?: boolean;
}

export class Scene<TContext extends Context = Context> extends Group<SceneEventMap> {

    public context: TContext;

    public buffer: Element[];

    public get width() {
        return this.context.width;
    }

    public get height() {
        return this.context.height;
    }

    constructor(target: Context | string | HTMLElement, options?: SceneOptions) {
        const {
            renderOnResize = true,
            ...groupOptions
        } = options || {};

        const context = (typeIsContext(target)
            ? target
            : createContext(target)) as TContext;

        context.buffer = false;

        super({
            font: window.getComputedStyle(context.element).font,
            ...groupOptions,
        });

        this.context = context;
        this.buffer = this.graph();

        const requestFrame = createFrameBuffer();

        context.on('resize', () => {
            this.emit('resize', null);

            if (renderOnResize && !!this.buffer.length) {
                this.render();
            }
        });

        this.on('graph', () => requestFrame(() => {
            this.buffer = this.graph().sort((ea, eb) => ea.zIndex - eb.zIndex);
            context.invalidateTrackedElements('');
        }));
    }

    public destroy(): void {
        this.context.destroy();
        super.destroy();
    }

    public render(): void {
        this.context.clear();
        this.context.markRenderStart();
        arrayForEach(this.buffer, element => element.render(this.context));
        this.context.markRenderEnd();
    }

}

export function createScene(...options: ConstructorParameters<typeof Scene>) {
    return new Scene(...options);
}
