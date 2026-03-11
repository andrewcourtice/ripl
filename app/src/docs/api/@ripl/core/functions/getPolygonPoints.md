[Documentation](../../../packages.md) / [@ripl/core](../index.md) / getPolygonPoints

# Function: getPolygonPoints()

> **getPolygonPoints**(`sides`, `cx`, `cy`, `radius`, `closePath?`): [`Point`](../type-aliases/Point.md)[]

Defined in: [packages/core/src/math/geometry.ts:61](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/geometry.ts#L61)

Generates the vertex points of a regular polygon centred at `(cx, cy)` with the given radius and number of sides.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `sides` | `number` | `undefined` |
| `cx` | `number` | `undefined` |
| `cy` | `number` | `undefined` |
| `radius` | `number` | `undefined` |
| `closePath` | `boolean` | `true` |

## Returns

[`Point`](../type-aliases/Point.md)[]
