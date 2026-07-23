import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    createSegmentLabel,
    resolveRadialLabel,
    resolveSegmentLabelLayout,
    SEGMENT_LABEL_FONT,
    SEGMENT_LABEL_INSIDE_FILL,
    SEGMENT_LABEL_OUTSIDE_FILL,
} from '../src/core/labels';

import {
    normalizeSegmentLabels,
} from '../src/core/options';

describe('resolveRadialLabel', () => {
    const base = {
        cx: 0,
        cy: 0,
        startAngle: 0,
        endAngle: Math.PI / 2,
        radius: 100,
        innerRadius: 0,
    };

    it('places the inside anchor at the mid-angle, mid-radius', () => {
        const { inside, mid } = resolveRadialLabel(base);
        expect(mid).toBeCloseTo(Math.PI / 4);
        // insideRadius = 50 at 45deg -> (35.36, 35.36)
        expect(inside.x).toBeCloseTo(Math.SQRT1_2 * 50);
        expect(inside.y).toBeCloseTo(Math.SQRT1_2 * 50);
        expect(inside.textAlign).toBe('center');
        expect(inside.textBaseline).toBe('middle');
    });

    it('builds a 3-point elbow connector for outside labels', () => {
        const { outside } = resolveRadialLabel(base);
        expect(outside.connector).toHaveLength(3);
        // The connector should start on the arc edge (radius 100 at 45deg).
        expect(outside.connector[0][0]).toBeCloseTo(Math.SQRT1_2 * 100);
        expect(outside.connector[0][1]).toBeCloseTo(Math.SQRT1_2 * 100);
    });

    it('flips outside textAlign by hemisphere', () => {
        const right = resolveRadialLabel({
            ...base,
            startAngle: 0,
            endAngle: Math.PI / 2,
        });
        expect(right.outside.textAlign).toBe('left');

        // Mid-angle in the left hemisphere (cos < 0).
        const left = resolveRadialLabel({
            ...base,
            startAngle: Math.PI * 0.75,
            endAngle: Math.PI * 1.25,
        });
        expect(left.outside.textAlign).toBe('right');
    });
});

describe('resolveSegmentLabelLayout', () => {
    const geometry = {
        cx: 0,
        cy: 0,
        startAngle: 0,
        endAngle: Math.PI / 2,
        radius: 100,
        innerRadius: 0,
    };

    it('is hidden (empty content, degenerate connector) when labels are off', () => {
        const layout = resolveSegmentLabelLayout(geometry, normalizeSegmentLabels(false), 'A');
        expect(layout.visible).toBe(false);
        expect(layout.content).toBe('');
        expect(layout.showConnector).toBe(false);
        expect(layout.connector).toHaveLength(2);
        expect(layout.connector[0]).toEqual(layout.connector[1]);
    });

    it('shows inside labels with the white inside fill by default', () => {
        const layout = resolveSegmentLabelLayout(geometry, normalizeSegmentLabels(true), 'A');
        expect(layout.visible).toBe(true);
        expect(layout.content).toBe('A');
        expect(layout.fill).toBe(SEGMENT_LABEL_INSIDE_FILL);
        expect(layout.showConnector).toBe(false);
    });

    it('shows outside labels with a leader line and the outside fill', () => {
        const layout = resolveSegmentLabelLayout(geometry, normalizeSegmentLabels('outside'), 'A');
        expect(layout.visible).toBe(true);
        expect(layout.showConnector).toBe(true);
        expect(layout.connector).toHaveLength(3);
        expect(layout.fill).toBe(SEGMENT_LABEL_OUTSIDE_FILL);
    });

    it('honors a fontColor override', () => {
        const layout = resolveSegmentLabelLayout(geometry, normalizeSegmentLabels({ fontColor: '#123456' }), 'A');
        expect(layout.fill).toBe('#123456');
    });

    it('respects the minimum-angle clutter guard', () => {
        const narrow = {
            ...geometry,
            endAngle: 0.05,
        };
        const layout = resolveSegmentLabelLayout(narrow, normalizeSegmentLabels(true), 'A', 0.15);
        expect(layout.visible).toBe(false);
        expect(layout.content).toBe('');
    });
});

describe('createSegmentLabel', () => {
    it('sets explicit styling so Canvas and SVG render identically', () => {
        const label = createSegmentLabel({
            x: 1,
            y: 2,
            content: 'Hello',
        });
        expect(label.font).toBe(SEGMENT_LABEL_FONT);
        expect(label.fill).toBe(SEGMENT_LABEL_INSIDE_FILL);
        expect(label.textAlign).toBe('center');
        expect(label.textBaseline).toBe('middle');
        expect(label.content).toBe('Hello');
    });

    it('applies overrides', () => {
        const label = createSegmentLabel({
            x: 0,
            y: 0,
            content: 'X',
            fill: '#000',
            font: '600 9px sans-serif',
            textAlign: 'left',
        });
        expect(label.fill).toBe('#000');
        expect(label.font).toBe('600 9px sans-serif');
        expect(label.textAlign).toBe('left');
    });
});
