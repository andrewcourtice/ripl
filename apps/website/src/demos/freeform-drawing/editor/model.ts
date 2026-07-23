import {
    Box,
    getContainingBox,
} from '@ripl/web';

import type {
    Point,
} from '@ripl/web';

import {
    numberExtent,
    stringUniqueId,
} from '@ripl/utilities';

/** The discriminating kind of a {@link Shape} record. */
export type ShapeType = 'freehand'
| 'path'
| 'rect'
| 'ellipse'
| 'line'
| 'connector'
| 'text';

/** The side of a shape's bounding box a connector endpoint can bind to. */
export type ConnectorSide = 'top'
| 'right'
| 'bottom'
| 'left';

/** One end of a {@link ConnectorShape} — either bound to a shape's side or pinned to a free world point. */
export interface ConnectorEnd {
    /** The id of the shape this end is bound to, or `undefined` for a free end. */
    shapeId?: string;
    /** The bounding-box side the end attaches to when bound. */
    side?: ConnectorSide;
    /** The end's world-space point (the free position, or the last resolved anchor). */
    point: Point;
}

/** The visual style shared by every {@link Shape}. */
export interface ShapeStyle {
    /** The stroke (outline) color. */
    stroke: string;
    /** The fill color, or `null` for no fill. */
    fill: string | null;
    /** The stroke width, in world units. */
    strokeWidth: number;
    /** The overall opacity, from `0` to `1`. */
    opacity: number;
    /** Whether the stroke is drawn dashed. */
    dash: boolean;
}

/** Fields common to every {@link Shape} record. */
export interface BaseShape extends ShapeStyle {
    /** A stable unique identifier used to reconcile the record with its rendered element. */
    id: string;
    /** The record's shape kind. */
    type: ShapeType;
    /** The paint-order index; higher values render on top. */
    zIndex: number;
}

/** A smoothed freehand stroke captured from pointer movement. */
export interface FreehandShape extends BaseShape {
    /** Discriminator for freehand strokes. */
    type: 'freehand';
    /** The ordered sample points, in world coordinates. */
    points: Point[];
    /** Whether the stroke is drawn as translucent highlighter ink. */
    highlighter: boolean;
}

/** A vector path of straight segments placed anchor-by-anchor with the pen tool. */
export interface PathShape extends BaseShape {
    /** Discriminator for pen paths. */
    type: 'path';
    /** The ordered anchor points, in world coordinates. */
    points: Point[];
    /** Whether the final anchor connects back to the first. */
    closed: boolean;
}

/** An axis-aligned rectangle. */
export interface RectShape extends BaseShape {
    /** Discriminator for rectangles. */
    type: 'rect';
    /** The x-coordinate of the top-left corner. */
    x: number;
    /** The y-coordinate of the top-left corner. */
    y: number;
    /** The width, in world units. */
    width: number;
    /** The height, in world units. */
    height: number;
    /** The corner radius, in world units. */
    radius: number;
}

/** An axis-aligned ellipse described by its bounding box. */
export interface EllipseShape extends BaseShape {
    /** Discriminator for ellipses. */
    type: 'ellipse';
    /** The x-coordinate of the bounding box's top-left corner. */
    x: number;
    /** The y-coordinate of the bounding box's top-left corner. */
    y: number;
    /** The width of the bounding box, in world units. */
    width: number;
    /** The height of the bounding box, in world units. */
    height: number;
}

/** A straight line segment between two points. */
export interface LineShape extends BaseShape {
    /** Discriminator for lines. */
    type: 'line';
    /** The x-coordinate of the start point. */
    x1: number;
    /** The y-coordinate of the start point. */
    y1: number;
    /** The x-coordinate of the end point. */
    x2: number;
    /** The y-coordinate of the end point. */
    y2: number;
}

/** A smart connector whose endpoints can bind to shapes and reroute automatically. */
export interface ConnectorShape extends BaseShape {
    /** Discriminator for connectors. */
    type: 'connector';
    /** The connector's originating end. */
    source: ConnectorEnd;
    /** The connector's terminating end (drawn with an arrowhead). */
    target: ConnectorEnd;
}

/** A single line of text anchored at a point. */
export interface TextShape extends BaseShape {
    /** Discriminator for text. */
    type: 'text';
    /** The x-coordinate of the text's top-left corner. */
    x: number;
    /** The y-coordinate of the text's top-left corner. */
    y: number;
    /** The rendered text content. */
    content: string;
    /** The font size, in world units. */
    fontSize: number;
}

/** Any shape record stored in a {@link RiplDocument}. */
export type Shape = FreehandShape
| PathShape
| RectShape
| EllipseShape
| LineShape
| ConnectorShape
| TextShape;

/** An ordered list of {@link Shape} records — the editor's single source of truth. */
export type RiplDocument = Shape[];

/** Generates a stable unique id for a new shape. */
export function createShapeId(): string {
    return stringUniqueId(10);
}

/** Deep-clones a single shape record so history snapshots never alias live state. */
export function cloneShape<TShape extends Shape>(shape: TShape): TShape {
    return structuredClone(shape);
}

/** Deep-clones a whole document, used to capture immutable undo/redo snapshots. */
export function cloneDocument(document: RiplDocument): RiplDocument {
    return document.map(cloneShape);
}

/** Type guard narrowing a shape to those defined by a point list (freehand strokes and pen paths). */
export function shapeHasPoints(shape: Shape): shape is FreehandShape | PathShape {
    return shape.type === 'freehand' || shape.type === 'path';
}

/**
 * Computes the axis-aligned world-space bounding {@link Box} of a shape. Connectors have no
 * intrinsic box (they follow their bound shapes), so an empty box is returned for them.
 */
export function getShapeBounds(shape: Shape): Box {
    if (shapeHasPoints(shape)) {
        const [left, right] = numberExtent(shape.points, point => point[0]);
        const [top, bottom] = numberExtent(shape.points, point => point[1]);

        return new Box(top, left, bottom, right);
    }

    if (shape.type === 'rect' || shape.type === 'ellipse') {
        return new Box(shape.y, shape.x, shape.y + shape.height, shape.x + shape.width);
    }

    if (shape.type === 'line') {
        return new Box(
            Math.min(shape.y1, shape.y2),
            Math.min(shape.x1, shape.x2),
            Math.max(shape.y1, shape.y2),
            Math.max(shape.x1, shape.x2)
        );
    }

    if (shape.type === 'connector') {
        return new Box(
            Math.min(shape.source.point[1], shape.target.point[1]),
            Math.min(shape.source.point[0], shape.target.point[0]),
            Math.max(shape.source.point[1], shape.target.point[1]),
            Math.max(shape.source.point[0], shape.target.point[0])
        );
    }

    // Text: approximate the box from the anchor and a rough per-glyph advance.
    const width = shape.content.length * shape.fontSize * 0.6;

    return new Box(shape.y, shape.x, shape.y + shape.fontSize, shape.x + width);
}

/** Computes the combined bounding {@link Box} of every shape in a document (empty when there are none). */
export function getDocumentBounds(document: RiplDocument): Box {
    if (!document.length) {
        return Box.empty();
    }

    return getContainingBox(document, getShapeBounds);
}
