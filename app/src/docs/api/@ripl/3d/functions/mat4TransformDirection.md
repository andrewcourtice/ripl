[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / mat4TransformDirection

# Function: mat4TransformDirection()

> **mat4TransformDirection**(`m`, `v`): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/math/matrix.ts:191](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/math/matrix.ts#L191)

Transforms a direction vector by the upper-3×3 of a 4×4 matrix, ignoring translation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `m` | [`Matrix4`](../type-aliases/Matrix4.md) |
| `v` | [`Vector3`](../type-aliases/Vector3.md) |

## Returns

[`Vector3`](../type-aliases/Vector3.md)
