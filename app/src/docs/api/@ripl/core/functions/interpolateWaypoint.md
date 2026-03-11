[Documentation](../../../packages.md) / [@ripl/core](../index.md) / interpolateWaypoint

# Function: interpolateWaypoint()

> **interpolateWaypoint**(`points`): [`Interpolator`](../type-aliases/Interpolator.md)\<[`Point`](../type-aliases/Point.md)\>

Defined in: [packages/core/src/interpolators/path.ts:93](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/interpolators/path.ts#L93)

Creates an interpolator that returns the point along a polyline at the given normalised position.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `points` | [`Point`](../type-aliases/Point.md)[] |

## Returns

[`Interpolator`](../type-aliases/Interpolator.md)\<[`Point`](../type-aliases/Point.md)\>
