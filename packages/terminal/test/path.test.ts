import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    TAU,
} from '@ripl/core';

import {
    TerminalPath,
} from '../src/path';

describe('TerminalPath', () => {

    test('Should generate a unique id when none provided', () => {
        const path = new TerminalPath();

        expect(path.id).toMatch(/^path-/);
    });

    test('Should accept a custom id', () => {
        const path = new TerminalPath('custom-id');

        expect(path.id).toBe('custom-id');
    });

    test('Should start with no commands', () => {
        const path = new TerminalPath();

        expect(path.commands).toEqual([]);
    });

    // ── moveTo ────────────────────────────────────────────────────

    test('moveTo should record command and update cursor', () => {
        const path = new TerminalPath();

        path.moveTo(10, 20);

        expect(path.commands).toHaveLength(1);
        expect(path.commands[0]).toEqual({
            type: 'moveTo',
            args: [10, 20],
        });
    });

    // ── lineTo ────────────────────────────────────────────────────

    test('lineTo should record command with previous cursor position', () => {
        const path = new TerminalPath();

        path.moveTo(5, 10);
        path.lineTo(20, 30);

        expect(path.commands).toHaveLength(2);
        expect(path.commands[1]).toEqual({
            type: 'lineTo',
            args: [5, 10, 20, 30],
        });
    });

    test('lineTo from origin when no moveTo called', () => {
        const path = new TerminalPath();

        path.lineTo(10, 10);

        expect(path.commands[0]).toEqual({
            type: 'lineTo',
            args: [0, 0, 10, 10],
        });
    });

    // ── arc ───────────────────────────────────────────────────────

    test('arc should record command with all parameters', () => {
        const path = new TerminalPath();

        path.arc(50, 50, 25, 0, Math.PI, false);

        expect(path.commands).toHaveLength(1);
        expect(path.commands[0].type).toBe('arc');
        expect(path.commands[0].args).toEqual([50, 50, 25, 0, Math.PI, 0]);
    });

    test('arc counterclockwise should set flag to 1', () => {
        const path = new TerminalPath();

        path.arc(0, 0, 10, 0, Math.PI, true);

        expect(path.commands[0].args[5]).toBe(1);
    });

    test('arc should update cursor to endpoint', () => {
        const path = new TerminalPath();

        path.arc(10, 10, 5, 0, Math.PI / 2);
        path.lineTo(99, 99);

        // Cursor after arc: cx + r*cos(endAngle), cy + r*sin(endAngle)
        const expectedX = 10 + 5 * Math.cos(Math.PI / 2);
        const expectedY = 10 + 5 * Math.sin(Math.PI / 2);

        expect(path.commands[1].args[0]).toBeCloseTo(expectedX, 10);
        expect(path.commands[1].args[1]).toBeCloseTo(expectedY, 10);
    });

    // ── circle ────────────────────────────────────────────────────

    test('circle should delegate to arc with 0 to TAU', () => {
        const path = new TerminalPath();

        path.circle(10, 10, 5);

        expect(path.commands).toHaveLength(1);
        expect(path.commands[0].type).toBe('arc');
        expect(path.commands[0].args[0]).toBe(10);
        expect(path.commands[0].args[1]).toBe(10);
        expect(path.commands[0].args[2]).toBe(5);
        expect(path.commands[0].args[3]).toBe(0);
        expect(path.commands[0].args[4]).toBe(TAU);
    });

    // ── bezierCurveTo ─────────────────────────────────────────────

    test('bezierCurveTo should record command with cursor prefix', () => {
        const path = new TerminalPath();

        path.moveTo(0, 0);
        path.bezierCurveTo(10, 20, 30, 40, 50, 60);

        expect(path.commands[1]).toEqual({
            type: 'bezierCurveTo',
            args: [0, 0, 10, 20, 30, 40, 50, 60],
        });
    });

    test('bezierCurveTo should update cursor to endpoint', () => {
        const path = new TerminalPath();

        path.bezierCurveTo(10, 20, 30, 40, 50, 60);
        path.lineTo(0, 0);

        expect(path.commands[1].args[0]).toBe(50);
        expect(path.commands[1].args[1]).toBe(60);
    });

    // ── quadraticCurveTo ──────────────────────────────────────────

    test('quadraticCurveTo should record command with cursor prefix', () => {
        const path = new TerminalPath();

        path.moveTo(5, 5);
        path.quadraticCurveTo(15, 25, 35, 45);

        expect(path.commands[1]).toEqual({
            type: 'quadraticCurveTo',
            args: [5, 5, 15, 25, 35, 45],
        });
    });

    test('quadraticCurveTo should update cursor to endpoint', () => {
        const path = new TerminalPath();

        path.quadraticCurveTo(10, 20, 30, 40);
        path.lineTo(0, 0);

        expect(path.commands[1].args[0]).toBe(30);
        expect(path.commands[1].args[1]).toBe(40);
    });

    // ── closePath ─────────────────────────────────────────────────

    test('closePath should record line back to start position', () => {
        const path = new TerminalPath();

        path.moveTo(10, 20);
        path.lineTo(30, 40);
        path.closePath();

        expect(path.commands[2]).toEqual({
            type: 'closePath',
            args: [30, 40, 10, 20],
        });
    });

    test('closePath should reset cursor to start position', () => {
        const path = new TerminalPath();

        path.moveTo(10, 20);
        path.lineTo(30, 40);
        path.closePath();
        path.lineTo(50, 50);

        // After closePath, cursor should be at start (10, 20)
        expect(path.commands[3].args[0]).toBe(10);
        expect(path.commands[3].args[1]).toBe(20);
    });

    // ── rect ──────────────────────────────────────────────────────

    test('rect should record command with x, y, width, height', () => {
        const path = new TerminalPath();

        path.rect(5, 10, 100, 50);

        expect(path.commands[0]).toEqual({
            type: 'rect',
            args: [5, 10, 100, 50],
        });
    });

    test('rect should update cursor and start to rect origin', () => {
        const path = new TerminalPath();

        path.rect(15, 25, 100, 50);
        path.lineTo(0, 0);

        expect(path.commands[1].args[0]).toBe(15);
        expect(path.commands[1].args[1]).toBe(25);
    });

    // ── roundRect ─────────────────────────────────────────────────

    test('roundRect should delegate to rect', () => {
        const path = new TerminalPath();

        path.roundRect(5, 10, 100, 50, [8, 8, 8, 8]);

        expect(path.commands).toHaveLength(1);
        expect(path.commands[0].type).toBe('rect');
        expect(path.commands[0].args).toEqual([5, 10, 100, 50]);
    });

    // ── arcTo ─────────────────────────────────────────────────────

    test('arcTo should approximate as two lineTo commands', () => {
        const path = new TerminalPath();

        path.moveTo(0, 0);
        path.arcTo(10, 10, 20, 0, 5);

        expect(path.commands).toHaveLength(3);
        expect(path.commands[1].type).toBe('lineTo');
        expect(path.commands[2].type).toBe('lineTo');
    });

    // ── addPath ───────────────────────────────────────────────────

    test('addPath should merge commands from another TerminalPath', () => {
        const path1 = new TerminalPath();
        const path2 = new TerminalPath();

        path1.moveTo(0, 0);
        path1.lineTo(10, 10);

        path2.moveTo(20, 20);
        path2.lineTo(30, 30);

        path1.addPath(path2);

        expect(path1.commands).toHaveLength(4);
        expect(path1.commands[2].type).toBe('moveTo');
        expect(path1.commands[3].type).toBe('lineTo');
    });

    test('addPath should ignore non-TerminalPath instances', () => {
        const path = new TerminalPath();

        path.moveTo(0, 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path.addPath({} as any);

        expect(path.commands).toHaveLength(1);
    });

    // ── ellipse ───────────────────────────────────────────────────

    test('ellipse should record command with all parameters', () => {
        const path = new TerminalPath();

        path.ellipse(10, 20, 30, 15, 0, 0, Math.PI, false);

        expect(path.commands[0]).toEqual({
            type: 'ellipse',
            args: [10, 20, 30, 15, 0, 0, Math.PI, 0],
        });
    });

    test('ellipse counterclockwise should set flag to 1', () => {
        const path = new TerminalPath();

        path.ellipse(10, 20, 30, 15, 0, 0, Math.PI, true);

        expect(path.commands[0].args[7]).toBe(1);
    });

});
