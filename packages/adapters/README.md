# @ripl/adapters

The framework-agnostic half of [Ripl](https://www.ripl.run)'s UI adapters.

Most of the work in wrapping a Ripl scene graph in a declarative component tree is not framework work at all. The state-key tables, the prop pipeline, the transition scope, the enter/update/leave logic and the paint-ordering tree touch no framework API. This package holds that half, and [`@ripl/vue`](../../adapters/vue) and [`@ripl/react`](../../adapters/react) are the thin bindings over it.

You do not install this directly: it arrives as a dependency of whichever adapter you use, and each re-exports the parts a consumer might reach for. Install it only if you are building a fourth adapter.

## What is in here

| Export | Use |
| --- | --- |
| `RiplTree`, `createRiplTree` | Per-context coordination: which group each element belongs to, which paint tier is in effect, and when to repaint. |
| `RiplTransitionScope` | The live phases in scope for a subtree, with the ordering a staggered phase factory needs. |
| `createElementTransition` | The enter, update and leave appliers for one element. |
| `createEventForwarder`, `getBoundListeners` | Demand-driven event forwarding from a Ripl bus to a component's listeners. |
| `readBoundProps`, `collectChangedProps`, `partitionProps`, `applyState`, `applyFields` | The prop pipeline: read what was bound, diff it, split it, write it. |
| `resolveNodeDefinition`, `elementFactory` | Turn a `RiplNodeDefinition` into the key lists a component binds to. |
| `BASE_STATE_KEYS`, `ELEMENT_STATE_KEYS`, `SHAPE_FIELDS`, `CONSTRUCTION_ONLY_KEYS`, … | The key tables every adapter works from. |
| `normalizeClass`, `resolveClassNames` | Flatten any class binding form to a stable, comparable value. |

## The seams an adapter fills in

What genuinely differs between frameworks is a parameter here rather than an assumption.

- **Where the reactivity lives.** `RiplTree` holds its context, scene and renderer as plain properties; an adapter keeps whatever reactive box its framework needs alongside them.
- **What the class prop is called.** `readBoundProps`, `collectChangedProps` and `applyFields` take a `classKey`, defaulting to `class`; the React adapter passes `className`.
- **When the initial mount is over.** `RiplTransitionScope.settle()` separates an element that *appears* from one that later *enters*. Each adapter calls it from whichever hook runs after its descendants have mounted.

## Contracts

- **This package owns the `@ripl/web` import**, and with it the platform factory: `requestAnimationFrame`, `devicePixelRatio`, `getDefaultState` and `measureText`. An adapter inherits that through its dependency here and should not add an `@ripl/web` import of its own, because a bare side-effect import inside a `sideEffects: false` package can be tree-shaken away, whereas the value imports here cannot.
- **Paint order comes from the hidden DOM mirror**, not from the order elements are attached in. Each element renders one `<ripl-node>` marker into a hidden subtree, and `RiplTree` reads that subtree's order and replays it onto the group. A framework whose effects run children-first, or which moves components on a keyed reorder rather than remounting them, still paints in declaration order.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run).

## License

MIT
