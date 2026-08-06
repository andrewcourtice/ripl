/**
 * A fixed-capacity `Map` that evicts the least recently used entry once it is full.
 *
 * Recency is tracked by `Map` insertion order: a read re-inserts its key so the oldest key is
 * always the map's first. Iteration (`keys`, `values`, `entries`, `forEach`, spread) therefore
 * yields entries least recently used first, and neither iterating nor {@link LRUCache.has} affects
 * recency — only {@link LRUCache.get} and {@link LRUCache.set} do.
 *
 * @typeParam TKey - Type of the cache key.
 * @typeParam TValue - Type of the cached value.
 */
export class LRUCache<TKey, TValue> extends Map<TKey, TValue> {

    private _maxSize: number;

    /** Maximum number of entries retained before a write evicts the least recently used entry. */
    public get maxSize() {
        return this._maxSize;
    }

    constructor(limit: number) {
        super();

        this._maxSize = Math.max(1, Math.floor(limit));
    }

    /** Reads an entry, marking it as the most recently used, or `undefined` when absent. */
    public get(key: TKey): TValue | undefined {
        if (!super.has(key)) {
            return undefined;
        }

        const value = super.get(key)!;

        super.delete(key);
        super.set(key, value);

        return value;
    }

    /** Writes an entry as the most recently used, evicting the least recently used entry when at capacity. */
    public set(key: TKey, value: TValue): this {
        super.delete(key);

        if (super.size >= this._maxSize) {
            super.delete(super.keys().next().value!);
        }

        return super.set(key, value);
    }

    // Overridden because the native upserts write through internal slots, skipping eviction entirely.
    /** Reads an entry as the most recently used, inserting `defaultValue` first when absent. */
    public getOrInsert(key: TKey, defaultValue: TValue): TValue {
        if (super.has(key)) {
            return this.get(key)!;
        }

        this.set(key, defaultValue);

        return defaultValue;
    }

    /** Reads an entry as the most recently used, inserting the result of `callback` first when absent. */
    public getOrInsertComputed(key: TKey, callback: (key: TKey) => TValue): TValue {
        if (super.has(key)) {
            return this.get(key)!;
        }

        const value = callback(key);

        this.set(key, value);

        return value;
    }

}

/**
 * Creates a bounded {@link LRUCache}, evicting the single least recently used entry when a write
 * exceeds the limit.
 *
 * Preferred over an unbounded memo wherever the key space is open-ended (paint strings, resolved
 * geometry), since evicting one entry keeps every other caller's entry warm — wiping the whole
 * cache at a threshold makes the steady state a permanent miss.
 *
 * @param limit - Maximum number of entries to retain. Values below `1` are clamped to `1`.
 * @typeParam TKey - Type of the cache key.
 * @typeParam TValue - Type of the cached value.
 * @returns The cache instance.
 * @example
 * const cache = createLRUCache<string, number>(2);
 *
 * cache.set('a', 1);
 * cache.set('b', 2);
 * cache.get('a');
 * cache.set('c', 3); // evicts 'b', the least recently used
 */
export function createLRUCache<TKey, TValue>(limit: number): LRUCache<TKey, TValue> {
    return new LRUCache(limit);
}
