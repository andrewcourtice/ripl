import {
    RiplCircle,
    RiplContext,
    RiplRenderer,
    RiplScene,
    RiplTransition,
} from '@ripl/react';

import {
    easeOutCubic,
} from '@ripl/web';

import {
    createElement,
    useState,
} from 'react';

import type {
    ReactElement,
} from 'react';

/** The scene behind the React quick start: one circle that grows and recolours on click. */
export function QuickStart(): ReactElement {
    const [grown, setGrown] = useState(false);

    return createElement(RiplContext, {
        style: {
            width: 400,
            height: 300,
        },
    }, createElement(RiplScene, null,
        createElement(RiplRenderer, null,
            createElement(RiplTransition, {
                update: {
                    duration: 400,
                    ease: easeOutCubic,
                },
            }, createElement(RiplCircle, {
                cx: 200,
                cy: 150,
                radius: grown ? 90 : 50,
                fill: grown ? '#ff006e' : '#3a86ff',
                onClick: () => setGrown(value => !value),
            })))));
}
