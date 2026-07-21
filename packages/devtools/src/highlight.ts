import type {
    Context,
    Element as RiplElement,
} from '@ripl/core';

let overlay: HTMLDivElement | undefined;

function getOverlay(): HTMLDivElement | undefined {
    if (typeof document === 'undefined') {
        return;
    }

    if (!overlay) {
        overlay = document.createElement('div');

        Object.assign(overlay.style, {
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '2147483646',
            background: 'rgba(111, 168, 220, 0.35)',
            border: '1px solid rgba(77, 144, 254, 0.8)',
            boxSizing: 'border-box',
        });
    }

    if (!overlay.isConnected) {
        document.body.appendChild(overlay);
    }

    return overlay;
}

/**
 * Positions the singleton highlight overlay over an element on the page. The element's world
 * bounding box (CSS pixels relative to the context origin) is scaled by the ratio between the
 * context's on-screen size and its logical size, then offset by the context element's viewport
 * position. A no-op outside browser environments.
 *
 * @param context - The context the element renders into.
 * @param element - The element to highlight.
 */
export function showHighlight(context: Context, element: RiplElement): void {
    const target = getOverlay();

    if (!target) {
        return;
    }

    const rect = context.element.getBoundingClientRect();
    const scaleX = context.width > 0 ? rect.width / context.width : 1;
    const scaleY = context.height > 0 ? rect.height / context.height : 1;
    const box = element.getBoundingBox();

    target.style.left = `${rect.left + box.left * scaleX}px`;
    target.style.top = `${rect.top + box.top * scaleY}px`;
    target.style.width = `${box.width * scaleX}px`;
    target.style.height = `${box.height * scaleY}px`;
}

/** Removes the highlight overlay from the page, if present. Safe to call repeatedly. */
export function clearHighlight(): void {
    overlay?.remove();
}
