[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / mat4LookAt

# Function: mat4LookAt()

> **mat4LookAt**(`eye`, `target`, `up`): [`Matrix4`](../type-aliases/Matrix4.md)

Defined in: [3d/src/math/matrix.ts:117](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/math/matrix.ts#L117)

Constructs a view matrix looking from `eye` toward `target` with the given `up` direction.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `eye` | [`Vector3`](../type-aliases/Vector3.md) |
| `target` | [`Vector3`](../type-aliases/Vector3.md) |
| `up` | [`Vector3`](../type-aliases/Vector3.md) |

## Returns

[`Matrix4`](../type-aliases/Matrix4.md)
