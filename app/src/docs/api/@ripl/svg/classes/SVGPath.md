[Documentation](../../../packages.md) / [@ripl/svg](../index.md) / SVGPath

# Class: SVGPath

Defined in: [svg/src/index.ts:225](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L225)

SVG-specific path implementation that builds an SVG `d` attribute string from drawing commands.

## Extends

- [`ContextPath`](../../core/classes/ContextPath.md)

## Implements

- [`SVGContextElement`](../interfaces/SVGContextElement.md)

## Constructors

### Constructor

> **new SVGPath**(`id?`): `SVGPath`

Defined in: [svg/src/index.ts:229](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L229)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id?` | `string` |

#### Returns

`SVGPath`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`constructor`](../../core/classes/ContextPath.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-definition"></a> `definition` | `public` | [`SVGContextElementDefinition`](../interfaces/SVGContextElementDefinition.md) | - | [svg/src/index.ts:227](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L227) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [`SVGContextElement`](../interfaces/SVGContextElement.md).[`id`](../interfaces/SVGContextElement.md#property-id) [`ContextPath`](../../core/classes/ContextPath.md).[`id`](../../core/classes/ContextPath.md#property-id) | [core/src/context/\_base/index.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L280) |

## Methods

### addPath()

> **addPath**(`path`): `void`

Defined in: [core/src/context/\_base/index.ts:337](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L337)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | [`ContextPath`](../../core/classes/ContextPath.md) |

#### Returns

`void`

#### Inherited from

[`ContextPath`](../../core/classes/ContextPath.md).[`addPath`](../../core/classes/ContextPath.md#addpath)

***

### arc()

> **arc**(`x`, `y`, `radius`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [svg/src/index.ts:248](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L248)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`arc`](../../core/classes/ContextPath.md#arc)

***

### arcTo()

> **arcTo**(`x1`, `y1`, `x2`, `y2`, `radius`): `void`

Defined in: [svg/src/index.ts:258](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L258)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`arcTo`](../../core/classes/ContextPath.md#arcto)

***

### bezierCurveTo()

> **bezierCurveTo**(`cp1x`, `cp1y`, `cp2x`, `cp2y`, `x`, `y`): `void`

Defined in: [svg/src/index.ts:269](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L269)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`bezierCurveTo`](../../core/classes/ContextPath.md#beziercurveto)

***

### circle()

> **circle**(`x`, `y`, `radius`): `void`

Defined in: [svg/src/index.ts:263](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L263)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `radius` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`circle`](../../core/classes/ContextPath.md#circle)

***

### closePath()

> **closePath**(): `void`

Defined in: [svg/src/index.ts:273](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L273)

#### Returns

`void`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`closePath`](../../core/classes/ContextPath.md#closepath)

***

### ellipse()

> **ellipse**(`x`, `y`, `radiusX`, `radiusY`, `rotation`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [svg/src/index.ts:277](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L277)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`ellipse`](../../core/classes/ContextPath.md#ellipse)

***

### lineTo()

> **lineTo**(`x`, `y`): `void`

Defined in: [svg/src/index.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L314)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`lineTo`](../../core/classes/ContextPath.md#lineto)

***

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: [svg/src/index.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L318)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`moveTo`](../../core/classes/ContextPath.md#moveto)

***

### polyline()

> **polyline**(`points`): `void`

Defined in: [core/src/context/\_base/index.ts:330](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L330)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `points` | [`Point`](../../core/type-aliases/Point.md)[] |

#### Returns

`void`

#### Inherited from

[`ContextPath`](../../core/classes/ContextPath.md).[`polyline`](../../core/classes/ContextPath.md#polyline)

***

### quadraticCurveTo()

> **quadraticCurveTo**(`cpx`, `cpy`, `x`, `y`): `void`

Defined in: [svg/src/index.ts:322](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L322)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`quadraticCurveTo`](../../core/classes/ContextPath.md#quadraticcurveto)

***

### rect()

> **rect**(`x`, `y`, `width`, `height`): `void`

Defined in: [svg/src/index.ts:326](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L326)

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

[`ContextPath`](../../core/classes/ContextPath.md).[`rect`](../../core/classes/ContextPath.md#rect)

***

### roundRect()

> **roundRect**(`x`, `y`, `width`, `height`, `radii?`): `void`

Defined in: [svg/src/index.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/svg/src/index.ts#L334)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |
| `radii?` | [`BorderRadius`](../../core/type-aliases/BorderRadius.md) |

#### Returns

`void`

#### Overrides

[`ContextPath`](../../core/classes/ContextPath.md).[`roundRect`](../../core/classes/ContextPath.md#roundrect)
