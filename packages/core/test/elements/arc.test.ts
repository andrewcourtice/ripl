import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createArc,
    elementIsArc,
    getThetaPoint,
    TAU,
} from '../../src';

import type {
    ArcState,
    Context,
    ContextPath,
    Point,
    Shape2DOptions,
} from '../../src';

type PathCommand = (string | number | boolean)[];

/** Records the drawing commands an arc emits, so a test can measure the geometry it actually traced. */
function renderCommands(options: Shape2DOptions<ArcState>): PathCommand[] {
    const commands: PathCommand[] = [];
    const capture = (type: string) => (...args: (number | boolean)[]) => {
        commands.push([type, ...args]);
    };

    const path = {
        id: 'arc',
        arc: capture('arc'),
        arcTo: capture('arcTo'),
        moveTo: capture('moveTo'),
        lineTo: capture('lineTo'),
        closePath: capture('closePath'),
        bezierCurveTo: capture('bezierCurveTo'),
        quadraticCurveTo: capture('quadraticCurveTo'),
    } as unknown as ContextPath;

    const context = {
        save: vi.fn(),
        restore: vi.fn(),
        markRenderStart: vi.fn(),
        markRenderEnd: vi.fn(),
        createPath: () => path,
        supportsPathCaching: false,
    } as unknown as Context;

    createArc(options).render(context);

    return commands;
}

type ArcCommand = [string, number, number, number, number, number, boolean?];

function arcCommands(commands: PathCommand[]) {
    return commands.filter(([type]) => type === 'arc') as ArcCommand[];
}

function arcEndPoint([, cx, cy, radius, , to]: ArcCommand): Point {
    return getThetaPoint(to, radius, cx, cy);
}

/** The two straight edges of a sharply traced annular sector, each as its inner then outer endpoint. */
function sharpEdges(commands: PathCommand[]): { start: [Point, Point];
    end: [Point, Point]; } {
    const [outer, inner] = arcCommands(commands);
    const [, cx, cy, radius, outerStart, outerEnd] = outer;
    const [,,, innerRadius, innerEnd, innerStart] = inner;

    return {
        start: [
            getThetaPoint(innerStart, innerRadius, cx, cy),
            getThetaPoint(outerStart, radius, cx, cy),
        ],
        end: [
            getThetaPoint(innerEnd, innerRadius, cx, cy),
            getThetaPoint(outerEnd, radius, cx, cy),
        ],
    };
}

function distanceToLine([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
    const dx = bx - ax;
    const dy = by - ay;

    return Math.abs(dy * (px - ax) - dx * (py - ay)) / Math.hypot(dx, dy);
}

function pointAlong([ax, ay]: Point, [bx, by]: Point, position: number): Point {
    return [
        ax + (bx - ax) * position,
        ay + (by - ay) * position,
    ];
}

/** Perpendicular separation between the facing edges of two neighbouring sectors, sampled across the band. */
function facingEdgeWidths(left: PathCommand[], right: PathCommand[]): number[] {
    const [leftInner, leftOuter] = sharpEdges(left).end;
    const [rightInner, rightOuter] = sharpEdges(right).start;

    return [0, 0.25, 0.5, 0.75, 1].map(position => distanceToLine(pointAlong(leftInner, leftOuter, position), rightInner, rightOuter));
}

function distanceFrom([cx, cy]: Point, [px, py]: Point): number {
    return Math.hypot(px - cx, py - cy);
}

/** Deterministic pseudo-random source, so a property sweep reproduces exactly on failure. */
function createRandom(seed: number) {
    let state = seed;

    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;

        return state / 4294967296;
    };
}

/** Spans biased towards the half turn, where `sin(span / 2)` rounds to exactly 1 and the corner clamp divides by zero. */
function randomSpan(random: () => number): number {
    const roll = random();

    if (roll < 0.15) {
        return Math.PI - random() * 2e-8;
    }

    if (roll < 0.25) {
        return Math.PI + (random() - 0.5) * 1e-7;
    }

    return random() * TAU;
}

describe('Arc', () => {

    test('Should create with state', () => {
        const arc = createArc({
            cx: 100,
            cy: 100,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 50,
        });

        expect(arc.cx).toBe(100);
        expect(arc.cy).toBe(100);
        expect(arc.startAngle).toBe(0);
        expect(arc.endAngle).toBe(Math.PI);
        expect(arc.radius).toBe(50);
        expect(arc.type).toBe('arc');
    });

    test('Should update state via setters', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: 1,
            radius: 10,
        });

        arc.cx = 50;
        arc.cy = 60;
        arc.startAngle = 0.5;
        arc.endAngle = 2;
        arc.radius = 100;
        arc.innerRadius = 20;
        arc.padAngle = 0.1;
        arc.padWidth = 4;
        arc.borderRadius = 6;

        expect(arc.cx).toBe(50);
        expect(arc.cy).toBe(60);
        expect(arc.startAngle).toBe(0.5);
        expect(arc.endAngle).toBe(2);
        expect(arc.radius).toBe(100);
        expect(arc.innerRadius).toBe(20);
        expect(arc.padAngle).toBe(0.1);
        expect(arc.padWidth).toBe(4);
        expect(arc.borderRadius).toBe(6);
    });

    test('Should compute bounding box without innerRadius', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI / 2,
            radius: 100,
        });

        const box = arc.getBoundingBox();

        expect(box).toBeDefined();
        expect(box.top).toBeLessThanOrEqual(box.bottom);
        expect(box.left).toBeLessThanOrEqual(box.right);
    });

    test('Should compute bounding box with innerRadius', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI / 2,
            radius: 100,
            innerRadius: 50,
        });

        const box = arc.getBoundingBox();

        expect(box).toBeDefined();
        expect(box.top).toBeLessThanOrEqual(box.bottom);
        expect(box.left).toBeLessThanOrEqual(box.right);
    });

    test('Should compute centroid', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 100,
        });

        const [cx, cy] = arc.getCentroid();

        expect(typeof cx).toBe('number');
        expect(typeof cy).toBe('number');
    });

    test('Should compute centroid with alterations', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 100,
        });

        const [cx1] = arc.getCentroid();
        const [cx2] = arc.getCentroid({ radius: 200 });

        expect(cx2).not.toBe(cx1);
    });

});

describe('Arc padAngle', () => {

    // Pinned before padWidth and borderRadius existed; padAngle's wedge gap is a compatibility promise.
    test('Should emit the same annular commands as before padWidth existed', () => {
        expect(renderCommands({
            cx: 100,
            cy: 100,
            startAngle: 0,
            endAngle: Math.PI / 2,
            radius: 80,
            innerRadius: 40,
            padAngle: 0.1,
        })).toEqual([
            ['moveTo', 179.90002083159732, 103.99833354165426],
            ['arc', 100, 100, 80, 0.05, 1.5207963267948965],
            ['lineTo', 101.99916677082713, 139.95001041579866],
            ['arc', 100, 100, 40, 1.5207963267948965, 0.05, true],
            ['lineTo', 179.90002083159732, 103.99833354165426],
        ]);
    });

    test('Should emit the same open-arc commands as before padWidth existed', () => {
        expect(renderCommands({
            cx: 0,
            cy: 0,
            startAngle: 0.25,
            endAngle: 2,
            radius: 50,
            padAngle: 0.2,
        })).toEqual([
            ['arc', 0, 0, 50, 0.35, 1.9],
        ]);
    });

    test('Should collapse an oversized padAngle onto the end angle as before', () => {
        expect(renderCommands({
            cx: 0,
            cy: 0,
            startAngle: 1,
            endAngle: 1.05,
            radius: 30,
            innerRadius: 10,
            padAngle: 0.5,
        })).toEqual([
            ['moveTo', 14.927131436751809, 26.02269676782051],
            ['arc', 0, 0, 30, 1.05, 1.05],
            ['lineTo', 4.97571047891727, 8.67423225594017],
            ['arc', 0, 0, 10, 1.05, 1.05, true],
            ['lineTo', 14.927131436751809, 26.02269676782051],
        ]);
    });

    test('Should emit the same unpadded commands as before padWidth existed', () => {
        expect(renderCommands({
            cx: 10,
            cy: 20,
            startAngle: 0,
            endAngle: 1,
            radius: 30,
            innerRadius: 15,
        })).toEqual([
            ['moveTo', 40, 20],
            ['arc', 10, 20, 30, 0, 1],
            ['lineTo', 18.104534588022098, 32.62206477211845],
            ['arc', 10, 20, 15, 1, 0, true],
            ['lineTo', 40, 20],
        ]);

        expect(renderCommands({
            cx: 10,
            cy: 20,
            startAngle: 0,
            endAngle: 1,
            radius: 30,
        })).toEqual([
            ['arc', 10, 20, 30, 0, 1],
        ]);
    });

    test('Should leave a reversed sector untouched', () => {
        expect(renderCommands({
            cx: 0,
            cy: 0,
            startAngle: 2,
            endAngle: 1,
            radius: 30,
        })).toEqual([
            ['arc', 0, 0, 30, 2, 1],
        ]);
    });

    test('Should widen the gap with radius', () => {
        const widths = facingEdgeWidths(
            renderCommands({
                cx: 0,
                cy: 0,
                radius: 120,
                innerRadius: 40,
                startAngle: 0.2,
                endAngle: 1.2,
                padAngle: 0.1,
            }),
            renderCommands({
                cx: 0,
                cy: 0,
                radius: 120,
                innerRadius: 40,
                startAngle: 1.2,
                endAngle: 2.4,
                padAngle: 0.1,
            })
        );

        expect(widths[0]).toBeCloseTo(40 * Math.sin(0.1), 9);
        expect(widths[4]).toBeCloseTo(120 * Math.sin(0.1), 9);
        expect(widths[4] / widths[0]).toBeCloseTo(3, 9);
    });

});

describe('Arc padWidth', () => {

    test('Should inset the endpoints by asin(padWidth / 2r) at every radius', () => {
        const padWidth = 9;

        [15, 45, 200].forEach(radius => {
            const [[,,,, startAngle, endAngle]] = arcCommands(renderCommands({
                cx: 0,
                cy: 0,
                radius,
                startAngle: 0.4,
                endAngle: 2.6,
                padWidth,
            }));

            const inset = Math.asin(padWidth / (2 * radius));

            expect(startAngle).toBeCloseTo(0.4 + inset, 12);
            expect(endAngle).toBeCloseTo(2.6 - inset, 12);
        });
    });

    test('Should inset the inner and outer arcs by their own radius', () => {
        const padWidth = 12;
        const [outer, inner] = arcCommands(renderCommands({
            cx: 0,
            cy: 0,
            radius: 150,
            innerRadius: 30,
            startAngle: 0,
            endAngle: 1,
            padWidth,
        }));

        expect(outer[4]).toBeCloseTo(Math.asin(padWidth / 300), 12);
        expect(inner[5]).toBeCloseTo(Math.asin(padWidth / 60), 12);
        expect(inner[5]).toBeGreaterThan(outer[4]);
    });

    test('Should hold the gap between adjacent segments constant along the whole edge', () => {
        const padWidth = 6;
        const base = {
            cx: 0,
            cy: 0,
            radius: 120,
            innerRadius: 40,
            padWidth,
        };

        const widths = facingEdgeWidths(
            renderCommands({
                ...base,
                startAngle: 0.2,
                endAngle: 1.2,
            }),
            renderCommands({
                ...base,
                startAngle: 1.2,
                endAngle: 2.4,
            })
        );

        widths.forEach(width => expect(width).toBeCloseTo(padWidth, 9));
        expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1e-9);
    });

    test('Should take precedence over padAngle', () => {
        const withBoth = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
            padAngle: 0.4,
            padWidth: 8,
        });

        const withWidthOnly = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
            padWidth: 8,
        });

        expect(withBoth).toEqual(withWidthOnly);
    });

    test('Should fall back to padAngle only when padWidth is absent', () => {
        const base = {
            cx: 0,
            cy: 0,
            radius: 100,
            startAngle: 0,
            endAngle: 1,
            padAngle: 0.4,
        };

        expect(renderCommands(base)).toEqual([['arc', 0, 0, 100, 0.2, 0.8]]);
        expect(renderCommands({
            ...base,
            padWidth: 0,
        })).toEqual([['arc', 0, 0, 100, 0, 1]]);
    });

    test('Should stay continuous across the padWidth zero boundary when padAngle is also set', () => {
        const base = {
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
            padAngle: 0.2,
        };

        const [zeroOuter] = arcCommands(renderCommands({
            ...base,
            padWidth: 0,
        }));

        const [epsilonOuter] = arcCommands(renderCommands({
            ...base,
            padWidth: 1e-9,
        }));

        expect(epsilonOuter[4]).toBeCloseTo(zeroOuter[4], 9);
        expect(epsilonOuter[5]).toBeCloseTo(zeroOuter[5], 9);
    });

    test('Should collapse a sliver to its mid-angle without inverting', () => {
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius: 60,
            innerRadius: 30,
            startAngle: 1,
            endAngle: 1.02,
            padWidth: 40,
        });

        const [outer, inner] = arcCommands(commands);

        expect(outer[4]).toBeCloseTo(1.01, 12);
        expect(outer[5]).toBe(outer[4]);
        expect(inner[4]).toBe(outer[4]);
        expect(inner[5]).toBe(outer[4]);
        commands.flat().forEach(value => expect(Number.isNaN(value as number)).toBe(false));
    });

    test('Should collapse an arc whose radius is inside the gap', () => {
        const [outer, inner] = arcCommands(renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 2,
            startAngle: 0,
            endAngle: 1,
            padWidth: 20,
        }));

        expect(outer[4]).toBeCloseTo(Math.asin(0.1), 12);
        expect(inner[4]).toBeCloseTo(0.5, 12);
        expect(inner[5]).toBe(inner[4]);
    });

    test('Should trim only the outer radius of an open arc', () => {
        const padWidth = 10;
        const commands = renderCommands({
            cx: 5,
            cy: 5,
            radius: 80,
            startAngle: 0,
            endAngle: 2,
            padWidth,
        });

        const inset = Math.asin(padWidth / 160);

        expect(commands).toEqual([
            ['arc', 5, 5, 80, inset, 2 - inset],
        ]);
    });

    test('Should ignore a negative padWidth', () => {
        expect(renderCommands({
            cx: 0,
            cy: 0,
            radius: 50,
            startAngle: 0,
            endAngle: 1,
            padWidth: -10,
        })).toEqual([
            ['arc', 0, 0, 50, 0, 1],
        ]);
    });

});

describe('Arc borderRadius', () => {

    test('Should store the configured value', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: Math.PI,
            radius: 50,
            borderRadius: 5,
        });

        expect(arc.borderRadius).toBe(5);
    });

    test('Should seat all four corner circles tangent to their arc and their edge', () => {
        const borderRadius = 10;
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: Math.PI / 2,
            borderRadius,
        });

        const corners = arcCommands(commands).filter(([,,, radius]) => radius === borderRadius);

        expect(corners).toHaveLength(4);

        const [outerStart, outerEnd, innerEnd, innerStart] = corners;

        expect(distanceFrom([0, 0], [outerStart[1], outerStart[2]])).toBeCloseTo(90, 9);
        expect(distanceFrom([0, 0], [outerEnd[1], outerEnd[2]])).toBeCloseTo(90, 9);
        expect(distanceFrom([0, 0], [innerEnd[1], innerEnd[2]])).toBeCloseTo(60, 9);
        expect(distanceFrom([0, 0], [innerStart[1], innerStart[2]])).toBeCloseTo(60, 9);

        expect(outerStart[2]).toBeCloseTo(borderRadius, 9);
        expect(innerStart[2]).toBeCloseTo(borderRadius, 9);
    });

    test('Should offset the corner circles by the half gap when padded', () => {
        const padWidth = 8;
        const borderRadius = 10;
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: Math.PI / 2,
            padWidth,
            borderRadius,
        });

        const [start, edge] = commands;

        expect(start[2]).toBeCloseTo(padWidth / 2, 9);
        expect(edge[2]).toBeCloseTo(padWidth / 2, 9);

        const [outerStart, outerEnd, innerEnd, innerStart] = arcCommands(commands).filter(([,,, radius]) => radius === borderRadius);

        expect(outerStart[2]).toBeCloseTo(padWidth / 2 + borderRadius, 9);
        expect(innerStart[2]).toBeCloseTo(padWidth / 2 + borderRadius, 9);
        expect(outerEnd[1]).toBeCloseTo(padWidth / 2 + borderRadius, 9);
        expect(innerEnd[1]).toBeCloseTo(padWidth / 2 + borderRadius, 9);
    });

    test('Should round two corners of an open wedge and keep the center sharp', () => {
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            startAngle: 0,
            endAngle: Math.PI / 2,
            borderRadius: 20,
        });

        expect(commands[0]).toEqual(['moveTo', 0, 0]);
        expect(commands[commands.length - 2]).toEqual(['lineTo', 0, 0]);
        expect(commands[commands.length - 1]).toEqual(['closePath']);
        expect(arcCommands(commands).filter(([,,, radius]) => radius === 20)).toHaveLength(2);
    });

    test('Should clamp to half the band thickness, collapsing to a capsule', () => {
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 60,
            startAngle: 0,
            endAngle: Math.PI / 2,
            borderRadius: 1000,
        });

        const corners = arcCommands(commands).filter(([,,, radius]) => radius === 20);

        expect(corners).toHaveLength(4);

        const [outerStart,,, innerStart] = corners;

        expect(innerStart[1]).toBeCloseTo(outerStart[1], 9);
        expect(innerStart[2]).toBeCloseTo(outerStart[2], 9);
        expect(commands[0].slice(1)).toEqual(commands[1].slice(1));
    });

    test('Should clamp to half the outer arc length on a narrow sector', () => {
        const radius = 100;
        const span = 0.2;
        const commands = renderCommands({
            cx: 0,
            cy: 0,
            radius,
            innerRadius: 10,
            startAngle: 0,
            endAngle: span,
            borderRadius: 1000,
        });

        const outerCorner = arcCommands(commands)[0];

        expect(outerCorner[3]).toBeCloseTo(9.077139786423315, 9);
        expect(outerCorner[3]).toBeLessThan(radius * span / 2);
        expect(outerCorner[3]).toBeLessThan((radius - 10) / 2);
    });

    test('Should ignore a full-turn sweep', () => {
        const options: Shape2DOptions<ArcState> = {
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: TAU,
        };

        expect(renderCommands({
            ...options,
            borderRadius: 20,
        })).toEqual(renderCommands(options));
    });

    test('Should leave the path sharp when zero or absent', () => {
        const sharp = renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
        });

        expect(renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
            borderRadius: 0,
        })).toEqual(sharp);

        expect(renderCommands({
            cx: 0,
            cy: 0,
            radius: 100,
            innerRadius: 50,
            startAngle: 0,
            endAngle: 1,
            borderRadius: -5,
        })).toEqual(sharp);
    });

    test('Should apply padding before rounding, keeping the gap constant', () => {
        const padWidth = 6;
        const base = {
            cx: 0,
            cy: 0,
            radius: 120,
            innerRadius: 40,
            padWidth,
            borderRadius: 8,
        };

        const left = renderCommands({
            ...base,
            startAngle: 0.2,
            endAngle: 1.2,
        });

        const right = renderCommands({
            ...base,
            startAngle: 1.2,
            endAngle: 2.4,
        });

        const leftOuter = arcEndPoint(left[4] as [string, number, number, number, number, number]);
        const leftInner: Point = [left[5][1] as number, left[5][2] as number];
        const rightInner: Point = [right[0][1] as number, right[0][2] as number];
        const rightOuter: Point = [right[1][1] as number, right[1][2] as number];

        [0, 0.5, 1].forEach(position => {
            expect(distanceToLine(pointAlong(leftInner, leftOuter, position), rightInner, rightOuter)).toBeCloseTo(padWidth, 9);
        });
    });

});

describe('Arc path validity', () => {

    test('Should emit finite, non-inverted arcs across random sectors', () => {
        const random = createRandom(20260804);

        for (let index = 0; index < 600; index++) {
            const radius = random() * 200;
            const startAngle = (random() - 0.5) * TAU;
            const padWidth = random() < 0.5 ? random() * 30 : undefined;
            const options: Shape2DOptions<ArcState> = {
                cx: (random() - 0.5) * 50,
                cy: (random() - 0.5) * 50,
                radius,
                startAngle,
                endAngle: startAngle + randomSpan(random),
                padWidth,
                padAngle: random() < 0.5 ? random() * 0.5 : undefined,
                borderRadius: random() < 0.5 ? random() * 100 : undefined,
            };

            const innerRoll = random();

            if (innerRoll < 0.15) {
                options.innerRadius = 0;
            } else if (innerRoll < 0.3) {
                options.innerRadius = (padWidth ?? 0) / 2;
            } else if (innerRoll < 0.8) {
                options.innerRadius = random() * radius;
            }

            const commands = renderCommands(options);

            commands.flat().forEach(value => {
                expect(typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value)).toBe(true);
            });

            arcCommands(commands).forEach(([, , , , from, to, counterclockwise]) => {
                expect(counterclockwise ? from - to : to - from).toBeGreaterThanOrEqual(0);
                expect(Math.abs(to - from)).toBeLessThanOrEqual(TAU + 1e-9);
            });
        }
    });

    test('Should stay finite where the half-span sine rounds to exactly one', () => {
        const endAngle = 0.49999999999999994 * TAU;

        expect(Math.sin(endAngle / 2)).toBe(1);

        const base = {
            cx: 0,
            cy: 0,
            radius: 100,
            startAngle: 0,
            endAngle,
            borderRadius: 10,
        };

        [
            {
                ...base,
                innerRadius: 0,
            },
            {
                ...base,
                innerRadius: 20,
                padWidth: 40,
            },
        ].forEach(options => {
            renderCommands(options).flat().forEach(value => {
                expect(typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value)).toBe(true);
            });
        });
    });

    test('Should keep every traced sub-command connected to the previous point', () => {
        const commands = renderCommands({
            cx: 12,
            cy: -7,
            radius: 90,
            innerRadius: 35,
            startAngle: 0.3,
            endAngle: 2.1,
            padWidth: 5,
            borderRadius: 9,
        });

        let cursor: Point = [0, 0];

        commands.forEach(command => {
            const [type] = command;

            if (type === 'closePath') {
                return;
            }

            if (type !== 'arc') {
                cursor = [command[1] as number, command[2] as number];
                return;
            }

            const [, cx, cy, radius, from] = command as ArcCommand;

            expect(distanceFrom(cursor, getThetaPoint(from, radius, cx, cy))).toBeLessThan(1e-9);

            cursor = arcEndPoint(command as ArcCommand);
        });
    });

});

describe('elementIsArc', () => {

    test('Should return true for Arc instances', () => {
        const arc = createArc({
            cx: 0,
            cy: 0,
            startAngle: 0,
            endAngle: 1,
            radius: 10,
        });

        expect(elementIsArc(arc)).toBe(true);
    });

    test('Should return false for non-Arc values', () => {
        expect(elementIsArc({})).toBe(false);
        expect(elementIsArc(null)).toBe(false);
    });

});
