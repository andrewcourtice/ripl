[Documentation](../../packages.md) / @ripl/3d

# @ripl/3d

Experimental 3D rendering for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

> **Note:** This package is experimental and its API may change between releases.

## Installation

```bash
npm install @ripl/3d
```

## Overview

Extends Ripl's rendering pipeline with 3D capabilities. Projects 3D geometry onto Ripl's 2D canvas context using a virtual camera, depth sorting, and flat shading.

## Features

- **3D math** — Vectors, matrices, and transformations
- **Camera** — Configurable virtual camera with projection
- **Shading** — Flat shading with directional lighting
- **Depth sorting** — Automatic painter's algorithm for correct draw order
- **3D shapes** — Built-in 3D shape primitives
- **Interpolation** — 3D-aware interpolators for smooth animation

## Usage

```typescript
import {
    createContext,
} from '@ripl/core';
import {
    createCamera, createCube,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera({ /* options */ });
const cube = createCube({ /* options */ });
```

## Documentation

Full documentation is available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../_media/LICENSE)

## Classes

| Class | Description |
| ------ | ------ |
| [Camera](classes/Camera.md) | An interactive camera controlling the 3D context's view and projection, with mouse/touch orbit, pan, and zoom. |
| [Cone](classes/Cone.md) | A 3D cone shape with configurable radius, height, and segment resolution. |
| [Context3D](classes/Context3D.md) | 3D rendering context extending the Canvas context with view/projection matrices and a face buffer for painter's algorithm sorting. |
| [Cube](classes/Cube.md) | A 3D cube shape with uniform edge size. |
| [Cylinder](classes/Cylinder.md) | A 3D cylinder shape with independent top and bottom radii for truncated cones. |
| [Plane](classes/Plane.md) | A flat rectangular 3D plane oriented along the XY plane. |
| [Shape3D](classes/Shape3D.md) | Base class for 3D shapes, handling model transforms, face projection, shading, and hit testing. |
| [Sphere](classes/Sphere.md) | A 3D sphere shape tessellated with configurable segments and rings. |
| [Torus](classes/Torus.md) | A 3D torus (donut) shape with configurable major radius, tube radius, and tessellation. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CameraInteractionConfig](interfaces/CameraInteractionConfig.md) | Fine-grained configuration for a single camera interaction. |
| [CameraInteractions](interfaces/CameraInteractions.md) | Configures which camera interactions (zoom, pivot, pan) are enabled. |
| [CameraOptions](interfaces/CameraOptions.md) | Options for constructing a camera, including position, projection type, and interaction config. |
| [ConeState](interfaces/ConeState.md) | State interface for a cone, defining radius, height, and segment count. |
| [Context3DOptions](interfaces/Context3DOptions.md) | Options for the 3D rendering context, extending the base context options with camera parameters. |
| [CubeState](interfaces/CubeState.md) | State interface for a cube, defining uniform edge size. |
| [CylinderState](interfaces/CylinderState.md) | State interface for a cylinder, defining top/bottom radii, height, and segment count. |
| [Face3D](interfaces/Face3D.md) | A single face of a 3D mesh, defined by its vertices and an optional precomputed normal. |
| [PlaneState](interfaces/PlaneState.md) | State interface for a plane, defining width and height. |
| [ProjectedFace3D](interfaces/ProjectedFace3D.md) | A projected face ready for 2D rendering with screen-space points, fill/stroke styles, and depth. |
| [Shape3DState](interfaces/Shape3DState.md) | State interface for a 3D shape, defining position and rotation around each axis. |
| [SphereState](interfaces/SphereState.md) | State interface for a sphere, defining radius, longitudinal segments, and latitudinal rings. |
| [TorusState](interfaces/TorusState.md) | State interface for a torus, defining major radius, tube radius, and segment counts. |
| [Viewport](interfaces/Viewport.md) | Viewport dimensions used for projection. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [CameraInteractionOption](type-aliases/CameraInteractionOption.md) | A camera interaction can be enabled/disabled with a boolean or configured with sensitivity. |
| [LightMode](type-aliases/LightMode.md) | Determines whether the light direction is fixed in world space or follows the camera. |
| [Matrix4](type-aliases/Matrix4.md) | A column-major 4×4 matrix stored as a 16-element `Float64Array`. |
| [ProjectedPoint](type-aliases/ProjectedPoint.md) | A 2D screen-space point with a depth component for z-ordering. |
| [Shape3DOptions](type-aliases/Shape3DOptions.md) | Options for constructing a 3D shape, with all state properties optional. |
| [Vector3](type-aliases/Vector3.md) | A 3-component vector represented as a labeled tuple [x, y, z]. |

## Variables

| Variable | Description |
| ------ | ------ |
| [interpolateVector3](variables/interpolateVector3.md) | Interpolator factory for `Vector3` values, using component-wise linear interpolation. |
| [LIGHT\_DIRECTION](variables/LIGHT_DIRECTION.md) | Pre-normalised light direction vectors for common light positions. |

## Functions

| Function | Description |
| ------ | ------ |
| [computeFaceBrightness](functions/computeFaceBrightness.md) | Computes a 0–1 brightness value for a face given its normal and a light direction. |
| [computeFaceNormal](functions/computeFaceNormal.md) | Computes the surface normal of a face from its first three vertices via the cross product. |
| [createCamera](functions/createCamera.md) | Factory function that creates a new `Camera` bound to a 3D scene. |
| [createCone](functions/createCone.md) | Factory function that creates a new `Cone` instance. |
| [createContext](functions/createContext.md) | Creates a 3D rendering context attached to the given DOM target. |
| [createCube](functions/createCube.md) | Factory function that creates a new `Cube` instance. |
| [createCylinder](functions/createCylinder.md) | Factory function that creates a new `Cylinder` instance. |
| [createPlane](functions/createPlane.md) | Factory function that creates a new `Plane` instance. |
| [createShape3D](functions/createShape3D.md) | Factory function that creates a new `Shape3D` instance. |
| [createSphere](functions/createSphere.md) | Factory function that creates a new `Sphere` instance. |
| [createTorus](functions/createTorus.md) | Factory function that creates a new `Torus` instance. |
| [elementIsCone](functions/elementIsCone.md) | Type guard that checks whether a value is a `Cone` instance. |
| [elementIsCube](functions/elementIsCube.md) | Type guard that checks whether a value is a `Cube` instance. |
| [elementIsCylinder](functions/elementIsCylinder.md) | Type guard that checks whether a value is a `Cylinder` instance. |
| [elementIsPlane](functions/elementIsPlane.md) | Type guard that checks whether a value is a `Plane` instance. |
| [elementIsShape3D](functions/elementIsShape3D.md) | Type guard that checks whether a value is a `Shape3D` instance. |
| [elementIsSphere](functions/elementIsSphere.md) | Type guard that checks whether a value is a `Sphere` instance. |
| [elementIsTorus](functions/elementIsTorus.md) | Type guard that checks whether a value is a `Torus` instance. |
| [mat4Clone](functions/mat4Clone.md) | Returns a copy of the given matrix. |
| [mat4Create](functions/mat4Create.md) | Creates a zeroed 4×4 matrix. |
| [mat4Identity](functions/mat4Identity.md) | Creates a 4×4 identity matrix. |
| [mat4LookAt](functions/mat4LookAt.md) | Constructs a view matrix looking from `eye` toward `target` with the given `up` direction. |
| [mat4Multiply](functions/mat4Multiply.md) | Multiplies two 4×4 matrices. |
| [mat4Orthographic](functions/mat4Orthographic.md) | Constructs an orthographic projection matrix. |
| [mat4Perspective](functions/mat4Perspective.md) | Constructs a perspective projection matrix. |
| [mat4RotateX](functions/mat4RotateX.md) | Applies a rotation around the X axis to a matrix. |
| [mat4RotateY](functions/mat4RotateY.md) | Applies a rotation around the Y axis to a matrix. |
| [mat4RotateZ](functions/mat4RotateZ.md) | Applies a rotation around the Z axis to a matrix. |
| [mat4Scale](functions/mat4Scale.md) | Applies a scale transform to a matrix. |
| [mat4TransformDirection](functions/mat4TransformDirection.md) | Transforms a direction vector by the upper-3×3 of a 4×4 matrix, ignoring translation. |
| [mat4TransformPoint](functions/mat4TransformPoint.md) | Transforms a 3D point by a 4×4 matrix, performing the perspective divide. |
| [mat4Translate](functions/mat4Translate.md) | Applies a translation to a matrix. |
| [projectPoint](functions/projectPoint.md) | Projects a 3D world-space point onto 2D screen-space via a view-projection matrix and viewport. |
| [shadeFaceColor](functions/shadeFaceColor.md) | Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels. |
| [typeIsVector3](functions/typeIsVector3.md) | Type guard that checks whether a value is a `Vector3` tuple. |
| [vec3Add](functions/vec3Add.md) | Returns the component-wise sum of two vectors. |
| [vec3Cross](functions/vec3Cross.md) | Computes the cross product of two vectors. |
| [vec3Distance](functions/vec3Distance.md) | Returns the Euclidean distance between two points. |
| [vec3Dot](functions/vec3Dot.md) | Computes the dot product of two vectors. |
| [vec3Length](functions/vec3Length.md) | Returns the Euclidean length of a vector. |
| [vec3Lerp](functions/vec3Lerp.md) | Linearly interpolates between two vectors by factor `t`. |
| [vec3Negate](functions/vec3Negate.md) | Negates all components of a vector. |
| [vec3Normalize](functions/vec3Normalize.md) | Returns the unit-length direction of a vector, or the zero vector if length is 0. |
| [vec3Scale](functions/vec3Scale.md) | Scales a vector by a scalar. |
| [vec3Sub](functions/vec3Sub.md) | Returns the component-wise difference of two vectors. |
