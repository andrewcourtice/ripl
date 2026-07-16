import {
    DASH_PATTERN,
    HIGHLIGHTER_ALPHA,
} from './constants';

import {
    drawArrowhead,
    routeConnector,
} from './connectors';

import type {
    RiplDocument,
    Shape,
} from './model';

import {
    createEllipse,
    createGroup,
    createLine,
    createPath,
    createPolyline,
    createRect,
    createText,
    easeOutCubic,
    setColorAlpha,
} from '@ripl/web';

import type {
    Element,
    Group,
    Line,
    Path,
    Polyline,
    Rect,
    Renderer,
    Text,
} from '@ripl/web';

import {
    arrayJoin,
} from '@ripl/utilities';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const ENTER_DURATION = 160;

/** Creates the bare Ripl element (with stable ids) for a shape kind; state is filled in by {@link applyShape}. */
function createElementForShape(shape: Shape): Element {
    if (shape.type === 'freehand') {
        return createPolyline({
            id: shape.id,
            points: [],
            renderer: 'catmullRom',
            autoFill: false,
        });
    }

    if (shape.type === 'path') {
        return createPolyline({
            id: shape.id,
            points: [],
            renderer: 'linear',
        });
    }

    if (shape.type === 'rect') {
        return createRect({
            id: shape.id,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        });
    }

    if (shape.type === 'ellipse') {
        return createEllipse({
            id: shape.id,
            cx: 0,
            cy: 0,
            radiusX: 0,
            radiusY: 0,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
        }) as unknown as Element;
    }

    if (shape.type === 'line') {
        return createLine({
            id: shape.id,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
        });
    }

    if (shape.type === 'text') {
        return createText({
            id: shape.id,
            x: 0,
            y: 0,
            content: '',
        });
    }

    return createGroup({
        id: shape.id,
        children: [
            createPolyline({
                id: `${shape.id}__line`,
                points: [],
                renderer: 'linear',
                autoFill: false,
            }),
            createPath({
                id: `${shape.id}__arrow`,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                autoStroke: false,
            }),
        ],
    });
}

function applyStrokeShape(element: Polyline | Line, shape: Shape): void {
    element.stroke = shape.stroke;
    element.lineWidth = shape.strokeWidth;
    element.lineCap = 'round';
    element.lineJoin = 'round';
    element.lineDash = shape.dash ? [...DASH_PATTERN] : [];
    element.opacity = shape.opacity;
    element.zIndex = shape.zIndex;
}

function applyFreehand(element: Polyline, shape: Extract<Shape, { type: 'freehand' }>): void {
    element.points = shape.points;
    element.stroke = shape.highlighter ? setColorAlpha(shape.stroke, HIGHLIGHTER_ALPHA) : shape.stroke;
    element.lineWidth = shape.strokeWidth;
    element.lineCap = 'round';
    element.lineJoin = 'round';
    element.opacity = shape.opacity;
    element.zIndex = shape.zIndex;
    element.globalCompositeOperation = shape.highlighter ? 'multiply' : 'source-over';
}

function applyConnector(group: Group, shape: Extract<Shape, { type: 'connector' }>): void {
    const route = routeConnector(shape);
    const line = group.query(`#${shape.id}__line`) as Polyline | undefined;
    const arrow = group.query(`#${shape.id}__arrow`) as Path | undefined;

    group.opacity = shape.opacity;
    group.zIndex = shape.zIndex;

    if (line) {
        line.points = route;
        line.stroke = shape.stroke;
        line.lineWidth = shape.strokeWidth;
        line.lineCap = 'round';
        line.lineJoin = 'round';
        line.lineDash = shape.dash ? [...DASH_PATTERN] : [];
    }

    if (arrow) {
        arrow.fill = shape.stroke;
        arrow.setPathRenderer(path => drawArrowhead(path, route));
    }
}

/** Writes a shape record's full state onto its (already-created) Ripl element. */
export function applyShape(element: Element, shape: Shape): void {
    if (shape.type === 'freehand') {
        applyFreehand(element as Polyline, shape);
        return;
    }

    if (shape.type === 'path') {
        const polyline = element as Polyline;

        polyline.points = shape.closed && shape.points.length > 2
            ? [...shape.points, shape.points[0]]
            : shape.points;
        polyline.fill = shape.fill ?? undefined;
        applyStrokeShape(polyline, shape);
        return;
    }

    if (shape.type === 'rect') {
        const rect = element as Rect;

        rect.x = shape.x;
        rect.y = shape.y;
        rect.width = shape.width;
        rect.height = shape.height;
        rect.borderRadius = shape.radius;
        rect.fill = shape.fill ?? undefined;
        rect.stroke = shape.stroke;
        rect.lineWidth = shape.strokeWidth;
        rect.lineDash = shape.dash ? [...DASH_PATTERN] : [];
        rect.opacity = shape.opacity;
        rect.zIndex = shape.zIndex;
        return;
    }

    if (shape.type === 'ellipse') {
        const ellipse = element as unknown as {
            cx: number;
            cy: number;
            radiusX: number;
            radiusY: number;
            fill: string | undefined;
            stroke: string;
            lineWidth: number;
            lineDash: number[];
            opacity: number;
            zIndex: number;
        };

        ellipse.cx = shape.x + shape.width / 2;
        ellipse.cy = shape.y + shape.height / 2;
        ellipse.radiusX = Math.abs(shape.width) / 2;
        ellipse.radiusY = Math.abs(shape.height) / 2;
        ellipse.fill = shape.fill ?? undefined;
        ellipse.stroke = shape.stroke;
        ellipse.lineWidth = shape.strokeWidth;
        ellipse.lineDash = shape.dash ? [...DASH_PATTERN] : [];
        ellipse.opacity = shape.opacity;
        ellipse.zIndex = shape.zIndex;
        return;
    }

    if (shape.type === 'line') {
        const line = element as Line;

        line.x1 = shape.x1;
        line.y1 = shape.y1;
        line.x2 = shape.x2;
        line.y2 = shape.y2;
        applyStrokeShape(line, shape);
        return;
    }

    if (shape.type === 'text') {
        const text = element as Text;

        text.x = shape.x;
        text.y = shape.y;
        text.content = shape.content;
        text.font = `600 ${shape.fontSize}px ${FONT_FAMILY}`;
        text.fill = shape.fill ?? shape.stroke;
        text.textBaseline = 'top';
        text.opacity = shape.opacity;
        text.zIndex = shape.zIndex;
        return;
    }

    applyConnector(element as Group, shape);
}

/**
 * Reconciles a document into a world {@link Group}, diffing desired shapes against the currently
 * rendered elements with {@link arrayJoin}: unmatched shapes enter (new elements, faded in),
 * matched shapes update in place, and orphaned elements exit (destroyed). The `elements` map is
 * kept in sync and returned for the caller's live-edit lookups.
 */
export function reconcile(
    world: Group,
    elements: Map<string, Element>,
    document: RiplDocument,
    renderer?: Renderer
): void {
    document.forEach((shape, index) => {
        shape.zIndex = index;
    });

    const existing = [...elements.values()];

    const {
        left: enters,
        inner: updates,
        right: exits,
    } = arrayJoin(document, existing, (shape, element) => element.id === shape.id);

    exits.forEach(element => {
        elements.delete(element.id);
        world.remove(element);
        element.destroy();
    });

    updates.forEach(([shape, element]) => applyShape(element, shape));

    enters.forEach(shape => {
        const element = createElementForShape(shape);

        applyShape(element, shape);
        elements.set(shape.id, element);
        world.add(element);

        if (!renderer) {
            return;
        }

        const target = shape.opacity;

        element.opacity = 0;
        renderer.transition(element, {
            duration: ENTER_DURATION,
            ease: easeOutCubic,
            state: {
                opacity: target,
            },
        });
    });
}

/** Applies a single shape's state to its live element without a structural diff (used during drags). */
export function refreshElement(elements: Map<string, Element>, shape: Shape): void {
    const element = elements.get(shape.id);

    if (element) {
        applyShape(element, shape);
    }
}
