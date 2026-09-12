# @ripl/adapters-3d

The framework-agnostic half of [Ripl](https://www.ripl.run)'s 3D UI adapters, shared by [`@ripl/vue-3d`](../../adapters/vue-3d) and [`@ripl/react-3d`](../../adapters/react-3d).

A 3D context is an ordinary Ripl context and a 3D shape is an ordinary element, so almost nothing here is 3D-specific machinery — it is the key tables and the handful of write overrides that describe how a 3D shape differs from a 2D one.

You do not install this directly; it arrives as a dependency of whichever 3D adapter you use.

## What is in here

| Export | Use |
| --- | --- |
| `SHAPE_3D_KEYS` | The state properties specific to each built-in 3D shape. |
| `SHAPE_3D_DEFINITION`, `GROUP_3D_DEFINITION` | The definition fields every 3D shape and group shares. |
| `BASE_3D_STATE_KEYS`, `SHAPE_3D_STATE_KEYS`, `GROUP_3D_FIELD_KEYS`, `SHAPE_3D_FIELD_KEYS`, `SHAPE_3D_FIELDS` | The state and field tables the definitions are built from. |
| `GEOMETRY_WRITERS` | Write overrides for `faces`, `patches` and `surface`, which a shape exposes through a method rather than a setter. |
| `CAMERA_PROP_KEYS`, `CAMERA_SYNC_KEYS`, `LIGHT_KEYS`, `LIGHT_OPTION_KEYS` | The props a camera and each light type accept. |
| `RiplCameraProps`, `RiplLightProps`, `RiplContext3DProps`, … | The prop surfaces both adapters share. |

## Two rules worth knowing

- **There is no `zIndex` on a 3D shape.** It derives depth ordering from its projected position and warns if one is assigned, so `BASE_3D_STATE_KEYS` removes it rather than letting a binding make the console noisy.
- **A group's transform is not element state.** `GROUP_3D_FIELD_KEYS` moves it into the plain fields, because a group's state is not parameterized — which is also why it cannot be the target of a transition.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run).

## License

MIT
