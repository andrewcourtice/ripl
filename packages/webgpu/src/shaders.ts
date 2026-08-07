import {
    FOG_MODE_CODE,
    LIGHT_TYPE_CODE,
    MAX_LIGHTS,
    SCENE_UNIFORM_WGSL,
} from '@ripl/3d';

/**
 * The lighting model, mirroring `shadeSurface` from `@ripl/3d` term for term.
 *
 * The struct layout above it is generated from the same descriptor the CPU-side packer writes, so
 * the two cannot disagree about the bytes. Keeping the maths in one chunk means the parity tests
 * have a single body to replay.
 */
const SHADING_WGSL = /* wgsl */ `
struct Illumination {
    diffuse: vec3f,
    additive: vec3f,
};

fn distanceAttenuation(distance: f32, range: f32, decay: f32) -> f32 {
    let falloff = 1.0 / max(pow(distance, decay), 1e-4);

    if (range <= 0.0) {
        return falloff;
    }

    let ratio = clamp(1.0 - pow(distance / range, 4.0), 0.0, 1.0);

    return falloff * ratio * ratio;
}

fn spotAttenuation(cosAngle: f32, cosOuter: f32, cosInner: f32) -> f32 {
    if (cosAngle <= cosOuter) {
        return 0.0;
    }

    if (cosAngle >= cosInner) {
        return 1.0;
    }

    let ratio = (cosAngle - cosOuter) / (cosInner - cosOuter);

    return ratio * ratio * (3.0 - 2.0 * ratio);
}

fn shadeSurface(
    normal: vec3f,
    position: vec3f,
    viewDirection: vec3f,
    specularColor: vec3f,
    shininess: f32,
    emissive: vec3f,
) -> Illumination {
    var result: Illumination;
    result.diffuse = vec3f(0.0);
    result.additive = emissive;

    let count = min(u32(uniforms.cameraPosition.w), ${MAX_LIGHTS}u);

    for (var index = 0u; index < count; index = index + 1u) {
        let light = uniforms.lights[index];
        let lightType = u32(light.color.w);
        let color = light.color.rgb;

        if (lightType == ${LIGHT_TYPE_CODE.ambient}u) {
            result.diffuse = result.diffuse + color;
            continue;
        }

        if (lightType == ${LIGHT_TYPE_CODE.hemisphere}u) {
            let weight = normal.y * 0.5 + 0.5;
            result.diffuse = result.diffuse + mix(light.ground.rgb, color, weight);
            continue;
        }

        var toLight: vec3f;
        var attenuation = 1.0;

        if (lightType == ${LIGHT_TYPE_CODE.directional}u) {
            toLight = -light.direction.xyz;
        } else {
            let offset = light.position.xyz - position;
            let distance = length(offset);

            if (distance == 0.0) {
                continue;
            }

            toLight = offset / distance;
            attenuation = distanceAttenuation(distance, light.position.w, light.direction.w);

            if (lightType == ${LIGHT_TYPE_CODE.spot}u) {
                attenuation = attenuation * spotAttenuation(dot(-light.direction.xyz, toLight), light.params.x, light.params.y);
            }

            if (attenuation == 0.0) {
                continue;
            }
        }

        let incidence = dot(normal, toLight);

        if (incidence <= 0.0) {
            continue;
        }

        result.diffuse = result.diffuse + color * incidence * attenuation;

        if (shininess <= 0.0) {
            continue;
        }

        let halfway = toLight + viewDirection;
        let halfLength = length(halfway);

        if (halfLength == 0.0) {
            continue;
        }

        let specularAngle = dot(normal, halfway) / halfLength;

        if (specularAngle <= 0.0) {
            continue;
        }

        result.additive = result.additive + specularColor * color * pow(specularAngle, shininess) * attenuation;
    }

    return result;
}

fn applyFog(color: vec3f, position: vec3f) -> vec3f {
    let mode = u32(uniforms.fogColor.w);

    if (mode == ${FOG_MODE_CODE.none}u) {
        return color;
    }

    let distance = length(uniforms.cameraPosition.xyz - position);
    var factor: f32;

    if (mode == ${FOG_MODE_CODE.linear}u) {
        factor = clamp((distance - uniforms.fogParams.x) / max(uniforms.fogParams.y - uniforms.fogParams.x, 1e-4), 0.0, 1.0);
    } else {
        let scaled = distance * uniforms.fogParams.z;
        factor = clamp(1.0 - exp(-scaled * scaled), 0.0, 1.0);
    }

    return mix(color, uniforms.fogColor.rgb, factor);
}
`;

/** WGSL vertex shader for 3D mesh rendering with per-vertex color and normal. */
export const VERTEX_SHADER = /* wgsl */ `
${SCENE_UNIFORM_WGSL}

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat4x4f,
};

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) color: vec4f,
};

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) worldNormal: vec3f,
    @location(1) color: vec4f,
    @location(2) worldPosition: vec3f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(1) @binding(0) var<uniform> model: ModelUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let worldPosition = model.modelMatrix * vec4f(input.position, 1.0);
    output.clipPosition = uniforms.viewProjectionMatrix * worldPosition;
    output.worldNormal = normalize((model.normalMatrix * vec4f(input.normal, 0.0)).xyz);
    output.color = input.color;
    output.worldPosition = worldPosition.xyz;

    return output;
}
`;

/** WGSL fragment shader resolving the shared lighting model across every light in the scene. */
export const FRAGMENT_SHADER = /* wgsl */ `
${SCENE_UNIFORM_WGSL}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

${SHADING_WGSL}

@fragment
fn main(
    @location(0) worldNormal: vec3f,
    @location(1) color: vec4f,
    @location(2) worldPosition: vec3f,
) -> @location(0) vec4f {
    let normal = normalize(worldNormal);
    let viewDirection = normalize(uniforms.cameraPosition.xyz - worldPosition);
    let illumination = shadeSurface(normal, worldPosition, viewDirection, vec3f(0.0), 0.0, vec3f(0.0));
    let shaded = color.rgb * illumination.diffuse + illumination.additive;

    return vec4f(applyFog(shaded, worldPosition), color.a);
}
`;
