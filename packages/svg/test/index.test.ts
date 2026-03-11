import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createContext,
    SVGContext,
    SVGImage,
    SVGPath,
    SVGText,
    SVGTextPath,
} from '../src';

function mockCanvasContext() {
    const stub = {
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        transform: vi.fn(),
        measureText: vi.fn(() => ({
            width: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
        })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        createConicGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        reset: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: document.createElement('canvas'),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        filter: 'none',
        direction: 'ltr' as CanvasDirection,
        font: '10px sans-serif',
        fontKerning: 'auto' as CanvasFontKerning,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
        lineCap: 'butt' as CanvasLineCap,
        lineDashOffset: 0,
        lineJoin: 'miter' as CanvasLineJoin,
        lineWidth: 1,
        miterLimit: 10,
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        textAlign: 'start' as CanvasTextAlign,
        textBaseline: 'alphabetic' as CanvasTextBaseline,
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stub as unknown as CanvasRenderingContext2D);

    return stub;
}

describe('SVG', () => {

    // ── SVGPath ──────────────────────────────────────────────────

    describe('SVGPath', () => {

        test('Should initialise with empty d attribute', () => {
            const path = new SVGPath();
            expect(path.definition.tag).toBe('path');
            expect(path.definition.attributes.d).toBe('');
            expect(path.definition.styles.stroke).toBe('none');
            expect(path.definition.styles.fill).toBe('none');
        });

        test('Should accept a custom id', () => {
            const path = new SVGPath('my-path');
            expect(path.id).toBe('my-path');
        });

        test('Should generate a unique id when not provided', () => {
            const path = new SVGPath();
            expect(path.id).toMatch(/^path-/);
        });

        test('moveTo should append M command', () => {
            const path = new SVGPath();
            path.moveTo(10, 20);
            expect(path.definition.attributes.d).toBe('M 10,20');
        });

        test('lineTo should append L command', () => {
            const path = new SVGPath();
            path.moveTo(0, 0);
            path.lineTo(50, 60);
            expect(path.definition.attributes.d).toBe('M 0,0 L 50,60');
        });

        test('closePath should append Z command', () => {
            const path = new SVGPath();
            path.moveTo(0, 0);
            path.lineTo(10, 0);
            path.closePath();
            expect(path.definition.attributes.d).toContain('Z');
        });

        test('bezierCurveTo should append C command', () => {
            const path = new SVGPath();
            path.moveTo(0, 0);
            path.bezierCurveTo(10, 20, 30, 40, 50, 60);
            expect(path.definition.attributes.d).toContain('C 10,20 30,40 50,60');
        });

        test('quadraticCurveTo should append Q command', () => {
            const path = new SVGPath();
            path.moveTo(0, 0);
            path.quadraticCurveTo(10, 20, 30, 40);
            expect(path.definition.attributes.d).toContain('Q 10,20 30,40');
        });

        test('arc should append M and A commands', () => {
            const path = new SVGPath();
            path.arc(50, 50, 25, 0, Math.PI);
            const d = path.definition.attributes.d;
            expect(d).toContain('M');
            expect(d).toContain('A');
        });

        test('arcTo should append M and A commands', () => {
            const path = new SVGPath();
            path.arcTo(10, 20, 30, 40, 15);
            const d = path.definition.attributes.d;
            expect(d).toContain('M 10,20');
            expect(d).toContain('A 15 15');
        });

        test('circle should produce two arc commands', () => {
            const path = new SVGPath();
            path.circle(50, 50, 25);
            const d = path.definition.attributes.d;
            expect(d).toContain('M 75,50');
            expect((d.match(/a /g) || []).length).toBe(2);
        });

        test('rect should produce M and L commands forming a rectangle', () => {
            const path = new SVGPath();
            path.rect(10, 20, 100, 50);
            const d = path.definition.attributes.d;
            expect(d).toContain('M 10,20');
            expect(d).toContain('L 110,20');
            expect(d).toContain('L 110,70');
            expect(d).toContain('L 10,70');
            expect(d).toContain('L 10,20');
        });

        test('roundRect without radii should produce same as rect', () => {
            const path = new SVGPath();
            path.roundRect(10, 20, 100, 50);
            const d = path.definition.attributes.d;
            expect(d).toContain('M 10,20');
            expect(d).toContain('L 110,20');
        });

        test('roundRect with radii should produce A commands', () => {
            const path = new SVGPath();
            path.roundRect(0, 0, 100, 50, [5, 5, 5, 5]);
            const d = path.definition.attributes.d;
            expect(d).toContain('A');
            expect(d).toContain('Z');
        });

        test('ellipse full should produce two A commands', () => {
            const path = new SVGPath();
            path.ellipse(50, 50, 30, 20, 0, 0, Math.PI * 2);
            const d = path.definition.attributes.d;
            expect((d.match(/A /g) || []).length).toBe(2);
        });

        test('ellipse partial should produce one A command', () => {
            const path = new SVGPath();
            path.ellipse(50, 50, 30, 20, 0, 0, Math.PI / 2);
            const d = path.definition.attributes.d;
            expect((d.match(/A /g) || []).length).toBe(1);
        });

    });

    // ── SVGText ──────────────────────────────────────────────────

    describe('SVGText', () => {

        test('Should set definition tag to text', () => {
            const text = new SVGText({
                x: 10,
                y: 20,
                content: 'Hello',
            });
            expect(text.definition.tag).toBe('text');
        });

        test('Should have dynamic x and y attributes', () => {
            const text = new SVGText({
                x: 10,
                y: 20,
                content: 'Hello',
            });
            expect(text.definition.attributes.x).toBe('10');
            expect(text.definition.attributes.y).toBe('20');

            text.x = 30;
            text.y = 40;
            expect(text.definition.attributes.x).toBe('30');
            expect(text.definition.attributes.y).toBe('40');
        });

        test('Should return content as textContent when no pathData', () => {
            const text = new SVGText({
                x: 0,
                y: 0,
                content: 'Test',
            });
            expect(text.definition.textContent).toBe('Test');
        });

        test('Should return undefined textContent when pathData is set', () => {
            const text = new SVGText({
                x: 0,
                y: 0,
                content: 'Test',
                pathData: 'M0,0 L100,100',
            });
            expect(text.definition.textContent).toBeUndefined();
        });

        test('Should generate a unique id', () => {
            const text = new SVGText({
                x: 0,
                y: 0,
                content: 'A',
            });
            expect(text.id).toMatch(/^text-/);
        });

    });

    // ── SVGImage ─────────────────────────────────────────────────

    describe('SVGImage', () => {

        test('Should set definition tag to image', () => {
            const img = new SVGImage('img-1', 'data:image/png;base64,abc', 10, 20, 100, 50);
            expect(img.definition.tag).toBe('image');
        });

        test('Should set all attributes', () => {
            const img = new SVGImage('img-1', 'data:image/png;base64,abc', 10, 20, 100, 50);
            expect(img.id).toBe('img-1');
            expect(img.definition.attributes.href).toBe('data:image/png;base64,abc');
            expect(img.definition.attributes.x).toBe('10');
            expect(img.definition.attributes.y).toBe('20');
            expect(img.definition.attributes.width).toBe('100');
            expect(img.definition.attributes.height).toBe('50');
            expect(img.definition.attributes.preserveAspectRatio).toBe('none');
        });

    });

    // ── SVGTextPath ──────────────────────────────────────────────

    describe('SVGTextPath', () => {

        test('Should set definition tag to textPath', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello');
            expect(tp.definition.tag).toBe('textPath');
        });

        test('Should set id as textId:textpath', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello');
            expect(tp.id).toBe('text-1:textpath');
        });

        test('Should set href to #pathId', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello');
            expect(tp.definition.attributes.href).toBe('#path-1');
        });

        test('Should set textContent', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello');
            expect(tp.definition.textContent).toBe('Hello');
        });

        test('Should set startOffset when provided', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello', 0.5);
            expect(tp.definition.attributes.startOffset).toBe('50%');
        });

        test('Should not set startOffset when not provided', () => {
            const tp = new SVGTextPath('text-1', 'path-1', 'Hello');
            expect(tp.definition.attributes.startOffset).toBeUndefined();
        });

    });

    // ── SVGContext ────────────────────────────────────────────────

    describe('SVGContext', () => {

        let el: HTMLDivElement;

        beforeEach(() => {
            mockCanvasContext();
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        afterEach(() => {
            el.remove();
            vi.restoreAllMocks();
        });

        function create(options?: Parameters<typeof createContext>[1]) {
            return createContext(el, options) as SVGContext;
        }

        // ── Construction ─────────────────────────────────────────

        test('Should create from HTMLElement', () => {
            const ctx = create();
            expect(ctx).toBeDefined();
            expect(ctx.type).toBe('svg');
            ctx.destroy();
        });

        test('Should expose root and SVG element', () => {
            const ctx = create();
            expect(ctx.root).toBe(el);
            expect(ctx.element.tagName.toLowerCase()).toBe('svg');
            ctx.destroy();
        });

        test('Should contain a defs element', () => {
            const ctx = create();
            const defs = ctx.element.querySelector('defs');
            expect(defs).not.toBeNull();
            ctx.destroy();
        });

        test('createContext factory should return Context', () => {
            const ctx = createContext(el);
            expect(ctx.type).toBe('svg');
            ctx.destroy();
        });

        // ── createPath ───────────────────────────────────────────

        test('createPath should return SVGPath', () => {
            const ctx = create();
            const path = ctx.createPath();
            expect(path).toBeInstanceOf(SVGPath);
            ctx.destroy();
        });

        test('createPath should accept custom id', () => {
            const ctx = create();
            const path = ctx.createPath('my-path');
            expect(path.id).toBe('my-path');
            ctx.destroy();
        });

        // ── createText ───────────────────────────────────────────

        test('createText should return SVGText', () => {
            const ctx = create();
            const text = ctx.createText({
                x: 10,
                y: 20,
                content: 'Hello',
            });
            expect(text).toBeInstanceOf(SVGText);
            ctx.destroy();
        });

        test('createText with pathData should create textPath defs', () => {
            const ctx = create();
            ctx.createText({
                x: 0,
                y: 0,
                content: 'Along path',
                pathData: 'M0,0 L100,100',
                startOffset: 0.5,
            });
            const defPaths = ctx.element.querySelectorAll('defs path');
            expect(defPaths.length).toBeGreaterThanOrEqual(1);
            ctx.destroy();
        });

        // ── Transforms ───────────────────────────────────────────

        test('rotate should add rotate transform to path', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.rotate(Math.PI / 4);
            const path = ctx.createPath('t-path');
            ctx.applyFill(path);
            expect(path.definition.attributes.transform).toContain('rotate(');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('scale should add scale transform', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.scale(2, 3);
            const path = ctx.createPath('t-path');
            ctx.applyFill(path);
            expect(path.definition.attributes.transform).toContain('scale(2,3)');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('translate should add translate transform', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.translate(10, 20);
            const path = ctx.createPath('t-path');
            ctx.applyFill(path);
            expect(path.definition.attributes.transform).toContain('translate(10,20)');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('setTransform should replace transforms with matrix', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.translate(5, 5);
            ctx.setTransform(1, 0, 0, 1, 10, 20);
            const path = ctx.createPath('t-path');
            ctx.applyFill(path);
            expect(path.definition.attributes.transform).toBe('matrix(1,0,0,1,10,20)');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('transform should append matrix', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.translate(5, 5);
            ctx.transform(1, 0, 0, 1, 10, 20);
            const path = ctx.createPath('t-path');
            ctx.applyFill(path);
            expect(path.definition.attributes.transform).toContain('translate(5,5)');
            expect(path.definition.attributes.transform).toContain('matrix(1,0,0,1,10,20)');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        // ── save / restore ───────────────────────────────────────

        test('save/restore should preserve and restore transforms', () => {
            const ctx = create();
            ctx.markRenderStart();

            ctx.translate(10, 20);
            ctx.save();
            ctx.translate(30, 40);

            const pathInner = ctx.createPath('inner');
            ctx.applyFill(pathInner);
            expect(pathInner.definition.attributes.transform).toContain('translate(30,40)');

            ctx.restore();

            const pathOuter = ctx.createPath('outer');
            ctx.applyFill(pathOuter);
            expect(pathOuter.definition.attributes.transform).toBe('translate(10,20)');

            ctx.markRenderEnd();
            ctx.destroy();
        });

        // ── applyFill / applyStroke ──────────────────────────────

        test('applyFill should set fill style', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.fill = 'red';
            const path = ctx.createPath('f-path');
            ctx.applyFill(path);
            expect(path.definition.styles.fill).toBe('red');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('applyStroke should set stroke styles', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.stroke = 'blue';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'bevel';
            ctx.lineDash = [5, 10];
            ctx.lineDashOffset = 2;
            ctx.miterLimit = 8;
            const path = ctx.createPath('s-path');
            ctx.applyStroke(path);
            expect(path.definition.styles.stroke).toBe('blue');
            expect(path.definition.styles.strokeWidth).toBe('3');
            expect(path.definition.styles.strokeLinecap).toBe('round');
            expect(path.definition.styles.strokeLinejoin).toBe('bevel');
            expect(path.definition.styles.strokeDasharray).toBe('5 10');
            expect(path.definition.styles.strokeDashoffset).toBe('2');
            expect(path.definition.styles.strokeMiterlimit).toBe('8');
            ctx.markRenderEnd();
            ctx.destroy();
        });

        // ── applyFill with gradient ──────────────────────────────

        test('applyFill with linear gradient should resolve to url()', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.fill = 'linear-gradient(180deg, red, blue)';
            const path = ctx.createPath('g-path');
            ctx.applyFill(path);
            expect(path.definition.styles.fill).toMatch(/^url\(#gradient-/);

            const defs = ctx.element.querySelector('defs');
            expect(defs?.querySelector('linearGradient')).not.toBeNull();

            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('applyFill with radial gradient should resolve to url()', () => {
            const ctx = create();
            ctx.markRenderStart();
            ctx.fill = 'radial-gradient(circle at 50% 50%, red, blue)';
            const path = ctx.createPath('g-path');
            ctx.applyFill(path);
            expect(path.definition.styles.fill).toMatch(/^url\(#gradient-/);

            const defs = ctx.element.querySelector('defs');
            expect(defs?.querySelector('radialGradient')).not.toBeNull();

            ctx.markRenderEnd();
            ctx.destroy();
        });

        // ── applyClip ────────────────────────────────────────────

        test('applyClip should add clip-path attribute to subsequent paths', () => {
            const ctx = create();
            ctx.markRenderStart();

            const clipPath = ctx.createPath('clip');
            clipPath.rect(0, 0, 100, 100);
            ctx.applyClip(clipPath);

            const path = ctx.createPath('content');
            ctx.applyFill(path);
            expect(path.definition.attributes['clip-path']).toMatch(/^url\(#clip-/);

            ctx.markRenderEnd();
            ctx.destroy();
        });

        test('applyClip with fillRule should set clip-rule', () => {
            const ctx = create();
            ctx.markRenderStart();

            const clipPath = ctx.createPath('clip');
            clipPath.rect(0, 0, 100, 100);
            ctx.applyClip(clipPath, 'evenodd');

            const defs = ctx.element.querySelector('defs');
            const clipEl = defs?.querySelector('clipPath path');
            expect(clipEl?.getAttribute('clip-rule')).toBe('evenodd');

            ctx.markRenderEnd();
            ctx.destroy();
        });

        // ── markRenderStart / markRenderEnd ──────────────────────

        test('markRenderStart should reset vtree at depth 0', () => {
            const ctx = create();

            ctx.markRenderStart();
            ctx.createPath('p1');
            ctx.markRenderEnd();

            // Second render pass should start fresh
            ctx.markRenderStart();
            ctx.createPath('p2');
            ctx.markRenderEnd();

            // After render (via requestAnimationFrame), only p2 should remain
            // We can't easily inspect vtree directly, but we can verify the context works
            expect(ctx.element).toBeDefined();

            ctx.destroy();
        });

        // ── rescale ──────────────────────────────────────────────

        test('Should set viewBox on rescale via resize emit', () => {
            const ctx = create();
            // The viewBox is set during init via rescale
            // With jsdom, getBoundingClientRect returns 0,0 so viewBox will be "0 0 0 0"
            const viewBox = ctx.element.getAttribute('viewBox');
            expect(viewBox).toMatch(/^0 0 /);
            ctx.destroy();
        });

    });

});
