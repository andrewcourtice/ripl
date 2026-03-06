# Components

## Infrastructure

### `<ripl-context>`

Creates a Canvas rendering context. Renders a `<canvas>` element.

| Prop | Type | Description |
|------|------|-------------|
| `width` | `Number` | Canvas width in pixels |
| `height` | `Number` | Canvas height in pixels |

### `<ripl-svg-context>`

Creates an SVG rendering context. Requires `@ripl/svg`.

| Prop | Type | Description |
|------|------|-------------|
| `width` | `Number` | SVG width in pixels |
| `height` | `Number` | SVG height in pixels |

### `<ripl-3d-context>`

Creates a 3D rendering context. Requires `@ripl/3d`.

| Prop | Type | Description |
|------|------|-------------|
| `width` | `Number` | Canvas width in pixels |
| `height` | `Number` | Canvas height in pixels |

### `<ripl-scene>`

Creates and manages a Ripl scene. Must be a child of a context component.

### `<ripl-renderer>`

Creates and manages a Ripl renderer. Must be a child of a scene component. Drives the `requestAnimationFrame` loop.

### `<ripl-group>`

Groups child elements together. Supports all base element props for styling.

### `<ripl-transition>`

Wraps child elements to animate prop changes. See [Transitions](./transitions) for details.

## Shape Elements

All shape elements support the following **base props** inherited from `BaseElementState`:

| Prop | Type | Description |
|------|------|-------------|
| `fillStyle` | `String` | Fill color |
| `strokeStyle` | `String` | Stroke color |
| `lineWidth` | `Number` | Stroke width |
| `lineDash` | `Array` | Dash pattern |
| `lineDashOffset` | `Number` | Dash offset |
| `lineCap` | `String` | Line cap style |
| `lineJoin` | `String` | Line join style |
| `opacity` | `Number` | Element opacity (0-1) |
| `font` | `String` | Font string |
| `textAlign` | `String` | Text alignment |
| `textBaseline` | `String` | Text baseline |
| `cursor` | `String` | Cursor on hover |
| `visible` | `Boolean` | Element visibility |
| `clip` | `Boolean` | Enable clipping |

### `<ripl-rect>`

| Prop | Type | Description |
|------|------|-------------|
| `x` | `Number` | X position |
| `y` | `Number` | Y position |
| `width` | `Number` | Width |
| `height` | `Number` | Height |
| `borderRadius` | `Number \| Array` | Corner radius |

### `<ripl-circle>`

| Prop | Type | Description |
|------|------|-------------|
| `cx` | `Number` | Center X |
| `cy` | `Number` | Center Y |
| `radius` | `Number` | Radius |

### `<ripl-arc>`

| Prop | Type | Description |
|------|------|-------------|
| `cx` | `Number` | Center X |
| `cy` | `Number` | Center Y |
| `startAngle` | `Number` | Start angle (radians) |
| `endAngle` | `Number` | End angle (radians) |
| `radius` | `Number` | Outer radius |
| `innerRadius` | `Number` | Inner radius |
| `padAngle` | `Number` | Padding angle |
| `borderRadius` | `Number` | Corner radius |

### `<ripl-ellipse>`

| Prop | Type | Description |
|------|------|-------------|
| `cx` | `Number` | Center X |
| `cy` | `Number` | Center Y |
| `radiusX` | `Number` | Horizontal radius |
| `radiusY` | `Number` | Vertical radius |
| `startAngle` | `Number` | Start angle |
| `endAngle` | `Number` | End angle |

### `<ripl-line>`

| Prop | Type | Description |
|------|------|-------------|
| `x1` | `Number` | Start X |
| `y1` | `Number` | Start Y |
| `x2` | `Number` | End X |
| `y2` | `Number` | End Y |

### `<ripl-polygon>`

| Prop | Type | Description |
|------|------|-------------|
| `cx` | `Number` | Center X |
| `cy` | `Number` | Center Y |
| `radius` | `Number` | Radius |
| `sides` | `Number` | Number of sides (min 3) |

### `<ripl-polyline>`

| Prop | Type | Description |
|------|------|-------------|
| `points` | `Array` | Array of `[x, y]` points |
| `renderer` | `String \| Function` | Interpolation renderer |

### `<ripl-path>`

| Prop | Type | Description |
|------|------|-------------|
| `x` | `Number` | X position |
| `y` | `Number` | Y position |
| `width` | `Number` | Width |
| `height` | `Number` | Height |

### `<ripl-text>`

| Prop | Type | Description |
|------|------|-------------|
| `x` | `Number` | X position |
| `y` | `Number` | Y position |
| `content` | `String \| Number` | Text content |
| `pathData` | `String` | SVG path data for text path |
| `startOffset` | `Number` | Text path start offset |

### `<ripl-image>`

| Prop | Type | Description |
|------|------|-------------|
| `image` | `CanvasImageSource` | Image source |
| `x` | `Number` | X position |
| `y` | `Number` | Y position |
| `width` | `Number` | Width |
| `height` | `Number` | Height |
