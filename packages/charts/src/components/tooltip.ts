import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    Group,
    Rect,
    Text,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    createText,
    easeOutQuart,
} from '@ripl/core';

/** Where the tooltip box sits relative to the anchor point. */
export type TooltipPlacement = 'above' | 'center';

/** Options for constructing a tooltip component. */
export interface TooltipOptions extends ChartComponentOptions {
    /** Inner padding between the tooltip text and its box, in pixels. */
    padding?: number;
    /** CSS font shorthand for the tooltip text. */
    font?: string;
    /** Colour of the tooltip text. */
    fontColor?: string;
    /** Fill colour of the tooltip box. */
    backgroundColor?: string;
    /** Stroke colour of the tooltip box border. */
    borderColor?: string;
    /** Corner radius of the tooltip box, in pixels. */
    borderRadius?: number;
    /** Maximum tooltip width before content wraps, in pixels. */
    maxWidth?: number;
    /** Whether long content wraps onto multiple lines. */
    wrap?: boolean;
    /** Transforms the raw content string before it is displayed. */
    formatContent?: (content: string) => string;
    /**
     * Where the box sits relative to the anchor point. `'above'` (default) floats it above the point
     * (best for cartesian markers); `'center'` centres the box on the point (best for radial charts
     * whose anchor is a segment centroid).
     */
    placement?: TooltipPlacement;
}

/** Restyleable tooltip options accepted by {@link Tooltip.setOptions} (everything but the scene/renderer wiring). */
export type TooltipStyleOptions = Partial<Omit<TooltipOptions, 'scene' | 'renderer'>>;

/** A boundary-aware tooltip component that shows text content near the mouse pointer with animated transitions. */
export class Tooltip extends ChartComponent {

    private _group: Group | null = null;
    private _hideTimeout: number | null = null;
    private _padding: number;
    private _font: string;
    private _fontColor: string;
    private _backgroundColor: string;
    private _borderColor: string;
    private _borderRadiusValue: number;
    private _placement: TooltipPlacement;
    private _maxWidth?: number;
    private _wrap: boolean;
    private _formatContent?: (content: string) => string;

    constructor(options: TooltipOptions) {
        const {
            scene,
            renderer,
            padding = 8,
            font = '12px sans-serif',
            fontColor = '#FFFFFF',
            backgroundColor = '#1a1a1a',
            borderColor = '#444444',
            borderRadius = 6,
            placement = 'above',
            maxWidth,
            wrap = false,
            formatContent,
        } = options;

        super({
            scene,
            renderer,
        });

        this._padding = padding;
        this._font = font;
        this._fontColor = fontColor;
        this._backgroundColor = backgroundColor;
        this._borderColor = borderColor;
        this._borderRadiusValue = borderRadius;
        this._placement = placement;
        this._maxWidth = maxWidth;
        this._wrap = wrap;
        this._formatContent = formatContent;
    }

    /** One line's vertical footprint, measured from the current font (with a fallback for zero-metric environments). */
    private get _lineHeight(): number {
        const metrics = this.context.measureText('Mg', this._font);
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        return (height || 12) * 1.35;
    }

    private _measureLine(line: string): number {
        return this.context.measureText(line, this._font).width;
    }

    // Greedy word-wrap of one authored line to the content width; a single overlong word stays whole.
    private _wrapLine(line: string, contentWidth: number): string[] {
        const words = line.split(/\s+/).filter(Boolean);

        if (words.length === 0) {
            return [line];
        }

        const lines: string[] = [];

        let current = words[0];

        for (let index = 1; index < words.length; index++) {
            const candidate = `${current} ${words[index]}`;

            if (this._measureLine(candidate) > contentWidth) {
                lines.push(current);
                current = words[index];
            } else {
                current = candidate;
            }
        }

        lines.push(current);

        return lines;
    }

    // Resolves the display lines: formatted content split on newlines, then word-wrapped to
    // `maxWidth` when wrapping is enabled.
    private _layoutLines(content: string): string[] {
        const formatted = this._formatContent ? this._formatContent(content) : content;
        const authored = formatted.split('\n');

        if (!this._wrap || !this._maxWidth) {
            return authored;
        }

        const contentWidth = Math.max(1, this._maxWidth - this._padding * 2);

        return authored.flatMap(line => this._wrapLine(line, contentWidth));
    }

    /** Shows the tooltip at the given position with the specified text content (newlines start new lines; wrapping applies when enabled). */
    public show(x: number, y: number, content: string) {
        // Clear any pending hide timeout
        if (this._hideTimeout !== null) {
            clearTimeout(this._hideTimeout);
            this._hideTimeout = null;
        }

        if (!this._group) {
            const background = createRect({
                id: 'tooltip-bg',
                fill: this._backgroundColor,
                stroke: this._borderColor,
                lineWidth: 1,
                borderRadius: this._borderRadiusValue,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            });

            this._group = createGroup({
                id: 'tooltip',
                opacity: 0,
                // Above every other overlay (crosshair 1500, legend 2000): the tooltip is
                // transient focused info and must never be occluded.
                zIndex: 2500,
                pointerEvents: 'none',
                children: [background],
            });

            this.scene.add(this._group);
        }

        const background = this._group.query('#tooltip-bg') as Rect;
        const lines = this._layoutLines(content);
        const lineHeight = this._lineHeight;

        // Reconcile one text element per display line, reusing existing ones by index.
        const existing = this._group.queryAll<Text>('text');
        const lineElements = lines.map((line, index) => {
            let element = existing[index];

            if (!element) {
                element = createText({
                    id: `tooltip-line-${index}`,
                    fill: this._fontColor,
                    font: this._font,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    content: '',
                    x: 0,
                    y: 0,
                });

                this._group!.add(element);
            }

            element.content = line;

            return element;
        });

        existing.slice(lines.length).forEach(element => element.destroy());

        const measuredWidth = Math.max(...lines.map(line => this._measureLine(line)));
        const textWidth = measuredWidth || 40;
        const textHeight = lines.length * lineHeight;

        let bgWidth = textWidth + this._padding * 2;
        const bgHeight = textHeight + this._padding * 2;

        if (this._maxWidth) {
            bgWidth = Math.min(bgWidth, this._maxWidth);
        }

        // Horizontally centred on the point; vertically either above it (default) or centred on it.
        let bgX = x - bgWidth / 2;
        let bgY = this._placement === 'center'
            ? y - bgHeight / 2
            : y - bgHeight - 10;

        // Get scene boundaries
        const sceneWidth = this.scene.width;
        const sceneHeight = this.scene.height;
        const offset = 10; // Offset from pointer and edges

        // Boundary aware positioning
        // Check horizontal boundaries
        if (bgX < 0) {
            // Would be cut off on the left
            bgX = offset;
        } else if (bgX + bgWidth > sceneWidth) {
            // Would be cut off on the right
            bgX = sceneWidth - bgWidth - offset;
        }

        // Check vertical boundaries
        if (bgY < 0) {
            // Above placement flips below the point; center placement just clamps to the top edge.
            bgY = this._placement === 'above' ? y + offset : offset;
        } else if (bgY + bgHeight > sceneHeight) {
            // Would be cut off on the bottom
            bgY = sceneHeight - bgHeight - offset;
        }

        background.width = bgWidth;
        background.height = bgHeight;

        const textX = bgX + bgWidth / 2;
        const lineY = (index: number) => bgY + this._padding + lineHeight * (index + 0.5);

        // If tooltip is already visible, smoothly transition position
        const isVisible = (this._group.opacity || 0) > 0.1;

        if (isVisible) {
            // Ensure tooltip stays visible while repositioning
            this._group.opacity = 1;

            this.renderer.transition(background, {
                duration: 150,
                ease: easeOutQuart,
                state: {
                    x: bgX,
                    y: bgY,
                },
            });

            lineElements.forEach((element, index) => {
                this.renderer.transition(element, {
                    duration: 150,
                    ease: easeOutQuart,
                    state: {
                        x: textX,
                        y: lineY(index),
                    },
                });
            });
        } else {
            background.x = bgX;
            background.y = bgY;

            lineElements.forEach((element, index) => {
                element.x = textX;
                element.y = lineY(index);
            });

            this.renderer.transition(this._group, {
                duration: 200,
                ease: easeOutQuart,
                state: {
                    opacity: 1,
                },
            });
        }
    }

    /**
     * Restyles the tooltip in place, updating both the stored options (used for future shows) and
     * any currently rendered tooltip elements. Lets a host chart apply runtime `tooltip` option
     * changes without destroying and recreating the component.
     *
     * @param options - The style options to apply; omitted properties keep their current values.
     */
    public setOptions(options: TooltipStyleOptions): void {
        this._padding = options.padding ?? this._padding;
        this._font = options.font ?? this._font;
        this._fontColor = options.fontColor ?? this._fontColor;
        this._backgroundColor = options.backgroundColor ?? this._backgroundColor;
        this._borderColor = options.borderColor ?? this._borderColor;
        this._borderRadiusValue = options.borderRadius ?? this._borderRadiusValue;
        this._placement = options.placement ?? this._placement;
        this._maxWidth = options.maxWidth ?? this._maxWidth;
        this._wrap = options.wrap ?? this._wrap;
        this._formatContent = options.formatContent ?? this._formatContent;

        if (!this._group) {
            return;
        }

        const background = this._group.query('#tooltip-bg') as Rect | null;

        this._group.queryAll<Text>('text').forEach(line => {
            line.fill = this._fontColor;
            line.font = this._font;
        });

        if (background) {
            background.fill = this._backgroundColor;
            background.stroke = this._borderColor;
            background.borderRadius = this._borderRadiusValue;
        }
    }

    /** Hides the tooltip with a short delay and fade-out animation. */
    public hide() {
        if (!this._group) {
            return;
        }

        // Clear any existing timeout
        if (this._hideTimeout !== null) {
            clearTimeout(this._hideTimeout);
        }

        // Delay the hide by 150ms
        this._hideTimeout = setTimeout(() => {
            if (this._group) {
                this.renderer.transition(this._group, {
                    duration: 200,
                    ease: easeOutQuart,
                    state: {
                        opacity: 0,
                    },
                });
            }
            this._hideTimeout = null;
        }, 150) as unknown as number;
    }

    /** Destroys the tooltip, cancelling any pending hide and removing its elements from the scene. */
    public destroy() {
        if (this._hideTimeout !== null) {
            clearTimeout(this._hideTimeout);
            this._hideTimeout = null;
        }

        this._group?.destroy();
        this._group = null;

        super.destroy();
    }

}

/** Factory function that creates a new `Tooltip` instance. */
export function createTooltip(...options: ConstructorParameters<typeof Tooltip>) {
    return new Tooltip(...options);
}