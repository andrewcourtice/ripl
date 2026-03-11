[Documentation](../../../packages.md) / [@ripl/core](../index.md) / interpolatePolygonPoint

# Function: interpolatePolygonPoint()

> **interpolatePolygonPoint**(`sides`, `cx`, `cy`, `radius`, `closePath?`): [`Interpolator`](../type-aliases/Interpolator.md)\<[`Point`](../type-aliases/Point.md)\>

Defined in: [packages/core/src/interpolators/path.ts:126](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/interpolators/path.ts#L126)

Creates an interpolator that traces a point around the vertices of a regular polygon.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `sides` | `number` | `undefined` |
| `cx` | `number` | `undefined` |
| `cy` | `number` | `undefined` |
| `radius` | `number` | `undefined` |
| `closePath` | `boolean` | `true` |

## Returns

[`Interpolator`](../type-aliases/Interpolator.md)\<[`Point`](../type-aliases/Point.md)\>
