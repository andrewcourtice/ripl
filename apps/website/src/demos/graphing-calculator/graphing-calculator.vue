<template>
    <div class="graphing-calculator">
        <header class="graphing-calculator__header">
            <div class="graphing-calculator__intro">
                <h1 class="graphing-calculator__title">Graphing Calculator</h1>
                <p class="graphing-calculator__subtitle">
                    Type equations and Ripl plots them: adaptively re-sampled curves you can pan and zoom,
                    implicit contours traced with marching squares, and orbitable 3D surfaces. Free symbols
                    become sliders you can animate.
                </p>
            </div>

            <RiplControlGroup>
                <!-- A wrapper, not a class on the button: the kit's scoped `display` would outrank a plain class. -->
                <div class="graphing-calculator__drawer-toggle">
                    <RiplButton
                        :active="panelOpen"
                        aria-label="Toggle the equation panel"
                        @click="onPanelToggle"
                    >
                        <PanelLeft :size="14" />
                        Equations
                    </RiplButton>
                </div>

                <RiplButton
                    :active="catalogueOpen"
                    aria-haspopup="dialog"
                    :aria-expanded="catalogueOpen"
                    title="Browse preset plots"
                    @click="onCatalogueToggle"
                >
                    <LayoutGrid :size="14" />
                    Presets
                </RiplButton>

                <RiplButtonGroup
                    :model-value="mode"
                    :options="MODE_OPTIONS"
                    @update:model-value="onModeChange"
                />

                <RiplButton title="Reset the view" @click="onResetView">
                    <RotateCcw :size="14" />
                    Reset view
                </RiplButton>
            </RiplControlGroup>
        </header>

        <div class="graphing-calculator__body">
            <aside
                class="graphing-calculator__panel"
                :class="{ 'graphing-calculator__panel--open': panelOpen }"
            >
                <section class="graphing-calculator__section">
                    <h2 class="graphing-calculator__section-title">Expressions</h2>
                    <ExpressionList
                        :expressions="expressions"
                        @update:expression="onExpressionUpdate"
                        @add="onExpressionAdd"
                        @remove="onExpressionRemove"
                    />
                </section>

                <section class="graphing-calculator__section">
                    <h2 class="graphing-calculator__section-title">Parameters</h2>
                    <ParameterSliders
                        :params="params"
                        @update:param="onParamUpdate"
                        @toggle-animation="onToggleAnimation"
                    />
                </section>

                <p class="graphing-calculator__note">
                    Forms: <code>y =</code>, <code>x =</code>, <code>r =</code>, <code>z =</code>,
                    <code>(f(t), g(t))</code>, or an equation in x and y. Inequalities, regression fits and
                    LaTeX input are out of scope.
                </p>
            </aside>

            <div
                class="graphing-calculator__scrim"
                v-if="panelOpen"
                @click="panelOpen = false"
            ></div>

            <div class="graphing-calculator__stage">
                <div
                    ref="host"
                    class="graphing-calculator__viewport"
                    role="img"
                    :aria-label="plotLabel"
                ></div>
                <RiplSpinner
                    v-if="loading"
                    overlay
                    label="Loading the expression engine"
                />
            </div>

            <RiplConfigDrawer
                v-model="catalogueOpen"
                class="graphing-calculator__catalogue"
                title="Presets"
            >
                <PresetGallery
                    :presets="PRESETS"
                    :mode="mode"
                    @select="onPresetSelect"
                />
            </RiplConfigDrawer>
        </div>
    </div>
</template>

<script lang="ts" setup>
import ExpressionList from './components/expression-list.vue';
import ParameterSliders from './components/parameter-sliders.vue';
import PresetGallery from './components/preset-gallery.vue';
import RiplButton from '../../.vitepress/components/ripl-button.vue';
import RiplButtonGroup from '../../.vitepress/components/ripl-button-group.vue';
import RiplConfigDrawer from '../../.vitepress/components/ripl-config-drawer.vue';
import RiplControlGroup from '../../.vitepress/components/ripl-control-group.vue';
import RiplSpinner from '../../.vitepress/components/ripl-spinner.vue';

import {
    computed,
    onMounted,
    onUnmounted,
    ref,
    shallowRef,
    watch,
} from 'vue';

import {
    useData,
} from 'vitepress';

import {
    LayoutGrid,
    PanelLeft,
    RotateCcw,
} from 'lucide-vue-next';

import {
    PRESETS,
} from './data/presets';

import {
    createGraph2D,
} from './graph/graph-2d';

import {
    createGraph3D,
} from './graph/graph-3d';

import {
    GRAPH_SERIES_PALETTE,
    resolveGraphTheme,
} from './graph/theme';

import {
    classifyExpression,
    compileExpression,
    evaluateSurface,
    loadMathEngine,
    sampleImplicit,
    samplePlot,
} from './math';

import type {
    Graph2D,
    Graph2DSeries,
} from './graph/graph-2d';

import type {
    Graph3D,
} from './graph/graph-3d';

import type {
    CompiledExpression,
    ExpressionKind,
    GraphExpression,
    GraphPreset,
    ParameterState,
    SamplePlot,
    SurfaceDomain,
    SurfaceField,
} from './types';

import type {
    ExpressionUpdate,
} from './components/expression-list.vue';

import type {
    ParameterUpdate,
} from './components/parameter-sliders.vue';

import {
    createDevtools,
} from '@ripl/devtools';

import {
    numberClamp,
    numberRoundTo,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

import './styles/graphing-calculator.scss';

/** Which renderer the calculator is currently driving. */
type CalculatorMode = GraphPreset['mode'];

/** One equation as it survives a round trip through the URL hash. */
interface SharedExpression {
    /** The raw text the user typed. */
    source: string;
    /** The stroke color the curve or surface is drawn in. */
    color: string;
    /** Whether the expression is currently drawn. */
    visible: boolean;
}

/** The whole calculator, in the form the URL hash carries it. */
interface SharedState {
    /** Which renderer the graph was in. */
    mode: CalculatorMode;
    /** The equation list, in display order. */
    expressions: SharedExpression[];
    /** The parameter sliders, with their values and bounds. */
    params: ParameterState[];
    /** The framed region, in data units. */
    viewport: SurfaceDomain;
}

const DEVTOOLS_LABEL = 'Graphing calculator';
const DEFAULT_EXTENT = 10;
const DEFAULT_SOURCE = 'y = a*sin(b*x)';
const PARAM_EXTENT = 10;
const PARAM_STEP = 0.1;
const PARAM_DEFAULT = 1;
const PARAM_PRECISION = 3;
const ANIMATION_PERIOD = 6000;
const SAVE_DELAY = 400;

// A settled mesh rebuild costs several milliseconds, so an animated parameter drives it below frame rate.
const SURFACE_ANIMATION_INTERVAL = 60;

const DEFAULT_VIEWPORT: SurfaceDomain = {
    xMin: -DEFAULT_EXTENT,
    xMax: DEFAULT_EXTENT,
    yMin: -DEFAULT_EXTENT,
    yMax: DEFAULT_EXTENT,
};

const MODE_OPTIONS = [
    {
        label: '2D',
        value: '2d',
    },
    {
        label: '3D',
        value: '3d',
    },
];

const MODE_HINTS: Record<CalculatorMode, (kind: ExpressionKind) => string | undefined> = {
    '2d': kind => kind === 'surface' ? 'Switch to 3D to plot a surface.' : undefined,
    '3d': kind => kind === 'surface' ? undefined : 'Only z = f(x, y) surfaces are drawn in 3D.',
};

const { isDark } = useData();

const host = ref<HTMLElement>();
const graph2d = shallowRef<Graph2D | null>(null);
const graph3d = shallowRef<Graph3D | null>(null);

const mode = ref<CalculatorMode>('2d');
const expressions = ref<GraphExpression[]>([]);
const params = ref<ParameterState[]>([]);
const viewport = ref<SurfaceDomain>({ ...DEFAULT_VIEWPORT });
const panelOpen = ref(false);
const catalogueOpen = ref(false);
const loading = ref(true);

const compiled = new Map<string, CompiledExpression>();
const phases = new Map<string, number>();

let identity = 0;
let ready = false;
let disposed = false;
let tickHandle: Disposable | undefined;
let viewHandle: Disposable | undefined;
let themeHandle: number | undefined;
let saveHandle: ReturnType<typeof setTimeout> | undefined;
let lastSurfaceUpdate = 0;

const plotLabel = computed(() => {
    const drawn = expressions.value.filter(item => item.visible && !item.error).map(item => item.source);
    const kind = mode.value === '3d' ? '3D surface plot' : '2D plot';

    return drawn.length ? `${kind} of ${drawn.join(', ')}` : `Empty ${kind}`;
});

/** Dispatches to the marching-squares tracer for implicit equations and the adaptive sweeper otherwise. */
const sample: SamplePlot = (expression, options) => expression.kind === 'implicit'
    ? sampleImplicit(expression, options)
    : samplePlot(expression, options);

function paramMap(): Map<string, number> {
    return new Map(params.value.map(param => [param.name, param.value]));
}

function createExpression(source: string, index: number): GraphExpression {
    return {
        id: `expression-${++identity}`,
        source,
        kind: 'invalid',
        color: GRAPH_SERIES_PALETTE[index % GRAPH_SERIES_PALETTE.length],
        visible: true,
        params: [],
    };
}

function createParam(name: string, value: number): ParameterState {
    const span = Math.max(PARAM_EXTENT, Math.abs(value) * 2);

    return {
        name,
        value,
        min: -span,
        max: span,
        step: PARAM_STEP,
        animating: false,
    };
}

function syncExpression(item: GraphExpression): void {
    const classified = classifyExpression(item.source);
    const result = compileExpression(classified);

    compiled.set(item.id, result);

    item.kind = result.kind === 'invalid' ? classified.kind : result.kind;
    item.params = result.params;
    item.error = item.source.trim()
        ? result.error ?? MODE_HINTS[mode.value](item.kind)
        : undefined;
}

function syncExpressions(): void {
    if (ready) {
        expressions.value.forEach(syncExpression);
    }
}

/** Unions the free symbols of every expression, keeping existing slider values and dropping unused ones. */
function syncParams(seed?: Record<string, number>): void {
    const names = new Set<string>();

    for (const item of expressions.value) {
        for (const name of item.params) {
            names.add(name);
        }
    }

    const existing = new Map(params.value.map(param => [param.name, param]));

    params.value = [...names].sort().map(name => {
        const seeded = seed?.[name];
        const current = existing.get(name);

        if (current && seeded === undefined) {
            return current;
        }

        return createParam(name, seeded ?? current?.value ?? PARAM_DEFAULT);
    });

    phases.forEach((_, name) => {
        if (!names.has(name)) {
            phases.delete(name);
        }
    });
}

function graphSeries(): Graph2DSeries[] {
    const series: Graph2DSeries[] = [];

    for (const item of expressions.value) {
        const expression = compiled.get(item.id);

        if (expression && expression.kind !== 'invalid' && expression.kind !== 'surface') {
            series.push({
                id: item.id,
                expression,
                color: item.color,
                visible: item.visible,
            });
        }
    }

    return series;
}

function provideField(resolution: number): SurfaceField | undefined {
    const item = expressions.value.find(entry => entry.visible && entry.kind === 'surface');
    const expression = item && compiled.get(item.id);

    if (!expression || expression.kind !== 'surface') {
        return undefined;
    }

    return evaluateSurface(expression, {
        domain: viewport.value,
        resolution,
        params: paramMap(),
    });
}

/** The region currently framed, read back from the live 2D window so a pan or zoom is shareable. */
function currentRegion(): SurfaceDomain {
    const graph = graph2d.value;

    if (!graph) {
        return { ...viewport.value };
    }

    const view = graph.getViewport();

    return {
        xMin: view.xMin,
        xMax: view.xMax,
        yMin: view.yMin,
        yMax: view.yMax,
    };
}

/** Frames a data-space region by converting it into the navigator's content pixels and fitting to it. */
function frameRegion(graph: Graph2D, region: SurfaceDomain): void {
    const view = graph.getViewport();
    const transform = graph.navigator.transform;
    const perPixel = graph.getUnitsPerPixel();
    const unit = perPixel * transform.k;

    if (!(unit > 0) || !(view.width > 0)) {
        return;
    }

    // Content space is the graph's untransformed pixel grid, recovered from the live window and transform.
    const left = view.xMin + transform.x * perPixel;
    const top = view.yMax - transform.y * perPixel;

    graph.navigator.fitBounds({
        x0: (region.xMin - left) / unit,
        y0: (top - region.yMax) / unit,
        x1: (region.xMax - left) / unit,
        y1: (top - region.yMin) / unit,
    });
}

function pushGraph(): void {
    const graph = graph2d.value;

    if (graph) {
        graph.setParams(paramMap());
        graph.setExpressions(graphSeries());

        return;
    }

    graph3d.value?.update();
}

function pushParams(animated = false): void {
    const graph = graph2d.value;

    if (graph) {
        graph.setParams(paramMap());

        return;
    }

    const surface = graph3d.value;
    const now = performance.now();

    if (!surface || (animated && now - lastSurfaceUpdate < SURFACE_ANIMATION_INTERVAL)) {
        return;
    }

    lastSurfaceUpdate = now;
    surface.update();
}

function triangleWave(phase: number): number {
    return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

function onTick(deltaTime: number): void {
    let animated = false;

    for (const param of params.value) {
        const span = param.max - param.min;

        if (!param.animating || !(span > 0)) {
            continue;
        }

        const phase = ((phases.get(param.name) ?? 0) + deltaTime / ANIMATION_PERIOD) % 1;

        phases.set(param.name, phase);
        param.value = numberRoundTo(param.min + span * triangleWave(phase), PARAM_PRECISION);
        animated = true;
    }

    if (animated) {
        pushParams(true);
    }
}

function createGraph(): void {
    const element = host.value;

    if (!element || !ready) {
        return;
    }

    const theme = resolveGraphTheme();

    if (mode.value === '3d') {
        const surface = createGraph3D({
            host: element,
            provideField,
            theme,
        });

        graph3d.value = surface;
        tickHandle = surface.renderer.on('tick', event => onTick(event.data.deltaTime));

        createDevtools(surface.context, surface.scene, surface.renderer, {
            label: DEVTOOLS_LABEL,
        });

        return;
    }

    const graph = createGraph2D(element, {
        sample,
        theme,
        extent: DEFAULT_EXTENT,
    });

    graph2d.value = graph;
    tickHandle = graph.renderer.on('tick', event => onTick(event.data.deltaTime));
    viewHandle = graph.navigator.on('change', scheduleSave);

    createDevtools(graph.context, graph.scene, graph.renderer, {
        label: DEVTOOLS_LABEL,
    });

    graph.setParams(paramMap());
    graph.setExpressions(graphSeries());
    frameRegion(graph, viewport.value);
}

/** Tears the active graph down completely, so a mode switch leaves no listener or frame loop behind. */
function destroyGraph(): void {
    tickHandle?.dispose();
    tickHandle = undefined;
    viewHandle?.dispose();
    viewHandle = undefined;

    graph2d.value?.destroy();
    graph2d.value = null;
    graph3d.value?.destroy();
    graph3d.value = null;
}

function encodeState(state: SharedState): string {
    try {
        return btoa(encodeURIComponent(JSON.stringify(state)));
    } catch {
        return '';
    }
}

function typeIsSharedState(value: unknown): value is SharedState {
    const state = value as SharedState | null;

    return Boolean(state)
        && (state.mode === '2d' || state.mode === '3d')
        && Array.isArray(state.expressions)
        && Array.isArray(state.params)
        && Boolean(state.viewport);
}

function decodeState(encoded: string): SharedState | null {
    try {
        const parsed: unknown = JSON.parse(decodeURIComponent(atob(encoded)));

        return typeIsSharedState(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function saveState(): void {
    const encoded = encodeState({
        mode: mode.value,
        expressions: expressions.value.map(item => ({
            source: item.source,
            color: item.color,
            visible: item.visible,
        })),
        params: params.value.map(param => ({ ...param })),
        viewport: currentRegion(),
    });

    if (encoded) {
        window.history.replaceState(null, '', `#${encoded}`);
    }
}

function scheduleSave(): void {
    clearTimeout(saveHandle);
    saveHandle = setTimeout(saveState, SAVE_DELAY);
}

function restoreState(): boolean {
    const hash = window.location.hash.slice(1);
    const state = hash ? decodeState(hash) : null;

    if (!state) {
        return false;
    }

    mode.value = state.mode;
    viewport.value = { ...state.viewport };
    params.value = state.params.map(param => ({ ...param }));
    expressions.value = state.expressions.map((item, index) => ({
        ...createExpression(item.source, index),
        color: item.color,
        visible: item.visible,
    }));

    return true;
}

function applyTheme(): void {
    const theme = resolveGraphTheme();

    graph2d.value?.setTheme(theme);
    graph3d.value?.setTheme(theme);
}

function onExpressionUpdate(update: ExpressionUpdate): void {
    const item = expressions.value.find(entry => entry.id === update.id);

    if (!item) {
        return;
    }

    Object.assign(item, update.patch);

    if (update.patch.source !== undefined) {
        syncExpression(item);
        syncParams();
    }

    pushGraph();
    scheduleSave();
}

function onExpressionAdd(): void {
    expressions.value.push(createExpression('', expressions.value.length));
    scheduleSave();
}

function onExpressionRemove(id: string): void {
    expressions.value = expressions.value.filter(item => item.id !== id);
    compiled.delete(id);
    syncParams();
    pushGraph();
    scheduleSave();
}

function onParamUpdate(update: ParameterUpdate): void {
    const param = params.value.find(item => item.name === update.name);

    if (!param) {
        return;
    }

    Object.assign(param, update.patch);
    param.value = numberClamp(param.value, param.min, param.max);

    pushParams();
    scheduleSave();
}

function onToggleAnimation(name: string): void {
    const param = params.value.find(item => item.name === name);

    if (param) {
        param.animating = !param.animating;
        scheduleSave();
    }
}

function onModeChange(next: string): void {
    if (next === mode.value) {
        return;
    }

    viewport.value = currentRegion();
    mode.value = next as CalculatorMode;

    destroyGraph();
    syncExpressions();
    createGraph();
    scheduleSave();
}

function onPresetSelect(preset: GraphPreset): void {
    const switching = preset.mode !== mode.value;

    mode.value = preset.mode;
    expressions.value = preset.expressions.map(createExpression);
    viewport.value = preset.viewport ? { ...preset.viewport } : { ...DEFAULT_VIEWPORT };

    compiled.clear();
    params.value = [];
    syncExpressions();
    syncParams(preset.params);

    if (switching) {
        destroyGraph();
        createGraph();
    } else {
        pushGraph();

        if (graph2d.value) {
            frameRegion(graph2d.value, viewport.value);
        }
    }

    panelOpen.value = false;
    catalogueOpen.value = false;
    scheduleSave();
}

// Both are overlays on small screens, so opening one has to dismiss the other.
function onCatalogueToggle(): void {
    catalogueOpen.value = !catalogueOpen.value;
    panelOpen.value = false;
}

function onPanelToggle(): void {
    panelOpen.value = !panelOpen.value;
    catalogueOpen.value = false;
}

function onResetView(): void {
    graph2d.value?.resetView();
    graph3d.value?.resetCamera();
}

// VitePress flips the theme class in its own watcher, so the custom properties are only settled next frame.
watch(isDark, () => {
    cancelAnimationFrame(themeHandle ?? 0);
    themeHandle = requestAnimationFrame(applyTheme);
});

onMounted(async () => {
    if (!restoreState()) {
        expressions.value = [createExpression(DEFAULT_SOURCE, 0)];
    }

    await loadMathEngine();

    if (disposed) {
        return;
    }

    ready = true;
    loading.value = false;

    syncExpressions();
    syncParams();
    createGraph();
});

onUnmounted(() => {
    disposed = true;

    clearTimeout(saveHandle);
    cancelAnimationFrame(themeHandle ?? 0);
    destroyGraph();
});
</script>
