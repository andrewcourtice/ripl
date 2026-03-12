/** WGSL vertex shader for 3D mesh rendering with per-vertex color and normal. */
export const VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
    viewProjectionMatrix: mat4x4f,
    lightDirection: vec3f,
    ambient: f32,
};

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

    return output;
}
`;

/** WGSL fragment shader with Lambertian diffuse lighting. */
export const FRAGMENT_SHADER = /* wgsl */ `
struct Uniforms {
    viewProjectionMatrix: mat4x4f,
    lightDirection: vec3f,
    ambient: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(
    @location(0) worldNormal: vec3f,
    @location(1) color: vec4f,
) -> @location(0) vec4f {
    let normal = normalize(worldNormal);
    let light = normalize(-uniforms.lightDirection);
    let diffuse = max(dot(normal, light), 0.0);
    let brightness = uniforms.ambient + (1.0 - uniforms.ambient) * diffuse;

    return vec4f(color.rgb * brightness, color.a);
}
`;
