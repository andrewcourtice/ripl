<template>
    <div class="jet-engine-demo">
        <div class="jet-engine-demo__header">
            <h1 class="jet-engine-demo__title">Jet Engine Exploded View</h1>
            <p class="jet-engine-demo__subtitle">Interactive 3D demo powered by @ripl/webgpu — GPU-accelerated rendering with hardware depth testing</p>
        </div>
        <div class="jet-engine-demo__controls">
            <RiplSwitch v-model="rotating" label="Rotate" />
            <RiplSwitch :modelValue="exploded" @update:modelValue="toggleExploded" label="Exploded View" />
        </div>
        <div class="jet-engine-demo__viewport" ref="viewport">
            <div
                v-if="!supported"
                class="jet-engine-demo__unsupported"
            >
                <p>WebGPU is not supported in this browser.</p>
                <p>Try Chrome 113+, Edge 113+, or Firefox Nightly.</p>
            </div>
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

import RiplSwitch from '../../.vitepress/components/ripl-switch.vue';

import {
    createCamera,
} from '@ripl/3d';

import {
    createScene,
    createRenderer,
    easeInOutCubic,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/webgpu';

import type {
    WebGPUContext3D,
} from '@ripl/webgpu';

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
} from '../jet-engine/elements';

const DEFAULT_COLOR = '#C8C8C8';

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
const EXPLODED_OFFSETS = [
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

// Assembled offsets — parts packed together along shaft
const ASSEMBLED_OFFSETS = [
    0.55,  // Fan
    0.55,  // Fan Case
    0.30,  // LP Compressor
    0.05,  // HP Compressor
    -0.25, // Combustion Chamber
    -0.55, // HP Turbine
    -0.70, // LP Turbine
    -0.95, // Exhaust Nozzle
    -0.10, // Central Shaft (centered)
];

// Parts that rotate with the shaft (rotor parts)
const ROTATING_PARTS = new Set([
    'Fan',
    'LP Compressor',
    'HP Compressor',
    'HP Turbine',
    'LP Turbine',
    'Central Shaft',
]);

const ROTATION_SPEED = 1.5; // radians per second

const SHAFT_LENGTH_EXPLODED = 3.0;
const SHAFT_LENGTH_ASSEMBLED = 1.8;

const viewport = ref<HTMLElement>();
const hoveredPart = ref<string | null>(null);
const rotating = ref(true);
const exploded = ref(true);
const supported = ref(true);
const mousePos = reactive({ x: 0, y: 0 });

const tooltipStyle = computed(() => ({
    left: `${mousePos.x + 16}px`,
    top: `${mousePos.y - 10}px`,
}));

let scene: Scene<WebGPUContext3D> | undefined;
let renderer: Renderer | undefined;

const partEntries = reactive<PartEntry[]>([]);

function createParts(): PartEntry[] {
    const offsets = exploded.value ? EXPLODED_OFFSETS : ASSEMBLED_OFFSETS;
    const parts: { name: string; element: Shape3D; hoverColor: string }[] = [
        {
            name: 'Fan',
            element: createFan({
                z: offsets[0],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[0],
        },
        {
            name: 'Fan Case',
            element: createFanCase({
                z: offsets[1],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[1],
        },
        {
            name: 'LP Compressor',
            element: createLPCompressor({
                z: offsets[2],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[2],
        },
        {
            name: 'HP Compressor',
            element: createHPCompressor({
                z: offsets[3],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[3],
        },
        {
            name: 'Combustion Chamber',
            element: createCombustionChamber({
                z: offsets[4],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[4],
        },
        {
            name: 'HP Turbine',
            element: createHPTurbine({
                z: offsets[5],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[5],
        },
        {
            name: 'LP Turbine',
            element: createLPTurbine({
                z: offsets[6],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[6],
        },
        {
            name: 'Exhaust Nozzle',
            element: createExhaustNozzle({
                z: offsets[7],
                fill: DEFAULT_COLOR,
            }),
            hoverColor: PASTEL_COLORS[7],
        },
        {
            name: 'Central Shaft',
            element: createCentralShaft({
                z: offsets[8],
                fill: DEFAULT_COLOR,
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

function toggleExploded() {
    exploded.value = !exploded.value;

    const targetOffsets = exploded.value ? EXPLODED_OFFSETS : ASSEMBLED_OFFSETS;
    const targetShaftLength = exploded.value ? SHAFT_LENGTH_EXPLODED : SHAFT_LENGTH_ASSEMBLED;

    for (let i = 0; i < partEntries.length; i++) {
        const isShaft = partEntries[i].name === 'Central Shaft';

        renderer?.transition(partEntries[i].element as any, {
            duration: 800,
            ease: easeInOutCubic,
            state: {
                z: targetOffsets[i],
                ...(isShaft ? { length: targetShaftLength } : {}),
            } as any,
        });
    }
}

onMounted(async () => {
    if (!viewport.value) return;

    if (!navigator.gpu) {
        supported.value = false;
        return;
    }

    const context = await createContext(viewport.value);

    scene = createScene(context) as Scene<WebGPUContext3D>;

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
            el.fill = part.hoverColor;
            hoveredPart.value = part.name;
        });

        el.on('mouseleave', () => {
            el.fill = part.defaultColor;
            hoveredPart.value = null;
        });

        scene!.add(el as any);
    }

    renderer = createRenderer(scene!, {
        autoStart: true,
        autoStop: false,
        debug: {
            fps: true
        }
    });

    renderer.on('tick', (event) => {
        if (!rotating.value) return;

        const dt = event.data.deltaTime / 1000;

        for (const part of partEntries) {
            if (ROTATING_PARTS.has(part.name)) {
                part.element.rotationZ += ROTATION_SPEED * dt;
            }
        }
    });

    viewport.value.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
    viewport.value?.removeEventListener('mousemove', onMouseMove);
    renderer?.destroy();
    scene?.destroy();
});
</script>

<style lang="scss" src="../jet-engine/styles/jet-engine.scss"></style>

<style lang="scss" scoped>
.jet-engine-demo__unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--vp-c-text-2);
    font-size: 0.9rem;
    gap: 0.25rem;

    p {
        margin: 0;
    }
}
</style>
