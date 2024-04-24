---
outline: "deep"
---

# Tutorial

This tutorial is a step-by-step guide to using Ripl from the most basic use-case and progressively adding complexity for more advanced use-cases.

## The basics

### Render a basic element

The following example show the most basic usage of Ripl - drawing a element to a context. There are 3 steps to rendering a basic element:

1. Create a context for which the element will be rendered to
2. Create an instance of an element specifying all required parameters for that element type
3. Render the element to the context

:::tabs
== Code
```ts
import {
    createContext,
    createCircle
} from '@ripl/core';

const context = createContext('.mount-element');
const circle = createCircle({
    fillStyle: '#3a86ff'
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 3,
});

circle.render(context);
```
== Demo
<ripl-example @context-changed="basicContextChanged"></ripl-example>
:::

> [!TIP]
> Ripl renders to a canvas context by default. To render to a different context import `createContext` from the relevant package (eg. `@ripl/svg`) as opposed to `@ripl/core`

### Change element properties

An element can be modified at any point by simply changing the properties you wish to update and re-rendering the element to the context.

:::tabs
== Code
```ts
circle.cx += 20;
circle.cy += 20;
circle.radius = 58;
circle.fillStyle = 'rgb()' 
```
== Demo
<ripl-example @context-changed="changeContextChanged">
    <template #footer>
        <div layout="row">
            <div>Radius</div>
            <input type="range" v-model.number="changePropsRadius" :min="changePropsMin" :max="changePropsMax" step="1" self="size-x1"/>
        </div>
    </template>
</ripl-example>
:::

## Creating structure

### Using groups


### Using scenes

## Interactivity and animation

### Using renderers

### Adding animation




<script lang="ts" setup>
import {
    ref,
    watch
} from 'vue';

import {
    createCircle,
    createText,
    Circle,
    clamp,
} from '@ripl/core';

import {
    useRiplExample
} from '../../../.vitepress/compositions/example';

// Basic example

const {
    contextChanged: basicContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const circle = createCircle({
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 3,
        fillStyle: '#3a86ff'
    });

    const label = createText({
        x: circle.cx,
        y: circle.cy,
        content: context.type,
        fillStyle: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle',
        font: '24px sans-serif'
    });

    const render = () => {
        context.markRenderStart();
        circle.render(context);
        label.render(context);
        context.markRenderEnd();
    }

    render();

    context.on('resize', () => {
        context.clear();
        render();
    })
});


// Change props example

const changePropsMin = ref(0);
const changePropsMax = ref(0);
const changePropsRadius = ref(0);

let changeCircle: Circle;

const {
    context: changeContext,
    contextChanged: changeContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;
    const shortSize = Math.min(width, height);

    changePropsMin.value = shortSize / 10;
    changePropsMax.value = shortSize;
    changePropsRadius.value = shortSize / 3;

    changeCircle = createCircle({
        cx: width / 2,
        cy: height / 2,
        radius: shortSize / 3,
        fillStyle: '#3a86ff'
    });

    changeCircle.render(context);

    context.on('resize', () => {
        changeCircle.render(context);
        context.clear();
    })
});

watch(changePropsRadius, (radius) => {
    if (!changeCircle) {
        return;
    }

    changeCircle.radius = clamp(parseInt(radius, 10), changePropsMin.value, changePropsMax.value);

    changeContext.value.clear();
    changeCircle.render(changeContext.value);
});
</script>