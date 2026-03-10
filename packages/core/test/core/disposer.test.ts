import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Disposer,
} from '../../src';

class TestDisposer extends Disposer {

    public retainDisposable(...args: Parameters<Disposer['retain']>) {
        this.retain(...args);
    }

    public disposeDisposables(...args: Parameters<Disposer['dispose']>) {
        this.dispose(...args);
    }

}

describe('Disposer', () => {

    test('Should dispose all disposables when dispose is called with no key', () => {
        const disposer = new TestDisposer();
        const disposeA = vi.fn();
        const disposeB = vi.fn();

        disposer.retainDisposable({ dispose: disposeA });
        disposer.retainDisposable({ dispose: disposeB });
        disposer.disposeDisposables();

        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).toHaveBeenCalledTimes(1);
    });

    test('Should dispose only disposables under a specific key', () => {
        const disposer = new TestDisposer();
        const key = Symbol('test');
        const disposeKeyed = vi.fn();
        const disposeDefault = vi.fn();

        disposer.retainDisposable({ dispose: disposeKeyed }, key);
        disposer.retainDisposable({ dispose: disposeDefault });
        disposer.disposeDisposables(key);

        expect(disposeKeyed).toHaveBeenCalledTimes(1);
        expect(disposeDefault).not.toHaveBeenCalled();
    });

    test('Should not throw when disposing with no retained items', () => {
        const disposer = new TestDisposer();

        expect(() => disposer.disposeDisposables()).not.toThrow();
    });

    test('Should not throw when disposing a nonexistent key', () => {
        const disposer = new TestDisposer();
        const key = Symbol('nonexistent');

        expect(() => disposer.disposeDisposables(key)).not.toThrow();
    });

    test('Should not double-dispose after full dispose', () => {
        const disposer = new TestDisposer();
        const dispose = vi.fn();

        disposer.retainDisposable({ dispose });
        disposer.disposeDisposables();
        disposer.disposeDisposables();

        expect(dispose).toHaveBeenCalledTimes(1);
    });

    test('Should not double-dispose after keyed dispose', () => {
        const disposer = new TestDisposer();
        const key = Symbol('test');
        const dispose = vi.fn();

        disposer.retainDisposable({ dispose }, key);
        disposer.disposeDisposables(key);
        disposer.disposeDisposables(key);

        expect(dispose).toHaveBeenCalledTimes(1);
    });

    test('Should not affect other keys when disposing a specific key', () => {
        const disposer = new TestDisposer();
        const keyA = Symbol('a');
        const keyB = Symbol('b');
        const disposeA = vi.fn();
        const disposeB = vi.fn();

        disposer.retainDisposable({ dispose: disposeA }, keyA);
        disposer.retainDisposable({ dispose: disposeB }, keyB);
        disposer.disposeDisposables(keyA);

        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).not.toHaveBeenCalled();

        disposer.disposeDisposables(keyB);
        expect(disposeB).toHaveBeenCalledTimes(1);
    });

    test('Should handle multiple disposables under the same key', () => {
        const disposer = new TestDisposer();
        const key = Symbol('shared');
        const disposeA = vi.fn();
        const disposeB = vi.fn();
        const disposeC = vi.fn();

        disposer.retainDisposable({ dispose: disposeA }, key);
        disposer.retainDisposable({ dispose: disposeB }, key);
        disposer.retainDisposable({ dispose: disposeC }, key);
        disposer.disposeDisposables(key);

        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).toHaveBeenCalledTimes(1);
        expect(disposeC).toHaveBeenCalledTimes(1);
    });

    test('Should use default key when no key is provided to retain', () => {
        const disposer = new TestDisposer();
        const disposeA = vi.fn();
        const disposeB = vi.fn();

        disposer.retainDisposable({ dispose: disposeA });
        disposer.retainDisposable({ dispose: disposeB });
        disposer.disposeDisposables(Disposer.defaultKey);

        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).toHaveBeenCalledTimes(1);
    });

    test('Should allow retaining new disposables after a full dispose', () => {
        const disposer = new TestDisposer();
        const disposeFirst = vi.fn();
        const disposeSecond = vi.fn();

        disposer.retainDisposable({ dispose: disposeFirst });
        disposer.disposeDisposables();

        disposer.retainDisposable({ dispose: disposeSecond });
        disposer.disposeDisposables();

        expect(disposeFirst).toHaveBeenCalledTimes(1);
        expect(disposeSecond).toHaveBeenCalledTimes(1);
    });

    test('Full dispose should clean up all keys including symbol keys', () => {
        const disposer = new TestDisposer();
        const keyA = Symbol('a');
        const keyB = Symbol('b');
        const disposeDefault = vi.fn();
        const disposeA = vi.fn();
        const disposeB = vi.fn();

        disposer.retainDisposable({ dispose: disposeDefault });
        disposer.retainDisposable({ dispose: disposeA }, keyA);
        disposer.retainDisposable({ dispose: disposeB }, keyB);
        disposer.disposeDisposables();

        expect(disposeDefault).toHaveBeenCalledTimes(1);
        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).toHaveBeenCalledTimes(1);
    });

});
