[Documentation](../../packages.md) / @ripl/core

# @ripl/core

Core rendering library for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering (Canvas & SVG) in the browser.

## Installation

```bash
npm install @ripl/core
```

## Features

- **Unified rendering API** — One API surface for both Canvas and SVG contexts
- **Built-in elements** — Arc, circle, rect, line, polyline, polygon, ellipse, path, text, and image
- **Scene management** — Scenegraph with grouping, property inheritance, and element querying
- **Animation** — High-performance async transitions with CSS-like keyframe support and custom interpolators
- **Event system** — Event bubbling, delegation, and stop propagation (mimics the DOM)
- **Scales** — Continuous, discrete, and time scales for data mapping
- **Color** — Color parsing, interpolation, and conversion (RGB, HSL, Hex)
- **Math** — Geometry utilities, vector operations, and easing functions
- **Zero dependencies** — Fully self-contained
- **Tree-shakable** — Only ship what you use

## Usage

```typescript
import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
});

const scene = createScene({
    children: [circle],
});

const renderer = createRenderer(scene, {
    autoStart: true,
    autoStop: true,
});

await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,
        fill: '#FF0000',
    },
});
```

## Switching to SVG

Replace the `createContext` import with `@ripl/svg` — everything else stays the same:

```typescript
import {
    createContext,
} from '@ripl/svg';
```

## Documentation

Full documentation and interactive demos are available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../_media/LICENSE)

## Namespaces

| Namespace | Description |
| ------ | ------ |
| [interpolateAny](namespaces/interpolateAny/index.md) | Fallback interpolator factory that snaps from the first value to the second at the halfway point. |
| [interpolateBorderRadius](namespaces/interpolateBorderRadius/index.md) | Interpolator factory that transitions between two border-radius values (single number or four-corner tuple). |
| [interpolateColor](namespaces/interpolateColor/index.md) | Interpolator factory that smoothly transitions between two CSS color strings by interpolating their RGBA channels. |
| [interpolateDate](namespaces/interpolateDate/index.md) | Interpolator factory that interpolates between two `Date` instances by lerping their timestamps. |
| [interpolateGradient](namespaces/interpolateGradient/index.md) | Interpolator factory that transitions between two CSS gradient strings by interpolating their stops, angles, and positions. |
| [interpolateNumber](namespaces/interpolateNumber/index.md) | Interpolator factory that linearly interpolates between two numbers. |
| [interpolatePoints](namespaces/interpolatePoints/index.md) | Interpolator factory that transitions between two point arrays, extrapolating additional points where set lengths differ. |
| [interpolateRotation](namespaces/interpolateRotation/index.md) | Interpolator factory that transitions between two rotation values (numbers in radians or strings like `"90deg"`). |
| [interpolateTransformOrigin](namespaces/interpolateTransformOrigin/index.md) | Interpolator factory that transitions between two transform-origin values (numbers or percentage strings). |

## Classes

| Class | Description |
| ------ | ------ |
| [Arc](classes/Arc.md) | An arc or annular sector shape supporting inner radius and pad angle. |
| [Box](classes/Box.md) | An axis-aligned bounding box defined by its four edges. |
| [CanvasContext](classes/CanvasContext.md) | Canvas 2D rendering context implementation, mapping the unified API to `CanvasRenderingContext2D`. |
| [CanvasPath](classes/CanvasPath.md) | Canvas-specific path implementation backed by a native `Path2D` object. |
| [Circle](classes/Circle.md) | A circle shape rendered at a center point with a given radius. |
| [ColorParseError](classes/ColorParseError.md) | Error thrown when a color string cannot be parsed in the expected format. |
| [Context](classes/Context.md) | Abstract rendering context providing a unified API for Canvas and SVG, with state management, coordinate scaling, and interaction handling. |
| [ContextPath](classes/ContextPath.md) | A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations. |
| [ContextText](classes/ContextText.md) | A virtual text element capturing position, content, and optional path-based text layout. |
| [Disposer](classes/Disposer.md) | Abstract base class that manages disposable resources, supporting keyed retention and bulk disposal. |
| [Element](classes/Element.md) | The base renderable element with state management, event handling, interpolation, transform support, and context rendering. |
| [Ellipse](classes/Ellipse.md) | An ellipse shape rendered at a center point with separate x/y radii, rotation, and angle range. |
| [Event](classes/Event.md) | An event object carrying type, data, target reference, and propagation control. |
| [EventBus](classes/EventBus.md) | A typed pub/sub event system with parent-chain bubbling, disposable subscriptions, and self-filtering. |
| [Group](classes/Group.md) | A container element that manages child elements, providing scenegraph traversal, CSS-like querying, and composite bounding boxes. |
| [ImageElement](classes/ImageElement.md) | An image element that draws a `CanvasImageSource` at a given position and optional size. |
| [Line](classes/Line.md) | A straight line segment between two points. |
| [Path](classes/Path.md) | A general-purpose shape rendered by a user-supplied path renderer callback. |
| [Polygon](classes/Polygon.md) | A regular polygon shape with a configurable number of sides. |
| [Polyline](classes/Polyline.md) | A multi-point line shape supporting various curve interpolation algorithms. |
| [Rect](classes/Rect.md) | A rectangle shape with optional rounded corners via border radius. |
| [Renderer](classes/Renderer.md) | Drives the animation loop via `requestAnimationFrame`, managing per-element transitions and rendering the scene each frame. |
| [Scene](classes/Scene.md) | The top-level group bound to a rendering context, maintaining a hoisted flat buffer for O(n) rendering. |
| [Shape](classes/Shape.md) | Abstract base class for renderable shapes, extending `Element` with a type-constrained constructor. |
| [Shape2D](classes/Shape2D.md) | A concrete 2D shape with path management, automatic fill/stroke rendering, clipping support, and path-based hit testing. |
| [Task](classes/Task.md) | A cancellable promise with `AbortController` integration, supporting abort callbacks and chaining. |
| [TaskAbortError](classes/TaskAbortError.md) | Error thrown when a task is aborted, carrying the abort reason. |
| [Text](classes/Text.md) | A text element that renders string or numeric content, with optional path-based text layout. |
| [Transition](classes/Transition.md) | A `Task`-based animation that drives a callback over time with easing, looping, and abort support. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ArcState](interfaces/ArcState.md) | State interface for an arc element, defining center, angles, radii, pad angle, and border radius. |
| [BandScale](interfaces/BandScale.md) | A band scale that divides a continuous range into uniform bands for categorical data, exposing bandwidth and step. |
| [BaseState](interfaces/BaseState.md) | The full set of visual state properties inherited by every renderable element. |
| [CircleState](interfaces/CircleState.md) | State interface for a circle element, defining center coordinates and radius. |
| [ColorParser](interfaces/ColorParser.md) | A color parser that can test, parse, and serialise a specific color format. |
| [ConicGradient](interfaces/ConicGradient.md) | A parsed conic gradient with angle, position, color stops, and optional repeating flag. |
| [ContextElement](interfaces/ContextElement.md) | Minimal interface for context-level elements (paths, text) identified by a unique id. |
| [ContextEventMap](interfaces/ContextEventMap.md) | Event map for a rendering context, including resize and pointer events. |
| [ContextOptions](interfaces/ContextOptions.md) | Options for constructing a rendering context. |
| [DivergingScaleOptions](interfaces/DivergingScaleOptions.md) | Options for a diverging scale, adding a midpoint to the base linear scale options. |
| [ElementEventMap](interfaces/ElementEventMap.md) | Event map for elements, extending the base event map with lifecycle and interaction events. |
| [ElementValidationResult](interfaces/ElementValidationResult.md) | The result of validating an element, with a severity type and descriptive message. |
| [EllipseState](interfaces/EllipseState.md) | State interface for an ellipse element, defining center, radii, rotation, and angle range. |
| [GradientColorStop](interfaces/GradientColorStop.md) | A single color stop within a gradient, consisting of a CSS color and an optional offset position. |
| [GroupOptions](interfaces/GroupOptions.md) | Options for constructing a group, extending element options with an optional initial set of children. |
| [ImageState](interfaces/ImageState.md) | State interface for an image element, defining position, optional size, and image source. |
| [LinearGradient](interfaces/LinearGradient.md) | A parsed linear gradient with angle, color stops, and optional repeating flag. |
| [LinearScaleOptions](interfaces/LinearScaleOptions.md) | Options shared by linear-based scales (continuous, logarithmic, power, etc.). |
| [LineState](interfaces/LineState.md) | State interface for a line element, defining start and end coordinates. |
| [LogarithmicScaleOptions](interfaces/LogarithmicScaleOptions.md) | Options for a logarithmic scale, adding a configurable base to the base linear scale options. |
| [PathState](interfaces/PathState.md) | State interface for a path element, defining bounding position and dimensions. |
| [PolygonState](interfaces/PolygonState.md) | State interface for a regular polygon element, defining center, radius, and number of sides. |
| [PolylineState](interfaces/PolylineState.md) | State interface for a polyline element, defining points and an optional curve renderer. |
| [PowerScaleOptions](interfaces/PowerScaleOptions.md) | Options for a power scale, adding a configurable exponent to the base linear scale options. |
| [RadialGradient](interfaces/RadialGradient.md) | A parsed radial gradient with shape, position, color stops, and optional repeating flag. |
| [RectState](interfaces/RectState.md) | State interface for a rectangle element, defining position, dimensions, and optional border radius. |
| [RenderElement](interfaces/RenderElement.md) | Minimal interface for any element that can be rendered and hit-tested by a context. |
| [RenderElementIntersectionOptions](interfaces/RenderElementIntersectionOptions.md) | Options for render element intersection testing. |
| [RendererDebugOptions](interfaces/RendererDebugOptions.md) | Options for enabling debug overlays on the renderer. |
| [RendererEventMap](interfaces/RendererEventMap.md) | Event map for the renderer, with start, stop, and per-frame tick events. |
| [RendererOptions](interfaces/RendererOptions.md) | Configuration for the renderer, controlling auto-start/stop behaviour and debug overlays. |
| [RendererTransition](interfaces/RendererTransition.md) | Internal representation of an active transition managed by the renderer. |
| [RendererTransitionOptions](interfaces/RendererTransitionOptions.md) | Options for scheduling a transition on one or more elements via the renderer. |
| [Scale](interfaces/Scale.md) | A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing. |
| [ScaleBindingOptions](interfaces/ScaleBindingOptions.md) | Low-level options for constructing a scale, providing conversion, inversion, inclusion, and tick generation callbacks. |
| [SceneEventMap](interfaces/SceneEventMap.md) | Event map for the scene, adding a `resize` event to the standard element events. |
| [SceneOptions](interfaces/SceneOptions.md) | Options for constructing a scene, extending group options with an optional auto-render-on-resize flag. |
| [StringInterpolatorTag](interfaces/StringInterpolatorTag.md) | A tagged template result capturing the static fragments and dynamic numeric arguments. |
| [TextState](interfaces/TextState.md) | State interface for a text element, defining position, content, and optional path-based text layout. |
| [TransitionOptions](interfaces/TransitionOptions.md) | Configuration for a transition animation. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [BandScaleOptions](type-aliases/BandScaleOptions.md) | - |
| [BaseElementState](type-aliases/BaseElementState.md) | Base state interface for all elements. All visual properties are optional at the element level. |
| [BorderRadius](type-aliases/BorderRadius.md) | Four-corner border radius represented as `[topLeft, topRight, bottomRight, bottomLeft]`. |
| [ColorHSL](type-aliases/ColorHSL.md) | An HSL color represented as a three-element tuple. |
| [ColorHSLA](type-aliases/ColorHSLA.md) | An HSLA color represented as a four-element tuple. |
| [ColorHSV](type-aliases/ColorHSV.md) | An HSV color represented as a three-element tuple. |
| [ColorHSVA](type-aliases/ColorHSVA.md) | An HSVA color represented as a four-element tuple. |
| [ColorRGBA](type-aliases/ColorRGBA.md) | An RGBA color represented as a four-element tuple of channel values. |
| [ColorSpace](type-aliases/ColorSpace.md) | Supported color space identifiers. |
| [Direction](type-aliases/Direction.md) | Text direction for the rendering context. |
| [Ease](type-aliases/Ease.md) | An easing function that maps a linear progress value (0–1) to an eased output value. |
| [ElementInterpolationKeyFrame](type-aliases/ElementInterpolationKeyFrame.md) | A single keyframe in a multi-step interpolation, with an optional offset (0–1) and a target value. |
| [ElementInterpolationState](type-aliases/ElementInterpolationState.md) | Partial state where each property can be a target value, keyframe array, or interpolator function. |
| [ElementInterpolationStateValue](type-aliases/ElementInterpolationStateValue.md) | An interpolation target: a direct value, an array of keyframes, or a custom interpolator function. |
| [ElementInterpolators](type-aliases/ElementInterpolators.md) | A map of interpolator factories keyed by state property, used to override default interpolation behaviour. |
| [ElementIntersectionOptions](type-aliases/ElementIntersectionOptions.md) | Options for element intersection (hit) testing. |
| [ElementOptions](type-aliases/ElementOptions.md) | Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state. |
| [ElementPointerEvents](type-aliases/ElementPointerEvents.md) | Controls which pointer events an element responds to during hit testing. |
| [ElementValidationType](type-aliases/ElementValidationType.md) | Severity level of an element validation result. |
| [EventHandler](type-aliases/EventHandler.md) | A callable event handler function with optional subscription options. |
| [EventMap](type-aliases/EventMap.md) | Base event map interface; all custom event maps should extend this. |
| [EventOptions](type-aliases/EventOptions.md) | Options for emitting an event, controlling bubbling and attached data. |
| [EventSubscriptionOptions](type-aliases/EventSubscriptionOptions.md) | Options for subscribing to an event, such as filtering to self-targeted events only. |
| [FillRule](type-aliases/FillRule.md) | Fill rule algorithm used to determine if a point is inside a path. |
| [FontKerning](type-aliases/FontKerning.md) | Font kerning mode for the rendering context. |
| [Gradient](type-aliases/Gradient.md) | Union of all supported gradient types. |
| [GradientType](type-aliases/GradientType.md) | - |
| [Interpolator](type-aliases/Interpolator.md) | A function that interpolates between two values based on a normalised position (0–1). |
| [InterpolatorFactory](type-aliases/InterpolatorFactory.md) | A factory that creates an interpolator between two values of the same type, with a `test` predicate for type matching. |
| [LineCap](type-aliases/LineCap.md) | Line cap style for stroke endpoints. |
| [LineJoin](type-aliases/LineJoin.md) | Line join style for stroke corners. |
| [MeasureTextOptions](type-aliases/MeasureTextOptions.md) | Options for measuring text dimensions. |
| [PathPoint](type-aliases/PathPoint.md) | A sampled point on an SVG path with position and tangent angle. |
| [PathRenderer](type-aliases/PathRenderer.md) | A callback that draws custom geometry onto a `ContextPath` using the element's state. |
| [Point](type-aliases/Point.md) | A 2D point represented as an `[x, y]` tuple. |
| [PolylineRenderer](type-aliases/PolylineRenderer.md) | Built-in polyline curve interpolation algorithm names. |
| [PolylineRenderFunc](type-aliases/PolylineRenderFunc.md) | A function that renders a polyline curve onto a path from an array of points. |
| [PredicatedFunction](type-aliases/PredicatedFunction.md) | A callable with a `test` method used to determine whether the factory can handle a given value. |
| [RenderElementPointerEvents](type-aliases/RenderElementPointerEvents.md) | Controls which pointer events a render element responds to during hit testing. |
| [RendererTransitionDirection](type-aliases/RendererTransitionDirection.md) | Alias for the transition playback direction within the renderer. |
| [RendererTransitionOptionsArg](type-aliases/RendererTransitionOptionsArg.md) | Transition options can be a static object or a per-element factory function. |
| [Rotation](type-aliases/Rotation.md) | Rotation value — a numeric radian value or a string with `deg`/`rad` suffix. |
| [ScaleMethod](type-aliases/ScaleMethod.md) | A function that maps a value from one space to another. |
| [Shape2DOptions](type-aliases/Shape2DOptions.md) | Options for a 2D shape, adding automatic fill/stroke and clipping controls. |
| [StringInterpolationFormatter](type-aliases/StringInterpolationFormatter.md) | Optional formatter applied to each interpolated numeric value before insertion into the output string. |
| [StringInterpolationSet](type-aliases/StringInterpolationSet.md) | A pair of tagged template results representing the start and end states for string interpolation. |
| [TaskAbortCallback](type-aliases/TaskAbortCallback.md) | Callback invoked when a task is aborted, receiving the abort reason. |
| [TaskExecutor](type-aliases/TaskExecutor.md) | Executor function for a task, providing resolve, reject, abort registration, and the underlying `AbortController`. |
| [TaskReject](type-aliases/TaskReject.md) | Callback to reject a task with an optional reason. |
| [TaskResolve](type-aliases/TaskResolve.md) | Callback to resolve a task with a value or promise. |
| [TextAlignment](type-aliases/TextAlignment.md) | Horizontal text alignment relative to the drawing position. |
| [TextBaseline](type-aliases/TextBaseline.md) | Vertical text baseline used when rendering text. |
| [TextOptions](type-aliases/TextOptions.md) | Options for creating a text element within the context. |
| [TransformOrigin](type-aliases/TransformOrigin.md) | Transform origin value — a numeric pixel offset or a percentage string. |
| [TransitionCallback](type-aliases/TransitionCallback.md) | Callback invoked on each animation frame with the current eased time value (0–1). |
| [TransitionDirection](type-aliases/TransitionDirection.md) | The playback direction of a transition. |

## Variables

| Variable | Description |
| ------ | ------ |
| [CONTEXT\_OPERATIONS](variables/CONTEXT_OPERATIONS.md) | Maps element state properties to their corresponding context setter functions. |
| [easeInCubic](variables/easeInCubic.md) | Cubic ease-in — accelerates from zero velocity. |
| [easeInOutCubic](variables/easeInOutCubic.md) | Cubic ease-in-out — accelerates then decelerates. |
| [easeInOutQuad](variables/easeInOutQuad.md) | Quadratic ease-in-out — accelerates then decelerates. |
| [easeInOutQuart](variables/easeInOutQuart.md) | Quartic ease-in-out — accelerates then decelerates. |
| [easeInOutQuint](variables/easeInOutQuint.md) | Quintic ease-in-out — accelerates then decelerates. |
| [easeInQuad](variables/easeInQuad.md) | Quadratic ease-in — accelerates from zero velocity. |
| [easeInQuart](variables/easeInQuart.md) | Quartic ease-in — accelerates from zero velocity. |
| [easeInQuint](variables/easeInQuint.md) | Quintic ease-in — accelerates from zero velocity. |
| [easeLinear](variables/easeLinear.md) | Linear easing — no acceleration or deceleration. |
| [easeOutCubic](variables/easeOutCubic.md) | Cubic ease-out — decelerates to zero velocity. |
| [easeOutQuad](variables/easeOutQuad.md) | Quadratic ease-out — decelerates to zero velocity. |
| [easeOutQuart](variables/easeOutQuart.md) | Quartic ease-out — decelerates to zero velocity. |
| [easeOutQuint](variables/easeOutQuint.md) | Quintic ease-out — decelerates to zero velocity. |
| [getRefContext](variables/getRefContext.md) | Returns a shared offscreen `CanvasRenderingContext2D` used for text measurement and default state retrieval. |
| [interpolateAny](variables/interpolateAny.md) | Fallback interpolator factory that snaps from the first value to the second at the halfway point. |
| [interpolateBorderRadius](variables/interpolateBorderRadius.md) | Interpolator factory that transitions between two border-radius values (single number or four-corner tuple). |
| [interpolateColor](variables/interpolateColor.md) | Interpolator factory that smoothly transitions between two CSS color strings by interpolating their RGBA channels. |
| [interpolateDate](variables/interpolateDate.md) | Interpolator factory that interpolates between two `Date` instances by lerping their timestamps. |
| [interpolateGradient](variables/interpolateGradient.md) | Interpolator factory that transitions between two CSS gradient strings by interpolating their stops, angles, and positions. |
| [interpolateImage](variables/interpolateImage.md) | Interpolator factory that cross-fades between two image sources using an offscreen canvas. |
| [interpolateNumber](variables/interpolateNumber.md) | Interpolator factory that linearly interpolates between two numbers. |
| [interpolatePoints](variables/interpolatePoints.md) | Interpolator factory that transitions between two point arrays, extrapolating additional points where set lengths differ. |
| [interpolateRotation](variables/interpolateRotation.md) | Interpolator factory that transitions between two rotation values (numbers in radians or strings like `"90deg"`). |
| [interpolateTransformOrigin](variables/interpolateTransformOrigin.md) | Interpolator factory that transitions between two transform-origin values (numbers or percentage strings). |
| [scaleDPR](variables/scaleDPR.md) | A scale that maps logical pixels to physical device pixels using `devicePixelRatio`. |
| [TAU](variables/TAU.md) | Full circle in radians (2π). |
| [TRACKED\_EVENTS](variables/TRACKED_EVENTS.md) | DOM event types that are tracked and forwarded to elements for hit testing and interaction. |
| [TRANSFORM\_DEFAULTS](variables/TRANSFORM_DEFAULTS.md) | Default numeric values for transform properties (translate, scale, rotation, transform-origin). |
| [TRANSFORM\_INTERPOLATORS](variables/TRANSFORM_INTERPOLATORS.md) | Interpolator factories for transform-related properties that require special interpolation (rotation, transform-origin). |

## Functions

| Function | Description |
| ------ | ------ |
| [arePointsEqual](functions/arePointsEqual.md) | Tests whether two points have identical coordinates. |
| [clamp](functions/clamp.md) | Constrains a value to the inclusive range between lower and upper bounds. |
| [computeTransitionTime](functions/computeTransitionTime.md) | Computes the eased time value for a transition given elapsed time, duration, easing function, and direction. |
| [createArc](functions/createArc.md) | Factory function that creates a new `Arc` instance. |
| [createCircle](functions/createCircle.md) | Factory function that creates a new `Circle` instance. |
| [createContext](functions/createContext.md) | Creates a Canvas 2D rendering context attached to the given DOM target. |
| [createElement](functions/createElement.md) | Factory function that creates a new `Element` instance. |
| [createEllipse](functions/createEllipse.md) | Factory function that creates a new `Ellipse` instance. |
| [createFrameBuffer](functions/createFrameBuffer.md) | Creates a debounced `requestAnimationFrame` wrapper that cancels any pending frame before scheduling a new one. |
| [createGroup](functions/createGroup.md) | Factory function that creates a new `Group` instance. |
| [createImage](functions/createImage.md) | Factory function that creates a new `ImageElement` instance. |
| [createLine](functions/createLine.md) | Factory function that creates a new `Line` instance. |
| [createNumericIncludesMethod](functions/createNumericIncludesMethod.md) | Creates an `includes` predicate that tests whether a value falls within the numeric domain. |
| [createPath](functions/createPath.md) | Factory function that creates a new `Path` instance. |
| [createPolygon](functions/createPolygon.md) | Factory function that creates a new `Polygon` instance. |
| [createPolyline](functions/createPolyline.md) | Factory function that creates a new `Polyline` instance. |
| [createRect](functions/createRect.md) | Factory function that creates a new `Rect` instance. |
| [createRenderer](functions/createRenderer.md) | Factory function that creates a new `Renderer` bound to the given scene. |
| [createScale](functions/createScale.md) | Assembles a `Scale` object from explicit conversion, inversion, and tick functions. |
| [createScene](functions/createScene.md) | Factory function that creates a new `Scene` instance from a context, selector, or element. |
| [createShape](functions/createShape.md) | Factory function that creates a new `Shape2D` instance. |
| [createText](functions/createText.md) | Factory function that creates a new `Text` instance. |
| [degreesToRadians](functions/degreesToRadians.md) | Converts degrees to radians. |
| [elementIsArc](functions/elementIsArc.md) | Type guard that checks whether a value is an `Arc` instance. |
| [elementIsCircle](functions/elementIsCircle.md) | Type guard that checks whether a value is a `Circle` instance. |
| [elementIsEllipse](functions/elementIsEllipse.md) | Type guard that checks whether a value is an `Ellipse` instance. |
| [elementIsImage](functions/elementIsImage.md) | Type guard that checks whether a value is an `ImageElement` instance. |
| [elementIsLine](functions/elementIsLine.md) | Type guard that checks whether a value is a `Line` instance. |
| [elementIsPath](functions/elementIsPath.md) | Type guard that checks whether a value is a `Path` instance. |
| [elementIsPolygon](functions/elementIsPolygon.md) | Type guard that checks whether a value is a `Polygon` instance. |
| [elementIsPolyline](functions/elementIsPolyline.md) | Type guard that checks whether a value is a `Polyline` instance. |
| [elementIsRect](functions/elementIsRect.md) | Type guard that checks whether a value is a `Rect` instance. |
| [elementIsShape](functions/elementIsShape.md) | Type guard that checks whether a value is a `Shape` instance. |
| [elementIsText](functions/elementIsText.md) | Type guard that checks whether a value is a `Text` instance. |
| [fractional](functions/fractional.md) | Returns the fractional part of a number (e.g. `fractional(3.7)` → `0.7`). |
| [getColorParser](functions/getColorParser.md) | Finds the first color parser whose pattern matches the given color string. |
| [getContainingBox](functions/getContainingBox.md) | Computes the smallest axis-aligned bounding box that contains all boxes extracted from the array. |
| [getEuclideanDistance](functions/getEuclideanDistance.md) | Computes the Euclidean distance from two points. |
| [getExtent](functions/getExtent.md) | Computes the `[min, max]` extent of an array using the given numeric accessor. |
| [getLinearScaleMethod](functions/getLinearScaleMethod.md) | Creates a linear mapping function from a numeric domain to a numeric range, with optional clamping and tick-padding. |
| [getLinearTicks](functions/getLinearTicks.md) | Generates an array of evenly spaced, "nice" tick values across the domain. |
| [getMidpoint](functions/getMidpoint.md) | Returns the midpoint between two points. |
| [getPathLength](functions/getPathLength.md) | Computes the total length of an SVG path from its `d` attribute string. |
| [getPolygonPoints](functions/getPolygonPoints.md) | Generates the vertex points of a regular polygon centred at `(cx, cy)` with the given radius and number of sides. |
| [getThetaPoint](functions/getThetaPoint.md) | Returns the point at a given angle and distance from an optional centre. |
| [getTotal](functions/getTotal.md) | Sums all numeric values extracted from an array via the accessor. |
| [getWaypoint](functions/getWaypoint.md) | Returns a point along the line segment between two points at the given normalised position (0–1). |
| [hslToRGBA](functions/hslToRGBA.md) | Converts HSLA values to an RGBA tuple. |
| [hsvToRGBA](functions/hsvToRGBA.md) | Converts HSVA values to an RGBA tuple. |
| [interpolateCirclePoint](functions/interpolateCirclePoint.md) | Creates an interpolator that traces a point around a circle of the given centre and radius. |
| [interpolatePath](functions/interpolatePath.md) | Creates an interpolator that progressively reveals a path from start to end as position advances from 0 to 1. |
| [interpolatePolygonPoint](functions/interpolatePolygonPoint.md) | Creates an interpolator that traces a point around the vertices of a regular polygon. |
| [interpolateString](functions/interpolateString.md) | Creates a string interpolator by interpolating between numeric values embedded in tagged template literals. |
| [interpolateWaypoint](functions/interpolateWaypoint.md) | Creates an interpolator that returns the point along a polyline at the given normalised position. |
| [isGradientString](functions/isGradientString.md) | Tests whether a string looks like a CSS gradient (starts with a recognised gradient function name). |
| [isGroup](functions/isGroup.md) | Type guard that checks whether a value is a `Group` instance. |
| [isPointInBox](functions/isPointInBox.md) | Tests whether a point lies within the given bounding box (inclusive). |
| [max](functions/max.md) | Returns the maximum of the provided numbers. |
| [maxOf](functions/maxOf.md) | Returns the maximum numeric value extracted from an array via the accessor. |
| [measureText](functions/measureText.md) | Measures the dimensions of a text string using an optional font and context override. |
| [min](functions/min.md) | Returns the minimum of the provided numbers. |
| [minOf](functions/minOf.md) | Returns the minimum numeric value extracted from an array via the accessor. |
| [normaliseBorderRadius](functions/normaliseBorderRadius.md) | Normalises a border radius value into a four-corner tuple, expanding a single number to all corners. |
| [padDomain](functions/padDomain.md) | Expands a numeric domain to "nice" tick-aligned boundaries and returns `[min, max, step]`. |
| [parseColor](functions/parseColor.md) | Parses any supported color string into an RGBA tuple, or returns `undefined` if no parser matches. |
| [parseGradient](functions/parseGradient.md) | Parses a CSS gradient string (linear, radial, or conic) into a structured `Gradient` object, or returns `undefined` if the string is not a recognised gradient. |
| [parseHEX](functions/parseHEX.md) | Parses a hexadecimal color string (e.g. `#ff0000` or `#ff000080`) into an RGBA tuple. |
| [parseHSL](functions/parseHSL.md) | Parses an `hsl()` color string into an RGBA tuple. |
| [parseHSLA](functions/parseHSLA.md) | Parses an `hsla()` color string into an RGBA tuple. |
| [parseHSV](functions/parseHSV.md) | Parses an `hsv()` color string into an RGBA tuple. |
| [parseHSVA](functions/parseHSVA.md) | Parses an `hsva()` color string into an RGBA tuple. |
| [parseRGB](functions/parseRGB.md) | Parses an `rgb()` color string into an RGBA tuple with alpha set to 1. |
| [parseRGBA](functions/parseRGBA.md) | Parses an `rgba()` color string into an RGBA tuple. |
| [polylineBasisRenderer](functions/polylineBasisRenderer.md) | Creates a cubic B-spline polyline renderer. |
| [polylineBumpXRenderer](functions/polylineBumpXRenderer.md) | Creates a bump-X polyline renderer using horizontal midpoint bezier curves. |
| [polylineBumpYRenderer](functions/polylineBumpYRenderer.md) | Creates a bump-Y polyline renderer using vertical midpoint bezier curves. |
| [polylineCardinalRenderer](functions/polylineCardinalRenderer.md) | Creates a cardinal spline polyline renderer with configurable tension. |
| [polylineCatmullRomRenderer](functions/polylineCatmullRomRenderer.md) | Creates a Catmull-Rom spline polyline renderer with configurable alpha. |
| [polylineLinearRenderer](functions/polylineLinearRenderer.md) | Creates a linear (straight segment) polyline renderer. |
| [polylineMonotoneXRenderer](functions/polylineMonotoneXRenderer.md) | Creates a monotone-X polyline renderer preserving monotonicity along the x-axis. |
| [polylineMonotoneYRenderer](functions/polylineMonotoneYRenderer.md) | Creates a monotone-Y polyline renderer preserving monotonicity along the y-axis. |
| [polylineNaturalRenderer](functions/polylineNaturalRenderer.md) | Creates a natural cubic spline polyline renderer with second-derivative continuity. |
| [polylineSplineRenderer](functions/polylineSplineRenderer.md) | Creates a spline polyline renderer with configurable tension. |
| [polylineStepAfterRenderer](functions/polylineStepAfterRenderer.md) | Creates a step-after polyline renderer where the vertical transition occurs at the end of each segment. |
| [polylineStepBeforeRenderer](functions/polylineStepBeforeRenderer.md) | Creates a step-before polyline renderer where the vertical transition occurs at the start of each segment. |
| [polylineStepRenderer](functions/polylineStepRenderer.md) | Creates a step polyline renderer with midpoint horizontal transitions. |
| [query](functions/query.md) | Returns the first element matching a CSS-like selector, or `undefined` if none match. |
| [queryAll](functions/queryAll.md) | Queries all elements matching a CSS-like selector across the given element(s) and their descendants. |
| [radiansToDegrees](functions/radiansToDegrees.md) | Converts radians to degrees. |
| [resolveRotation](functions/resolveRotation.md) | Resolves a rotation value (number, degrees string, or radians string) to radians. |
| [resolveTransformOrigin](functions/resolveTransformOrigin.md) | Resolves a transform-origin value (number or percentage string) to a pixel offset relative to the given dimension. |
| [rgbaToHSL](functions/rgbaToHSL.md) | Converts RGBA channel values to an HSLA tuple. |
| [rgbaToHSV](functions/rgbaToHSV.md) | Converts RGBA channel values to an HSVA tuple. |
| [rgbChannelToHEX](functions/rgbChannelToHEX.md) | Converts a single RGB channel value (0–255) to a two-character hexadecimal string. |
| [samplePathPoint](functions/samplePathPoint.md) | Samples a point and tangent angle at the given distance along an SVG path. |
| [scaleBand](functions/scaleBand.md) | Creates a band scale that maps discrete domain values to evenly spaced bands within the range. |
| [scaleContinuous](functions/scaleContinuous.md) | Creates a continuous linear scale that maps a numeric domain to a numeric range. |
| [scaleDiscrete](functions/scaleDiscrete.md) | Creates a discrete (ordinal) scale that maps domain values to corresponding range values by index. |
| [scaleDiverging](functions/scaleDiverging.md) | Creates a diverging scale that maps values below and above a midpoint to separate sub-ranges. |
| [scaleLog](functions/scaleLog.md) | - |
| [scaleLogarithmic](functions/scaleLogarithmic.md) | Creates a logarithmic scale that maps a numeric domain to a range using a log transformation. |
| [scalePower](functions/scalePower.md) | Creates a power scale that maps a numeric domain to a range using an exponential transformation. |
| [scaleQuantile](functions/scaleQuantile.md) | Creates a quantile scale that divides a sorted numeric domain into quantiles mapped to discrete range values. |
| [scaleQuantize](functions/scaleQuantize.md) | Creates a quantize scale that divides a continuous numeric domain into uniform segments mapped to discrete range values. |
| [scaleSqrt](functions/scaleSqrt.md) | Shortcut for a power scale with exponent 0.5 (square root). |
| [scaleThreshold](functions/scaleThreshold.md) | Creates a threshold scale that maps numeric values to range values based on a set of threshold breakpoints. |
| [scaleTime](functions/scaleTime.md) | Creates a time scale that maps a `Date` domain to a numeric range using linear interpolation of timestamps. |
| [serialiseGradient](functions/serialiseGradient.md) | Serialises a structured `Gradient` object back into a CSS gradient string. |
| [serialiseHEX](functions/serialiseHEX.md) | Serialises RGBA channel values into a hexadecimal color string (e.g. `#ff0000`). |
| [serialiseHSL](functions/serialiseHSL.md) | Serialises RGBA channel values into an `hsl()` color string. |
| [serialiseHSLA](functions/serialiseHSLA.md) | Serialises RGBA channel values into an `hsla()` color string. |
| [serialiseHSV](functions/serialiseHSV.md) | Serialises RGBA channel values into an `hsv()` color string. |
| [serialiseHSVA](functions/serialiseHSVA.md) | Serialises RGBA channel values into an `hsva()` color string. |
| [serialiseRGB](functions/serialiseRGB.md) | Serialises RGBA channel values into an `rgb()` color string. |
| [serialiseRGBA](functions/serialiseRGBA.md) | Serialises RGBA channel values into an `rgba()` color string. |
| [setColorAlpha](functions/setColorAlpha.md) | Returns a new color string with the alpha channel replaced by the given value. |
| [transition](functions/transition.md) | Creates and starts a frame-driven transition that invokes the callback with the eased time on each animation frame. |
| [typeIsContext](functions/typeIsContext.md) | Type guard that checks whether a value is a `Context` instance. |
| [typeIsElement](functions/typeIsElement.md) | Type guard that checks whether a value is an `Element` instance. |
| [typeIsPoint](functions/typeIsPoint.md) | Type guard that checks whether a value is a `Point` (a two-element array). |
