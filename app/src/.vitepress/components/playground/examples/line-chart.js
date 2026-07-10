import {
    createCircle,
    createLine,
    createPolyline,
    createText,
    easeOutCubic,
    interpolatePath,
    scaleContinuous,
} from '@ripl/web';


const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VALUE_SCALE = scaleContinuous([0, 1], [40, 120]); // for color interpolation
const VALUES = Array.from({ length: 12 }, () => VALUE_SCALE(Math.random()));
const COLOR = '#6366f1';
const DURATION = 1600;

// All geometry derives from the context size, so the chart fits any
// renderer — canvas, SVG, or a terminal.
function getArea() {
    const marginX = context.width * 0.1;
    const marginY = context.height * 0.12;

    return {
        left: marginX,
        right: context.width - marginX,
        top: marginY,
        bottom: context.height - marginY,
    };
}

function getScales(area) {
    return {
        x: scaleContinuous([0, VALUES.length - 1], [area.left, area.right]),
        y: scaleContinuous([0, Math.max(...VALUES) * 1.1], [area.bottom, area.top]),
    };
}

function getPoints(scales) {
    return VALUES.map((value, index) => [scales.x(index), scales.y(value)]);
}

// --- Build the chart elements (geometry is assigned by layout below) ---

const gridLines = [0, 1, 2, 3].map(() => createLine({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: '#a1a1aa',
    lineWidth: 1,
    opacity: 0,
}));

const tickLabels = gridLines.map(() => createText({
    x: 0,
    y: 0,
    content: '',
    fill: '#9ca3af',
    font: '11px sans-serif',
    textAlign: 'right',
    textBaseline: 'middle',
    opacity: 0,
}));

// Label every other month so narrow viewports (like a terminal) stay legible.
const monthLabels = MONTHS.filter((_, index) => index % 2 === 0).map(month => createText({
    x: 0,
    y: 0,
    content: month,
    fill: '#9ca3af',
    font: '11px sans-serif',
    textAlign: 'center',
    textBaseline: 'top',
    opacity: 0,
}));

const baseline = createLine({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: '#71717a',
    lineWidth: 1,
    opacity: 0,
});

const line = createPolyline({
    points: [],
    renderer: 'spline',
    stroke: COLOR,
    lineWidth: 3,
});

const markers = VALUES.map(() => createCircle({
    cx: 0,
    cy: 0,
    radius: 0,
    fill: '#ffffff',
    stroke: COLOR,
    lineWidth: 2,
}));

// Positions every element for the current context size.
function layout() {
    const area = getArea();
    const scales = getScales(area);
    const points = getPoints(scales);
    // Evenly spaced tick values above the baseline (which marks zero itself).
    const maxDomain = Math.max(...VALUES) * 1.1;
    const ticks = gridLines.map((_, index) => (maxDomain * (index + 1)) / gridLines.length);

    gridLines.forEach((gridLine, index) => {
        const y = scales.y(ticks[index]);
        gridLine.x1 = area.left;
        gridLine.x2 = area.right;
        gridLine.y1 = y;
        gridLine.y2 = y;
    });

    tickLabels.forEach((label, index) => {
        label.content = Math.round(ticks[index]);
        label.x = area.left - 8;
        label.y = scales.y(ticks[index]);
    });

    monthLabels.forEach((label, index) => {
        label.x = scales.x(index * 2);
        label.y = area.bottom + 8;
    });

    baseline.x1 = area.left;
    baseline.x2 = area.right;
    baseline.y1 = area.bottom;
    baseline.y2 = area.bottom;

    line.points = points;

    markers.forEach((marker, index) => {
        marker.cx = points[index][0];
        marker.cy = points[index][1];
    });

    return points;
}

const points = layout();

scene.add([...gridLines, ...tickLabels, ...monthLabels, baseline, line, ...markers]);

// --- Entry animation: the line draws on left→right while markers pop in
// as the front passes them, and the chart furniture fades up. ---

renderer.transition(line, {
    duration: DURATION,
    ease: easeOutCubic,
    state: { points: interpolatePath(points) },
});

renderer.transition(markers, (marker, index, length) => ({
    duration: 350,
    delay: (index / length) * DURATION,
    ease: easeOutCubic,
    state: { radius: 4 },
}));

renderer.transition(gridLines, {
    duration: 600,
    ease: easeOutCubic,
    state: { opacity: 0.35 },
});

renderer.transition([...tickLabels, ...monthLabels, baseline], {
    duration: 600,
    ease: easeOutCubic,
    state: { opacity: 1 },
});

scene.on('resize', layout);
