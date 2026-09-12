import {
    defineRiplElement,
    elementFactory,
} from '../core/define-element';

import {
    ELEMENT_STATE_KEYS,
} from '../core/props';

import type {
    RiplComponent,
    RiplElementProps,
} from '../types';

import {
    createArc,
    createCircle,
    createEllipse,
    createGroup,
    createImage,
    createLine,
    createPath,
    createPolygon,
    createPolyline,
    createRect,
    createText,
} from '@ripl/web';

import type {
    Arc,
    ArcState,
    BaseElementState,
    Circle,
    CircleState,
    Ellipse,
    EllipseState,
    Group,
    GroupOptions,
    ImageElement,
    ImageState,
    Line,
    LineState,
    Path,
    PathState,
    Polygon,
    PolygonState,
    Polyline,
    PolylineState,
    Rect,
    RectState,
    Shape2DOptions,
    Text,
    TextState,
} from '@ripl/web';

/**
 * Groups its children, cascading its own state to them and transforming them as a unit.
 *
 * @example
 * <ripl-group fill="#f00" :translate-x="20">
 *     <ripl-circle :cx="10" :cy="10" :radius="5"/>
 * </ripl-group>
 */
export const RiplGroup = defineRiplElement({
    name: 'RiplGroup',
    stateKeys: [],
    container: true,
    create: elementFactory<GroupOptions>(createGroup),
}) as unknown as RiplComponent<RiplElementProps<BaseElementState>, Group>;

/** An arc or annular segment, the building block of pie, donut and gauge shapes. */
export const RiplArc = defineRiplElement({
    name: 'RiplArc',
    stateKeys: ELEMENT_STATE_KEYS.arc,
    create: elementFactory<Shape2DOptions<ArcState>>(createArc),
}) as unknown as RiplComponent<RiplElementProps<ArcState>, Arc>;

/** A circle rendered at a center point with a given radius. */
export const RiplCircle = defineRiplElement({
    name: 'RiplCircle',
    stateKeys: ELEMENT_STATE_KEYS.circle,
    create: elementFactory<Shape2DOptions<CircleState>>(createCircle),
}) as unknown as RiplComponent<RiplElementProps<CircleState>, Circle>;

/** An ellipse, optionally drawn as a partial sweep between two angles. */
export const RiplEllipse = defineRiplElement({
    name: 'RiplEllipse',
    stateKeys: ELEMENT_STATE_KEYS.ellipse,
    create: elementFactory<Shape2DOptions<EllipseState>>(createEllipse),
}) as unknown as RiplComponent<RiplElementProps<EllipseState>, Ellipse>;

/** A bitmap drawn from any canvas image source. */
export const RiplImage = defineRiplElement({
    name: 'RiplImage',
    stateKeys: ELEMENT_STATE_KEYS.image,
    create: elementFactory<Shape2DOptions<ImageState>>(createImage),
}) as unknown as RiplComponent<RiplElementProps<ImageState>, ImageElement>;

/** A straight line between two points. */
export const RiplLine = defineRiplElement({
    name: 'RiplLine',
    stateKeys: ELEMENT_STATE_KEYS.line,
    create: elementFactory<Shape2DOptions<LineState>>(createLine),
}) as unknown as RiplComponent<RiplElementProps<LineState>, Line>;

/** A shape drawn by a custom path renderer within a bounding box. */
export const RiplPath = defineRiplElement({
    name: 'RiplPath',
    stateKeys: ELEMENT_STATE_KEYS.path,
    create: elementFactory<Shape2DOptions<PathState>>(createPath),
}) as unknown as RiplComponent<RiplElementProps<PathState>, Path>;

/** A regular polygon with a given number of sides. */
export const RiplPolygon = defineRiplElement({
    name: 'RiplPolygon',
    stateKeys: ELEMENT_STATE_KEYS.polygon,
    create: elementFactory<Shape2DOptions<PolygonState>>(createPolygon),
}) as unknown as RiplComponent<RiplElementProps<PolygonState>, Polygon>;

/** A multi-segment line through a list of points. */
export const RiplPolyline = defineRiplElement({
    name: 'RiplPolyline',
    stateKeys: ELEMENT_STATE_KEYS.polyline,
    create: elementFactory<Shape2DOptions<PolylineState>>(createPolyline),
}) as unknown as RiplComponent<RiplElementProps<PolylineState>, Polyline>;

/** A rectangle, optionally with rounded corners. */
export const RiplRect = defineRiplElement({
    name: 'RiplRect',
    stateKeys: ELEMENT_STATE_KEYS.rect,
    create: elementFactory<Shape2DOptions<RectState>>(createRect),
}) as unknown as RiplComponent<RiplElementProps<RectState>, Rect>;

/** A run of text, optionally laid out along an SVG path. */
export const RiplText = defineRiplElement({
    name: 'RiplText',
    stateKeys: ELEMENT_STATE_KEYS.text,
    create: elementFactory<Shape2DOptions<TextState>>(createText),
}) as unknown as RiplComponent<RiplElementProps<TextState>, Text>;
