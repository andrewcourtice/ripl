import type {
    ContextElement,
    TextOptions,
} from './types';

import {
    stringUniqueId,
} from '@ripl/utilities';

/** A virtual text element capturing position, content, and optional path-based text layout. */
export class ContextText implements ContextElement {

    /** Unique identifier for this text element. */
    public readonly id: string;

    /** X coordinate of the text's anchor position. */
    public x: number;
    /** Y coordinate of the text's anchor position. */
    public y: number;
    /** The text string to render. */
    public content: string;
    /** Maximum width, in pixels, the text is scaled to fit within. */
    public maxWidth?: number;
    /** SVG path data along which the text is laid out, for text-on-a-path. */
    public pathData?: string;
    /** Offset along the text path at which rendering begins. */
    public startOffset?: number;

    constructor({
        x,
        y,
        content,
        maxWidth,
        pathData,
        startOffset,
        id = `text-${stringUniqueId()}`,
    }: TextOptions) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.content = content;
        this.maxWidth = maxWidth;
        this.pathData = pathData;
        this.startOffset = startOffset;
    }

}