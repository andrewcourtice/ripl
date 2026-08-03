/**
 * Canvas↔SVG parity harness: every scene in `parity-ids.ts` is rendered twice — once through
 * `@ripl/canvas`, once through `@ripl/svg` — and the two surfaces are diffed **against each other**
 * rather than against a stored baseline, so a divergence fails even when both backends move
 * together.
 *
 * Scenes are deliberately axis-aligned and animation-free: the assertion is that two rasterisers
 * agree on the same geometry, so anything that adds anti-aliased edges only adds noise.
 */

// Side-effect import: `@ripl/web` registers the browser factory (text measurement, rAF, DPR).
import '@ripl/web';

import {
    PARITY_HEIGHT,
    PARITY_SCENE_IDS,
    PARITY_WIDTH,
} from './parity-ids';

import type {
    ParityDiff,
    ParitySceneId,
} from './parity-ids';

import {
    createGroup,
    createRect,
    createScene,
} from '@ripl/core';

import type {
    Context,
    Scene,
} from '@ripl/core';

import {
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createContext as createSVGContext,
} from '@ripl/svg';

type ParityBackend = 'canvas' | 'svg';

const GRADIENT = 'linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))';
const OPAQUE_BLACK = 'rgb(0, 0, 0)';

const LEFT = {
    x: 20,
    y: 20,
    width: 90,
    height: 100,
};

const RIGHT = {
    x: 150,
    y: 20,
    width: 90,
    height: 100,
};

const SCENES: Record<ParitySceneId, (context: Context) => Scene> = {
    // The ramp must run once across the group's composed box, not restart on each child.
    'group-gradient': context => createScene(context, {
        children: [
            createGroup({
                id: 'ramp',
                fill: GRADIENT,
                children: [
                    createRect({
                        id: 'ramp-left',
                        ...LEFT,
                    }),
                    createRect({
                        id: 'ramp-right',
                        ...RIGHT,
                    }),
                ],
            }),
        ],
    }),
    // The left rect must paint at 0.25 (group 0.5 × leaf 0.5), the right at the group's 0.5.
    'group-opacity': context => createScene(context, {
        children: [
            createGroup({
                id: 'fade',
                opacity: 0.5,
                children: [
                    createRect({
                        id: 'fade-quarter',
                        fill: OPAQUE_BLACK,
                        opacity: 0.5,
                        ...LEFT,
                    }),
                    createRect({
                        id: 'fade-half',
                        fill: OPAQUE_BLACK,
                        ...RIGHT,
                    }),
                ],
            }),
        ],
    }),
};

const CONTEXTS: Record<ParityBackend, (host: HTMLElement) => Context> = {
    canvas: host => createCanvasContext(host),
    svg: host => createSVGContext(host),
};

function mount(id: ParitySceneId, backend: ParityBackend): HTMLElement {
    const el = document.createElement('div');

    el.style.width = `${PARITY_WIDTH}px`;
    el.style.height = `${PARITY_HEIGHT}px`;
    // Both surfaces paint alpha over an identical opaque backdrop, so a composite difference is the element's, not the page's.
    el.style.background = '#ffffff';
    el.setAttribute('data-parity', id);
    el.setAttribute('data-backend', backend);

    document.body.appendChild(el);

    return el;
}

async function decode(base64: string): Promise<ImageData> {
    const image = new Image();

    image.src = `data:image/png;base64,${base64}`;

    await image.decode();

    const surface = document.createElement('canvas');

    surface.width = image.naturalWidth;
    surface.height = image.naturalHeight;

    const context = surface.getContext('2d');

    if (!context) {
        throw new Error('Unable to acquire a 2D context for the parity diff');
    }

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, surface.width, surface.height);
}

async function diff(left: string, right: string, tolerance: number): Promise<ParityDiff> {
    const [source, target] = await Promise.all([decode(left), decode(right)]);

    if (source.width !== target.width || source.height !== target.height) {
        return {
            width: 0,
            height: 0,
            mismatch: 1,
            maxDelta: 255,
        };
    }

    let mismatched = 0;
    let maxDelta = 0;

    for (let offset = 0; offset < source.data.length; offset += 4) {
        const delta = Math.max(
            Math.abs(source.data[offset] - target.data[offset]),
            Math.abs(source.data[offset + 1] - target.data[offset + 1]),
            Math.abs(source.data[offset + 2] - target.data[offset + 2]),
            Math.abs(source.data[offset + 3] - target.data[offset + 3])
        );

        maxDelta = Math.max(maxDelta, delta);

        if (delta > tolerance) {
            mismatched += 1;
        }
    }

    return {
        width: source.width,
        height: source.height,
        mismatch: mismatched / (source.width * source.height),
        maxDelta,
    };
}

PARITY_SCENE_IDS.forEach(id => {
    Object.entries(CONTEXTS).forEach(([backend, createContext]) => {
        SCENES[id](createContext(mount(id, backend as ParityBackend))).render();
    });
});

window.riplParity = {
    diff,
};

const mounted = PARITY_SCENE_IDS.every(id => document.querySelectorAll(`[data-parity="${id}"]`).length === 2);

requestAnimationFrame(() => {
    if (mounted) {
        document.body.setAttribute('data-ready', 'true');
    }
});
