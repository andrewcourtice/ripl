[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / mat4TransformPoint

# Function: mat4TransformPoint()

> **mat4TransformPoint**(`m`, `v`): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/math/matrix.ts:200](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/math/matrix.ts#L200)

Transforms a 3D point by a 4×4 matrix, performing the perspective divide.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `m` | [`Matrix4`](../type-aliases/Matrix4.md) |
| `v` | [`Vector3`](../type-aliases/Vector3.md) |

## Returns

[`Vector3`](../type-aliases/Vector3.md)
