[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / Merge

# Type Alias: Merge\<TA, TB\>

> **Merge**\<`TA`, `TB`\> = `Omit`\<`TA`, keyof `TB`\> & `TB`

Defined in: [types.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/types.ts#L22)

Merges two types, with properties in `TB` overriding those in `TA`.

## Type Parameters

| Type Parameter |
| ------ |
| `TA` |
| `TB` |
