<template>
    <div class="combustion-engine-demo">
        <div class="combustion-engine-demo__header">
            <h1 class="combustion-engine-demo__title">Inline 4-Cylinder Engine</h1>
            <p class="combustion-engine-demo__subtitle">Interactive 3D demo powered by @ripl/3d — orbit, zoom, and hover to explore</p>
        </div>
        <div class="combustion-engine-demo__controls">
            <RiplSwitch v-model="animating" label="Animate" />
        </div>
        <div class="combustion-engine-demo__viewport" ref="viewport">
            <div
                class="combustion-engine-demo__tooltip"
                v-if="hoveredPart"
                :style="tooltipStyle"
            >
                {{ hoveredPart }}
            </div>
        </div>
        <div class="combustion-engine-demo__legend">
            <div
                v-for="part in partEntries"
                :key="part.name"
                class="combustion-engine-demo__legend-item"
            >
                <span
                    class="combustion-engine-demo__legend-swatch"
                    :style="{ backgroundColor: part.hoverColor }"
                ></span>
                <span class="combustion-engine-demo__legend-label">{{ part.name }}</span>
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

import RiplSwitch from '../../.vitepress/components/RiplSwitch.vue';

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
    createEngineBlock,
    createCylinderHead,
    createValveCover,
    createPiston,
    createConnectingRod,
    createCrankshaft,
    createCamshaft,
    createValve,
} from './elements';

import './styles/combustion-engine.scss';

const DEFAULT_COLOR = '#C8C8C8';
const EDGE_COLOR = '#555555';
const EDGE_WIDTH = 0.5;

const BORE_SPACING = 0.28;
const CRANK_PHASES = [0, Math.PI, Math.PI, 0];
const STROKE = 0.15;
const THROW_RADIUS = 0.15;
const CON_ROD_LENGTH = 0.4;
const CRANKSHAFT_SPEED = 1.5;

const PART_COLORS: Record<string, { default: string; hover: string }> = {
    'Engine Block': { default: '#B0BEC5', hover: '#90A4AE' },
    'Cylinder Head': { default: '#A1887F', hover: '#8D6E63' },
    'Valve Cover': { default: '#78909C', hover: '#546E7A' },
    'Crankshaft': { default: '#EF9A9A', hover: '#E57373' },
    'Camshaft': { default: '#CE93D8', hover: '#BA68C8' },
};

const PISTON_COLOR = { default: '#FFCC80', hover: '#FFB74D' };
const CON_ROD_COLOR = { default: '#A5D6A7', hover: '#81C784' };
const VALVE_COLOR = { default: '#80DEEA', hover: '#4DD0E1' };

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

const tooltipStyle = computed(() => ({
    left: `${mousePos.x + 16}px`,
    top: `${mousePos.y - 10}px`,
}));

let scene: Scene<Context3D> | undefined;
let renderer: Renderer | undefined;

const partEntries = reactive<PartEntry[]>([]);

// Track dynamic elements for animation
let crankAngle = 0;
const pistons: Shape3D[] = [];
const connectingRods: Shape3D[] = [];
let crankshaftEl: Shape3D | undefined;
let camshaftEl: Shape3D | undefined;
const valves: Shape3D[] = [];

// Piston and valve base positions
const pistonBaseY: number[] = [];
const valveBaseY: number[] = [];

function camLiftProfile(angle: number): number {
    const noseWidth = Math.PI * 0.35;
    let diff = angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < noseWidth) {
        const tt = Math.abs(diff) / noseWidth;
        return 0.02 * (1 - tt * tt * (3 - 2 * tt));
    }
    return 0;
}

function onMouseMove(event: MouseEvent) {
    if (!viewport.value) return;
    const rect = viewport.value.getBoundingClientRect();
    mousePos.x = event.clientX - rect.left;
    mousePos.y = event.clientY - rect.top;
}

function addPart(name: string, element: Shape3D, colors: { default: string; hover: string }) {
    const entry: PartEntry = {
        name,
        element,
        hoverColor: colors.hover,
        defaultColor: colors.default,
    };

    element.fillStyle = colors.default;
    element.strokeStyle = EDGE_COLOR;
    element.lineWidth = EDGE_WIDTH;

    element.on('mouseenter', () => {
        element.fillStyle = entry.hoverColor;
        hoveredPart.value = entry.name;
    });

    element.on('mouseleave', () => {
        element.fillStyle = entry.defaultColor;
        hoveredPart.value = null;
    });

    partEntries.push(entry);
    scene!.add(element as any);

    return element;
}

onMounted(() => {
    if (!viewport.value) return;

    const context = createContext(viewport.value, {
        buffer: false,
    });

    scene = createScene(context) as Scene<Context3D>;

    createCamera(scene, {
        position: [4, 3, 5],
        target: [0, 0.1, 0],
        fov: 45,
        interactions: {
            pivot: true,
            zoom: true,
            pan: true,
        },
    });

    context.lightDirection = [-0.5, -0.8, -1];

    // Crankshaft Y offset (bottom of engine)
    const crankY = -0.2;
    // Block center
    const blockCenterY = 0.1;
    const headY = blockCenterY + 0.275 + 0.06;
    const valveCoverY = headY + 0.06 + 0.02;
    const camshaftY = headY + 0.04;

    // Engine Block
    addPart('Engine Block', createEngineBlock({
        y: blockCenterY,
    }), PART_COLORS['Engine Block']);

    // Cylinder Head
    addPart('Cylinder Head', createCylinderHead({
        y: headY,
    }), PART_COLORS['Cylinder Head']);

    // Valve Cover
    addPart('Valve Cover', createValveCover({
        y: valveCoverY,
    }), PART_COLORS['Valve Cover']);

    // Crankshaft
    crankshaftEl = addPart('Crankshaft', createCrankshaft({
        y: crankY,
    }), PART_COLORS['Crankshaft']);

    // Camshaft
    camshaftEl = addPart('Camshaft', createCamshaft({
        y: camshaftY,
    }), PART_COLORS['Camshaft']);

    // Pistons, Connecting Rods, Valves (per cylinder)
    const blockHalfDepth = 1.2 / 2;

    for (let cyl = 0; cyl < 4; cyl++) {
        const cylZ = -blockHalfDepth + BORE_SPACING * 0.5 + cyl * BORE_SPACING + BORE_SPACING * 0.15;
        const phase = CRANK_PHASES[cyl];

        // Piston
        const pistonY = blockCenterY + STROKE / 2 * Math.cos(phase);
        pistonBaseY.push(blockCenterY);

        const piston = addPart(
            `Piston ${cyl + 1}`,
            createPiston({
                y: pistonY,
                z: cylZ,
            }),
            PISTON_COLOR
        );
        pistons.push(piston);

        // Connecting Rod
        const crankPinX = Math.cos(phase) * THROW_RADIUS;
        const crankPinY = crankY + Math.sin(phase) * THROW_RADIUS;
        const rodAngle = Math.atan2(crankPinX, pistonY - crankPinY);

        const rod = addPart(
            `Con Rod ${cyl + 1}`,
            createConnectingRod({
                y: (pistonY + crankPinY) / 2,
                x: crankPinX / 2,
                z: cylZ,
                rotationZ: rodAngle,
            }),
            CON_ROD_COLOR
        );
        connectingRods.push(rod);

        // Valves (2 per cylinder: intake + exhaust)
        for (let vi = 0; vi < 2; vi++) {
            const valveX = (vi === 0 ? -1 : 1) * 0.05;
            const valveY = headY - 0.02;
            valveBaseY.push(valveY);

            const valve = addPart(
                `${vi === 0 ? 'Intake' : 'Exhaust'} Valve ${cyl + 1}`,
                createValve({
                    y: valveY,
                    x: valveX,
                    z: cylZ,
                }),
                VALVE_COLOR
            );
            valves.push(valve);
        }
    }

    renderer = createRenderer(scene!, {
        autoStart: true,
        autoStop: false,
        sortBuffer: depthSort(context),
    });

    renderer.on('tick', (event) => {
        if (!animating.value) return;

        const dt = event.data.deltaTime / 1000;
        crankAngle += CRANKSHAFT_SPEED * dt;

        // Rotate crankshaft
        if (crankshaftEl) {
            crankshaftEl.rotationZ = crankAngle;
        }

        // Rotate camshaft at half speed
        if (camshaftEl) {
            camshaftEl.rotationZ = crankAngle / 2;
        }

        // Update pistons and connecting rods
        const crankY2 = -0.2;

        for (let cyl = 0; cyl < 4; cyl++) {
            const phase = CRANK_PHASES[cyl];
            const angle = crankAngle + phase;

            // Crank pin position
            const pinX = Math.cos(angle) * THROW_RADIUS;
            const pinY = crankY2 + Math.sin(angle) * THROW_RADIUS;

            // Piston position (simple approximation)
            const pistonNewY = pistonBaseY[cyl] + STROKE / 2 * Math.cos(angle);
            pistons[cyl].y = pistonNewY;

            // Connecting rod: center between piston and crank pin
            const rodCenterX = pinX / 2;
            const rodCenterY = (pistonNewY + pinY) / 2;
            const rodAngle = Math.atan2(pinX, pistonNewY - pinY);

            connectingRods[cyl].x = rodCenterX;
            connectingRods[cyl].y = rodCenterY;
            connectingRods[cyl].rotationZ = rodAngle;

            // Valve motion (driven by camshaft)
            const camAngle = crankAngle / 2;
            const intakePhase = phase;
            const exhaustPhase = phase + Math.PI;

            const intakeLift = camLiftProfile(camAngle + intakePhase);
            const exhaustLift = camLiftProfile(camAngle + exhaustPhase);

            const intakeIdx = cyl * 2;
            const exhaustIdx = cyl * 2 + 1;

            valves[intakeIdx].y = valveBaseY[intakeIdx] - intakeLift;
            valves[exhaustIdx].y = valveBaseY[exhaustIdx] - exhaustLift;
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
