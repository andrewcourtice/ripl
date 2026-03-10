import type {
    Disposable,
} from '@ripl/utilities';

/** Abstract base class that manages disposable resources, supporting keyed retention and bulk disposal. */
export abstract class Disposer {

    private disposables = new Map<PropertyKey, Disposable[]>();

    public static readonly defaultKey = Symbol('*');

    /** Registers a disposable resource under an optional key for later cleanup. */
    protected retain(value: Disposable, key: PropertyKey = Disposer.defaultKey) {
        const entries = this.disposables.get(key);

        if (entries) {
            entries.push(value);
        } else {
            this.disposables.set(key, [value]);
        }
    }

    /** Disposes all resources under the given key, or all resources if no key is provided. */
    protected dispose(key?: PropertyKey) {
        if (!key) {
            this.disposables.forEach(entries => {
                entries.forEach(entry => entry.dispose());
            });

            this.disposables.clear();

            return;
        }

        const entries = this.disposables.get(key);

        if (entries) {
            entries.forEach(entry => entry.dispose());
            this.disposables.delete(key);
        }
    }
}