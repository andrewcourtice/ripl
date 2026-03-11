[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / GetMutableKeys

# Type Alias: GetMutableKeys\<TValue\>

> **GetMutableKeys**\<`TValue`\> = `{ [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, TKey> }`\[keyof `TValue`\]

Defined in: [types.ts:39](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/types.ts#L39)

Extracts the mutable (non-readonly) property keys from an object type.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* `object` |
