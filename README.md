# Ripl

Ripl (pronounced ripple) is a library for working with canvas in an intuitive and familiar way. Working with the canvas API can be quite difficult as it is designed to be very low-level. Ripl alleviates this issue by mimicking the DOM/CSSOM in as many ways possible to make it simple for developers to interact with canvas via high-level APIs.

One of the main differences with Ripl compared to other canvas libraries is that every element in Ripl is expressed as a function of time where `0 <= time <= 1`. By expressing elements this way, it makes transforming between states extremely easy which in turn works well wth scene rendering and animations.

## Usage

Let's look at the most basic example of using Ripl which is to draw a static shape to a canvas:

```typescript
import {
    getContext,
    createCircle,
} from '@ripl/core';

function draw() {
    const {
        context,
        width,
        height
    } = getContext('.example__canvas');

    const circle = createCircle({
        fillStyle: 'rgb(30, 105, 120)',
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: width / 3
    });

    circle.render(context);
}
```

Now that we have a circle, let's see how we can use keyframe expressions to render the circle in different states over time:

```typescript
import {
    getContext,
    createCircle,
} from '@ripl/core';

function draw() {
    const {
        context,
        width,
        height
    } = getContext('.example__canvas');

    const circle = createCircle({
        fillStyle: ['rgb(30, 105, 120)', 'rgba(150, 105, 120, 0.2)'],
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: [width / 5, width / 3]
    });

    circle.render(context);
}
```

Now we've stated that the circle should change it's `fillStyle` and `radius` properties between their start and end states. For now this process is manual by changing the time parameter when calling render:

```typescript
circle.render(context); // time === 0
circle.render(context, 0.5); // time === 0.5, radius would be width / 4 at this point, the fillStyle would be a color halfway between it's 2 defined states
circle.render(context, 1); // time === 1, radius would be width / 3 at this point
```

Element properties can also be expressed as explicit keyframes or interpolation functions:

```typescript
import {
    getContext,
    createCircle,
} from '@ripl/core';

function draw() {
    const {
        context,
        width,
        height
    } = getContext('.example__canvas');

    const circle = createCircle({
        fillStyle: [
            {
                offset: 0.3,
                value: 'rgb(30, 105, 120)'
            },
            {
                offset: 0.7,
                value: 'rgba(150, 105, 120, 0.2)'
            }
        ],
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: time => Math.min(width, height) / time
    });

    circle.render(context, 0.5);
}
```

In the above example the `radius` of the circle will grow as time approaches 1. The `fillStyle` will also smoothly interpolate between states at it's specified keyframes.

Now let's animate the rendering process as opposed to changing time manually:

```typescript
import {
    getContext,
    createCircle,
    transition,
    easeOutQuint,
} from '@ripl/core';

function draw() {
    const {
        context,
        clear,
        width,
        height
    } = getContext('.example__canvas');

    const circle = createCircle({
        fillStyle: [
            {
                offset: 0.3,
                value: 'rgb(30, 105, 120)'
            },
            {
                offset: 0.7,
                value: 'rgba(150, 105, 120, 0.2)'
            }
        ],
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: time => Math.min(width, height) / time
    });

    return transition(time => {
        clear(); // clear the canvas on each frame
        circle.render(context, time);
    }, {
        duration: 3000,
        ease: easeOutQuint,
    });
}
```

The transition engine will now smoothly animate the circle between states over 3 seconds. The transition function returns a promise that can be awaited.

Let's take this a step further by using groups to render more than just one element and inherit properties:

```typescript
import {
    getContext,
    createCircle,
    createGroup,
    transition,
    easeOutQuint,
} from '@ripl/core';

function draw() {
    const {
        context,
        clear,
        width,
        height
    } = getContext('.example__canvas');

    const group = createGroup({
        fillStyle: ['#000000', '#FF0000']
    });

    const circles = Array.from({ length: 1000 }, () => createCircle({
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: Math.random() * Math.min(width, height) 
    }));

    group.add(circles);

    return transition(time => {
        clear(); // clear the canvas on each frame
        group.render(context, time);
    }, {
        duration: 3000,
        ease: easeOutQuint,
    });
}
```

Notice we now call `render` on the group as opposed to each circle element. The circles now all inherit their `fillStyle` from the group.

Now let's add some interaction using a `scene` and `renderer` to create a continuous render cycle and handling mouse events: 

```typescript
import {
    clamp,
    scaleContinuous,
    easeOutQuint,
    createScene,
    createRenderer,
    createCircle,
    createGroup,
    createLine,
} from '@ripl/core';


function draw() {
    let x = 0;
    let y = 0;

    const scene = createScene('.example__canvas');
    const renderer = createRenderer(scene, {
        autoStart: false
    });

    const circleGroup = createGroup({
        fillStyle: ['#000000', '#FF0000']
    });

    const rScale = scaleContinuous([0, 1], [5, 10]);

    const circles = Array.from({ length: 1000 }, () => createCircle({
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: rScale(Math.random()) 
    }));

    const crosshairGroup = createGroup({
        strokeStyle: '#CCCCCC'
    });

    const crosshairHLine = createLine({
        x1: 0,
        y1: () => y,
        x2: scene.width,
        y2: () => y
    }, {
        pointerEvents: 'none'
    });

    const crosshairVLine = createLine({
        x1: () => x,
        y1: 0,
        x2: () => x,
        y2: scene.height
    }, {
        pointerEvents: 'none'
    });

    circleGroup.add(circles);
    crosshairGroup.add([
        crosshairHLine,
        crosshairVLine,
    ]);

    scene.add([
        circleGroup,
        crosshairGroup
    ]);

    scene.on('scenemousemove', ({ data }) => {
        if (data) {
            x = data.x;
            y = data.y;
        }
    });

    circleGroup.on('elementclick', ({ element }) => element.update({
        fillStyle: '#FF0000'
    }));

    renderer.start();
}
```

For a more in depth demo take a look at the pie chart example here: https://github.com/andrewcourtice/ripl/blob/main/packages/charts/src/charts/pie.ts