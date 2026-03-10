---
outline: "deep"
---

# Ellipse

An **Ellipse** draws an elliptical shape with independent X and Y radii (`radiusX`, `radiusY`), intrinsic `rotation`, and optional `startAngle`/`endAngle` for partial ellipses. Use ellipses when you need non-uniform curvature — for example, orbit paths, oval indicators, or stylized backgrounds.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createEllipse,
} from '@ripl/core';

const context = createContext('.mount-element');
const TAU = Math.PI * 2;

createEllipse({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radiusX: context.width / 4,
    radiusY: context.height / 4,
    rotation: 0,
    startAngle: 0,
    endAngle: TAU,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createEllipse,
    createText,
} from '@ripl/core';

const TAU = Math.PI * 2;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const rx = Math.min(w / 6, 80);
    const ry = Math.min(h / 5, 60);

    const render = () => {
        context.markRenderStart();

        createEllipse({
            fill: '#3a86ff',
            cx: w * 0.3, cy: h / 2,
            radiusX: rx, radiusY: ry,
            rotation: 0, startAngle: 0, endAngle: TAU,
        }).render(context);

        createText({
            x: w * 0.3, y: h / 2 + ry + 24,
            content: 'No Rotation', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createEllipse({
            fill: '#ff006e',
            cx: w * 0.7, cy: h / 2,
            radiusX: rx, radiusY: ry,
            rotation: Math.PI / 6, startAngle: 0, endAngle: TAU,
        }).render(context);

        createText({
            x: w * 0.7, y: h / 2 + ry + 24,
            content: 'Rotated 30°', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>

## Usage

```ts
import {
    createEllipse,
} from '@ripl/core';

const ellipse = createEllipse({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radiusX: 100,
    radiusY: 60,
    rotation: 0,
    startAngle: 0,
    endAngle: Math.PI * 2,
});
```

## Properties

The ellipse's geometry is defined by `cx`, `cy`, `radiusX`, `radiusY`, `rotation`, `startAngle`, and `endAngle`.

> [!NOTE]
> For the full property list, see the [Ellipse API Reference](/docs/api/core/elements).
