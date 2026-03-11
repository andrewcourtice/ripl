[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ColorParseError

# Class: ColorParseError

Defined in: [packages/core/src/color/parsers.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/parsers.ts#L24)

Error thrown when a color string cannot be parsed in the expected format.

## Extends

- `Error`

## Constructors

### Constructor

> **new ColorParseError**(`value`, `type`): `ColorParseError`

Defined in: [packages/core/src/color/parsers.ts:26](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/parsers.ts#L26)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |
| `type` | [`ColorSpace`](../type-aliases/ColorSpace.md) |

#### Returns

`ColorParseError`

#### Overrides

`Error.constructor`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `unknown` | `Error.cause` | node\_modules/typescript/lib/lib.es2022.error.d.ts:26 |
| <a id="property-message"></a> `message` | `string` | `Error.message` | node\_modules/typescript/lib/lib.es5.d.ts:1077 |
| <a id="property-name"></a> `name` | `string` | `Error.name` | node\_modules/typescript/lib/lib.es5.d.ts:1076 |
| <a id="property-stack"></a> `stack?` | `string` | `Error.stack` | node\_modules/typescript/lib/lib.es5.d.ts:1078 |

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
