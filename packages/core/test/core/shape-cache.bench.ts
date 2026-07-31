import {
    bench,
    describe,
} from 'vitest';

import type {
    Context,
    ContextPath,
    Element,
} from '../../src';

import {
    createCircle,
    createGroup,
    createPath,
} from '../../src';

// Run with `yarn test:bench` (never in CI); jsdom's `Path2D` is a no-op so these are a lower bound.

// Sink read by `renderFrame` so the JIT cannot dead-code-eliminate the trace loop.
let blackhole = 0;

// Shared via the prototype so `createNoopPath` allocates one object per call, like `new Path2D()`.
const noopPathMethods = {
    moveTo(x: number, y: number) {
        blackhole += x + y;
    },
    lineTo(x: number, y: number) {
        blackhole += x + y;
    },
    circle(x: number, y: number, radius: number) {
        blackhole += x + y + radius;
    },
    rect() {},
    arc() {},
    ellipse() {},
    closePath() {},
    bezierCurveTo() {},
    quadraticCurveTo() {},
    arcTo() {},
    roundRect() {},
    polyline() {},
};

/** A path whose methods consume coordinates into a sink (mirrors a polyfilled Path2D's shape). */
function createNoopPath(): ContextPath {
    return Object.create(noopPathMethods) as ContextPath;
}

/**
 * A minimal caching-capable context implementing only what Element/Shape2D/Group rendering
 * touches. Isolates the cache mechanism (createPath + trace callback) from the jsdom canvas mock.
 */
function createBenchContext(): Context {
    return {
        supportsPathCaching: true,
        currentRenderElement: undefined,
        markRenderStart() {},
        markRenderEnd() {},
        save() {},
        restore() {},
        pushGroup() {},
        popGroup() {},
        applyFill() {},
        applyStroke() {},
        applyClip() {},
        createPath() {
            return createNoopPath();
        },
    } as unknown as Context;
}

const context = createBenchContext();

// ~256 real trig computations per trace — the cost the cache skips when a shape is unchanged.
const TRACE_STEPS = 256;

function traceHeavyGeometry(path: ContextPath): void {
    for (let step = 0; step < TRACE_STEPS; step++) {
        const angle = (step / TRACE_STEPS) * Math.PI * 2;
        path.lineTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
    }
}

function makeHeavyPaths(count: number, cachePath: boolean): Element[] {
    return Array.from({ length: count }, () => createPath({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        cachePath,
        pathRenderer: path => traceHeavyGeometry(path),
    }));
}

function makeLightCircles(count: number, cachePath: boolean): Element[] {
    return Array.from({ length: count }, (_, index) => createCircle({
        cx: index,
        cy: index,
        radius: 5,
        cachePath,
    }));
}

function renderFrame(shapes: Element[]): void {
    for (const shape of shapes) {
        shape.render(context);
    }

    // Reads the sink so the JIT keeps the trace writes (and thus the geometry computation) live.
    if (blackhole === Infinity) {
        throw new Error('unreachable');
    }
}

// ── Static scenes, heavy geometry (the primary "many static elements" result) ──────────────

describe('static heavy paths — 500 elements / frame', () => {
    const cached = makeHeavyPaths(500, true);
    const uncached = makeHeavyPaths(500, false);

    bench('cached (reuse traced path)', () => {
        renderFrame(cached);
    });

    bench('uncached (re-trace every frame)', () => {
        renderFrame(uncached);
    });
});

describe('static heavy paths — 2000 elements / frame', () => {
    const cached = makeHeavyPaths(2000, true);
    const uncached = makeHeavyPaths(2000, false);

    bench('cached (reuse traced path)', () => {
        renderFrame(cached);
    });

    bench('uncached (re-trace every frame)', () => {
        renderFrame(uncached);
    });
});

describe('static heavy paths — 8000 elements / frame', () => {
    const cached = makeHeavyPaths(8000, true);
    const uncached = makeHeavyPaths(8000, false);

    bench('cached (reuse traced path)', () => {
        renderFrame(cached);
    });

    bench('uncached (re-trace every frame)', () => {
        renderFrame(uncached);
    });
});

// ── Static scene, light geometry (honest contrast) ─────────────────────────────────────────

describe('static light circles — 2000 elements / frame', () => {
    const cached = makeLightCircles(2000, true);
    const uncached = makeLightCircles(2000, false);

    bench('cached (reuse traced path)', () => {
        renderFrame(cached);
    });

    bench('uncached (re-trace every frame)', () => {
        renderFrame(uncached);
    });
});

// ── Group-transform animation with static heavy children (pan/zoom a large chart) ──────────

describe('group transform animation — 2000 static heavy children / frame', () => {
    const cachedGroup = createGroup({ children: makeHeavyPaths(2000, true) });
    const uncachedGroup = createGroup({ children: makeHeavyPaths(2000, false) });

    let cachedTick = 0;
    let uncachedTick = 0;

    bench('cached children (reuse while group animates)', () => {
        cachedGroup.translateX = ++cachedTick;
        cachedGroup.render(context);
    });

    bench('uncached children (re-trace while group animates)', () => {
        uncachedGroup.translateX = ++uncachedTick;
        uncachedGroup.render(context);
    });
});
