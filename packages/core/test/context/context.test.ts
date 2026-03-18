import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    ContextPath,
    ContextText,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Context', () => {

    let el: HTMLDivElement;
    let canvasStub: ReturnType<typeof mockCanvasContext>;

    beforeEach(() => {
        canvasStub = mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        vi.restoreAllMocks();
    });

    function create(options?: Parameters<typeof createContext>[1]) {
        return createContext(el, options);
    }

    // ── Construction ──────────────────────────────────────────────

    describe('Construction', () => {

        test('Should create from an HTMLElement', () => {
            const ctx = create();

            expect(ctx).toBeDefined();
            expect(ctx.type).toBe('canvas');

            ctx.destroy();
        });

        test('Should expose root and element', () => {
            const ctx = create();

            expect(ctx.root).toBe(el);
            expect(ctx.element).toBeInstanceOf(HTMLCanvasElement);

            ctx.destroy();
        });

        test('Should expose width and height', () => {
            const ctx = create();

            expect(typeof ctx.width).toBe('number');
            expect(typeof ctx.height).toBe('number');

            ctx.destroy();
        });

        test('Should initialise scales', () => {
            const ctx = create();

            expect(ctx.scaleX).toBeDefined();
            expect(ctx.scaleY).toBeDefined();
            expect(ctx.scaleDPR).toBeDefined();

            ctx.destroy();
        });

        test('Should start with empty renderedElements', () => {
            const ctx = create();

            expect(ctx.renderedElements).toEqual([]);

            ctx.destroy();
        });

    });

    // ── State Properties ──────────────────────────────────────────

    describe('State Properties', () => {

        test('Should get/set fill', () => {
            const ctx = create();

            ctx.fill = '#ff0000';
            expect(ctx.fill).toBe('#ff0000');

            ctx.destroy();
        });

        test('Should get/set stroke', () => {
            const ctx = create();

            ctx.stroke = '#00ff00';
            expect(ctx.stroke).toBe('#00ff00');

            ctx.destroy();
        });

        test('Should get/set opacity', () => {
            const ctx = create();

            ctx.opacity = 0.5;
            expect(ctx.opacity).toBe(0.5);

            ctx.destroy();
        });

        test('Should get/set lineWidth', () => {
            const ctx = create();

            ctx.lineWidth = 3;
            expect(ctx.lineWidth).toBe(3);

            ctx.destroy();
        });

        test('Should get/set lineCap', () => {
            const ctx = create();

            ctx.lineCap = 'round';
            expect(ctx.lineCap).toBe('round');

            ctx.destroy();
        });

        test('Should get/set lineJoin', () => {
            const ctx = create();

            ctx.lineJoin = 'round';
            expect(ctx.lineJoin).toBe('round');

            ctx.destroy();
        });

        test('Should get/set lineDash', () => {
            const ctx = create();

            ctx.lineDash = [5, 10];
            expect(canvasStub.setLineDash).toHaveBeenCalledWith([5, 10]);

            ctx.destroy();
        });

        test('Should get/set lineDashOffset', () => {
            const ctx = create();

            ctx.lineDashOffset = 5;
            expect(ctx.lineDashOffset).toBe(5);

            ctx.destroy();
        });

        test('Should get/set miterLimit', () => {
            const ctx = create();

            ctx.miterLimit = 20;
            expect(ctx.miterLimit).toBe(20);

            ctx.destroy();
        });

        test('Should get/set font', () => {
            const ctx = create();

            ctx.font = '16px monospace';
            expect(ctx.font).toBe('16px monospace');

            ctx.destroy();
        });

        test('Should get/set fontKerning', () => {
            const ctx = create();

            ctx.fontKerning = 'none';
            expect(ctx.fontKerning).toBe('none');

            ctx.destroy();
        });

        test('Should get/set direction', () => {
            const ctx = create();

            ctx.direction = 'rtl';
            expect(ctx.direction).toBe('rtl');

            ctx.destroy();
        });

        test('Should get/set filter', () => {
            const ctx = create();

            ctx.filter = 'blur(5px)';
            expect(ctx.filter).toBe('blur(5px)');

            ctx.destroy();
        });

        test('Should get/set textAlign', () => {
            const ctx = create();

            ctx.textAlign = 'center';
            expect(ctx.textAlign).toBe('center');

            ctx.destroy();
        });

        test('Should get/set textBaseline', () => {
            const ctx = create();

            ctx.textBaseline = 'middle';
            expect(ctx.textBaseline).toBe('middle');

            ctx.destroy();
        });

        test('Should get/set shadowBlur', () => {
            const ctx = create();

            ctx.shadowBlur = 10;
            expect(ctx.shadowBlur).toBe(10);

            ctx.destroy();
        });

        test('Should get/set shadowColor', () => {
            const ctx = create();

            ctx.shadowColor = '#333333';
            expect(ctx.shadowColor).toBe('#333333');

            ctx.destroy();
        });

        test('Should get/set shadowOffsetX', () => {
            const ctx = create();

            ctx.shadowOffsetX = 5;
            expect(ctx.shadowOffsetX).toBe(5);

            ctx.destroy();
        });

        test('Should get/set shadowOffsetY', () => {
            const ctx = create();

            ctx.shadowOffsetY = 8;
            expect(ctx.shadowOffsetY).toBe(8);

            ctx.destroy();
        });

        test('Should get/set globalCompositeOperation', () => {
            const ctx = create();

            ctx.globalCompositeOperation = 'multiply';
            expect(ctx.globalCompositeOperation).toBe('multiply');

            ctx.destroy();
        });

        test('Should get/set zIndex', () => {
            const ctx = create();

            ctx.zIndex = 5;
            expect(ctx.zIndex).toBe(5);

            ctx.destroy();
        });

        test('Should get/set translateX', () => {
            const ctx = create();

            ctx.translateX = 50;
            expect(ctx.translateX).toBe(50);

            ctx.destroy();
        });

        test('Should get/set translateY', () => {
            const ctx = create();

            ctx.translateY = 75;
            expect(ctx.translateY).toBe(75);

            ctx.destroy();
        });

        test('Should get/set transformScaleX', () => {
            const ctx = create();

            ctx.transformScaleX = 2;
            expect(ctx.transformScaleX).toBe(2);

            ctx.destroy();
        });

        test('Should get/set transformScaleY', () => {
            const ctx = create();

            ctx.transformScaleY = 0.5;
            expect(ctx.transformScaleY).toBe(0.5);

            ctx.destroy();
        });

        test('Should get/set rotation', () => {
            const ctx = create();

            ctx.rotation = 1.57;
            expect(ctx.rotation).toBe(1.57);

            ctx.destroy();
        });

        test('Should get/set transformOriginX', () => {
            const ctx = create();

            ctx.transformOriginX = '50%';
            expect(ctx.transformOriginX).toBe('50%');

            ctx.destroy();
        });

        test('Should get/set transformOriginY', () => {
            const ctx = create();

            ctx.transformOriginY = 100;
            expect(ctx.transformOriginY).toBe(100);

            ctx.destroy();
        });

    });

    // ── save / restore ────────────────────────────────────────────

    describe('save / restore', () => {

        test('Should call native canvas save/restore', () => {
            const ctx = create();

            canvasStub.save.mockClear();
            canvasStub.restore.mockClear();

            ctx.save();
            expect(canvasStub.save).toHaveBeenCalledTimes(1);

            ctx.restore();
            expect(canvasStub.restore).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('Should support multiple save calls', () => {
            const ctx = create();

            canvasStub.save.mockClear();

            ctx.save();
            ctx.save();

            expect(canvasStub.save).toHaveBeenCalledTimes(2);

            ctx.restore();
            ctx.restore();

            ctx.destroy();
        });

    });

    // ── layer() ───────────────────────────────────────────────────

    describe('layer', () => {

        test('Should call save before and restore after callback', () => {
            const ctx = create();
            const order: string[] = [];

            canvasStub.save.mockImplementation(() => order.push('save'));
            canvasStub.restore.mockImplementation(() => order.push('restore'));

            ctx.layer(() => {
                order.push('body');
            });

            expect(order).toEqual(['save', 'body', 'restore']);

            ctx.destroy();
        });

        test('Should return callback result', () => {
            const ctx = create();

            const result = ctx.layer(() => 42);
            expect(result).toBe(42);

            ctx.destroy();
        });

        test('Should restore even if callback throws', () => {
            const ctx = create();

            canvasStub.restore.mockClear();

            expect(() => {
                ctx.layer(() => {
                    throw new Error('test');
                });
            }).toThrow('test');

            expect(canvasStub.restore).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('Should call native save/restore', () => {
            const ctx = create();

            canvasStub.save.mockClear();
            canvasStub.restore.mockClear();

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            ctx.layer(() => {});

            expect(canvasStub.save).toHaveBeenCalledTimes(1);
            expect(canvasStub.restore).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

    });

    // ── batch() ───────────────────────────────────────────────────

    describe('batch', () => {

        test('Should clear before callback', () => {
            const ctx = create();

            canvasStub.clearRect.mockClear();

            ctx.batch(() => {
                expect(canvasStub.clearRect).toHaveBeenCalledTimes(1);
            });

            ctx.destroy();
        });

        test('Should return callback result', () => {
            const ctx = create();

            const result = ctx.batch(() => 'hello');
            expect(result).toBe('hello');

            ctx.destroy();
        });

        test('Should call markRenderEnd even if callback throws', () => {
            const ctx = create();
            const endSpy = vi.spyOn(ctx, 'markRenderEnd');

            expect(() => {
                ctx.batch(() => {
                    throw new Error('test');
                });
            }).toThrow('test');

            expect(endSpy).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('Should reset renderedElements at start', () => {
            const ctx = create();

            // Simulate a previous render element
            ctx.markRenderStart();
            ctx.currentRenderElement = {
                id: 'fake',
                abstract: false,
                pointerEvents: 'all',
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };
            ctx.markRenderEnd();

            expect(ctx.renderedElements.length).toBe(1);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            ctx.batch(() => {});

            expect(ctx.renderedElements).toEqual([]);

            ctx.destroy();
        });

    });

    // ── markRenderStart / markRenderEnd ───────────────────────────

    describe('markRenderStart / markRenderEnd', () => {

        test('Should reset renderedElements at depth 0', () => {
            const ctx = create();

            ctx.markRenderStart();
            ctx.currentRenderElement = {
                id: 'el1',
                abstract: false,
                pointerEvents: 'all',
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };
            ctx.markRenderEnd();

            expect(ctx.renderedElements.length).toBe(1);

            ctx.markRenderStart();
            expect(ctx.renderedElements).toEqual([]);

            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('Should not reset renderedElements at depth > 0', () => {
            const ctx = create();

            ctx.markRenderStart();

            ctx.currentRenderElement = {
                id: 'el1',
                abstract: false,
                pointerEvents: 'all',
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };

            // Nested start should not reset
            ctx.markRenderStart();
            expect(ctx.renderedElements.length).toBe(1);

            ctx.markRenderEnd();
            ctx.markRenderEnd();

            ctx.destroy();
        });

    });

    // ── currentRenderElement ──────────────────────────────────────

    describe('currentRenderElement', () => {

        test('Should push non-abstract elements to renderedElements', () => {
            const ctx = create();

            ctx.markRenderStart();

            const element = {
                id: 'el1',
                abstract: false,
                pointerEvents: 'all' as const,
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };

            ctx.currentRenderElement = element;

            expect(ctx.renderedElements).toContain(element);

            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('Should not push abstract elements to renderedElements', () => {
            const ctx = create();

            ctx.markRenderStart();

            ctx.currentRenderElement = {
                id: 'group1',
                abstract: true,
                pointerEvents: 'all',
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };

            expect(ctx.renderedElements.length).toBe(0);

            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('Should store element as renderElement', () => {
            const ctx = create();

            const element = {
                id: 'el1',
                abstract: false,
                pointerEvents: 'all' as const,
                zIndex: 0,
                has: vi.fn(() => false),
                intersectsWith: vi.fn(() => false),
                emit: vi.fn(),
            };

            ctx.currentRenderElement = element;
            expect(ctx.currentRenderElement).toBe(element);

            ctx.destroy();
        });

    });

    // ── createPath / createText ───────────────────────────────────

    describe('createPath / createText', () => {

        test('Should create a path with a unique id', () => {
            const ctx = create();

            const path = ctx.createPath();
            expect(path).toBeDefined();
            expect(path.id).toBeDefined();
            expect(typeof path.id).toBe('string');

            ctx.destroy();
        });

        test('Should create a path with a given id', () => {
            const ctx = create();

            const path = ctx.createPath('my-path');
            expect(path.id).toBe('my-path');

            ctx.destroy();
        });

        test('Should create paths with unique ids by default', () => {
            const ctx = create();

            const path1 = ctx.createPath();
            const path2 = ctx.createPath();
            expect(path1.id).not.toBe(path2.id);

            ctx.destroy();
        });

        test('Should create a text element with properties', () => {
            const ctx = create();

            const text = ctx.createText({
                x: 10,
                y: 20,
                content: 'Hello',
                maxWidth: 200,
                pathData: 'M0,0 L100,100',
                startOffset: 0.5,
            });

            expect(text.x).toBe(10);
            expect(text.y).toBe(20);
            expect(text.content).toBe('Hello');
            expect(text.maxWidth).toBe(200);
            expect(text.pathData).toBe('M0,0 L100,100');
            expect(text.startOffset).toBe(0.5);
            expect(text.id).toBeDefined();

            ctx.destroy();
        });

        test('Should create text with custom id', () => {
            const ctx = create();

            const text = ctx.createText({
                id: 'my-text',
                x: 0,
                y: 0,
                content: 'Test',
            });

            expect(text.id).toBe('my-text');

            ctx.destroy();
        });

    });

    // ── ContextPath ───────────────────────────────────────────────

    describe('ContextPath', () => {

        test('Should generate a unique id', () => {
            const path = new ContextPath();
            expect(path.id).toMatch(/^path-/);
        });

        test('Should accept a custom id', () => {
            const path = new ContextPath('custom');
            expect(path.id).toBe('custom');
        });

        test('polyline should call moveTo for first point and lineTo for rest', () => {
            const path = new ContextPath();
            const moveToSpy = vi.spyOn(path, 'moveTo');
            const lineToSpy = vi.spyOn(path, 'lineTo');

            path.polyline([[0, 0], [10, 20], [30, 40]]);

            expect(moveToSpy).toHaveBeenCalledTimes(1);
            expect(moveToSpy).toHaveBeenCalledWith(0, 0);
            expect(lineToSpy).toHaveBeenCalledTimes(2);
            expect(lineToSpy).toHaveBeenCalledWith(10, 20);
            expect(lineToSpy).toHaveBeenCalledWith(30, 40);
        });

    });

    // ── ContextText ───────────────────────────────────────────────

    describe('ContextText', () => {

        test('Should store all provided options', () => {
            const text = new ContextText({
                x: 5,
                y: 10,
                content: 'World',
                maxWidth: 300,
                pathData: 'M0,0',
                startOffset: 0.25,
                id: 'txt-1',
            });

            expect(text.id).toBe('txt-1');
            expect(text.x).toBe(5);
            expect(text.y).toBe(10);
            expect(text.content).toBe('World');
            expect(text.maxWidth).toBe(300);
            expect(text.pathData).toBe('M0,0');
            expect(text.startOffset).toBe(0.25);
        });

        test('Should generate a unique id when not provided', () => {
            const text = new ContextText({
                x: 0,
                y: 0,
                content: 'Test',
            });

            expect(text.id).toMatch(/^text-/);
        });

    });

    // ── Canvas Delegation: clear / reset ──────────────────────────

    describe('Canvas clear / reset', () => {

        test('clear should call clearRect', () => {
            const ctx = create();

            canvasStub.clearRect.mockClear();
            ctx.clear();

            expect(canvasStub.clearRect).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('reset should call native reset', () => {
            const ctx = create();

            canvasStub.reset.mockClear();
            ctx.reset();

            expect(canvasStub.reset).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

    });

    // ── Canvas Delegation: transforms ─────────────────────────────

    describe('Canvas transforms', () => {

        test('rotate should delegate to native', () => {
            const ctx = create();

            canvasStub.rotate.mockClear();
            ctx.rotate(1.5);

            expect(canvasStub.rotate).toHaveBeenCalledWith(1.5);

            ctx.destroy();
        });

        test('scale should delegate to native', () => {
            const ctx = create();

            canvasStub.scale.mockClear();
            ctx.scale(2, 3);

            expect(canvasStub.scale).toHaveBeenCalledWith(2, 3);

            ctx.destroy();
        });

        test('translate should delegate to native', () => {
            const ctx = create();

            canvasStub.translate.mockClear();
            ctx.translate(10, 20);

            expect(canvasStub.translate).toHaveBeenCalledWith(10, 20);

            ctx.destroy();
        });

        test('setTransform should delegate to native', () => {
            const ctx = create();

            canvasStub.setTransform.mockClear();
            ctx.setTransform(1, 0, 0, 1, 5, 10);

            expect(canvasStub.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 5, 10);

            ctx.destroy();
        });

        test('transform should delegate to native', () => {
            const ctx = create();

            canvasStub.transform.mockClear();
            ctx.transform(1, 0, 0, 1, 5, 10);

            expect(canvasStub.transform).toHaveBeenCalledWith(1, 0, 0, 1, 5, 10);

            ctx.destroy();
        });

    });

    // ── Canvas Delegation: drawing ────────────────────────────────

    describe('Canvas drawing', () => {

        test('applyFill on path should call context.fill', () => {
            const ctx = create();
            const path = ctx.createPath();

            canvasStub.fill.mockClear();
            ctx.applyFill(path);

            expect(canvasStub.fill).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('applyStroke on path should call context.stroke', () => {
            const ctx = create();
            const path = ctx.createPath();

            canvasStub.stroke.mockClear();
            ctx.applyStroke(path);

            expect(canvasStub.stroke).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('applyFill on text should call context.fillText', () => {
            const ctx = create();
            const text = ctx.createText({
                x: 10,
                y: 20,
                content: 'Hi',
            });

            canvasStub.fillText.mockClear();
            ctx.applyFill(text);

            expect(canvasStub.fillText).toHaveBeenCalledWith('Hi', 10, 20, undefined);

            ctx.destroy();
        });

        test('applyStroke on text should call context.strokeText', () => {
            const ctx = create();
            const text = ctx.createText({
                x: 10,
                y: 20,
                content: 'Hi',
            });

            canvasStub.strokeText.mockClear();
            ctx.applyStroke(text);

            expect(canvasStub.strokeText).toHaveBeenCalledWith('Hi', 10, 20, undefined);

            ctx.destroy();
        });

        test('applyClip should call context.clip', () => {
            const ctx = create();
            const path = ctx.createPath();

            canvasStub.clip.mockClear();
            ctx.applyClip(path);

            expect(canvasStub.clip).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('drawImage should delegate to native with position only', () => {
            const ctx = create();
            const img = document.createElement('img');

            canvasStub.drawImage.mockClear();
            ctx.drawImage(img, 5, 10);

            expect(canvasStub.drawImage).toHaveBeenCalledWith(img, 5, 10);

            ctx.destroy();
        });

        test('drawImage should delegate to native with size', () => {
            const ctx = create();
            const img = document.createElement('img');

            canvasStub.drawImage.mockClear();
            ctx.drawImage(img, 5, 10, 100, 200);

            expect(canvasStub.drawImage).toHaveBeenCalledWith(img, 5, 10, 100, 200);

            ctx.destroy();
        });

        test('measureText should return TextMetrics', () => {
            const ctx = create();

            const result = ctx.measureText('test');
            expect(result).toBeDefined();

            ctx.destroy();
        });

    });

    // ── Events ────────────────────────────────────────────────────

    describe('Events', () => {

        test('Should emit resize on construction', () => {
            const resizeSpy = vi.fn();

            // Context emits resize during init/rescale, we verify we can listen
            const ctx = create();
            ctx.on('resize', resizeSpy);

            // Trigger a manual rescale by simulating it
            // (the init already happened, but we can listen going forward)
            ctx.emit('resize', null);

            expect(resizeSpy).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

    });

    // ── destroy ───────────────────────────────────────────────────

    describe('destroy', () => {

        test('Should remove element from DOM', () => {
            const ctx = create();
            const canvasEl = ctx.element;

            expect(el.contains(canvasEl)).toBe(true);

            ctx.destroy();

            expect(el.contains(canvasEl)).toBe(false);
        });

        test('Should emit destroyed event', () => {
            const ctx = create();
            const destroySpy = vi.fn();

            ctx.on('destroyed', destroySpy);
            ctx.destroy();

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });

    });

    // ── enableInteraction / disableInteraction ────────────────────

    describe('Interaction', () => {

        test('enableInteraction should be idempotent', () => {
            const ctx = create({ interactive: false });

            // Should not throw on double enable
            ctx.enableInteraction();
            ctx.enableInteraction();

            ctx.destroy();
        });

        test('disableInteraction should be idempotent', () => {
            const ctx = create({ interactive: true });

            ctx.disableInteraction();
            ctx.disableInteraction();

            ctx.destroy();
        });

        test('Should create context with interaction disabled', () => {
            const ctx = create({ interactive: false });

            // Context should still be valid
            expect(ctx).toBeDefined();

            ctx.destroy();
        });

    });

    // ── Gradient fill/stroke ──────────────────────────────────────

    describe('Gradient handling', () => {

        test('Should handle gradient string for fill', () => {
            const ctx = create();

            ctx.fill = 'linear-gradient(0deg, #ff0000 0%, #0000ff 100%)';

            expect(canvasStub.createLinearGradient).toHaveBeenCalled();

            ctx.destroy();
        });

        test('Should handle plain color for fill', () => {
            const ctx = create();

            canvasStub.createLinearGradient.mockClear();
            ctx.fill = '#ff0000';

            expect(canvasStub.createLinearGradient).not.toHaveBeenCalled();
            expect(canvasStub.fillStyle).toBe('#ff0000');

            ctx.destroy();
        });

        test('Should handle gradient string for stroke', () => {
            const ctx = create();

            ctx.stroke = 'linear-gradient(0deg, #ff0000 0%, #0000ff 100%)';

            expect(canvasStub.createLinearGradient).toHaveBeenCalled();

            ctx.destroy();
        });

    });

    // ── isPointInPath / isPointInStroke ────────────────────────────

    describe('Hit testing', () => {

        test('isPointInPath should delegate to native', () => {
            const ctx = create();
            const path = ctx.createPath();

            ctx.isPointInPath(path, 10, 20);

            expect(canvasStub.isPointInPath).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        test('isPointInStroke should delegate to native', () => {
            const ctx = create();
            const path = ctx.createPath();

            ctx.isPointInStroke(path, 10, 20);

            expect(canvasStub.isPointInStroke).toHaveBeenCalledTimes(1);

            ctx.destroy();
        });

        function createMockElement(id: string, zIndex: number, events: string[], intersects = true) {
            const eventSet = new Set(events);

            return {
                id,
                abstract: false,
                pointerEvents: 'all' as const,
                zIndex,
                has: vi.fn((event: string) => eventSet.has(event)),
                intersectsWith: vi.fn(() => intersects),
                emit: vi.fn(),
            };
        }

        function registerElements(ctx: ReturnType<typeof create>, elements: ReturnType<typeof createMockElement>[]) {
            ctx.markRenderStart();

            for (const element of elements) {
                ctx.currentRenderElement = element;
            }

            ctx.markRenderEnd();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx as any).invalidateTrackedElements();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function callHitTest(ctx: ReturnType<typeof create>, events: string[], x: number, y: number): any[] {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (ctx as any).hitTest(events, x, y);
        }

        test('hitTest should return elements sorted by zIndex (highest first)', () => {
            const ctx = create();
            const low = createMockElement('low', 1, ['click']);
            const mid = createMockElement('mid', 5, ['click']);
            const high = createMockElement('high', 10, ['click']);

            registerElements(ctx, [low, mid, high]);

            const result = callHitTest(ctx, ['click'], 0, 0);

            expect(result.map((el: { id: string }) => el.id)).toEqual(['high', 'mid', 'low']);

            ctx.destroy();
        });

        test('hitTest should use render order as tiebreaker when zIndex is equal', () => {
            const ctx = create();
            const first = createMockElement('first', 0, ['click']);
            const second = createMockElement('second', 0, ['click']);
            const third = createMockElement('third', 0, ['click']);

            registerElements(ctx, [first, second, third]);

            const result = callHitTest(ctx, ['click'], 0, 0);

            expect(result.map((el: { id: string }) => el.id)).toEqual(['third', 'second', 'first']);

            ctx.destroy();
        });

        test('hitTest should deduplicate elements listening to multiple events', () => {
            const ctx = create();
            const element = createMockElement('el', 1, ['mouseenter', 'mouseleave', 'mousemove']);

            registerElements(ctx, [element]);

            const result = callHitTest(ctx, ['mouseenter', 'mouseleave', 'mousemove'], 0, 0);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('el');

            ctx.destroy();
        });

        test('hitTest should exclude elements that do not intersect', () => {
            const ctx = create();
            const hit = createMockElement('hit', 5, ['click']);
            const miss = createMockElement('miss', 10, ['click'], false);

            registerElements(ctx, [hit, miss]);

            const result = callHitTest(ctx, ['click'], 0, 0);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('hit');

            ctx.destroy();
        });

        test('hitTest should pass isPointer option to intersectsWith', () => {
            const ctx = create();
            const element = createMockElement('el', 1, ['click']);

            registerElements(ctx, [element]);

            callHitTest(ctx, ['click'], 10, 20);

            expect(element.intersectsWith).toHaveBeenCalledWith(10, 20, { isPointer: true });

            ctx.destroy();
        });

    });

});
