/** A fixed-capacity cache that evicts the least recently used entry once it is full. */
export interface LRUCache<TKey, TValue> {
    /** The number of entries currently held. */
    readonly size: number;
    /** Reads an entry, marking it as the most recently used, or `undefined` when absent. */
    get(key: TKey): TValue | undefined;
    /** Writes an entry as the most recently used, evicting the least recently used entry when at capacity. */
    set(key: TKey, value: TValue): void;
    /** Tests whether an entry is present without affecting its recency. */
    has(key: TKey): boolean;
    /** Removes an entry, returning whether it was present. */
    delete(key: TKey): boolean;
    /** Removes every entry. */
    clear(): void;
}

/**
 * Creates a bounded {@link LRUCache}, evicting the single least recently used entry when a write
 * exceeds the limit.
 *
 * Recency is tracked by `Map` insertion order: a read re-inserts its key so the oldest key is
 * always the map's first. Preferred over an unbounded memo wherever the key space is open-ended
 * (paint strings, resolved geometry), since evicting one entry keeps every other caller's entry
 * warm — wiping the whole cache at a threshold makes the steady state a permanent miss.
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
    const entries = new Map<TKey, TValue>();
    const maxSize = Math.max(1, Math.floor(limit));

    return {
        get size() {
            return entries.size;
        },
        get(key) {
            if (!entries.has(key)) {
                return undefined;
            }

            const value = entries.get(key)!;

            entries.delete(key);
            entries.set(key, value);

            return value;
        },
        set(key, value) {
            entries.delete(key);

            if (entries.size >= maxSize) {
                entries.delete(entries.keys().next().value!);
            }

            entries.set(key, value);
        },
        has(key) {
            return entries.has(key);
        },
        delete(key) {
            return entries.delete(key);
        },
        clear() {
            entries.clear();
        },
    };
}
