<template>
    <div class="event-timeline">
        <div class="event-timeline__lanes">
            <span v-for="lane of EVENT_LANES" :key="lane.source" class="event-timeline__lane">{{ lane.label }}</span>
        </div>
        <div ref="mount" class="event-timeline__canvas"></div>
        <div v-if="!events.length" class="event-timeline__empty">No events recorded</div>
    </div>
</template>

<script setup lang="ts">
import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import type {
    RecordedEvent,
} from '../../composables/use-devtools-store';

import {
    EVENT_LANES,
    findNearestEvent,
    formatOffset,
    getTimeOrigin,
    getTimeSpan,
} from '../../composables/use-event-log';

import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';

import {
    createContext,
    createNavigator,
    createRect,
    createScene,
    createText,
    rescaleDomain,
    scaleContinuous,
} from '@ripl/web';

import type {
    Context,
    DOMNavigator,
    Scene,
} from '@ripl/web';

import {
    numberClamp,
} from '@ripl/utilities';

const AXIS_HEIGHT = 14;
const LANE_GAP = 2;
const BUCKET_WIDTH = 3;
const MARK_MIN_HEIGHT = 3;
const AXIS_TICKS = 5;

const store = useDevtoolsStore();

const mount = ref<HTMLElement | null>(null);
const events = computed(() => store.events.value);

let context: Context | undefined;
let scene: Scene | undefined;
let navigator: DOMNavigator | undefined;
let resizeObserver: ResizeObserver | undefined;
let panned = false;

function getComputedColor(token: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function getVisibleWindow(width: number): [number, number] {
    const [start, end] = getTimeSpan(events.value);
    const scale = scaleContinuous([start, end], [0, width]);

    if (!navigator) {
        return [start, end];
    }

    return rescaleDomain(scale, navigator.transform, [0, width]);
}

function draw(): void {
    const target = scene;
    const surface = context;

    if (!target || !surface) {
        return;
    }

    const width = surface.width;
    const height = surface.height;
    const laneHeight = Math.max(1, (height - AXIS_HEIGHT - LANE_GAP * EVENT_LANES.length) / EVENT_LANES.length);

    const [windowStart, windowEnd] = getVisibleWindow(width);
    const origin = getTimeOrigin(events.value);
    const scale = scaleContinuous([windowStart, windowEnd], [0, width]);

    const accent = getComputedColor('--ripl-accent');
    const dim = getComputedColor('--ripl-text-dim');
    const soft = getComputedColor('--ripl-border-soft');

    const children = EVENT_LANES.flatMap((lane, laneIndex) => {
        const top = laneIndex * (laneHeight + LANE_GAP);

        // One mark per bucket keeps the element count bound by pixel width, not by event count.
        const buckets = new Map<number, number>();

        events.value.forEach(event => {
            if (event.source !== lane.source) {
                return;
            }

            const x = scale(event.timestamp - origin);

            if (x < 0 || x > width) {
                return;
            }

            const bucket = Math.floor(x / BUCKET_WIDTH);

            buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
        });

        const busiest = Math.max(1, ...buckets.values());

        const background = createRect({
            y: top,
            x: 0,
            width,
            height: laneHeight,
            fill: soft,
        });

        const marks = Array.from(buckets.entries()).map(([bucket, count]) => {
            const markHeight = numberClamp(laneHeight * (count / busiest), MARK_MIN_HEIGHT, laneHeight);

            return createRect({
                x: bucket * BUCKET_WIDTH,
                y: top + laneHeight - markHeight,
                width: BUCKET_WIDTH - 1,
                height: markHeight,
                fill: accent,
            });
        });

        return [background, ...marks];
    });

    const axisY = height - AXIS_HEIGHT + 10;

    const getTickAlign = (index: number) => {
        if (index === 0) {
            return 'left';
        }

        return index === AXIS_TICKS - 1 ? 'right' : 'center';
    };

    const ticks = Array.from({
        length: AXIS_TICKS,
    }, (unused, index) => {
        const offset = windowStart + (windowEnd - windowStart) * (index / (AXIS_TICKS - 1));

        return createText({
            y: axisY,
            x: numberClamp(scale(offset), 2, width - 2),
            content: formatOffset(offset),
            fill: dim,
            font: '9px ui-monospace, Menlo, Consolas, monospace',
            textAlign: getTickAlign(index),
        });
    });

    const selected = store.selectedEvent.value;

    if (selected) {
        const x = scale(selected.timestamp - origin);

        if (x >= 0 && x <= width) {
            children.push(createRect({
                x: x - 0.5,
                y: 0,
                width: 1,
                height: height - AXIS_HEIGHT,
                fill: accent,
            }));
        }
    }

    target.set([...children, ...ticks]);
    target.render();
}

function selectAt(x: number, y: number): void {
    const surface = context;

    if (!surface || !events.value.length) {
        return;
    }

    const width = surface.width;
    const laneHeight = Math.max(1, (surface.height - AXIS_HEIGHT - LANE_GAP * EVENT_LANES.length) / EVENT_LANES.length);
    const laneIndex = numberClamp(Math.floor(y / (laneHeight + LANE_GAP)), 0, EVENT_LANES.length - 1);

    const [windowStart, windowEnd] = getVisibleWindow(width);
    const offset = scaleContinuous([0, width], [windowStart, windowEnd])(x);
    const nearest = findNearestEvent(events.value, offset, EVENT_LANES[laneIndex].source);

    if (nearest) {
        store.selectEvent(nearest);
    }
}

onMounted(() => {
    const element = mount.value;

    if (!element) {
        return;
    }

    context = createContext(element);
    scene = createScene(context);
    navigator = createNavigator(context, {
        interactions: {
            pan: true,
            zoom: true,
        },
    });

    // The timeline never animates, so it repaints on demand rather than running a renderer loop.
    navigator.on('change', () => {
        panned = true;
        draw();
    });

    context.on('resize', draw);
    context.on('mousedown', () => panned = false);

    // The marks carry no listeners, so a pan never suppresses the trailing click the way a drag would.
    context.on('click', event => {
        if (!panned) {
            selectAt(event.data.x, event.data.y);
        }
    });

    resizeObserver = new ResizeObserver(() => draw());
    resizeObserver.observe(element);

    draw();
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    navigator?.destroy();
    scene?.destroy();
    context?.destroy();
});

watch([events, store.selectedEvent], () => draw());
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
    cursor: crosshair;
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
