---
outline: "deep"
---

# Interpolators

Interpolators are functions that compute intermediate values between two endpoints. They are the engine behind Ripl's animation system — when you transition an element's `radius` from 50 to 100, an interpolator generates all the in-between values.

Ripl automatically selects the right interpolator based on the value type, but you can also provide custom interpolators for specialized behavior.

## Built-in Interpolators

Ripl ships with interpolators for common value types. They are tested in order — the first one whose `test` function returns `true` is used.

| Interpolator | Type | Description |
| --- | --- | --- |
| `interpolateNumber` | `number` | Linear interpolation between two numbers |
| `interpolateColor` | `string` | Interpolates between CSS color strings (hex, rgb, rgba, hsl) |
| `interpolateGradient` | `string` | Interpolates between CSS gradient strings |
| `interpolateDate` | `Date` | Interpolates between two Date objects |
| `interpolatePath` | `string` | Interpolates between SVG path strings |
| `interpolateString` | `string` | Extracts and interpolates numeric values within strings |
| `interpolateAny` | `any` | Fallback — snaps to the target value at t > 0.5 |

## How Interpolators Work

An interpolator factory takes two values (start and end) and returns a function that accepts a time value `t` (0 to 1) and returns the interpolated result:

```ts
import { interpolateNumber } from '@ripl/core';

const interpolate = interpolateNumber(0, 100);

interpolate(0);    // 0
interpolate(0.5);  // 50
interpolate(1);    // 100
```

### Number Interpolation

The simplest interpolator — linear interpolation between two numbers:

```ts
const interpolate = interpolateNumber(10, 50);
interpolate(0.25); // 20
interpolate(0.75); // 40
```

### Color Interpolation

Interpolates between CSS color strings by parsing them to RGBA, interpolating each channel, and serializing back:

```ts
import { interpolateColor } from '@ripl/core';

const interpolate = interpolateColor('#3a86ff', '#ff006e');
interpolate(0);    // 'rgba(58, 134, 255, 1)'
interpolate(0.5);  // 'rgba(157, 67, 162, 1)' (midpoint)
interpolate(1);    // 'rgba(255, 0, 110, 1)'
```

Color interpolation works across different color formats — you can interpolate from a hex color to an RGB color seamlessly.

### Any Interpolation

The fallback interpolator for values that don't match any other type. It snaps to the target value at the halfway point:

```ts
import { interpolateAny } from '@ripl/core';

const interpolate = interpolateAny('hello', 'world');
interpolate(0.3);  // 'hello'
interpolate(0.7);  // 'world'
```

## Automatic Interpolation

When you use `element.interpolate()` or `renderer.transition()`, Ripl automatically selects the appropriate interpolator for each property:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,           // uses interpolateNumber
        fillStyle: '#ff006e',  // uses interpolateColor
    },
});
```

## Custom Interpolators

### Inline Interpolator

The simplest way to use a custom interpolator is to pass a function directly in the transition state:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        // Custom function: t goes from 0 to 1
        radius: t => 50 + Math.sin(t * Math.PI) * 50,
    },
});
```

### InterpolatorFactory

For reusable interpolators, create an `InterpolatorFactory` — a function that takes start and end values and returns an interpolator:

```ts
import type { InterpolatorFactory } from '@ripl/core';

const interpolateBoolean: InterpolatorFactory<boolean> = (a, b) => {
    return t => t > 0.5 ? b : a;
};

// Optional: add a test function so it's auto-selected
interpolateBoolean.test = (value) => typeof value === 'boolean';
```

### Keyframe Values

Transitions also support keyframe-style arrays for multi-step animations:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        // Implicit offsets (evenly spaced)
        fillStyle: ['#3a86ff', '#ff006e', '#8338ec'],

        // Explicit offsets
        radius: [
            { value: 80, offset: 0.3 },
            { value: 40, offset: 0.7 },
            { value: 100, offset: 1.0 },
        ],
    },
});
```

## The Interpolation Pipeline

When a transition runs, here's what happens for each property:

1. **Read** the current value from the element
2. **Select** an interpolator (custom function, keyframe array, or auto-detected factory)
3. On each frame, **compute** the eased time `t`
4. **Apply** the interpolated value to the element
5. The renderer re-renders the scene

This pipeline runs for every animated property simultaneously, producing smooth multi-property transitions.
