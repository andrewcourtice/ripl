[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / GetReadonlyKeys

# Type Alias: GetReadonlyKeys\<TValue\>

> **GetReadonlyKeys**\<`TValue`\> = `{ [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, never, TKey> }`\[keyof `TValue`\]

Defined in: [types.ts:34](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/types.ts#L34)

Extracts the readonly property keys from an object type.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* `object` |
