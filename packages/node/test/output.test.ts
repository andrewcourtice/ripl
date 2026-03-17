import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createTerminalOutput,
} from '../src/output';

describe('createTerminalOutput', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── write ─────────────────────────────────────────────────────

    test('write should call process.stdout.write', () => {
        const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const output = createTerminalOutput();

        output.write('hello');

        expect(writeSpy).toHaveBeenCalledWith('hello');
    });

    // ── columns ───────────────────────────────────────────────────

    test('columns should return process.stdout.columns', () => {
        const original = process.stdout.columns;

        Object.defineProperty(process.stdout, 'columns', {
            value: 120,
            writable: true,
            configurable: true,
        });

        const output = createTerminalOutput();

        expect(output.columns).toBe(120);

        Object.defineProperty(process.stdout, 'columns', {
            value: original,
            writable: true,
            configurable: true,
        });
    });

    test('columns should default to 80 when stdout.columns is falsy', () => {
        const original = process.stdout.columns;

        Object.defineProperty(process.stdout, 'columns', {
            value: 0,
            writable: true,
            configurable: true,
        });

        const output = createTerminalOutput();

        expect(output.columns).toBe(80);

        Object.defineProperty(process.stdout, 'columns', {
            value: original,
            writable: true,
            configurable: true,
        });
    });

    // ── rows ──────────────────────────────────────────────────────

    test('rows should return process.stdout.rows', () => {
        const original = process.stdout.rows;

        Object.defineProperty(process.stdout, 'rows', {
            value: 50,
            writable: true,
            configurable: true,
        });

        const output = createTerminalOutput();

        expect(output.rows).toBe(50);

        Object.defineProperty(process.stdout, 'rows', {
            value: original,
            writable: true,
            configurable: true,
        });
    });

    test('rows should default to 24 when stdout.rows is falsy', () => {
        const original = process.stdout.rows;

        Object.defineProperty(process.stdout, 'rows', {
            value: 0,
            writable: true,
            configurable: true,
        });

        const output = createTerminalOutput();

        expect(output.rows).toBe(24);

        Object.defineProperty(process.stdout, 'rows', {
            value: original,
            writable: true,
            configurable: true,
        });
    });

    // ── onResize ──────────────────────────────────────────────────

    test('onResize should register a SIGWINCH handler', () => {
        const onSpy = vi.spyOn(process, 'on');
        const output = createTerminalOutput();

        const callback = vi.fn();

        output.onResize!(callback);

        expect(onSpy).toHaveBeenCalledWith('SIGWINCH', expect.any(Function));
    });

    test('onResize dispose should remove the SIGWINCH handler', () => {
        const offSpy = vi.spyOn(process, 'off');
        const output = createTerminalOutput();

        const callback = vi.fn();
        const dispose = output.onResize!(callback);

        dispose();

        expect(offSpy).toHaveBeenCalledWith('SIGWINCH', expect.any(Function));
    });

});
