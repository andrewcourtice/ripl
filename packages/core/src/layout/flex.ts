import {
    Layout,
} from './layout';

import type {
    LayoutOptions,
    LayoutState,
} from './layout';

import type {
    Element,
} from '../core';

/** Main-axis direction of a flex container. */
export type FlexDirection = 'row' | 'column';

/** Main-axis distribution of children. */
export type FlexJustify = 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

/** Cross-axis alignment of children. */
export type FlexAlign = 'start' | 'end' | 'center' | 'stretch';

/** State for a flex layout container. */
export interface FlexState extends LayoutState {
    flexDirection?: FlexDirection;
    wrap?: boolean;
    justify?: FlexJustify;
    align?: FlexAlign;
}

interface FlexItem {
    child: Element;
    main: number;
    cross: number;
}

interface FlexLine {
    items: FlexItem[];
    usedMain: number;
    lineCross: number;
}

interface FlexJustification {
    leading: number;
    spacing: number;
}

const EPSILON = 0.01;

/** A flexbox-style layout container that arranges children along a main axis with wrapping and alignment. */
export class Flex extends Layout<FlexState> {

    public get flexDirection(): FlexDirection {
        return this.state.flexDirection ?? 'row';
    }

    public set flexDirection(value: FlexDirection) {
        this.setStateValue('flexDirection', value);
    }

    public get wrap(): boolean {
        return this.state.wrap ?? false;
    }

    public set wrap(value: boolean) {
        this.setStateValue('wrap', value);
    }

    public get justify(): FlexJustify {
        return this.state.justify ?? 'start';
    }

    public set justify(value: FlexJustify) {
        this.setStateValue('justify', value);
    }

    public get align(): FlexAlign {
        return this.state.align ?? 'start';
    }

    public set align(value: FlexAlign) {
        this.setStateValue('align', value);
    }

    private get isRow(): boolean {
        return this.flexDirection !== 'column';
    }

    constructor(options: LayoutOptions<FlexState> = {
        x: 0,
        y: 0,
    }) {
        super('flex', options);
    }

    private measureItems(): FlexItem[] {
        const isRow = this.isRow;

        return this.children.map(child => {
            const { width, height } = this.measureChild(child);

            return {
                child,
                main: isRow ? width : height,
                cross: isRow ? height : width,
            };
        });
    }

    private buildLines(items: FlexItem[], availMain?: number): FlexLine[] {
        const gap = this.gap;

        if (!this.wrap || availMain === undefined) {
            return [this.createLine(items, gap)];
        }

        const lines: FlexLine[] = [];

        let current: FlexItem[] = [];
        let running = 0;

        items.forEach(item => {
            const projected = current.length ? running + gap + item.main : item.main;

            if (current.length && projected > availMain) {
                lines.push(this.createLine(current, gap));
                current = [];
                running = 0;
            }

            current.push(item);
            running += (current.length > 1 ? gap : 0) + item.main;
        });

        if (current.length) {
            lines.push(this.createLine(current, gap));
        }

        return lines;
    }

    private createLine(items: FlexItem[], gap: number): FlexLine {
        const usedMain = items.reduce((sum, item) => sum + item.main, 0) + gap * Math.max(0, items.length - 1);
        const lineCross = items.reduce((max, item) => Math.max(max, item.cross), 0);

        return {
            items,
            usedMain,
            lineCross,
        };
    }

    private justifyLine(count: number, usedMain: number, mainSpace: number): FlexJustification {
        const gap = this.gap;
        const free = Math.max(0, mainSpace - usedMain);

        if (this.justify === 'end') {
            return {
                leading: free,
                spacing: gap,
            };
        }

        if (this.justify === 'center') {
            return {
                leading: free / 2,
                spacing: gap,
            };
        }

        if (this.justify === 'space-between' && count > 1) {
            return {
                leading: 0,
                spacing: gap + free / (count - 1),
            };
        }

        if (this.justify === 'space-around' && count > 0) {
            return {
                leading: free / (count * 2),
                spacing: gap + free / count,
            };
        }

        if (this.justify === 'space-evenly' && count > 0) {
            return {
                leading: free / (count + 1),
                spacing: gap + free / (count + 1),
            };
        }

        return {
            leading: 0,
            spacing: gap,
        };
    }

    private crossOffset(itemCross: number, lineCross: number): number {
        if (this.align === 'center') {
            return (lineCross - itemCross) / 2;
        }

        if (this.align === 'end') {
            return lineCross - itemCross;
        }

        return 0;
    }

    private applyStretch(child: Element, lineCross: number): void {
        const property = this.isRow ? 'height' : 'width';
        const target = child as unknown as Record<string, unknown>;

        if (typeof target[property] !== 'number' || Math.abs((target[property] as number) - lineCross) < EPSILON) {
            return;
        }

        target[property] = lineCross;
    }

    protected isRelayoutKey(key: string): boolean {
        return super.isRelayoutKey(key)
            || key === 'flexDirection'
            || key === 'wrap'
            || key === 'justify'
            || key === 'align';
    }

    protected relayout(): void {
        const isRow = this.isRow;
        const gap = this.gap;
        const padding = this.resolvePadding();

        const mainOrigin = isRow ? this.x + padding.left : this.y + padding.top;
        const crossOrigin = isRow ? this.y + padding.top : this.x + padding.left;

        const outerMain = isRow ? this.width : this.height;
        const availMain = outerMain === undefined
            ? undefined
            : outerMain - (isRow ? padding.left + padding.right : padding.top + padding.bottom);

        const items = this.measureItems();
        const lines = this.buildLines(items, availMain);

        const stretch = this.align === 'stretch';

        let contentMain = 0;
        let crossCursor = 0;

        lines.forEach((line, lineIndex) => {
            const mainSpace = availMain ?? line.usedMain;
            const { leading, spacing } = this.justifyLine(line.items.length, line.usedMain, mainSpace);

            let mainCursor = leading;

            line.items.forEach(item => {
                if (stretch) {
                    this.applyStretch(item.child, line.lineCross);
                }

                const cross = stretch ? 0 : this.crossOffset(item.cross, line.lineCross);
                const mainPos = mainOrigin + mainCursor;
                const crossPos = crossOrigin + crossCursor + cross;

                const targetX = isRow ? mainPos : crossPos;
                const targetY = isRow ? crossPos : mainPos;

                this.place(item.child, targetX, targetY);

                mainCursor += item.main + spacing;
            });

            contentMain = Math.max(contentMain, line.usedMain);
            crossCursor += line.lineCross + (lineIndex < lines.length - 1 ? gap : 0);
        });

        const contentCross = crossCursor;
        const contentWidth = isRow ? contentMain : contentCross;
        const contentHeight = isRow ? contentCross : contentMain;

        this.setContentSize(
            contentWidth + padding.left + padding.right,
            contentHeight + padding.top + padding.bottom
        );
    }

}

/** Factory function that creates a new `Flex` container. */
export function createFlex(...options: ConstructorParameters<typeof Flex>) {
    return new Flex(...options);
}

/** Type guard that checks whether a value is a `Flex` container. */
export function elementIsFlex(value: unknown): value is Flex {
    return value instanceof Flex;
}
