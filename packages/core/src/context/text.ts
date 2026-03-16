import type {
    ContextElement,
    TextOptions,
} from './types';

import {
    stringUniqueId,
} from '@ripl/utilities';

/** A virtual text element capturing position, content, and optional path-based text layout. */
export class ContextText implements ContextElement {

    public readonly id: string;

    public x: number;
    public y: number;
    public content: string;
    public maxWidth?: number;
    public pathData?: string;
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