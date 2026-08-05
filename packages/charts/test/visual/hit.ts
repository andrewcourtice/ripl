/**
 * Canvas↔SVG hit-test harness: every scene in `hit-ids.ts` is mounted twice — once through
 * `@ripl/canvas`, once through `@ripl/svg` — with a `click` listener on the transformed target, and
 * the element each click reaches is recorded for the spec to compare.
 *
 * This is the non-pixel half of the parity work. `parity.ts` diffs what the two backends *paint*;
 * a hit-test defect is invisible to that, so this diffs what they *hit*.
 */

// Side-effect import: `@ripl/web` registers the browser factory (text measurement, rAF, DPR).
import '@ripl/web';

import {
    HIT_BACKENDS,
    HIT_HEIGHT,
    HIT_SCENES,
    HIT_WIDTH,
} from './hit-ids';

import type {
    HitBackend,
    HitRecord,
    HitSceneId,
} from './hit-ids';

import {
    createGroup,
    createRect,
    createScene,
} from '@ripl/core';

import type {
    Context,
    Element,
    Scene,
} from '@ripl/core';

import {
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    createContext as createSVGContext,
} from '@ripl/svg';

const FILL = 'rgb(64, 128, 255)';

const records: HitRecord[] = [];

interface TargetBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

function createTarget(id: string, box: TargetBox, report: (target: string) => void, transform?: Record<string, number>): Element {
    const rect = createRect({
        id,
        fill: FILL,
        ...box,
        ...transform,
    });

    rect.on('click', () => report(id));

    return rect;
}

const SCENES: Record<HitSceneId, (context: Context, report: (target: string) => void) => Scene> = {
    // Rendered at x 100–160; the authored rect sits at x 10–70, so the clicked centre misses it unmapped.
    translated: (context, report) => createScene(context, {
        children: [
            createGroup({
                id: 'translated-group',
                translateX: 90,
                children: [
                    createTarget('translated-target', {
                        x: 10,
                        y: 40,
                        width: 60,
                        height: 60,
                    }, report),
                ],
            }),
        ],
    }),
    // Scaling about the default origin renders 20–50 as 40–100, so the clicked centre lands outside the authored box.
    scaled: (context, report) => createScene(context, {
        children: [
            createGroup({
                id: 'scaled-group',
                transformScaleX: 2,
                transformScaleY: 2,
                children: [
                    createTarget('scaled-target', {
                        x: 20,
                        y: 20,
                        width: 30,
                        height: 30,
                    }, report),
                ],
            }),
        ],
    }),
    // The clicked point sits on the rotated long axis but below the authored rect's lower edge.
    rotated: (context, report) => createScene(context, {
        children: [
            createTarget('rotated-target', {
                x: 40,
                y: 50,
                width: 100,
                height: 40,
            }, report, {
                rotation: Math.PI / 4,
                transformOriginX: 90,
                transformOriginY: 70,
            }),
        ],
    }),
};

const CONTEXTS: Record<HitBackend, (host: HTMLElement) => Context> = {
    canvas: host => createCanvasContext(host),
    svg: host => createSVGContext(host),
};

function mount(id: HitSceneId, backend: HitBackend): HTMLElement {
    const el = document.createElement('div');

    el.style.width = `${HIT_WIDTH}px`;
    el.style.height = `${HIT_HEIGHT}px`;
    el.style.background = '#ffffff';
    el.setAttribute('data-hit', id);
    el.setAttribute('data-backend', backend);

    document.body.appendChild(el);

    return el;
}

HIT_SCENES.forEach(scene => {
    HIT_BACKENDS.forEach(backend => {
        const host = mount(scene.id, backend);
        const report = (target: string) => records.push({
            scene: scene.id,
            backend,
            target,
        });

        SCENES[scene.id](CONTEXTS[backend](host), report).render();
    });
});

window.riplHit = {
    records,
    reset() {
        records.length = 0;
    },
};

const mounted = HIT_SCENES.every(scene => document.querySelectorAll(`[data-hit="${scene.id}"]`).length === HIT_BACKENDS.length);

requestAnimationFrame(() => {
    if (mounted) {
        document.body.setAttribute('data-ready', 'true');
    }
});
