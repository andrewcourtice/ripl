<template>
    <div class="vue-adapter-demo">
        <div class="vue-adapter-demo__canvas">
            <ripl-context>
                <ripl-scene>
                    <ripl-renderer>
                        <ripl-transition :duration="transitionDuration" :ease="ease">

                            <!-- Background stars -->
                            <ripl-group>
                                <ripl-circle
                                    v-for="star in stars"
                                    :key="star.id"
                                    :cx="star.x"
                                    :cy="star.y"
                                    :radius="star.radius"
                                    :fill-style="star.color"
                                    :opacity="star.opacity"
                                />
                            </ripl-group>

                            <!-- Orbit rings -->
                            <ripl-group>
                                <ripl-circle
                                    v-for="planet in planets"
                                    :key="'orbit-' + planet.id"
                                    :cx="centerX"
                                    :cy="centerY"
                                    :radius="planet.orbitRadius"
                                    fill-style="transparent"
                                    stroke-style="rgba(255, 255, 255, 0.08)"
                                    :line-width="1"
                                />
                            </ripl-group>

                            <!-- Sun -->
                            <ripl-circle
                                :cx="centerX"
                                :cy="centerY"
                                :radius="sunRadius"
                                :fill-style="sunColor"
                                @mouseenter="onSunEnter"
                                @mouseleave="onSunLeave"
                                @click="onSunClick"
                            />

                            <!-- Sun glow -->
                            <ripl-circle
                                :cx="centerX"
                                :cy="centerY"
                                :radius="sunRadius + 8"
                                fill-style="transparent"
                                :stroke-style="sunGlowColor"
                                :line-width="4"
                                :opacity="0.4"
                            />

                            <!-- Planets group -->
                            <ripl-group>
                                <ripl-circle
                                    v-for="planet in planets"
                                    :key="planet.id"
                                    :cx="planet.x"
                                    :cy="planet.y"
                                    :radius="planet.radius"
                                    :fill-style="planet.color"
                                    :opacity="planet.opacity"
                                    @mouseenter="() => onPlanetEnter(planet)"
                                    @mouseleave="() => onPlanetLeave(planet)"
                                    @click="() => onPlanetClick(planet)"
                                />
                            </ripl-group>

                            <!-- Labels -->
                            <ripl-group>
                                <ripl-text
                                    v-for="planet in planets"
                                    :key="'label-' + planet.id"
                                    :x="planet.x"
                                    :y="planet.y - planet.radius - 8"
                                    :content="planet.name"
                                    fill-style="rgba(255, 255, 255, 0.7)"
                                    font="11px sans-serif"
                                    text-align="center"
                                    text-baseline="bottom"
                                />
                            </ripl-group>

                            <!-- Decorative arcs -->
                            <ripl-arc
                                :cx="centerX"
                                :cy="centerY"
                                :start-angle="decorArcStart"
                                :end-angle="decorArcEnd"
                                :radius="decorArcRadius"
                                fill-style="transparent"
                                stroke-style="rgba(99, 102, 241, 0.25)"
                                :line-width="2"
                            />

                            <!-- Selection indicator -->
                            <ripl-rect
                                v-if="selectedPlanet"
                                :x="selectedPlanet.x - selectedPlanet.radius - 6"
                                :y="selectedPlanet.y - selectedPlanet.radius - 6"
                                :width="(selectedPlanet.radius + 6) * 2"
                                :height="(selectedPlanet.radius + 6) * 2"
                                :border-radius="4"
                                fill-style="transparent"
                                stroke-style="rgba(255, 255, 255, 0.5)"
                                :line-width="1"
                                :line-dash="[4, 4]"
                            />

                        </ripl-transition>
                    </ripl-renderer>
                </ripl-scene>
            </ripl-context>
        </div>
        <div class="vue-adapter-demo__controls">
            <div class="vue-adapter-demo__control-row">
                <button class="vue-adapter-demo__button" @click="randomizeOrbits">
                    Randomize Orbits
                </button>
                <button class="vue-adapter-demo__button" @click="resetOrbits">
                    Reset
                </button>
            </div>
            <div class="vue-adapter-demo__control-row">
                <label class="vue-adapter-demo__label">
                    Duration: {{ transitionDuration }}ms
                </label>
                <input
                    type="range"
                    class="vue-adapter-demo__range"
                    v-model.number="transitionDuration"
                    :min="100"
                    :max="2000"
                    :step="100"
                />
            </div>
            <div class="vue-adapter-demo__control-row">
                <label class="vue-adapter-demo__label">
                    Easing:
                </label>
                <select class="vue-adapter-demo__select" v-model="ease">
                    <option value="easeLinear">Linear</option>
                    <option value="easeInOutCubic">Cubic In/Out</option>
                    <option value="easeInOutQuad">Quad In/Out</option>
                    <option value="easeOutBack">Back Out</option>
                    <option value="easeInOutExpo">Expo In/Out</option>
                    <option value="easeOutCirc">Circ Out</option>
                </select>
            </div>
            <div class="vue-adapter-demo__info" v-if="hoveredName">
                Hovered: <strong>{{ hoveredName }}</strong>
            </div>
            <div class="vue-adapter-demo__info" v-if="selectedPlanet">
                Selected: <strong>{{ selectedPlanet.name }}</strong>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    reactive,
    ref,
} from 'vue';

const WIDTH = 560;
const HEIGHT = 320;

const centerX = WIDTH / 2;
const centerY = HEIGHT / 2;

const transitionDuration = ref(800);
const ease = ref('easeInOutCubic');
const hoveredName = ref('');

interface Planet {
    id: number;
    name: string;
    orbitRadius: number;
    angle: number;
    radius: number;
    color: string;
    baseColor: string;
    hoverColor: string;
    opacity: number;
    x: number;
    y: number;
}

const PLANET_DEFS = [
    { name: 'Mercury', orbitRadius: 50, radius: 6, baseColor: '#94a3b8', hoverColor: '#cbd5e1' },
    { name: 'Venus', orbitRadius: 75, radius: 9, baseColor: '#fbbf24', hoverColor: '#fde68a' },
    { name: 'Earth', orbitRadius: 105, radius: 10, baseColor: '#3b82f6', hoverColor: '#93c5fd' },
    { name: 'Mars', orbitRadius: 130, radius: 8, baseColor: '#ef4444', hoverColor: '#fca5a5' },
    { name: 'Jupiter', orbitRadius: 155, radius: 14, baseColor: '#f97316', hoverColor: '#fdba74' },
];

const DEFAULT_ANGLES = [0.3, 1.2, 2.8, 4.1, 5.5];

function makePlanet(def: typeof PLANET_DEFS[0], index: number, angle: number): Planet {
    return {
        id: index,
        name: def.name,
        orbitRadius: def.orbitRadius,
        angle,
        radius: def.radius,
        color: def.baseColor,
        baseColor: def.baseColor,
        hoverColor: def.hoverColor,
        opacity: 1,
        x: centerX + Math.cos(angle) * def.orbitRadius,
        y: centerY + Math.sin(angle) * def.orbitRadius,
    };
}

const planets = reactive<Planet[]>(
    PLANET_DEFS.map((def, i) => makePlanet(def, i, DEFAULT_ANGLES[i]))
);

const selectedPlanet = ref<Planet | null>(null);

// Sun state
const sunRadius = ref(22);
const sunColor = ref('#fbbf24');
const sunGlowColor = ref('#f59e0b');

// Decorative arc
const decorArcStart = ref(0);
const decorArcEnd = ref(Math.PI * 1.5);
const decorArcRadius = ref(145);

// Background stars
interface Star {
    id: number;
    x: number;
    y: number;
    radius: number;
    color: string;
    opacity: number;
}

function generateStars(): Star[] {
    const result: Star[] = [];

    for (let i = 0; i < 60; i++) {
        result.push({
            id: i,
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            radius: Math.random() * 1.5 + 0.5,
            color: '#ffffff',
            opacity: Math.random() * 0.6 + 0.2,
        });
    }

    return result;
}

const stars = reactive<Star[]>(generateStars());

// Event handlers
function onPlanetEnter(planet: Planet) {
    planet.color = planet.hoverColor;
    planet.radius = PLANET_DEFS[planet.id].radius + 4;
    planet.opacity = 1;
    hoveredName.value = planet.name;
}

function onPlanetLeave(planet: Planet) {
    planet.color = planet.baseColor;
    planet.radius = PLANET_DEFS[planet.id].radius;
    planet.opacity = 1;
    hoveredName.value = '';
}

function onPlanetClick(planet: Planet) {
    selectedPlanet.value = selectedPlanet.value?.id === planet.id ? null : planet;
}

function onSunEnter() {
    sunRadius.value = 26;
    sunColor.value = '#fde68a';
    sunGlowColor.value = '#fbbf24';
    hoveredName.value = 'Sun';
}

function onSunLeave() {
    sunRadius.value = 22;
    sunColor.value = '#fbbf24';
    sunGlowColor.value = '#f59e0b';
    hoveredName.value = '';
}

function onSunClick() {
    randomizeOrbits();
}

// Actions
function randomizeOrbits() {
    for (const planet of planets) {
        const newAngle = Math.random() * Math.PI * 2;

        planet.angle = newAngle;
        planet.x = centerX + Math.cos(newAngle) * planet.orbitRadius;
        planet.y = centerY + Math.sin(newAngle) * planet.orbitRadius;
    }

    decorArcStart.value = Math.random() * Math.PI * 2;
    decorArcEnd.value = decorArcStart.value + Math.PI * (1 + Math.random());
}

function resetOrbits() {
    for (let i = 0; i < planets.length; i++) {
        const angle = DEFAULT_ANGLES[i];

        planets[i].angle = angle;
        planets[i].x = centerX + Math.cos(angle) * planets[i].orbitRadius;
        planets[i].y = centerY + Math.sin(angle) * planets[i].orbitRadius;
        planets[i].color = planets[i].baseColor;
        planets[i].radius = PLANET_DEFS[i].radius;
    }

    decorArcStart.value = 0;
    decorArcEnd.value = Math.PI * 1.5;
    selectedPlanet.value = null;
}
</script>

<style scoped>
.vue-adapter-demo {
    margin: 1.5rem 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.5rem;
    overflow: hidden;
}

.vue-adapter-demo__canvas {
    width: 100%;
    aspect-ratio: 560 / 320;
    background: #0f172a;
}

.vue-adapter-demo__controls {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--vp-c-divider);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.vue-adapter-demo__control-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.vue-adapter-demo__button {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
}

.vue-adapter-demo__button:hover {
    background: var(--vp-c-bg-mute);
}

.vue-adapter-demo__label {
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
    white-space: nowrap;
}

.vue-adapter-demo__range {
    width: 120px;
}

.vue-adapter-demo__select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    font-size: 0.8rem;
}

.vue-adapter-demo__info {
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
    margin-left: auto;
}

.vue-adapter-demo__info strong {
    color: var(--vp-c-text-1);
}
</style>
