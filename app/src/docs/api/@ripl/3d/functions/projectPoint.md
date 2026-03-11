[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / projectPoint

# Function: projectPoint()

> **projectPoint**(`point`, `viewProjection`, `viewport`): [`ProjectedPoint`](../type-aliases/ProjectedPoint.md)

Defined in: [3d/src/math/projection.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/math/projection.ts#L23)

Projects a 3D world-space point onto 2D screen-space via a view-projection matrix and viewport.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `point` | [`Vector3`](../type-aliases/Vector3.md) |
| `viewProjection` | [`Matrix4`](../type-aliases/Matrix4.md) |
| `viewport` | [`Viewport`](../interfaces/Viewport.md) |

## Returns

[`ProjectedPoint`](../type-aliases/ProjectedPoint.md)
