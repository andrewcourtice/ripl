import {
    Element,
} from '../core';

import type {
    BaseElementState,
    ElementOptions,
} from '../core';

import {
    measureText,
} from '../context';

import type {
    Context,
} from '../context';

import {
    Box,
} from '../math';

/** State interface for a text element, defining position, content, and optional path-based text layout. */
export interface TextState extends BaseElementState {
    x: number;
    y: number;
    content: string | number;
    pathData?: string;
    startOffset?: number;
}

/** The subset of text metrics needed to build a text bounding box, cached to avoid re-measuring. */
interface TextMeasurement {
    ascent: number;
    left: number;
    descent: number;
    right: number;
}

/** A text element that renders string or numeric content, with optional path-based text layout. */
export class Text extends Element<TextState> {

    private _measureKey?: string;
    private _measurement?: TextMeasurement;

    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    public get content() {
        return this.getStateValue('content');
    }

    public set content(value) {
        this.setStateValue('content', value);
    }

    public get pathData() {
        return this.getStateValue('pathData');
    }

    public set pathData(value) {
        this.setStateValue('pathData', value);
    }

    public get startOffset() {
        return this.getStateValue('startOffset');
    }

    public set startOffset(value) {
        this.setStateValue('startOffset', value);
    }

    constructor(options: ElementOptions<TextState>) {
        super('text', options);
    }

    public getBoundingBox(): Box {
        const {
            ascent,
            left,
            descent,
            right,
        } = this._measure();

        // `x`/`y` only translate the box, so they stay out of the cache key — the box is rebuilt from
        // the cached metrics on every call, while the expensive `measureText` runs only when the
        // content, font, or alignment actually change.
        return new Box(
            this.y - ascent,
            this.x - left,
            this.y + descent,
            this.x + right
        );
    }

    /**
     * Returns the anchor-relative text metrics, measuring only when the content, font, or alignment
     * differ from the last measurement. `measureText` is one of the hottest calls in the pipeline
     * (hit testing, transforms, and gradients all resolve bounding boxes), so caching a single
     * measurement per element — invalidated purely by its own inputs — removes most of that cost
     * for one negligible object.
     */
    private _measure(): TextMeasurement {
        const text = this.content.toString();
        const font = this.font;
        const textAlign = this.textAlign;
        const textBaseline = this.textBaseline;
        const key = `${text} ${font} ${textAlign} ${textBaseline}`;

        if (this._measurement && this._measureKey === key) {
            return this._measurement;
        }

        // Measure with the element's alignment so the anchor-relative `actualBoundingBox*` metrics
        // position the box correctly for any `textAlign`/`textBaseline` (not just start/alphabetic).
        const {
            actualBoundingBoxAscent,
            actualBoundingBoxLeft,
            actualBoundingBoxDescent,
            actualBoundingBoxRight,
        } = measureText(text, {
            font,
            textAlign,
            textBaseline,
        });

        this._measureKey = key;
        this._measurement = {
            ascent: actualBoundingBoxAscent,
            left: actualBoundingBoxLeft,
            descent: actualBoundingBoxDescent,
            right: actualBoundingBoxRight,
        };

        return this._measurement;
    }

    public render(context: Context) {
        return super.render(context, () => {
            const text = context.createText({
                id: this.id,
                x: this.x,
                y: this.y,
                content: this.content.toString(),
                pathData: this.pathData,
                startOffset: this.startOffset,
            });

            if (this.stroke) {
                return context.applyStroke(text);
            }

            if (this.fill) {
                return context.applyFill(text);
            }
        });
    }

}

/** Factory function that creates a new `Text` instance. */
export function createText(...options: ConstructorParameters<typeof Text>) {
    return new Text(...options);
}

/** Type guard that checks whether a value is a `Text` instance. */
export function elementIsText(value: unknown): value is Text {
    return value instanceof Text;
}