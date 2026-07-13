<template>
    <div class="piston-mechanism-demo">
        <div class="piston-mechanism-demo__header">
            <h1 class="piston-mechanism-demo__title">Piston Mechanism</h1>
            <p class="piston-mechanism-demo__subtitle">A basic single-cylinder slider-crank — crankshaft, connecting rod, and piston head — powered by @ripl/3d. Orbit, zoom, and hover to explore.</p>
        </div>
        <div class="piston-mechanism-demo__controls">
            <RiplSwitch v-model="animating" label="Animate" />
        </div>
        <div class="piston-mechanism-demo__viewport" ref="viewport">
            <div
                class="piston-mechanism-demo__tooltip"
                v-if="hoveredPart"
                :style="tooltipStyle"
            >
                {{ hoveredPart }}
            </div>
        </div>
        <div class="piston-mechanism-demo__legend">
            <div
                v-for="part in partEntries"
                :key="part.name"
                class="piston-mechanism-demo__legend-item"
            >
                <span
                    class="piston-mechanism-demo__legend-swatch"
                    :style="{ backgroundColor: part.hoverColor }"
                ></span>
                <span class="piston-mechanism-demo__legend-label">{{ part.name }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    onMounted,
    onUnmounted,
    reactive,
    ref,
} from 'vue';

import RiplSwitch from '../../.vitepress/components/ripl-switch.vue';

import {
    createCamera,
    createContext,
} from '@ripl/3d';

import type {
    Context3D,
    Shape3D,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Renderer,
    Scene,
} from '@ripl/web';

import {
    createConnectingRod,
    createCrankshaft,
    createPistonHead,
} from './elements';

import './styles/piston-mechanism.scss';

const EDGE_COLOR = '#555555';
const EDGE_WIDTH = 0.5;

// Slider-crank geometry (world units).
const CRANK_Y = -0.2;
const THROW_RADIUS = 0.15;
const CON_ROD_LENGTH = 0.4;
const CRANKSHAFT_SPEED = 1.5;

const CRANKSHAFT_COLOR = { default: '#EF9A9A', hover: '#E57373' };
const CON_ROD_COLOR = { default: '#A5D6A7', hover: '#81C784' };
const PISTON_COLOR = { default: '#FFCC80', hover: '#FFB74D' };

interface PartColors {
    default: string;
    hover: string;
}

interface PartEntry {
    name: string;
    element: Shape3D;
    hoverColor: string;
    defaultColor: string;
}

const viewport = ref<HTMLElement>();
const hoveredPart = ref<string | null>(null);
const animating = ref(true);
const mousePos = reactive({ x: 0, y: 0 });
const partEntries = reactive<PartEntry[]>([]);

const tooltipStyle = computed(() => ({
    left: `${mousePos.x + 16}px`,
    top: `${mousePos.y - 10}px`,
}));

let scene: Scene<Context3D> | undefined;
let renderer: Renderer | undefined;

let crankAngle = 0;
let crankshaftEl: Shape3D | undefined;
let connectingRodEl: Shape3D | undefined;
let pistonEl: Shape3D | undefined;

function onMouseMove(event: MouseEvent) {
    if (!viewport.value) {
        return;
    }

    const rect = viewport.value.getBoundingClientRect();
    mousePos.x = event.clientX - rect.left;
    mousePos.y = event.clientY - rect.top;
}

function addPart(name: string, element: Shape3D, colors: PartColors): Shape3D {
    const entry: PartEntry = {
        name,
        element,
        hoverColor: colors.hover,
        defaultColor: colors.default,
    };

    element.fill = colors.default;
    element.stroke = EDGE_COLOR;
    element.lineWidth = EDGE_WIDTH;

    element.on('mouseenter', () => {
        element.fill = entry.hoverColor;
        hoveredPart.value = entry.name;
    });

    element.on('mouseleave', () => {
        element.fill = entry.defaultColor;
        hoveredPart.value = null;
    });

    partEntries.push(entry);
    scene!.add(element as never);

    return element;
}

/** Slider-crank kinematics for a single cylinder at crank angle `angle`. */
function solveKinematics(angle: number) {
    const pinX = Math.cos(angle) * THROW_RADIUS;
    const pinY = CRANK_Y + Math.sin(angle) * THROW_RADIUS;
    const pistonY = pinY + Math.sqrt(CON_ROD_LENGTH * CON_ROD_LENGTH - pinX * pinX);

    return {
        pinX,
        pinY,
        pistonY,
        rodCentreX: pinX / 2,
        rodCentreY: (pistonY + pinY) / 2,
        rodAngle: Math.atan2(pinX, pistonY - pinY),
    };
}

onMounted(() => {
    if (!viewport.value) {
        return;
    }

    const context = createContext(viewport.value);

    scene = createScene(context) as Scene<Context3D>;

    createCamera(context, {
        position: [1.1, 0.35, 1.7],
        target: [0, 0.05, 0],
        fov: 45,
        interactions: {
            pivot: true,
            zoom: true,
            pan: true,
        },
    });

    context.lightDirection = [-0.5, -0.8, -1];

    const initial = solveKinematics(crankAngle);

    crankshaftEl = addPart('Crankshaft', createCrankshaft({ y: CRANK_Y }), CRANKSHAFT_COLOR);
    connectingRodEl = addPart(
        'Connecting Rod',
        createConnectingRod({
            x: initial.rodCentreX,
            y: initial.rodCentreY,
            rotationZ: initial.rodAngle,
        }),
        CON_ROD_COLOR
    );
    pistonEl = addPart('Piston Head', createPistonHead({ y: initial.pistonY }), PISTON_COLOR);

    renderer = createRenderer(scene, {
        autoStart: true,
        autoStop: false,
    });

    renderer.on('tick', (event) => {
        if (!animating.value) {
            return;
        }

        const dt = event.data.deltaTime / 1000;
        crankAngle += CRANKSHAFT_SPEED * dt;

        const { pistonY, rodCentreX, rodCentreY, rodAngle } = solveKinematics(crankAngle);

        if (crankshaftEl) {
            crankshaftEl.rotationZ = crankAngle;
        }

        if (connectingRodEl) {
            connectingRodEl.x = rodCentreX;
            connectingRodEl.y = rodCentreY;
            connectingRodEl.rotationZ = rodAngle;
        }

        if (pistonEl) {
            pistonEl.y = pistonY;
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
