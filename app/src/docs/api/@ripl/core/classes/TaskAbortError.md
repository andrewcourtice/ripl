[Documentation](../../../packages.md) / [@ripl/core](../index.md) / TaskAbortError

# Class: TaskAbortError

Defined in: [packages/core/src/task/index.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L24)

Error thrown when a task is aborted, carrying the abort reason.

## Extends

- `Error`

## Constructors

### Constructor

> **new TaskAbortError**(`reason?`): `TaskAbortError`

Defined in: [packages/core/src/task/index.ts:30](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L30)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `any` |

#### Returns

`TaskAbortError`

#### Overrides

`Error.constructor`

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `Error.cause` | node\_modules/typescript/lib/lib.es2022.error.d.ts:26 |
| <a id="property-message"></a> `message` | `public` | `string` | `Error.message` | node\_modules/typescript/lib/lib.es5.d.ts:1077 |
| <a id="property-name"></a> `name` | `public` | `string` | `Error.name` | node\_modules/typescript/lib/lib.es5.d.ts:1076 |
| <a id="property-reason"></a> `reason` | `public` | `any` | - | [packages/core/src/task/index.ts:27](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L27) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `Error.stack` | node\_modules/typescript/lib/lib.es5.d.ts:1078 |

## Methods

### isError()

> `static` **isError**(`error`): `error is Error`

Defined in: node\_modules/typescript/lib/lib.esnext.error.d.ts:23

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |

#### Returns

`error is Error`

#### Inherited from

`Error.isError`
