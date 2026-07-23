import {
    HANDLE_SIZE,
} from './constants';

import type {
    Editor,
} from './editor';

import {
    getShapeBounds,
} from './model';

import {
    Box,
    createRect,
    getContainingBox,
    setColorAlpha,
} from '@ripl/web';

import type {
    Element,
    Point,
} from '@ripl/web';

const SELECTION_COLOR = '#4c9ffe';

/** The eight resize-handle positions around a selection's bounding box. */
export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** A resize handle with its screen-space centre and hit box. */
export interface SelectionHandle {
    /** Which corner/edge the handle controls. */
    id: HandleId;
    /** The handle's centre in screen space. */
    center: Point;
    /** The handle's hit box in screen space. */
    box: Box;
}

/** Computes the combined world-space bounding box of the current selection, or `null` when empty. */
export function getSelectionBounds(editor: Editor): Box | null {
    const shapes = editor.getSelectedShapes();

    if (!shapes.length) {
        return null;
    }

    return getContainingBox(shapes, getShapeBounds);
}

function handleCenters(x: number, y: number, width: number, height: number): Record<HandleId, Point> {
    return {
        'nw': [x, y],
        'n': [x + width / 2, y],
        'ne': [x + width, y],
        'e': [x + width, y + height / 2],
        'se': [x + width, y + height],
        's': [x + width / 2, y + height],
        'sw': [x, y + height],
        'w': [x, y + height / 2],
    };
}

/** Returns the selection's resize handles in screen space (empty when there is no selection). */
export function getSelectionHandles(editor: Editor): SelectionHandle[] {
    const bounds = getSelectionBounds(editor);

    if (!bounds) {
        return [];
    }

    const [x, y] = editor.worldToScreen([bounds.left, bounds.top]);
    const [right, bottom] = editor.worldToScreen([bounds.right, bounds.bottom]);
    const centers = handleCenters(x, y, right - x, bottom - y);
    const half = HANDLE_SIZE;

    return (Object.keys(centers) as HandleId[]).map(id => {
        const [cx, cy] = centers[id];

        return {
            id,
            center: centers[id],
            box: new Box(cy - half, cx - half, cy + half, cx + half),
        };
    });
}

/**
 * Rebuilds the editor's overlay group with the current selection's bounding rectangle and resize
 * handles plus any active marquee — all in untransformed screen space, so handles stay a constant
 * size regardless of zoom. Called whenever the selection, marquee or view transform changes.
 */
export function renderSelectionOverlay(editor: Editor): void {
    const children: Element[] = [];
    const bounds = getSelectionBounds(editor);

    if (bounds) {
        const [x, y] = editor.worldToScreen([bounds.left, bounds.top]);
        const [right, bottom] = editor.worldToScreen([bounds.right, bounds.bottom]);

        children.push(createRect({
            id: 'selection-frame',
            x,
            y,
            width: right - x,
            height: bottom - y,
            stroke: SELECTION_COLOR,
            lineWidth: 1.5,
            pointerEvents: 'none',
        }));

        getSelectionHandles(editor).forEach(handle => {
            children.push(createRect({
                id: `selection-handle-${handle.id}`,
                x: handle.center[0] - HANDLE_SIZE / 2,
                y: handle.center[1] - HANDLE_SIZE / 2,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: 2,
                fill: '#ffffff',
                stroke: SELECTION_COLOR,
                lineWidth: 1.5,
                pointerEvents: 'none',
            }));
        });
    }

    const marquee = editor.marquee;

    if (marquee) {
        const [x, y] = editor.worldToScreen([marquee.left, marquee.top]);
        const [right, bottom] = editor.worldToScreen([marquee.right, marquee.bottom]);

        children.push(createRect({
            id: 'selection-marquee',
            x,
            y,
            width: right - x,
            height: bottom - y,
            fill: setColorAlpha(SELECTION_COLOR, 0.12),
            stroke: SELECTION_COLOR,
            lineWidth: 1,
            lineDash: [4, 4],
            pointerEvents: 'none',
        }));
    }

    editor.overlay.set(children);
}
