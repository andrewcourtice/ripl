import type {
    SVGContextElement,
    SVGContextElementDefinition,
} from './types';

import {
    ContextText,
} from '@ripl/core';

import type {
    TextOptions,
} from '@ripl/core';

/** SVG-specific text element mapping position and content to SVG `<text>` attributes. */
export class SVGText extends ContextText implements SVGContextElement {

    /** The rendering definition describing this text's SVG `<text>` node. */
    public definition: SVGContextElementDefinition;

    constructor(options: TextOptions) {
        super(options);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        this.definition = {
            tag: 'text',
            styles: {
                fill: 'none',
            },
            attributes: {
                get x() {
                    return _this.x.toString();
                },
                get y() {
                    return _this.y.toString();
                },
            },
            get textContent() {
                return _this.pathData ? undefined : _this.content;
            },
        };
    }
}

/** SVG `<textPath>` element for rendering text along a path defined in `<defs>`. */
export class SVGTextPath implements SVGContextElement {

    /** Unique identifier for this element, derived from the owning text element's id. */
    public readonly id: string;
    /** The rendering definition describing this element's SVG `<textPath>` node. */
    public definition: SVGContextElementDefinition;

    constructor(textId: string, pathId: string, content: string, startOffset?: number) {
        this.id = `${textId}:textpath`;

        this.definition = {
            tag: 'textPath',
            styles: {},
            attributes: {
                href: `#${pathId}`,
                ...(startOffset !== undefined ? { startOffset: `${startOffset * 100}%` } : {}),
            },
            textContent: content,
        };
    }
}
