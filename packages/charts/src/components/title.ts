import type {
    ChartComponentOptions,
} from './_base';
import {
    ChartComponent,
} from './_base';

import type {
    ChartArea,
} from '../core/layout';

import type {
    ChartTitleOptions,
} from '../core/options';

import {
    normalizePadding,
} from '../core/options';

import type {
    ResolvedAnimation,
} from '../core/animation';

import type {
    Text,
} from '@ripl/core';
import {
    createText,
} from '@ripl/core';

/** Options for constructing a {@link ChartTitle}. */
export interface ChartTitleComponentOptions extends ChartComponentOptions {
    options: ChartTitleOptions;
}

/**
 * Renders a chart title in a reserved layout band. Previously the chart title was parsed but
 * never drawn anywhere; this component draws it and reports the band thickness it needs so the
 * layout can reserve space for it.
 */
export class ChartTitle extends ChartComponent {

    private options: ChartTitleOptions;
    private text?: Text;

    constructor({ scene, renderer, options }: ChartTitleComponentOptions) {
        super({
            scene,
            renderer,
        });
        this.options = options;
    }

    /** Updates the resolved title options. */
    public setOptions(options: ChartTitleOptions) {
        this.options = options;
    }

    /** The side of the chart the title occupies. */
    public get position() {
        return this.options.position;
    }

    /** Whether the title should render (visible and has text). */
    public get visible() {
        return this.options.visible && !!this.options.text;
    }

    private get isVertical() {
        return this.options.position === 'left' || this.options.position === 'right';
    }

    /** Lazily creates the title text element (added directly to the scene — no wrapping group). */
    private ensureText(): Text {
        if (!this.text) {
            this.text = createText({
                id: 'chart-title',
                class: 'chart-title',
                // Sit above the plot/axes but below the tooltip (1000) so tooltips near the
                // top of the chart aren't occluded by the title.
                zIndex: 500,
                content: this.options.text,
                x: 0,
                y: 0,
                textAlign: 'center',
                textBaseline: 'middle',
                fill: this.options.fontColor,
                font: this.options.font,
            });

            this.scene.add(this.text);
        }

        return this.text;
    }

    /** The thickness of the band this title needs (height for top/bottom, width for left/right). */
    public measure(): number {
        if (!this.visible) {
            return 0;
        }

        // The text element already measures itself via getBoundingBox, so reuse it rather than
        // re-deriving the metrics by hand.
        const text = this.ensureText();
        text.content = this.options.text;
        text.font = this.options.font;

        const textHeight = text.getBoundingBox().height;
        const padding = normalizePadding(this.options.padding) ?? {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        };

        return this.isVertical
            ? textHeight + padding.left + padding.right
            : textHeight + padding.top + padding.bottom;
    }

    /** Draws (or repositions) the title centred within the reserved region. */
    public render(region: ChartArea, animation?: ResolvedAnimation) {
        if (!this.visible) {
            this.destroy();
            return;
        }

        const x = region.x + region.width / 2;
        const y = region.y + region.height / 2;

        let rotation = 0;

        if (this.options.position === 'left') {
            rotation = -Math.PI / 2;
        } else if (this.options.position === 'right') {
            rotation = Math.PI / 2;
        }

        const isNew = !this.text;
        const text = this.ensureText();

        text.content = this.options.text;
        text.x = x;
        text.y = y;
        text.fill = this.options.fontColor;
        text.font = this.options.font;
        text.rotation = rotation;
        text.transformOriginX = x;
        text.transformOriginY = y;

        if (isNew && animation?.enabled) {
            text.opacity = 0;

            this.renderer.transition(text, {
                duration: animation.duration,
                ease: animation.ease,
                state: { opacity: 1 },
            });
        } else {
            text.opacity = 1;
        }
    }

    /** Removes the title from the scene. */
    public destroy() {
        if (this.text) {
            this.scene.remove(this.text);
            this.text = undefined;
        }
    }

}
