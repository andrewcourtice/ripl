import {
    ChartComponent,
    ChartComponentOptions,
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

import {
    createGroup,
    createText,
    Group,
    Text,
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
    private group?: Group;

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

    /** The thickness of the band this title needs (height for top/bottom, width for left/right). */
    public measure(): number {
        if (!this.visible) {
            return 0;
        }

        const metrics = this.context.measureText(this.options.text, this.options.font);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
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

        const isNew = !this.group;

        if (!this.group) {
            const text = createText({
                id: 'chart-title-text',
                content: this.options.text,
                x,
                y,
                textAlign: 'center',
                textBaseline: 'middle',
                fill: this.options.fontColor,
                font: this.options.font,
                rotation,
                transformOriginX: x,
                transformOriginY: y,
                opacity: animation?.enabled ? 0 : 1,
            });

            this.group = createGroup({
                id: 'chart-title',
                class: 'chart-title',
                zIndex: 2500,
                children: [text],
            });

            this.scene.add(this.group);
        }

        const text = this.group.query('#chart-title-text') as Text;

        text.content = this.options.text;
        text.x = x;
        text.y = y;
        text.fill = this.options.fontColor;
        text.font = this.options.font;
        text.rotation = rotation;
        text.transformOriginX = x;
        text.transformOriginY = y;

        if (isNew && animation?.enabled) {
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
        if (this.group) {
            this.scene.remove(this.group);
            this.group = undefined;
        }
    }

}
