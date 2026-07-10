import type {
    PolylineRenderer,
    PolylineRenderFunc,
} from '@ripl/core';
import {
    resolvePolylineRenderer,
} from '@ripl/core';

/**
 * Renderer for a closed area band laid out as `[top..., reversed bottom...]` (area chart). Curves
 * only the top half with the series' line renderer — so the fill's upper edge exactly matches the
 * drawn line — then closes along the lower boundary with straight segments. Running a single curve
 * over the whole loop would smooth through the two side corners and the baseline, pulling the fill
 * away from the line and leaving gaps.
 */
export function areaBandRenderer(lineType?: PolylineRenderer | PolylineRenderFunc): PolylineRenderFunc {
    const renderTop = resolvePolylineRenderer(lineType);

    return (context, path, points) => {
        if (!points.length) {
            return;
        }

        const half = Math.floor(points.length / 2);
        const top = points.slice(0, half);
        const bottom = points.slice(half);

        renderTop(context, path, top);

        // Continue the same subpath down and back along the lower boundary; the fill's implicit
        // close returns to the subpath start (the first top point), sealing the left edge.
        bottom.forEach(([x, y]) => path.lineTo(x, y));
    };
}

/**
 * Renderer for an area band laid out as `[baseline anchor, top..., baseline anchor]` (realtime
 * chart). Curves only the interior line points and joins the two baseline anchors with straight
 * edges, drawing them after the curve so everything stays on one subpath.
 */
export function anchoredAreaRenderer(lineType?: PolylineRenderer | PolylineRenderFunc): PolylineRenderFunc {
    const renderTop = resolvePolylineRenderer(lineType);

    return (context, path, points) => {
        if (points.length < 4) {
            return resolvePolylineRenderer('linear')(context, path, points);
        }

        const first = points[0];
        const last = points[points.length - 1];
        const top = points.slice(1, -1);

        renderTop(context, path, top);

        // Right edge down to the baseline, straight baseline back, implicit close up the left edge.
        path.lineTo(last[0], last[1]);
        path.lineTo(first[0], first[1]);
    };
}
