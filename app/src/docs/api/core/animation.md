---
outline: "deep"
---

# Animation & Easing

<p class="api-package-badge"><code>@ripl/core</code></p>

Transition utilities and easing functions for smooth animations.

## Overview

**Classes:** [`Transition`](#transition)

**Interfaces:** [`TransitionOptions`](#transitionoptions)

**Type Aliases:** [`Ease`](#ease) · [`TransitionCallback`](#transitioncallback) · [`TransitionDirection`](#transitiondirection)

**Functions:** [`computeTransitionTime`](#computetransitiontime) · [`transition`](#transition) · [`createFrameBuffer`](#createframebuffer)

**Constants:** [`easeLinear`](#easelinear) · [`easeInQuad`](#easeinquad) · [`easeOutQuad`](#easeoutquad) · [`easeInOutQuad`](#easeinoutquad) · [`easeInCubic`](#easeincubic) · [`easeOutCubic`](#easeoutcubic) · [`easeInOutCubic`](#easeinoutcubic) · [`easeInQuart`](#easeinquart) · [`easeOutQuart`](#easeoutquart) · [`easeInOutQuart`](#easeinoutquart) · [`easeInQuint`](#easeinquint) · [`easeOutQuint`](#easeoutquint) · [`easeInOutQuint`](#easeinoutquint)

### Transition `class`

A `Task`-based animation that drives a callback over time with easing, looping, and abort support.

```ts
class Transition extends Task
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `signal` | `AbortSignal` | The `AbortSignal` associated with this task's controller. |
| `hasAborted` | `boolean` | Whether this task has already been aborted. |
| `readonly __@toStringTag@81` | `string` |  |

**Methods:**

#### `abort(reason: unknown): Transition`

Aborts the task with an optional reason, triggering all registered abort callbacks.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `reason` | `unknown` |  |

#### `then(onfulfilled: ((value: void) =&gt; TResult1 \| PromiseLike&lt;TResult1&gt;) \| null \| undefined, onrejected: ((reason: any) =&gt; TResult2 \| PromiseLike&lt;TResult2&gt;) \| null \| undefined): Promise&lt;TResult1 \| TResult2&gt;`

Attaches callbacks for the resolution and/or rejection of the Promise.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onfulfilled` | `((value: void) =&gt; TResult1 \| PromiseLike&lt;TResult1&gt;) \| null \| undefined` | The callback to execute when the Promise is resolved. |
| `onrejected` | `((reason: any) =&gt; TResult2 \| PromiseLike&lt;TResult2&gt;) \| null \| undefined` | The callback to execute when the Promise is rejected. |

#### `catch(onrejected: ((reason: any) =&gt; TResult \| PromiseLike&lt;TResult&gt;) \| null \| undefined): Promise&lt;void \| TResult&gt;`

Attaches a callback for only the rejection of the Promise.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onrejected` | `((reason: any) =&gt; TResult \| PromiseLike&lt;TResult&gt;) \| null \| undefined` | The callback to execute when the Promise is rejected. |

#### `finally(onfinally: (() =&gt; void) \| null \| undefined): Promise&lt;void&gt;`

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onfinally` | `(() =&gt; void) \| null \| undefined` | The callback to execute when the Promise is settled (fulfilled or rejected). |

---

### TransitionOptions `interface`

Configuration for a transition animation.

```ts
interface TransitionOptions {
    duration: number;
    ease: Ease;
    loop: boolean;
    delay: number;
    direction: TransitionDirection;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `duration` | `number` |  |
| `ease` | `Ease` |  |
| `loop` | `boolean` |  |
| `delay` | `number` |  |
| `direction` | `TransitionDirection` |  |
---

### Ease `type`

An easing function that maps a linear progress value (0–1) to an eased output value.

```ts
type Ease = (time: number) => number;
```

---

### TransitionCallback `type`

Callback invoked on each animation frame with the current eased time value (0–1).

```ts
type TransitionCallback = (time: number) => void;
```

---

### TransitionDirection `type`

The playback direction of a transition.

```ts
type TransitionDirection = 'forward' | 'reverse';
```

---

### computeTransitionTime `function`

Computes the eased time value for a transition given elapsed time, duration, easing function, and direction.

```ts
function computeTransitionTime(elapsed: number, duration: number, ease: Ease, direction: TransitionDirection): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `elapsed` | `number` |  |
| `duration` | `number` |  |
| `ease` | `Ease` |  |
| `direction` | `TransitionDirection` |  |

**Returns:** `number`

---

### transition `function`

Creates and starts a frame-driven transition that invokes the callback with the eased time on each animation frame.

```ts
function transition(callback: TransitionCallback, options?: Partial<TransitionOptions>): Transition;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `callback` | `TransitionCallback` |  |
| `options` | `Partial&lt;TransitionOptions&gt; \| undefined` |  |

**Returns:** `Transition`

---

### createFrameBuffer `function`

Creates a debounced `requestAnimationFrame` wrapper that cancels any pending frame before scheduling a new one.

```ts
function createFrameBuffer();
```

**Returns:** `(callback: AnyFunction) =&gt; void`

---

### easeLinear `const`

Linear easing — no acceleration or deceleration.

```ts
const easeLinear: Ease;
```

---

### easeInQuad `const`

Quadratic ease-in — accelerates from zero velocity.

```ts
const easeInQuad: Ease;
```

---

### easeOutQuad `const`

Quadratic ease-out — decelerates to zero velocity.

```ts
const easeOutQuad: Ease;
```

---

### easeInOutQuad `const`

Quadratic ease-in-out — accelerates then decelerates.

```ts
const easeInOutQuad: Ease;
```

---

### easeInCubic `const`

Cubic ease-in — accelerates from zero velocity.

```ts
const easeInCubic: Ease;
```

---

### easeOutCubic `const`

Cubic ease-out — decelerates to zero velocity.

```ts
const easeOutCubic: Ease;
```

---

### easeInOutCubic `const`

Cubic ease-in-out — accelerates then decelerates.

```ts
const easeInOutCubic: Ease;
```

---

### easeInQuart `const`

Quartic ease-in — accelerates from zero velocity.

```ts
const easeInQuart: Ease;
```

---

### easeOutQuart `const`

Quartic ease-out — decelerates to zero velocity.

```ts
const easeOutQuart: Ease;
```

---

### easeInOutQuart `const`

Quartic ease-in-out — accelerates then decelerates.

```ts
const easeInOutQuart: Ease;
```

---

### easeInQuint `const`

Quintic ease-in — accelerates from zero velocity.

```ts
const easeInQuint: Ease;
```

---

### easeOutQuint `const`

Quintic ease-out — decelerates to zero velocity.

```ts
const easeOutQuint: Ease;
```

---

### easeInOutQuint `const`

Quintic ease-in-out — accelerates then decelerates.

```ts
const easeInOutQuint: Ease;
```

---

