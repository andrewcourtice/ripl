[Documentation](../../../packages.md) / [@ripl/core](../index.md) / CanvasPath

# Class: CanvasPath

Defined in: [packages/core/src/context/canvas.ts:98](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L98)

Canvas-specific path implementation backed by a native `Path2D` object.

## Extends

- [`ContextPath`](ContextPath.md)

## Constructors

### Constructor

> **new CanvasPath**(`id?`): `CanvasPath`

Defined in: [packages/core/src/context/canvas.ts:102](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L102)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

`CanvasPath`

#### Overrides

[`ContextPath`](ContextPath.md).[`constructor`](ContextPath.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [`ContextPath`](ContextPath.md).[`id`](ContextPath.md#property-id) | [packages/core/src/context/\_base/index.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L280) |
| <a id="property-ref"></a> `ref` | `readonly` | `Path2D` | - | [packages/core/src/context/canvas.ts:100](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L100) |

## Methods

### addPath()

> **addPath**(`path`): `void`

Defined in: [packages/core/src/context/canvas.ts:151](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L151)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextPath`](ContextPath.md) |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`addPath`](ContextPath.md#addpath)

***

### arc()

> **arc**(`x`, `y`, `radius`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [packages/core/src/context/canvas.ts:107](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L107)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `radius` | `number` |
| `startAngle` | `number` |
| `endAngle` | `number` |
| `counterclockwise?` | `boolean` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`arc`](ContextPath.md#arc)

***

### arcTo()

> **arcTo**(`x1`, `y1`, `x2`, `y2`, `radius`): `void`

Defined in: [packages/core/src/context/canvas.ts:111](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L111)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x1` | `number` |
| `y1` | `number` |
| `x2` | `number` |
| `y2` | `number` |
| `radius` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`arcTo`](ContextPath.md#arcto)

***

### bezierCurveTo()

> **bezierCurveTo**(`cp1x`, `cp1y`, `cp2x`, `cp2y`, `x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:119](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L119)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cp1x` | `number` |
| `cp1y` | `number` |
| `cp2x` | `number` |
| `cp2y` | `number` |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`bezierCurveTo`](ContextPath.md#beziercurveto)

***

### circle()

> **circle**(`x`, `y`, `radius`): `void`

Defined in: [packages/core/src/context/canvas.ts:115](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L115)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `radius` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`circle`](ContextPath.md#circle)

***

### closePath()

> **closePath**(): `void`

Defined in: [packages/core/src/context/canvas.ts:123](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L123)

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`closePath`](ContextPath.md#closepath)

***

### ellipse()

> **ellipse**(`x`, `y`, `radiusX`, `radiusY`, `rotation`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [packages/core/src/context/canvas.ts:127](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L127)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `radiusX` | `number` |
| `radiusY` | `number` |
| `rotation` | `number` |
| `startAngle` | `number` |
| `endAngle` | `number` |
| `counterclockwise?` | `boolean` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`ellipse`](ContextPath.md#ellipse)

***

### lineTo()

> **lineTo**(`x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:131](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L131)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`lineTo`](ContextPath.md#lineto)

***

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:135](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L135)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`moveTo`](ContextPath.md#moveto)

***

### polyline()

> **polyline**(`points`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:330](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L330)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `points` | [`Point`](../type-aliases/Point.md)[] |

#### Returns

`void`

#### Inherited from

[`ContextPath`](ContextPath.md).[`polyline`](ContextPath.md#polyline)

***

### quadraticCurveTo()

> **quadraticCurveTo**(`cpx`, `cpy`, `x`, `y`): `void`

Defined in: [packages/core/src/context/canvas.ts:139](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L139)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cpx` | `number` |
| `cpy` | `number` |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`quadraticCurveTo`](ContextPath.md#quadraticcurveto)

***

### rect()

> **rect**(`x`, `y`, `width`, `height`): `void`

Defined in: [packages/core/src/context/canvas.ts:143](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L143)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`rect`](ContextPath.md#rect)

***

### roundRect()

> **roundRect**(`x`, `y`, `width`, `height`, `radii?`): `void`

Defined in: [packages/core/src/context/canvas.ts:147](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/canvas.ts#L147)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |
| `radii?` | [`BorderRadius`](../type-aliases/BorderRadius.md) |

#### Returns

`void`

#### Overrides

[`ContextPath`](ContextPath.md).[`roundRect`](ContextPath.md#roundrect)
