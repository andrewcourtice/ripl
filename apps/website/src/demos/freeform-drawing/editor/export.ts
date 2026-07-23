import type {
    Editor,
} from './editor';

import {
    getDocumentBounds,
} from './model';

import type {
    RiplDocument,
} from './model';

import {
    reconcile,
} from './reconcile';

import {
    createGroup,
    isGroup,
} from '@ripl/web';

import type {
    Context,
    Element,
    Group,
} from '@ripl/web';

import {
    createContext as createSVGContext,
} from '@ripl/svg';

const EXPORT_PADDING = 32;

/** Triggers a browser download of a URL under the given file name. */
function triggerDownload(url: string, filename: string): void {
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

/**
 * Renders a group's children to a context in paint order, mirroring the scene's push/draw/pop
 * walk. Used for one-shot exports where the scene's debounced instruction rebuild has not run.
 */
function renderGroupContents(context: Context, group: Group): void {
    [...group.children]
        .sort((first, second) => first.zIndex - second.zIndex)
        .forEach(element => {
            if (isGroup(element)) {
                context.pushGroup(element);
                renderGroupContents(context, element as Group);
                context.popGroup();
                return;
            }

            element.render(context);
        });
}

/** Renders a whole document to standalone SVG markup by reconciling it into an offscreen SVG context. */
export function renderDocumentToSVG(document: RiplDocument): string {
    const bounds = getDocumentBounds(document);
    const width = Math.max(1, bounds.width) + EXPORT_PADDING * 2;
    const height = Math.max(1, bounds.height) + EXPORT_PADDING * 2;

    const container = window.document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-99999px';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    window.document.body.appendChild(container);

    const context = createSVGContext(container);
    const world = createGroup({
        translateX: EXPORT_PADDING - bounds.left,
        translateY: EXPORT_PADDING - bounds.top,
    });

    reconcile(world, new Map<string, Element>(), document);

    context.batch(() => {
        context.pushGroup(world);
        renderGroupContents(context, world);
        context.popGroup();
    });

    const markup = context.export().toString();

    context.destroy();
    container.remove();

    return markup;
}

/** Downloads a PNG snapshot of the current canvas view. */
export function exportPNG(editor: Editor): void {
    triggerDownload(editor.exportPNG(), 'ripl-drawing.png');
}

/** Downloads a clean, full-document SVG rendered through Ripl's SVG backend. */
export function exportSVG(editor: Editor): void {
    const markup = renderDocumentToSVG(editor.document);
    const blob = new Blob([markup], {
        type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);

    triggerDownload(url, 'ripl-drawing.svg');
    URL.revokeObjectURL(url);
}
