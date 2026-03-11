[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createStockChart

# Function: createStockChart()

> **createStockChart**\<`TData`\>(`target`, `options`): [`StockChart`](../classes/StockChart.md)\<`TData`\>

Defined in: [charts/src/charts/stock.ts:719](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L719)

Factory function that creates a new [StockChart](../classes/StockChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`StockChartOptions`](../interfaces/StockChartOptions.md)\<`TData`\> |

## Returns

[`StockChart`](../classes/StockChart.md)\<`TData`\>
