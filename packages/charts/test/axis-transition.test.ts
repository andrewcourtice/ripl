import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    mockTextMetrics,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Group,
    Line,
    Text,
} from '@ripl/core';

import {
    createLineChart,
} from '../src';

/**
 * Long enough that a settled state cannot be mistaken for a completed transition: a few frames in,
 * an animating property has barely moved, while an assigned one is already at its target.
 */
const SLOW = 20_000;

interface ChartInternals {
    scene: {
        context: { rescale(width: number, height: number): void };
        queryAll(selector: string): unknown[];
    };
    renderer: { stop(): void };
}

function internals(chart: unknown): ChartInternals {
    return chart as ChartInternals;
}

/** Live y-axis tick groups, keyed by the tick value in their id. */
function yTicks(chart: unknown): Map<string, Group> {
    const groups = internals(chart).scene.queryAll('.chart-axis__tick-group') as Group[];

    return new Map(groups
        .filter(group => group.id.startsWith('y-tick:'))
        .map(group => [group.id.split(':').pop() as string, group]));
}

/** Tick groups retagged as exiting: still in the scene, fading out. */
function exiting(chart: unknown): Group[] {
    return (internals(chart).scene.queryAll('group') as Group[])
        .filter(group => group.id.includes(':exit:'));
}

function labelOf(group: Group): Text {
    return group.getElementsByType('text')[0] as Text;
}

function markOf(group: Group): Line {
    return group.getElementsByType('line')[0] as Line;
}

function yAxisLine(chart: unknown): Line {
    const vertical = (internals(chart).scene.queryAll('.chart-axis__line') as Line[])
        .filter(line => line.x1 === line.x2);

    expect(vertical.length).toBe(1);
    return vertical[0];
}

function createChart(max: number, animation: boolean | Record<string, unknown>) {
    polyfillPath2D();
    mockTextMetrics(mockCanvasContext());

    const chart = createLineChart(document.createElement('div'), {
        autoRender: false,
        animation,
        axis: {
            y: {
                min: 0,
                max,
            },
        },
        data: [{
            k: 'a',
            v: 1,
        }, {
            k: 'b',
            v: 2,
        }, {
            k: 'c',
            v: 3,
        }],
        key: 'k',
        series: [{
            id: 's',
            label: 'S',
            value: 'v',
        }],
    });

    internals(chart).scene.context.rescale(600, 400);

    return chart;
}

/**
 * Starts a render and lets a few frames run without waiting for it to finish, so mid-transition
 * state can be observed. The render promise is deliberately not awaited — with {@link SLOW} it would
 * take 20s to settle.
 */
async function renderPartially(chart: { render(): Promise<unknown> }) {
    void chart.render().catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 60));
}

/** Re-renders with a new y domain, so the tick set and every tick position change. */
function rescale(chart: ReturnType<typeof createChart>, max: number) {
    chart.update({
        axis: {
            y: {
                min: 0,
                max,
            },
        },
    });
}

describe('Axis transitions', () => {

    it('Should reuse the element of a tick that survives a rescale', async () => {
        const chart = createChart(100, false);

        await chart.render();

        const before = yTicks(chart);
        const survivor = [...before.keys()].find(key => key !== '0');

        expect(survivor).toBeDefined();

        const labelBefore = labelOf(before.get(survivor!)!);

        rescale(chart, 160);
        await chart.render();

        const after = yTicks(chart);

        expect(after.get(survivor!)).toBe(before.get(survivor!));
        expect(labelOf(after.get(survivor!)!)).toBe(labelBefore);
    });

    it('Should transition a surviving tick toward its new position rather than snapping', async () => {
        const chart = createChart(100, { duration: SLOW });

        await renderPartially(chart);

        const survivor = [...yTicks(chart).keys()].find(key => key !== '0')!;
        const label = labelOf(yTicks(chart).get(survivor)!);
        const settled = label.y;

        internals(chart).renderer.stop();

        rescale(chart, 160);
        await renderPartially(chart);

        // Assigning the position instead of transitioning it would have put the label at its target.
        expect(label.y).not.toBe(settled);
        expect(Math.abs(label.y - settled)).toBeLessThan(5);

        internals(chart).renderer.stop();
    });

    it('Should fade leaving ticks out instead of popping them', async () => {
        // Settle with animation off first, else an in-flight entry fade looks identical to a broken exit fade.
        const chart = createChart(100, false);

        await chart.render();
        [...yTicks(chart).values()].forEach(group => expect(labelOf(group).opacity).toBe(1));

        chart.update({ animation: { duration: SLOW } });
        rescale(chart, 40);
        await renderPartially(chart);

        const leaving = exiting(chart);

        expect(leaving.length).toBeGreaterThan(0);

        leaving.forEach(group => {
            // The fade used to be applied to the group, whose opacity was undefined, so it no-opped and popped.
            expect(labelOf(group).opacity).toBeLessThan(1);
            expect(labelOf(group).opacity).toBeGreaterThan(0);
            expect(markOf(group).opacity).toBeLessThan(1);
        });

        internals(chart).renderer.stop();
    });

    it('Should fade entering ticks in from transparent', async () => {
        const chart = createChart(100, { duration: SLOW });

        await renderPartially(chart);

        const entering = [...yTicks(chart).values()];

        expect(entering.length).toBeGreaterThan(0);
        entering.forEach(group => {
            expect(labelOf(group).opacity).toBeGreaterThan(0);
            expect(labelOf(group).opacity).toBeLessThan(0.5);
        });

        internals(chart).renderer.stop();
    });

    it('Should seed an entering tick at the position its value held under the previous scale', async () => {
        const chart = createChart(100, false);

        await chart.render();

        const before = yTicks(chart);
        const scaleBefore = [...before].map(([key, group]) => [Number(key), labelOf(group).y] as const);

        rescale(chart, 160);

        const chartWithSlowAnimation = chart;
        chartWithSlowAnimation.update({ animation: { duration: SLOW } });

        await renderPartially(chartWithSlowAnimation);

        const after = yTicks(chart);
        const fresh = [...after.keys()].filter(key => !before.has(key));

        expect(fresh.length).toBeGreaterThan(0);

        // Where the old axis would have drawn this value — a freshly entered tick starts there.
        const [
            lowValue,
            lowPosition,
        ] = scaleBefore[0];
        const [
            highValue,
            highPosition,
        ] = scaleBefore[scaleBefore.length - 1];

        const previousPositionOf = (value: number) => lowPosition
            + ((value - lowValue) / (highValue - lowValue)) * (highPosition - lowPosition);

        fresh.forEach(key => {
            const value = Number(key);
            const seeded = labelOf(after.get(key)!).y;
            const previous = previousPositionOf(value);

            // A few frames have elapsed, so allow small drift; the point is it started at the old position.
            expect(Math.abs(seeded - previous)).toBeLessThan(5);
        });

        internals(chart).renderer.stop();
    });

    it('Should transition the axis line instead of jumping it', async () => {
        const chart = createChart(100, false);

        await chart.render();

        const line = yAxisLine(chart);
        const settled = line.x1;

        // A far wider domain widens the tick labels, which moves the axis line.
        chart.update({ animation: { duration: SLOW } });
        rescale(chart, 1_000_000);

        await renderPartially(chart);

        expect(line.x1).not.toBe(settled);
        expect(Math.abs(line.x1 - settled)).toBeLessThan(5);

        internals(chart).renderer.stop();
    });

    it('Should land everything on its target in one pass when animation is off', async () => {
        const chart = createChart(100, false);

        await chart.render();

        const groups = [...yTicks(chart).values()];

        expect(groups.length).toBeGreaterThan(0);
        groups.forEach(group => expect(labelOf(group).opacity).toBe(1));

        rescale(chart, 160);
        await chart.render();

        // Exits are destroyed immediately rather than left fading.
        expect(exiting(chart).length).toBe(0);
        [...yTicks(chart).values()].forEach(group => expect(labelOf(group).opacity).toBe(1));
    });

});
