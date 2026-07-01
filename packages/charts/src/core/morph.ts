/**
 * Point-set morphing helpers for line-like charts (line, area, trend).
 *
 * When a data point is added or removed, the previous and target polyline point arrays differ in
 * length. The core `interpolatePoints` interpolator would equalise them by inserting straight-line
 * waypoints (its default extrapolation), which makes a curved renderer (monotoneX, catmullRom, …)
 * look linear for the whole transition. Passing a `resolveKeys` correspondence to `interpolatePoints`
 * instead matches points by identity and preserves the curve — these helpers build that
 * correspondence from the charts' stable data keys.
 */

/**
 * Builds the correspondence consumed by `interpolatePoints`' `resolveKeys` option: for each key in
 * `newKeys` (parallel to the target points), returns the index of the same key in `prevKeys`, or
 * `-1` when the key is new. Handles append, insert, remove, and reorder uniformly.
 */
export function correspondence(prevKeys: string[], newKeys: string[]): number[] {
    const prevIndex = new Map<string, number>();

    prevKeys.forEach((key, index) => {
        // Keep the first occurrence so duplicate/disambiguated keys map deterministically.
        if (!prevIndex.has(key)) {
            prevIndex.set(key, index);
        }
    });

    return newKeys.map(key => prevIndex.get(key) ?? -1);
}

/** Returns true when two ordered key lists differ in length or in any position (add/remove/reorder). */
export function keysDiffer(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return true;
    }

    return a.some((key, index) => key !== b[index]);
}
