[Documentation](../../../packages.md) / [@ripl/core](../index.md) / TaskResolve

# Type Alias: TaskResolve()\<TResult\>

> **TaskResolve**\<`TResult`\> = (`value`) => `void`

Defined in: [packages/core/src/task/index.ts:7](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L7)

Callback to resolve a task with a value or promise.

## Type Parameters

| Type Parameter |
| ------ |
| `TResult` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TResult` \| `PromiseLike`\<`TResult`\> |

## Returns

`void`
