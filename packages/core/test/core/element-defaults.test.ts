import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createGroup,
    createRect,
    Element,
    interpolateNumber,
    Shape2D,
} from '../../src';

import type {
    BaseElementState,
    ElementDefaults,
    ElementOptions,
    InterpolatorFactory,
    Shape2DDefaults,
    Shape2DOptions,
} from '../../src';

interface WidgetState extends BaseElementState {
    weight: number;
    label: string;
}

const halving: InterpolatorFactory<number> = (valueA, valueB) => position => valueA + (valueB - valueA) * position * 0.5;

class Widget extends Element<WidgetState> {

    public get weight() {
        return this.getStateValue('weight');
    }

    public get label() {
        return this.getStateValue('label');
    }

    constructor(options: ElementOptions<WidgetState>, defaults?: ElementDefaults<WidgetState>) {
        super('widget', options, {
            weight: 10,
            label: 'default',
            interpolators: {
                weight: interpolateNumber,
            },
            ...defaults,
        });
    }

}

describe('Element defaults', () => {

    describe('State', () => {

        test('Should apply a default for a property the caller omits', () => {
            const widget = new Widget({} as ElementOptions<WidgetState>);

            expect(widget.weight).toBe(10);
            expect(widget.label).toBe('default');
        });

        test('Should let the caller override a default', () => {
            const widget = new Widget({
                weight: 99,
            } as ElementOptions<WidgetState>);

            expect(widget.weight).toBe(99);
            expect(widget.label).toBe('default');
        });

        test('Should let a deeper layer override a shallower one', () => {
            const widget = new Widget({} as ElementOptions<WidgetState>, {
                label: 'deeper',
            });

            expect(widget.label).toBe('deeper');
            expect(widget.weight).toBe(10);
        });

        test('Should keep the built-in transform defaults beneath everything', () => {
            const widget = new Widget({} as ElementOptions<WidgetState>);

            expect(widget.$state.transformScaleX).toBe(1);
            expect(widget.$state.translateX).toBe(0);
        });

    });

    describe('Interpolators', () => {

        test('Should let a caller override an interpolator the element type declares', () => {
            const circle = createCircle({
                cx: 0,
                cy: 0,
                radius: 0,
                interpolators: {
                    radius: halving,
                },
            });

            circle.interpolate({ radius: 100 })(1);

            expect(circle.radius).toBe(50);
        });

        test('Should merge interpolator maps key-wise rather than replacing them', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 0,
                height: 10,
                fill: '#000000',
                interpolators: {
                    x: halving,
                },
            });

            const interpolator = rect.interpolate({
                x: 100,
                width: 100,
                fill: '#ffffff',
            });

            interpolator(1);

            // The override replaces only `x`; `width` keeps the element's default and `fill` the base one.
            expect(rect.x).toBe(50);
            expect(rect.width).toBe(100);
            expect(rect.fill).toBe('rgba(255, 255, 255, 1)');
        });

    });

    describe('Shape2D flags', () => {

        class Panel extends Shape2D<BaseElementState> {

            constructor(options: Shape2DOptions<BaseElementState>, defaults?: Shape2DDefaults<BaseElementState>) {
                super('panel', options, {
                    autoFill: false,
                    ...defaults,
                });
            }

        }

        test('Should apply a flag default the caller omits', () => {
            expect(new Panel({}).autoFill).toBe(false);
            expect(new Panel({}).autoStroke).toBe(true);
        });

        test('Should let the caller override a flag default', () => {
            expect(new Panel({ autoFill: true }).autoFill).toBe(true);
        });

    });


    describe('Group', () => {

        test('Should accept defaults alongside its options', () => {
            const group = createGroup({}, { fill: 'blue' });

            expect(group.fill).toBe('blue');
        });

        test('Should let the caller override a group default', () => {
            const group = createGroup({ fill: 'red' }, { fill: 'blue' });

            expect(group.fill).toBe('red');
        });

    });

});
