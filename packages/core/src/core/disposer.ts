import {
    Disposable,
    objectForEach,
} from '@ripl/utilities';

export abstract class Disposer {

    private disposables: Record<string, Disposable[]> = {};

    protected retain(value: Disposable, key: string = '*') {
        this.disposables[key] = (this.disposables[key] ?? []).concat(value);
    }

    protected dispose(key?: string) {
        if (!key) {
            objectForEach(this.disposables, (key, value) => {
                value.forEach(entry => entry.dispose());
            });

            this.disposables = {};

            return;
        }

        if (key in this.disposables) {
            this.disposables[key].forEach(entry => entry.dispose());
            delete this.disposables[key];
        }
    }
}