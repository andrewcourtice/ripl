<template>
    <div class="event-timeline">
        <div class="event-timeline__lanes">
            <span v-for="lane of EVENT_LANES" :key="lane.source" class="event-timeline__lane">{{ lane.label }}</span>
        </div>
        <div ref="mount" class="event-timeline__canvas" :style="{ cursor }"></div>
        <div v-if="!events.length" class="event-timeline__empty">No events recorded</div>
    </div>
</template>

<script setup lang="ts">
import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    dragEventWindow,
    EVENT_LANES,
    findNearestEvent,
    formatOffset,
    getTimeOrigin,
    getTimeSpan,
} from '../../composables/use-event-log';

import type {
    EventWindowDrag,
} from '../../composables/use-event-log';

import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watchEffect,
} from 'vue';

import {
    createContext,
    createRect,
    createScene,
    createText,
    scaleContinuous,
} from '@ripl/web';

import type {
    Context,
    Scene,
} from '@ripl/web';

import {
    numberClamp,
} from '@ripl/utilities';

const AXIS_HEIGHT = 14;
const TOP_PAD = 6;
const LANE_GAP = 2;
const BUCKET_WIDTH = 3;
const MARK_MIN_HEIGHT = 3;
const AXIS_TICKS = 5;
const HANDLE_WIDTH = 8;
const HANDLE_SLOP = 10;

const store = useDevtoolsStore();

const mount = ref<HTMLElement | null>(null);
const cursor = ref('default');
// Marks come from the filtered set; the axis and the window map onto the whole recording, so
// narrowing a filter never rescales the timeline under the window.
const events = computed(() => store.timelineEvents.value);
const span = computed(() => getTimeSpan(store.events.value));
const origin = computed(() => getTimeOrigin(store.events.value));

let context: Context | undefined;
let scene: Scene | undefined;
let resizeObserver: ResizeObserver | undefined;
let drag: {
    mode: EventWindowDrag;
    startX: number;
    startWindow: {
        start: number;
        end: number;
    };
} | undefined;

// Reading the rect per pointermove flushes layout mid-gesture, so it is cached behind a dirty flag.
let originLeft = 0;
let originDirty = true;
let frameHandle: number | undefined;

/**
 * Paints on the next frame rather than inline. `Scene` defers rebuilding its instruction stream
 * to a frame buffer, so rendering straight after mutating the graph paints the previous stream.
 */
function paint(): void {
    if (frameHandle !== undefined) {
        return;
    }

    frameHandle = requestAnimationFrame(() => {
        frameHandle = undefined;
        scene?.render();
    });
}

/** The one place lane and axis geometry is derived, so drawing and hit testing cannot drift apart. */
function getGeometry(width: number, height: number) {
    const lanesHeight = height - AXIS_HEIGHT - TOP_PAD - LANE_GAP * EVENT_LANES.length;
    const laneHeight = Math.max(1, lanesHeight / EVENT_LANES.length);

    return {
        width,
        height,
        laneHeight,
        lanesBottom: height - AXIS_HEIGHT,
        axisY: height - AXIS_HEIGHT + 10,
        getLaneTop: (index: number) => TOP_PAD + index * (laneHeight + LANE_GAP),
        getLaneIndex: (y: number) => numberClamp(
            Math.floor((y - TOP_PAD) / (laneHeight + LANE_GAP)),
            0,
            EVENT_LANES.length - 1
        ),
    };
}

function getComputedColor(token: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function getLocalX(event: PointerEvent): number {
    const element = mount.value;

    if (element && originDirty) {
        originLeft = element.getBoundingClientRect().left;
        originDirty = false;
    }

    return event.clientX - originLeft;
}

function getHitMode(x: number, width: number): EventWindowDrag | null {
    const { start, end } = store.eventWindow.value;
    const startX = start * width;
    const endX = end * width;

    // Edges are tested before the body so a narrow window stays resizable.
    if (Math.abs(x - startX) <= HANDLE_SLOP) {
        return 'resize-start';
    }

    if (Math.abs(x - endX) <= HANDLE_SLOP) {
        return 'resize-end';
    }

    return x > startX && x < endX ? 'move' : null;
}

function getCursorFor(mode: EventWindowDrag | null): string {
    if (mode === 'resize-start' || mode === 'resize-end') {
        return 'ew-resize';
    }

    return mode === 'move' ? 'grab' : 'default';
}

function drawWindow(geometry: ReturnType<typeof getGeometry>) {
    const { start, end } = store.eventWindow.value;
    const startX = start * geometry.width;
    const endX = end * geometry.width;
    const mask = getComputedColor('--ripl-window-mask');
    const border = getComputedColor('--ripl-window-border');

    const maskRect = (x: number, width: number, fill: string) => createRect({
        x,
        width,
        y: 0,
        height: geometry.lanesBottom,
        fill,
    });

    const handle = (x: number) => createRect({
        x: x - HANDLE_WIDTH / 2,
        y: geometry.lanesBottom / 4,
        width: HANDLE_WIDTH,
        height: geometry.lanesBottom / 2,
        borderRadius: 2,
        fill: border,
    });

    return [
        maskRect(0, startX, mask),
        maskRect(endX, geometry.width - endX, mask),
        createRect({
            x: startX,
            y: 0,
            width: endX - startX,
            height: geometry.lanesBottom,
            fill: 'transparent',
            stroke: border,
            lineWidth: 1,
        }),
        handle(startX),
        handle(endX),
    ];
}

function draw(): void {
    // Read every reactive source before the guard below: the first pass runs during setup, when
    // the scene does not exist yet, and an early return there would track no dependencies at all
    // and never repaint again.
    const marks = events.value;
    const [spanStart, spanEnd] = span.value;
    const timeOrigin = origin.value;
    const selected = store.selectedEvent.value;

    const target = scene;
    const surface = context;

    if (!target || !surface) {
        return;
    }

    const geometry = getGeometry(surface.width, surface.height);
    const scale = scaleContinuous([spanStart, spanEnd], [0, geometry.width]);

    const accent = getComputedColor('--ripl-accent');
    const dim = getComputedColor('--ripl-text-dim');
    const soft = getComputedColor('--ripl-border-soft');

    const children = EVENT_LANES.flatMap((lane, laneIndex) => {
        const top = geometry.getLaneTop(laneIndex);

        // One mark per bucket keeps the element count bound by pixel width, not by event count.
        const buckets = new Map<number, number>();

        marks.forEach(event => {
            if (event.source !== lane.source) {
                return;
            }

            const x = scale(event.timestamp - timeOrigin);

            if (x < 0 || x > geometry.width) {
                return;
            }

            const bucket = Math.floor(x / BUCKET_WIDTH);

            buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
        });

        const busiest = Math.max(1, ...buckets.values());

        const background = createRect({
            y: top,
            x: 0,
            width: geometry.width,
            height: geometry.laneHeight,
            fill: soft,
        });

        const bars = Array.from(buckets.entries()).map(([bucket, count]) => {
            const markHeight = numberClamp(geometry.laneHeight * (count / busiest), MARK_MIN_HEIGHT, geometry.laneHeight);

            return createRect({
                x: bucket * BUCKET_WIDTH,
                y: top + geometry.laneHeight - markHeight,
                width: BUCKET_WIDTH - 1,
                height: markHeight,
                fill: accent,
            });
        });

        return [background, ...bars];
    });

    const getTickAlign = (index: number) => {
        if (index === 0) {
            return 'left';
        }

        return index === AXIS_TICKS - 1 ? 'right' : 'center';
    };

    const ticks = Array.from({
        length: AXIS_TICKS,
    }, (unused, index) => {
        const offset = spanStart + (spanEnd - spanStart) * (index / (AXIS_TICKS - 1));

        return createText({
            y: geometry.axisY,
            x: numberClamp(scale(offset), 2, geometry.width - 2),
            content: formatOffset(offset),
            fill: dim,
            font: '9px ui-monospace, Menlo, Consolas, monospace',
            textAlign: getTickAlign(index),
        });
    });

    if (selected) {
        const x = scale(selected.timestamp - timeOrigin);

        if (x >= 0 && x <= geometry.width) {
            children.push(createRect({
                x: x - 0.5,
                y: TOP_PAD,
                width: 1,
                height: geometry.lanesBottom - TOP_PAD,
                fill: accent,
            }));
        }
    }

    target.set([...children, ...ticks, ...drawWindow(geometry)]);
    paint();
}

function selectAt(x: number, y: number): void {
    const surface = context;

    if (!surface || !events.value.length) {
        return;
    }

    const geometry = getGeometry(surface.width, surface.height);
    const [spanStart, spanEnd] = span.value;
    const offset = scaleContinuous([0, geometry.width], [spanStart, spanEnd])(x);
    const nearest = findNearestEvent(events.value, offset, EVENT_LANES[geometry.getLaneIndex(y)].source);

    if (nearest) {
        store.selectEvent(nearest);
    }
}

function onPointerDown(event: PointerEvent): void {
    const surface = context;

    if (!surface) {
        return;
    }

    const x = getLocalX(event);
    const mode = getHitMode(x, surface.width);

    if (!mode) {
        return;
    }

    drag = {
        mode,
        startX: x,
        startWindow: {
            ...store.eventWindow.value,
        },
    };

    cursor.value = mode === 'move' ? 'grabbing' : 'ew-resize';
    mount.value?.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
    const surface = context;

    if (!surface) {
        return;
    }

    const x = getLocalX(event);

    if (!drag) {
        cursor.value = getCursorFor(getHitMode(x, surface.width));
        return;
    }

    const delta = (x - drag.startX) / Math.max(1, surface.width);

    store.setEventWindow(dragEventWindow(drag.startWindow, drag.mode, delta));
}

function onPointerUp(event: PointerEvent): void {
    const surface = context;

    // A press that never moved is a click, so it selects rather than scrubs.
    if (surface && drag && Math.abs(getLocalX(event) - drag.startX) < 1) {
        selectAt(drag.startX, event.clientY - (mount.value?.getBoundingClientRect().top ?? 0));
    }

    if (drag) {
        mount.value?.releasePointerCapture(event.pointerId);
        drag = undefined;
    }

    cursor.value = surface ? getCursorFor(getHitMode(getLocalX(event), surface.width)) : 'default';
}

onMounted(() => {
    const element = mount.value;

    if (!element) {
        return;
    }

    context = createContext(element);
    scene = createScene(context);

    // The timeline never animates, so it repaints on demand rather than running a renderer loop.
    context.on('resize', draw);

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('scroll', () => originDirty = true, {
        capture: true,
        passive: true,
    });

    resizeObserver = new ResizeObserver(() => {
        originDirty = true;
        draw();
    });

    resizeObserver.observe(element);

    draw();
});

onBeforeUnmount(() => {
    const element = mount.value;

    element?.removeEventListener('pointerdown', onPointerDown);
    element?.removeEventListener('pointermove', onPointerMove);
    element?.removeEventListener('pointerup', onPointerUp);
    element?.removeEventListener('pointercancel', onPointerUp);

    if (frameHandle !== undefined) {
        cancelAnimationFrame(frameHandle);
    }

    resizeObserver?.disconnect();
    scene?.destroy();
    context?.destroy();
});

// Tracked rather than listed: draw() reads the events, the span, the window and the selection,
// and a hand-maintained dependency list silently stops repainting the moment one is missed.
watchEffect(() => draw());
</script>

<style scoped>
.event-timeline {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
}

.event-timeline__lanes {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 0 var(--ripl-space-2) var(--ripl-space-4);
    border-right: 1px solid var(--ripl-border-soft);
}

.event-timeline__lane {
    font-size: 10px;
    color: var(--ripl-text-dim);
}

.event-timeline__canvas {
    flex: 1;
    min-width: 0;
    touch-action: none;
}

.event-timeline__empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ripl-text-dim);
    font-size: 11px;
    pointer-events: none;
}
</style>
