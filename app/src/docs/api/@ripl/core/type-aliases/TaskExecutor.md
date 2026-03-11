[Documentation](../../../packages.md) / [@ripl/core](../index.md) / TaskExecutor

# Type Alias: TaskExecutor()\<TResult\>

> **TaskExecutor**\<`TResult`\> = (`resolve`, `reject`, `onAbort`, `controller`) => `void`

Defined in: [packages/core/src/task/index.ts:16](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L16)

Executor function for a task, providing resolve, reject, abort registration, and the underlying `AbortController`.

## Type Parameters

| Type Parameter |
| ------ |
| `TResult` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `resolve` | [`TaskResolve`](TaskResolve.md)\<`TResult`\> |
| `reject` | [`TaskReject`](TaskReject.md) |
| `onAbort` | (`callback`) => `void` |
| `controller` | `AbortController` |

## Returns

`void`
