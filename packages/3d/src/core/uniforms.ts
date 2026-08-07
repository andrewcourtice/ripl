/**
 * The scene uniform layout, shared by the CPU painter's tests and the WebGPU backend.
 *
 * Both the byte packer and the WGSL struct text are derived from the descriptors here, so a field
 * added on one side cannot silently drift from the other.
 */

import type {
    ColorUnitRGB,
} from './color';

import type {
    ResolvedLight,
} from './shading';

import type {
    Vector3,
} from '../math/vector';

/** The maximum number of lights a single render pass can carry. */
export const MAX_LIGHTS = 8;

/** Numeric discriminators for each light type, shared by the packer and the shader. */
export const LIGHT_TYPE_CODE = {
    /** Uniform light with no direction. */
    ambient: 0,
    /** Two-colour sky/ground gradient light. */
    hemisphere: 1,
    /** Parallel light with a direction but no position. */
    directional: 2,
    /** Positional light radiating in every direction. */
    point: 3,
    /** Positional light confined to a cone. */
    spot: 4,
} as const;

/** Numeric discriminators for each fog mode, shared by the packer and the shader. */
export const FOG_MODE_CODE = {
    /** No fog. */
    none: 0,
    /** Fog ramping linearly between a near and a far distance. */
    linear: 1,
    /** Fog ramping exponentially with the square of distance. */
    exponential: 2,
} as const;

/** A single field within a uniform struct. */
export interface UniformField {
    /** The field's name, identical in the packer and the WGSL struct. */
    name: string;
    /** The field's WGSL type. */
    type: string;
    /** The field's offset from the start of the struct, in 4-byte floats. */
    offset: number;
    /** The field's size, in 4-byte floats. */
    size: number;
}

/** Floats occupied by one light in the scene uniform. */
export const LIGHT_STRUCT_SIZE = 20;

/**
 * The per-light fields, in declaration order.
 *
 * Each is a `vec4f` so the array stride stays 16-byte aligned, with the scalar that would otherwise
 * need its own slot folded into the unused `w` component.
 */
export const LIGHT_UNIFORM_FIELDS: UniformField[] = [
    {
        name: 'color',
        type: 'vec4f',
        offset: 0,
        size: 4,
    },
    {
        name: 'position',
        type: 'vec4f',
        offset: 4,
        size: 4,
    },
    {
        name: 'direction',
        type: 'vec4f',
        offset: 8,
        size: 4,
    },
    {
        name: 'params',
        type: 'vec4f',
        offset: 12,
        size: 4,
    },
    {
        name: 'ground',
        type: 'vec4f',
        offset: 16,
        size: 4,
    },
];

/** The scene uniform fields, in declaration order. */
export const SCENE_UNIFORM_FIELDS: UniformField[] = [
    {
        name: 'viewProjectionMatrix',
        type: 'mat4x4f',
        offset: 0,
        size: 16,
    },
    {
        name: 'cameraPosition',
        type: 'vec4f',
        offset: 16,
        size: 4,
    },
    {
        name: 'fogColor',
        type: 'vec4f',
        offset: 20,
        size: 4,
    },
    {
        name: 'fogParams',
        type: 'vec4f',
        offset: 24,
        size: 4,
    },
    {
        name: 'lights',
        type: `array<Light, ${MAX_LIGHTS}>`,
        offset: 28,
        size: MAX_LIGHTS * LIGHT_STRUCT_SIZE,
    },
];

/** Floats occupied by the whole scene uniform. */
export const SCENE_UNIFORM_FLOATS = 28 + MAX_LIGHTS * LIGHT_STRUCT_SIZE;

/** Size in bytes of the scene uniform buffer. */
export const SCENE_UNIFORM_BYTES = SCENE_UNIFORM_FLOATS * 4;

/** Float offset of the first light within the scene uniform. */
export const SCENE_LIGHTS_OFFSET = 28;

/** Float offset of the camera position within the scene uniform. */
export const SCENE_CAMERA_POSITION_OFFSET = 16;

/** Float offset of the light count, packed into the camera position's unused `w` component. */
export const SCENE_LIGHT_COUNT_OFFSET = 19;

/** Float offset of the fog colour and mode within the scene uniform. */
export const SCENE_FOG_COLOR_OFFSET = 20;

/** Float offset of the fog distance parameters within the scene uniform. */
export const SCENE_FOG_PARAMS_OFFSET = 24;

/** Fog reduced to the numeric form the scene uniform carries. */
export interface ResolvedFog {
    /** The fog mode, one of {@link FOG_MODE_CODE}. */
    mode: number;
    /** The fog colour, in unit RGB. */
    color: ColorUnitRGB;
    /** Distance at which linear fog begins. */
    near: number;
    /** Distance at which linear fog fully obscures. */
    far: number;
    /** Density of exponential fog. */
    density: number;
}

/** Everything the scene uniform needs, independent of any particular backend. */
export interface SceneUniformInput {
    /** The combined view-projection matrix. */
    viewProjectionMatrix: ArrayLike<number>;
    /** The camera's world-space position. */
    cameraPosition: Vector3;
    /** The resolved lights, capped at {@link MAX_LIGHTS} by the caller. */
    lights: ResolvedLight[];
    /** The resolved fog, or `null`/omitted for no fog. */
    fog?: ResolvedFog | null;
}

/**
 * Writes the scene uniform into a `Float32Array` laid out per {@link SCENE_UNIFORM_FIELDS}.
 *
 * The counterpart to {@link SCENE_UNIFORM_WGSL}: both are derived from the same descriptors, so a
 * field cannot be added to the bytes without appearing in the shader's struct.
 *
 * @param target - The scratch array to write into; must hold at least {@link SCENE_UNIFORM_FLOATS}.
 * @param input - The scene state to pack.
 * @returns `target`, for convenience.
 */
export function packSceneUniform(target: Float32Array, input: SceneUniformInput): Float32Array {
    const {
        viewProjectionMatrix,
        cameraPosition,
        lights,
        fog,
    } = input;

    target.fill(0);
    target.set(viewProjectionMatrix as ArrayLike<number> & Iterable<number>, 0);

    target[SCENE_CAMERA_POSITION_OFFSET] = cameraPosition[0];
    target[SCENE_CAMERA_POSITION_OFFSET + 1] = cameraPosition[1];
    target[SCENE_CAMERA_POSITION_OFFSET + 2] = cameraPosition[2];
    target[SCENE_LIGHT_COUNT_OFFSET] = Math.min(lights.length, MAX_LIGHTS);

    if (fog) {
        target[SCENE_FOG_COLOR_OFFSET] = fog.color[0];
        target[SCENE_FOG_COLOR_OFFSET + 1] = fog.color[1];
        target[SCENE_FOG_COLOR_OFFSET + 2] = fog.color[2];
        target[SCENE_FOG_COLOR_OFFSET + 3] = fog.mode;
        target[SCENE_FOG_PARAMS_OFFSET] = fog.near;
        target[SCENE_FOG_PARAMS_OFFSET + 1] = fog.far;
        target[SCENE_FOG_PARAMS_OFFSET + 2] = fog.density;
    }

    const count = Math.min(lights.length, MAX_LIGHTS);

    for (let index = 0; index < count; index++) {
        const light = lights[index];
        const base = SCENE_LIGHTS_OFFSET + index * LIGHT_STRUCT_SIZE;

        target[base] = light.color[0];
        target[base + 1] = light.color[1];
        target[base + 2] = light.color[2];
        target[base + 3] = light.type;

        target[base + 4] = light.position[0];
        target[base + 5] = light.position[1];
        target[base + 6] = light.position[2];
        target[base + 7] = light.distance;

        target[base + 8] = light.direction[0];
        target[base + 9] = light.direction[1];
        target[base + 10] = light.direction[2];
        target[base + 11] = light.decay;

        target[base + 12] = light.cosOuter;
        target[base + 13] = light.cosInner;

        target[base + 16] = light.ground[0];
        target[base + 17] = light.ground[1];
        target[base + 18] = light.ground[2];
    }

    return target;
}

function renderStruct(name: string, fields: UniformField[]): string {
    const members = fields.map(field => `    ${field.name}: ${field.type},`).join('\n');

    return `struct ${name} {\n${members}\n};`;
}

/**
 * The WGSL declaration of the scene uniform, generated from {@link SCENE_UNIFORM_FIELDS}.
 *
 * Interpolated into both shader stages rather than written out twice, so the vertex and fragment
 * stages cannot disagree about the layout the packer writes.
 */
export const SCENE_UNIFORM_WGSL = [
    renderStruct('Light', LIGHT_UNIFORM_FIELDS),
    renderStruct('Uniforms', SCENE_UNIFORM_FIELDS),
].join('\n\n');
