# @ripl/react-native

React Native rendering for [Ripl](https://www.ripl.run), powered by
[React Native Skia](https://shopify.github.io/react-native-skia/). It lets any Ripl element or chart
render natively in a React Native app — the same scene/renderer/element and `@ripl/charts` code that
runs on the web, drawn onto a Skia canvas.

It provides:

- **`ReactNativeSkiaContext`** — a Ripl rendering context (a non-DOM `Context` subclass) that records
  each frame into a Skia `SkPicture`.
- **`<RiplCanvas>`** and the **`useRiplScene` / `useRiplContext`** hooks — for rendering raw Ripl
  elements.
- **Chart components** (`<BarChart>`, `<LineChart>`, `<AreaChart>`, `<PieChart>`, `<ScatterChart>`)
  plus **`createChartComponent`** to wrap any other `@ripl/charts` chart.
- Touch interaction (tooltips, hover, drag) via
  [`react-native-gesture-handler`](https://docs.swmansion.com/react-native-gesture-handler/).

## Installation

```sh
yarn add @ripl/react-native @ripl/core @ripl/charts \
  @shopify/react-native-skia react-native-gesture-handler
```

`@shopify/react-native-skia`, `react-native-gesture-handler`, `react`, and `react-native` are peer
dependencies. Follow their setup guides (in particular, wrap your app in `GestureHandlerRootView`).

## Charts

```tsx
import {
    GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {
    BarChart,
} from '@ripl/react-native';

const data = [
    { month: 'Jan', sales: 120 },
    { month: 'Feb', sales: 180 },
    { month: 'Mar', sales: 90 },
];

export function SalesChart() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BarChart
                style={{ flex: 1 }}
                options={{
                    data,
                    key: 'month',
                    series: [{ id: 'sales', value: 'sales' }],
                    title: 'Monthly sales',
                }}
            />
        </GestureHandlerRootView>
    );
}
```

Any chart type from `@ripl/charts` can be wrapped in one line:

```tsx
import {
    createChartComponent,
} from '@ripl/react-native';

import {
    createHeatmapChart,
} from '@ripl/charts';

const HeatmapChart = createChartComponent(createHeatmapChart);
// <HeatmapChart options={{ data, ... }} style={{ flex: 1 }} />
```

> Memoize the `options` object (e.g. with `useMemo`) if your screen re-renders often — a new object
> identity re-applies the chart options each render.

## Raw elements

```tsx
import {
    createCircle, RiplCanvas,
} from '@ripl/react-native';

<RiplCanvas
    style={{ flex: 1 }}
    onReady={({ scene, renderer }) => {
        scene.add(createCircle({ cx: 80, cy: 80, radius: 40, fillStyle: '#4c9aff' }));
        renderer.render();
    }}
/>;
```

For full control, use the hooks directly and render a `RiplSurface`:

```tsx
import {
    RiplSurface, useRiplScene,
} from '@ripl/react-native';

function Chartlet() {
    const { scene, renderer, picture, onLayout, gesture } = useRiplScene();
    // ... add elements to `scene`, drive `renderer` ...
    return <RiplSurface picture={picture} onLayout={onLayout} gesture={gesture} style={{ flex: 1 }} />;
}
```

## Fonts

Skia loads typefaces asynchronously, but Ripl measures text synchronously during layout. Default
system families are resolved via Skia's system font manager. To use a **custom** font family, load it
(e.g. with React Native Skia's `useFonts`) and pass the typefaces to the component/hook so they are
registered before the first render:

```tsx
const fonts = { 'Inter': interTypeface };
<BarChart options={options} fonts={fonts} style={{ flex: 1 }} />;
```

## How it works

- The context subclasses `@ripl/core`'s abstract `Context` (like `@ripl/terminal`), so the core scene,
  renderer, elements, animation, and `@ripl/charts` are used unchanged.
- Each render pass is recorded into an `SkPicture` and presented via a Skia `<Picture>`; the renderer
  skips idle frames, so a static screen triggers no React re-renders.
- All coordinates are logical pixels (Skia handles device pixels), which keeps hit testing correct
  through transforms.
- Importing the package registers the React Native platform bindings on the shared Ripl `factory`
  (`sideEffects: true`), making the Skia context the default.

## License

MIT
