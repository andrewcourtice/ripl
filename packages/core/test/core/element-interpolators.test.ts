import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createEllipse,
    createRect,
    createText,
    Element,
    interpolateNumber,
    TAU,
} from '../../src';

import type {
    BaseElementState,
    ElementOptions,
    InterpolatorFactory,
} from '../../src';

interface VectorState extends BaseElementState {
    offset: number[];
}

describe('Element interpolator defaults', () => {

    describe('Paint properties', () => {

        test('Should interpolate a gradient fill rather than snapping to an endpoint', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: 'linear-gradient(0deg, #000000 0%, #ffffff 100%)',
            });

            rect.interpolate({ fill: 'linear-gradient(180deg, #ffffff 0%, #000000 100%)' })(0.5);

            expect(rect.fill).toContain('linear-gradient');
            expect(rect.fill).toContain('90deg');
        });

        test('Should interpolate a pattern fill rather than snapping to an endpoint', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: 'pattern(diagonal, #000000, #ffffff, 10)',
            });

            rect.interpolate({ fill: 'pattern(diagonal, #ffffff, #000000, 20)' })(0.5);

            expect(rect.fill).toContain('pattern(diagonal');
            expect(rect.fill).toContain('15');
        });

        test('Should still interpolate a colour fill through the colour channels', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: '#000000',
            });

            rect.interpolate({ fill: '#ffffff' })(1);

            expect(rect.fill).toBe('rgba(255, 255, 255, 1)');
        });

        test('Should snap a paint no declared factory claims', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: 'currentColor',
            });

            const interpolator = rect.interpolate({ fill: 'inherit' });

            interpolator(0.25);
            expect(rect.fill).toBe('currentColor');

            interpolator(0.75);
            expect(rect.fill).toBe('inherit');
        });

    });

    describe('Precedence', () => {

        const doubling: InterpolatorFactory<number> = (valueA, valueB) => position => valueA + (valueB - valueA) * position * 2;
        const halving: InterpolatorFactory<number> = (valueA, valueB) => position => valueA + (valueB - valueA) * position * 0.5;

        test('Should let a construction override beat the element type default', () => {
            const circle = createCircle({
                cx: 0,
                cy: 0,
                radius: 0,
                interpolators: {
                    radius: doubling,
                },
            });

            circle.interpolate({ radius: 100 })(0.5);

            expect(circle.radius).toBe(100);
        });

        test('Should let a per-call override beat a construction override', () => {
            const circle = createCircle({
                cx: 0,
                cy: 0,
                radius: 0,
                interpolators: {
                    radius: doubling,
                },
            });

            circle.interpolate({ radius: 100 }, { radius: halving })(0.5);

            expect(circle.radius).toBe(25);
        });

    });

    describe('Resolution', () => {

        test('Should take the first factory in a list whose predicate claims the value', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            rect.interpolate({ x: 100 }, { x: [doublingUnclaimed, interpolateNumber] })(0.5);

            expect(rect.x).toBe(50);
        });

        test('Should use a factory carrying no predicate unconditionally', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            const untested = ((valueA: number, valueB: number) => () => valueA + valueB) as InterpolatorFactory<number>;

            rect.interpolate({ x: 100 }, { x: untested })(0.5);

            expect(rect.x).toBe(100);
        });

        test('Should snap when no factory in the declared list claims the value', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            rect.interpolate({ x: 100 }, { x: doublingUnclaimed })(0.75);

            expect(rect.x).toBe(100);
        });

        const doublingUnclaimed = Object.assign(
            (valueA: number, valueB: number) => (position: number) => valueA + (valueB - valueA) * position * 2,
            { test: () => false }
        ) as InterpolatorFactory<number>;

    });

    describe('Element type defaults', () => {

        test('Should keep a scalar border radius finite when it grows into four corners', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                borderRadius: 8,
            });

            const interpolator = rect.interpolate({ borderRadius: [4, 8, 4, 8] });

            interpolator(0.5);
            expect(rect.borderRadius).toEqual([6, 8, 6, 8]);

            interpolator(1);
            expect(rect.borderRadius).toEqual([4, 8, 4, 8]);
        });

        test('Should snap text content that reads as a colour rather than tweening it', () => {
            const text = createText({
                x: 0,
                y: 0,
                content: 'red',
            });

            const interpolator = text.interpolate({ content: 'blue' });

            interpolator(0.25);
            expect(text.content).toBe('red');

            interpolator(0.75);
            expect(text.content).toBe('blue');
        });

        test('Should interpolate numeric text content', () => {
            const text = createText({
                x: 0,
                y: 0,
                content: 0,
            });

            text.interpolate({ content: 100 })(0.5);

            expect(text.content).toBeCloseTo(50, 5);
        });

        test('Should interpolate a line dash pattern longer than four entries', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                lineDash: [0, 0, 0, 0, 0, 0],
            });

            rect.interpolate({ lineDash: [10, 20, 30, 40, 50, 60] })(0.5);

            expect(rect.lineDash).toEqual([5, 10, 15, 20, 25, 30]);
        });

        test('Should interpolate an undeclared numeric array component-wise, whatever its length', () => {
            const element = new Element<VectorState>('vectored', { offset: [0, 0, 0] });

            const interpolator = element.interpolate({ offset: [10, 20, 30] });

            interpolator(0.5);
            expect(element.$state.offset).toEqual([5, 10, 15]);

            interpolator(1);
            expect(element.$state.offset).toHaveLength(3);
        });

    });

    describe('Transform properties', () => {

        test('Should interpolate rotation through its unit rather than as a plain number', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                rotation: '0deg',
            });

            rect.interpolate({ rotation: '90deg' })(0.5);

            expect(rect.rotation).toBe('45deg');
        });

        test('Should interpolate a percentage transform origin', () => {
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                transformOriginX: '0%',
            });

            rect.interpolate({ transformOriginX: '100%' })(0.5);

            expect(rect.transformOriginX).toBe('50%');
        });

        test('Should interpolate an ellipse rotation, which narrows the base property to a number', () => {
            const ellipse = createEllipse({
                cx: 0,
                cy: 0,
                radiusX: 10,
                radiusY: 5,
                startAngle: 0,
                endAngle: TAU,
                rotation: 0,
            });

            ellipse.interpolate({ rotation: Math.PI })(0.5);

            expect(ellipse.rotation).toBeCloseTo(Math.PI / 2, 5);
        });

    });

    describe('Custom elements', () => {

        interface TaggedState extends BaseElementState {
            weight: number;
        }

        const interpolateWeight = Object.assign(
            (valueA: number, valueB: number) => (position: number) => Math.round(valueA + (valueB - valueA) * position),
            { test: (value: unknown) => typeof value === 'number' }
        ) as InterpolatorFactory<number>;

        class Tagged extends Element<TaggedState> {

            public get weight() {
                return this.getStateValue('weight');
            }

            constructor(options: ElementOptions<TaggedState>) {
                const {
                    interpolators,
                    ...rest
                } = options;

                super('tagged', {
                    ...rest,
                    interpolators: {
                        weight: interpolateWeight,
                        ...interpolators,
                    },
                });
            }

        }

        test('Should resolve a bespoke state property with no global registration', () => {
            const element = new Tagged({ weight: 0 });

            element.interpolate({ weight: 10 })(0.44);

            expect(element.weight).toBe(4);
        });

        test('Should still resolve inherited base properties', () => {
            const element = new Tagged({
                weight: 0,
                opacity: 0,
            });

            element.interpolate({ opacity: 1 })(0.5);

            expect(element.$state.opacity).toBeCloseTo(0.5, 5);
        });

    });

});
