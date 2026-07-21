import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue';

import type {
    ComputedRef,
    Ref,
} from 'vue';

/** The currently rendered window of a virtualized list. */
export interface VirtualListRange {
    /** Index of the first rendered row. */
    start: number;
    /** Exclusive index of the last rendered row. */
    end: number;
    /** Height of the spacer above the rendered rows, in pixels. */
    topPad: number;
    /** Height of the spacer below the rendered rows, in pixels. */
    bottomPad: number;
}

/** Handles returned by {@link useVirtualList}. */
export interface UseVirtualList {
    /** The visible slice bounds and spacer heights. */
    range: ComputedRef<VirtualListRange>;
    /** Scroll handler to bind to the viewport element. */
    onScroll(): void;
}

/**
 * Simple fixed-row-height windowing over a scrollable viewport: renders only
 * the rows intersecting the viewport (plus overscan) between two spacers.
 */
export function useVirtualList(
    viewport: Ref<HTMLElement | null>,
    count: ComputedRef<number> | Ref<number>,
    rowHeight: number,
    overscan: number = 10
): UseVirtualList {
    const scrollTop = ref(0);
    const viewportHeight = ref(0);

    let resizeObserver: ResizeObserver | undefined;

    const range = computed<VirtualListRange>(() => {
        const total = count.value;
        const start = Math.max(0, Math.floor(scrollTop.value / rowHeight) - overscan);
        const visible = Math.ceil(viewportHeight.value / rowHeight) + overscan * 2;
        const end = Math.min(total, start + visible);

        return {
            start,
            end,
            topPad: start * rowHeight,
            bottomPad: Math.max(0, (total - end) * rowHeight),
        };
    });

    function onScroll(): void {
        scrollTop.value = viewport.value?.scrollTop ?? 0;
    }

    onMounted(() => {
        const element = viewport.value;

        if (!element) {
            return;
        }

        viewportHeight.value = element.clientHeight;

        resizeObserver = new ResizeObserver(() => {
            viewportHeight.value = element.clientHeight;
        });

        resizeObserver.observe(element);
    });

    onBeforeUnmount(() => resizeObserver?.disconnect());

    return {
        range,
        onScroll,
    };
}
