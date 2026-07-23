import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createGanttChart,
} from '../src';

import type {
    Group,
    Polyline,
} from '@ripl/core';

polyfillPath2D();

/** jsdom measures every element as 0×0; give the canvas a real size so the layout has room. */
function mockCanvasSize(width: number, height: number): void {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    } as DOMRect);
}

afterEach(() => {
    vi.restoreAllMocks();
});

/** Reaches into a chart's scene to inspect the rendered element graph. */
function sceneOf(chart: unknown): Group {
    return (chart as { scene: Group }).scene;
}

interface Task {
    id: string;
    name: string;
    start: Date;
    end: Date;
    dependsOn: string[];
}

const DAY = 86400000;
const BASE = new Date('2026-01-01').getTime();

/**
 * Three chained tasks (research → design → build) with two finish-to-start dependency edges. `shift`
 * slides the design/build tasks along the time axis so a re-render moves the connector endpoints.
 */
function makeTasks(shift: number): Task[] {
    return [
        {
            id: 'research',
            name: 'Research',
            start: new Date(BASE),
            end: new Date(BASE + 5 * DAY),
            dependsOn: [],
        },
        {
            id: 'design',
            name: 'Design',
            start: new Date(BASE + (5 + shift) * DAY),
            end: new Date(BASE + (12 + shift) * DAY),
            dependsOn: ['research'],
        },
        {
            id: 'build',
            name: 'Build',
            start: new Date(BASE + (12 + shift) * DAY),
            end: new Date(BASE + (24 + shift) * DAY),
            dependsOn: ['design'],
        },
    ];
}

describe('GanttChart dependency connectors', () => {

    test('Should draw one stroke-only polyline per dependency edge and no arrowhead fills', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createGanttChart<Task>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: makeTasks(0),
            key: 'id',
            label: 'name',
            start: 'start',
            end: 'end',
            dependencies: 'dependsOn',
        });

        await chart.render();

        const connectors = sceneOf(chart).getElementById('connectors') as Group | undefined;

        expect(connectors).toBeDefined();

        const links = connectors!.getElementsByType('polyline') as Polyline[];

        // Exactly two edges: research → design and design → build.
        expect(links).toHaveLength(2);

        // The layer holds only those polylines — no separate filled-triangle arrowhead elements.
        expect(connectors!.children).toHaveLength(2);

        // Connectors are stroked structural lines, never filled arrowheads.
        const filledLinks = links.filter(link => link.fill !== undefined);

        expect(filledLinks).toHaveLength(0);

        chart.destroy();
    });

    test('Should morph existing connectors in place when bars move rather than recreating them', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createGanttChart<Task>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: makeTasks(0),
            key: 'id',
            label: 'name',
            start: 'start',
            end: 'end',
            dependencies: 'dependsOn',
        });

        await chart.render();

        const connectors = sceneOf(chart).getElementById('connectors') as Group;
        const before = connectors.getElementsByType('polyline') as Polyline[];
        const beforeIds = before.map(link => link.id).sort();

        expect(beforeIds).toEqual(['connector:design->build', 'connector:research->design']);

        // Reschedule design/build so their bars (and hence the connector endpoints) move; keys are
        // unchanged, so the connectors should update rather than be torn down and rebuilt.
        chart.update({
            data: makeTasks(10),
        });

        await chart.render();

        const after = connectors.getElementsByType('polyline') as Polyline[];
        const afterIds = after.map(link => link.id).sort();

        // Same ids, same element instances — persisted across the update, not recreated.
        expect(afterIds).toEqual(beforeIds);
        expect(after).toHaveLength(2);
        before.forEach(link => expect(after).toContain(link));

        chart.destroy();
    });

});
