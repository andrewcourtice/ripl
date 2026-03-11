[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / UnionToIntersection

# Type Alias: UnionToIntersection\<U\>

> **UnionToIntersection**\<`U`\> = `U` *extends* `any` ? (`arg`) => `any` : `never` *extends* (`arg`) => `void` ? `I` : `never`

Defined in: [types.ts:26](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/types.ts#L26)

Converts a union type to an intersection type.

## Type Parameters

| Type Parameter |
| ------ |
| `U` |
