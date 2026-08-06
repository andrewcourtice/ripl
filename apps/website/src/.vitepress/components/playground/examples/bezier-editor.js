import {
    createCircle,
    createPath,
    createPolyline,
    createText,
} from '@ripl/web';

const FILL_IDLE = '#6366f1';
const FILL_HOVER = '#a5b4fc';
const FILL_DRAG = '#f59e0b';

function getAnchors() {
    const {
        width,
        height,
    } = context;

    return [
        [width * 0.15, height * 0.75],
        [width * 0.35, height * 0.2],
        [width * 0.65, height * 0.8],
        [width * 0.85, height * 0.25],
    ];
}

const handles = getAnchors().map(([cx, cy]) => createCircle({
    cx,
    cy,
    radius: 9,
    fill: FILL_IDLE,
    stroke: '#ffffff',
    lineWidth: 2,
}));

const hull = createPolyline({
    points: [],
    stroke: '#94a3b8',
    lineWidth: 1,
    lineDash: [6, 6],
});

// The renderer reads the handle elements, so a cached path would keep redrawing the first frame's curve.
const curve = createPath({
    x: 0,
    y: 0,
    width: context.width,
    height: context.height,
    stroke: FILL_IDLE,
    lineWidth: 3,
    cachePath: false,
    pathRenderer: path => {
        const [start, cp1, cp2, end] = handles;

        path.moveTo(start.cx, start.cy);
        path.bezierCurveTo(cp1.cx, cp1.cy, cp2.cx, cp2.cy, end.cx, end.cy);
    },
});

const hint = createText({
    x: 16,
    y: 16,
    content: 'Drag the control points',
    fill: '#94a3b8',
    font: '13px sans-serif',
    textBaseline: 'top',
});

function syncHull() {
    hull.points = handles.map(handle => [handle.cx, handle.cy]);
}

handles.forEach(handle => {
    let dragging = false;
    let originX = 0;
    let originY = 0;

    handle.on('mouseenter', () => {
        handle.fill = dragging ? FILL_DRAG : FILL_HOVER;
    });

    handle.on('mouseleave', () => {
        handle.fill = dragging ? FILL_DRAG : FILL_IDLE;
    });

    handle.on('dragstart', () => {
        dragging = true;
        originX = handle.cx;
        originY = handle.cy;
        handle.fill = FILL_DRAG;
        handle.radius = 12;
    });

    // `deltaX`/`deltaY` are the total since dragstart, so anchoring on the origin keeps the grab offset.
    handle.on('drag', event => {
        handle.cx = originX + event.data.deltaX;
        handle.cy = originY + event.data.deltaY;
        syncHull();
    });

    handle.on('dragend', () => {
        dragging = false;
        handle.fill = FILL_IDLE;
        handle.radius = 9;
    });
});

context.on('resize', () => {
    getAnchors().forEach(([cx, cy], index) => {
        handles[index].cx = cx;
        handles[index].cy = cy;
    });

    curve.width = context.width;
    curve.height = context.height;
    syncHull();
});

syncHull();

// A handle is hit-testable only after its first render, and only because it registered these listeners itself.
scene.add([hull, curve, hint, ...handles]);
