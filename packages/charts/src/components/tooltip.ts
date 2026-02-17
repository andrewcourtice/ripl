import {
    ChartComponent,
    ChartComponentOptions,
} from './_base';

import {
    createGroup,
    createRect,
    createText,
    easeOutQuart,
    Group,
    Rect,
    Text,
} from '@ripl/core';

export interface TooltipOptions extends ChartComponentOptions {
    padding?: number;
    formatContent?: (content: string) => string;
}

export class Tooltip extends ChartComponent {

    private group: Group | null = null;
    private hideTimeout: number | null = null;
    private padding: number;

    constructor(options: TooltipOptions) {
        const {
            scene,
            renderer,
            padding = 8,
        } = options;

        super({
            scene,
            renderer,
        });

        this.padding = padding;
    }

    public show(x: number, y: number, content: string) {
        // Clear any pending hide timeout
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        if (!this.group) {
            const textElement = createText({
                id: 'tooltip-text',
                fillStyle: '#FFFFFF',
                textAlign: 'center',
                textBaseline: 'middle',
                content: '',
                x: 0,
                y: 0,
            });

            const background = createRect({
                id: 'tooltip-bg',
                fillStyle: '#1a1a1a',
                strokeStyle: '#444444',
                lineWidth: 1,
                borderRadius: 6,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            });

            this.group = createGroup({
                id: 'tooltip',
                globalAlpha: 0,
                zIndex: 1000,
                pointerEvents: 'none',
                children: [background, textElement],
            });

            this.scene.add(this.group);
        }

        const textElement = this.group.query('#tooltip-text') as Text;
        const background = this.group.query('#tooltip-bg') as Rect;

        textElement.content = content;

        // Measure text to calculate background size
        const metrics = this.context.measureText(content);
        const textWidth = metrics.width || 40;
        const textHeight = 16; // Approximate text height

        const bgWidth = textWidth + this.padding * 2;
        const bgHeight = textHeight + this.padding * 2;

        // Calculate initial position (centered above the point)
        let bgX = x - bgWidth / 2;
        let bgY = y - bgHeight - 10;

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
            // Would be cut off on the top, position below the point instead
            bgY = y + offset;
        } else if (bgY + bgHeight > sceneHeight) {
            // Would be cut off on the bottom
            bgY = sceneHeight - bgHeight - offset;
        }

        background.width = bgWidth;
        background.height = bgHeight;

        const textX = bgX + bgWidth / 2;
        const textY = bgY + bgHeight / 2;

        // If tooltip is already visible, smoothly transition position
        const isVisible = (this.group.globalAlpha || 0) > 0.1;

        if (isVisible) {
            // Ensure tooltip stays visible while repositioning
            this.group.globalAlpha = 1;

            this.renderer.transition(background, {
                duration: 150,
                ease: easeOutQuart,
                state: {
                    x: bgX,
                    y: bgY,
                },
            });

            this.renderer.transition(textElement, {
                duration: 150,
                ease: easeOutQuart,
                state: {
                    x: textX,
                    y: textY,
                },
            });
        } else {
            background.x = bgX;
            background.y = bgY;
            textElement.x = textX;
            textElement.y = textY;

            this.renderer.transition(this.group, {
                duration: 200,
                ease: easeOutQuart,
                state: {
                    globalAlpha: 1,
                },
            });
        }
    }

    public hide() {
        if (!this.group) {
            return;
        }

        // Clear any existing timeout
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
        }

        // Delay the hide by 150ms
        this.hideTimeout = setTimeout(() => {
            if (this.group) {
                this.renderer.transition(this.group, {
                    duration: 200,
                    ease: easeOutQuart,
                    state: {
                        globalAlpha: 0,
                    },
                });
            }
            this.hideTimeout = null;
        }, 150) as unknown as number;
    }

}

export function createTooltip(...options: ConstructorParameters<typeof Tooltip>) {
    return new Tooltip(...options);
}