<template>
    <div class="jet-engine-demo">
        <div class="jet-engine-demo__header">
            <h1 class="jet-engine-demo__title">Jet Engine Exploded View</h1>
            <p class="jet-engine-demo__subtitle">Interactive 3D demo powered by @ripl/3d — orbit, zoom, and hover to explore</p>
        </div>
        <div class="jet-engine-demo__viewport" ref="viewport">
            <div
                class="jet-engine-demo__tooltip"
                v-if="hoveredPart"
                :style="tooltipStyle"
            >
                {{ hoveredPart }}
            </div>
        </div>
        <div class="jet-engine-demo__legend">
            <div
                v-for="part in partEntries"
                :key="part.name"
                class="jet-engine-demo__legend-item"
            >
                <span
                    class="jet-engine-demo__legend-swatch"
                    :style="{ backgroundColor: part.hoverColor }"
                ></span>
                <span class="jet-engine-demo__legend-label">{{ part.name }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    reactive,
    computed,
    onMounted,
    onUnmounted,
} from 'vue';

import {
    createCamera,
    createContext,
    depthSort,
} from '@ripl/3d';

import {
    createScene,
    createRenderer,
} from '@ripl/core';

import type {
    Context3D,
} from '@ripl/3d';

import type {
    Scene,
    Renderer,
} from '@ripl/core';

import type {
    Shape3D,
} from '@ripl/3d';

import {
    createFan,
    createFanCase,
    createLPCompressor,
    createHPCompressor,
    createCombustionChamber,
    createHPTurbine,
    createLPTurbine,
    createExhaustNozzle,
    createCentralShaft,
} from './elements';

const DEFAULT_COLOR = '#C8C8C8';
const EDGE_COLOR = '#555555';
const EDGE_WIDTH = 0.5;

interface PartEntry {
    name: string;
    element: Shape3D;
    hoverColor: string;
    defaultColor: string;
}

const PASTEL_COLORS = [
    '#A8D8EA', // pastel blue - Fan
    '#B5EAD7', // pastel mint - Fan Case
    '#C7CEEA', // pastel lavender - LP Compressor
    '#FFDAC1', // pastel peach - HP Compressor
    '#FFB7B2', // pastel pink - Combustion Chamber
    '#E2F0CB', // pastel lime - HP Turbine
    '#D4A5A5', // pastel rose - LP Turbine
    '#F0E6CC', // pastel cream - Exhaust Nozzle
    '#C9CCD5', // pastel grey-blue - Central Shaft
];

// Exploded offsets along z-axis (front to back)
const PART_OFFSETS = [
    1.8,   // Fan
    1.8,   // Fan Case
    1.0,   // LP Compressor
    0.3,   // HP Compressor
    -0.35, // Combustion Chamber
    -0.95, // HP Turbine
    -1.35, // LP Turbine
    -1.85, // Exhaust Nozzle
    -0.1,  // Central Shaft (centered)
];

const viewport = ref<HTMLElement>();
const hoveredPart = ref<string | null>(null);
const mousePos = reactive({ x: 0, y: 0 });

const tooltipStyle = computed(() => ({
    left: `${mousePos.x + 16}px`,
    top: `${mousePos.y - 10}px`,
}));

let scene: Scene<Context3D> | undefined;
let renderer: Renderer | undefined;

const partEntries = reactive<PartEntry[]>([]);

function createParts(): PartEntry[] {
    const parts: { name: string; element: Shape3D; hoverColor: string }[] = [
        {
            name: 'Fan',
            element: createFan({
                z: PART_OFFSETS[0],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[0],
        },
        {
            name: 'Fan Case',
            element: createFanCase({
                z: PART_OFFSETS[1],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[1],
        },
        {
            name: 'LP Compressor',
            element: createLPCompressor({
                z: PART_OFFSETS[2],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[2],
        },
        {
            name: 'HP Compressor',
            element: createHPCompressor({
                z: PART_OFFSETS[3],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[3],
        },
        {
            name: 'Combustion Chamber',
            element: createCombustionChamber({
                z: PART_OFFSETS[4],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[4],
        },
        {
            name: 'HP Turbine',
            element: createHPTurbine({
                z: PART_OFFSETS[5],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[5],
        },
        {
            name: 'LP Turbine',
            element: createLPTurbine({
                z: PART_OFFSETS[6],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[6],
        },
        {
            name: 'Exhaust Nozzle',
            element: createExhaustNozzle({
                z: PART_OFFSETS[7],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[7],
        },
        {
            name: 'Central Shaft',
            element: createCentralShaft({
                z: PART_OFFSETS[8],
                fillStyle: DEFAULT_COLOR,
                strokeStyle: EDGE_COLOR,
                lineWidth: EDGE_WIDTH,
            }),
            hoverColor: PASTEL_COLORS[8],
        },
    ];

    return parts.map(p => ({
        ...p,
        defaultColor: DEFAULT_COLOR,
    }));
}

function onMouseMove(event: MouseEvent) {
    if (!viewport.value) return;
    const rect = viewport.value.getBoundingClientRect();
    mousePos.x = event.clientX - rect.left;
    mousePos.y = event.clientY - rect.top;
}

onMounted(() => {
    if (!viewport.value) return;

    const context = createContext(viewport.value, {
        buffer: false,
    });

    scene = createScene(context) as Scene<Context3D>;

    const camera = createCamera(scene, {
        position: [2.5, 1.8, 4],
        target: [0, 0, -0.1],
        fov: 45,
        interactions: {
            pivot: true,
            zoom: true,
            pan: true,
        },
    });

    context.lightDirection = [-0.5, -0.8, -1];

    const parts = createParts();
    partEntries.push(...parts);

    for (const part of parts) {
        const el = part.element;

        el.on('mouseenter', () => {
            el.fillStyle = part.hoverColor;
            hoveredPart.value = part.name;
        });

        el.on('mouseleave', () => {
            el.fillStyle = part.defaultColor;
            hoveredPart.value = null;
        });

        scene!.add(el as any);
    }

    renderer = createRenderer(scene!, {
        autoStart: true,
        autoStop: false,
        sortBuffer: depthSort(context),
    });

    viewport.value.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
    viewport.value?.removeEventListener('mousemove', onMouseMove);
    renderer?.destroy();
    scene?.destroy();
});
</script>
