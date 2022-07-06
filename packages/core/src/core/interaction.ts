import {
    Element,
} from './element';

import {
    Renderer,
} from './renderer';

import {
    Scene,
} from './scene';

type InteractionEventName = 'mouseenter'
| 'mouseleave';

interface InteractionEvent {
    element: Element<any>;
}

export function interaction(scene: Scene, renderer?: Renderer) {
    const {
        canvas,
    } = scene;

    const eventMap = {
        mouseenter: [],
        mouseleave: [],
    } as Record<InteractionEventName, Function[]>;

    let left = 0;
    let top = 0;

    const onMouseenter = (event: MouseEvent) => {
        ({
            left,
            top,
        } = canvas.getBoundingClientRect());
    };

    const onMouseleave = (event: MouseEvent) => {
        const x = event.clientX - left;
        const y = event.clientY - top;

        console.log(x, y);

        // for (const element of scene.elements) {
        //     element.
        // }
    };

    const destroy = () => {
        canvas.removeEventListener('mouseenter', onMouseenter);
        canvas.removeEventListener('mousemove', onMouseleave);
    };

    canvas.addEventListener('mouseenter', onMouseenter);
    canvas.addEventListener('mousemove', onMouseleave);

    return {
        //on,
        destroy,
    };
}