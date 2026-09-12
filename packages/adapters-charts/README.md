# @ripl/adapters-charts

The framework-agnostic half of [Ripl](https://www.ripl.run)'s chart UI adapters, shared by [`@ripl/vue-charts`](../../adapters/vue-charts) and [`@ripl/react-charts`](../../adapters/react-charts).

You do not install this directly; it arrives as a dependency of whichever chart adapter you use.

## What is in here

| Export | Use |
| --- | --- |
| `createChartController` | The whole lifecycle of one chart: construction, its first paint, updates and teardown. |
| `resolveChartDefinition`, `chartFactory` | Turn a `RiplChartDefinition` into the prop names a component binds to. |
| `BASE_CHART_OPTION_KEYS`, `CHART_OPTION_KEYS` | The options every chart accepts, and those specific to each of the 25 types. |
| `CHART_PROP_ALIASES` | The options whose names a UI framework reserves, and what stands in for them. |
| `RiplChartProps`, `RiplChartListeners`, `RiplAnyChart` | The prop and listener surfaces both adapters share. |

## Four things the controller gets right

Each of these is a bug an adapter would otherwise have to rediscover:

1. **`key` is reserved.** Both Vue and React consume a `key` prop as the element key, so it never reaches the component and the chart option would silently arrive unset. It is bound as `keyBy` and renamed on the way in.
2. **The first paint is held.** A chart renders itself on construction, and a surface with no size collapses its scales permanently, so `autoRender` is forced off and handed back on the first `resize`.
3. **A changed prop updates, never rebuilds.** `collect` diffs the props and `update` pushes the batch through the chart's own `update()`.
4. **Teardown respects ownership.** `Chart.destroy()` takes the context with it, so a chart drawn into a context someone else made tears down only its renderer and scene.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run).

## License

MIT
