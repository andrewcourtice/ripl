import {
    dataURLToBlob,
} from '@ripl/core';

import type {
    ContextExport,
} from '@ripl/core';

/**
 * Builds a {@link ContextExport} from an `HTMLCanvasElement`, shared by every canvas-backed context
 * (Canvas 2D, 3D, WebGPU). The canvas is snapshotted immediately by copying its current pixels onto
 * a detached 2D canvas, so the returned exporters are unaffected by subsequent rendering. This works
 * for any canvas regardless of the API used to draw it, because the source canvas is a valid
 * `drawImage` source even when backed by WebGL/WebGPU, so callers should ensure a frame has been
 * rendered before exporting (WebGPU present textures are transient).
 *
 * Every object URL handed out by `toURL()` is tracked and revoked by `release()`; without that call
 * each one pins its blob for the document's lifetime.
 */
export function createCanvasExport(canvas: HTMLCanvasElement): ContextExport {
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);

    const snapshot = document.createElement('canvas');

    snapshot.width = width;
    snapshot.height = height;

    const context = snapshot.getContext('2d');

    if (!context) {
        throw new Error('Unable to acquire a 2D context for canvas export');
    }

    if (canvas.width > 0 && canvas.height > 0) {
        context.drawImage(canvas, 0, 0);
    }

    const urls = new Set<string>();

    return {
        toString: () => snapshot.toDataURL('image/png'),
        toURL: () => {
            const url = URL.createObjectURL(dataURLToBlob(snapshot.toDataURL('image/png')));

            urls.add(url);

            return url;
        },
        toImage: () => Promise.resolve(context.getImageData(0, 0, width, height)),
        release: () => {
            urls.forEach(url => URL.revokeObjectURL(url));
            urls.clear();
        },
    };
}
