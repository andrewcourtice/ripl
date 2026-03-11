[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ContextPath

# Class: ContextPath

Defined in: [packages/core/src/context/\_base/index.ts:278](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L278)

A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations.

## Extended by

- [`CanvasPath`](CanvasPath.md)
- [`SVGPath`](../../svg/classes/SVGPath.md)

## Implements

- [`ContextElement`](../interfaces/ContextElement.md)

## Constructors

### Constructor

> **new ContextPath**(`id?`): `ContextPath`

Defined in: [packages/core/src/context/\_base/index.ts:282](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L282)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`ContextPath`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/core/src/context/\_base/index.ts:280](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L280) |

## Methods

### addPath()

> **addPath**(`path`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:337](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L337)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `ContextPath` |

#### Returns

`void`

***

### arc()

> **arc**(`x`, `y`, `radius`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:286](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L286)

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

***

### arcTo()

> **arcTo**(`x1`, `y1`, `x2`, `y2`, `radius`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:290](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L290)

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

***

### bezierCurveTo()

> **bezierCurveTo**(`cp1x`, `cp1y`, `cp2x`, `cp2y`, `x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:298](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L298)

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

***

### circle()

> **circle**(`x`, `y`, `radius`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:294](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L294)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `radius` | `number` |

#### Returns

`void`

***

### closePath()

> **closePath**(): `void`

Defined in: [packages/core/src/context/\_base/index.ts:302](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L302)

#### Returns

`void`

***

### ellipse()

> **ellipse**(`x`, `y`, `radiusX`, `radiusY`, `rotation`, `startAngle`, `endAngle`, `counterclockwise?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:306](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L306)

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

***

### lineTo()

> **lineTo**(`x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:310](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L310)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:314](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L314)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

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

***

### quadraticCurveTo()

> **quadraticCurveTo**(`cpx`, `cpy`, `x`, `y`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:318](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L318)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cpx` | `number` |
| `cpy` | `number` |
| `x` | `number` |
| `y` | `number` |

#### Returns

`void`

***

### rect()

> **rect**(`x`, `y`, `width`, `height`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:322](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L322)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `x` | `number` |
| `y` | `number` |
| `width` | `number` |
| `height` | `number` |

#### Returns

`void`

***

### roundRect()

> **roundRect**(`x`, `y`, `width`, `height`, `radii?`): `void`

Defined in: [packages/core/src/context/\_base/index.ts:326](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L326)

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
