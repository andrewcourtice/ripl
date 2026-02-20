import type {
    Element,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    ArrayJoinPredicate,
} from '@ripl/utilities';

export interface SeriesJoinResult<TData, TElement extends Element> {
    entries: TData[];
    updates: [TData, TElement][];
    exits: TElement[];
}

/**
 * Joins new data against existing elements, automatically destroying exits.
 * Returns entries (new data), updates (matched pairs), and exits (removed elements).
 */
export function seriesJoin<TData, TElement extends Element>(
    data: TData[],
    elements: TElement[],
    predicate: ArrayJoinPredicate<TData, TElement>,
    destroyExits: boolean = true
): SeriesJoinResult<TData, TElement> {
    const {
        left: entries,
        inner: updates,
        right: exits,
    } = arrayJoin(data, elements, predicate);

    if (destroyExits) {
        arrayForEach(exits, element => element.destroy());
    }

    return {
        entries,
        updates,
        exits,
    };
}
