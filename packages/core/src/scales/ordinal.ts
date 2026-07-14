/** A callable ordinal scale mapping discrete domain values to a cycling range of output values. */
export interface OrdinalScale<TDomain = string, TRange = string> {
    /** Maps a domain value to its assigned range value, cycling through the range as needed. */
    (value: TDomain): TRange;
    /** The distinct domain values seen so far, in first-encountered order. */
    domain: TDomain[];
    /** The output values assigned to domain values in order, cycling when exhausted. */
    range: TRange[];
}

/**
 * Creates an ordinal scale mapping each distinct domain value to a value from `range`, cycling when
 * there are more domain values than range values. Unknown values encountered later are assigned the
 * next range slot (so a chart can colour series without pre-declaring every category). Unlike the
 * numeric scales this maps value → value of any type — its most common use is categorical colour.
 */
export function scaleOrdinal<TDomain = string, TRange = string>(domain: TDomain[], range: TRange[]): OrdinalScale<TDomain, TRange> {
    const index = new Map<TDomain, number>();
    const knownDomain: TDomain[] = [];

    domain.forEach(value => {
        if (index.has(value)) {
            return;
        }

        index.set(value, index.size);
        knownDomain.push(value);
    });

    const scale = ((value: TDomain) => {
        let position = index.get(value);

        if (position === undefined) {
            position = index.size;
            index.set(value, position);
            knownDomain.push(value);
        }

        return range[position % range.length];
    }) as OrdinalScale<TDomain, TRange>;

    scale.domain = knownDomain;
    scale.range = range;

    return scale;
}
