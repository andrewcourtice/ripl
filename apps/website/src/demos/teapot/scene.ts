import {
    TEAPOT_PARTS,
    TEAPOT_SURFACES,
} from './data/teapot';

import {
    createAmbientLight,
    createCamera,
    createContext,
    createDirectionalLight,
    createGroup3D,
    createParametric,
    createPointLight,
    createTexture,
} from '@ripl/3d';

import type {
    Camera,
    CanvasContext3D,
    Material,
    Parametric,
    Texture,
} from '@ripl/3d';

import {
    createDevtools,
} from '@ripl/devtools';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Renderer,
    Scene,
} from '@ripl/web';

/** The material presets the teapot can be rendered in. */
export type TeapotPreset = 'porcelain' | 'copper' | 'jade';

/** The look the teapot is currently rendered with. */
export interface TeapotOptions {
    /** The material preset. */
    preset: TeapotPreset;
    /** Whether the procedural glaze texture is applied. */
    textured: boolean;
    /** Whether the surfaces are drawn as edges only. */
    wireframe: boolean;
    /** Whether each face is shaded by its own normal rather than its vertex normals. */
    flatShading: boolean;
    /** The Blinn-Phong specular exponent. */
    shininess: number;
}

/** A teapot view, owning its context, scene, renderer and camera. */
export interface TeapotScene {
    /** The 3D rendering context the view paints into. */
    readonly context: CanvasContext3D;
    /** The scene holding the teapot's parts. */
    readonly scene: Scene;
    /** The renderer driving the frame loop. */
    readonly renderer: Renderer;
    /** The orbit camera rig. */
    readonly camera: Camera;
    /** Applies a new look to every part. */
    setOptions(options: TeapotOptions): void;
    /** Starts or stops the idle rotation. */
    setSpinning(spinning: boolean): void;
    /** Destroys the renderer, scene, camera, context and every listener this view registered. */
    destroy(): void;
}

/** Options for constructing the teapot view. */
export interface TeapotSceneOptions {
    /** The element the 3D canvas mounts into. */
    host: HTMLElement;
    /** Subdivisions along each parameter of every surface. Defaults to `28`. */
    segments?: number;
}

const PRESETS: Record<TeapotPreset, { color: string;
    specular: string; }> = {
    porcelain: {
        color: '#eae6dd',
        specular: '#ffffff',
    },
    copper: {
        color: '#b87333',
        specular: '#ffd9a0',
    },
    jade: {
        color: '#5c9e78',
        specular: '#d8ffe8',
    },
};

const CAMERA_POSITION = [4.2, 3.2, 5.4] as const;
const SPIN_SPEED = 0.00022;
const TEXTURE_SIZE = 128;

/**
 * Draws the glaze texture into an offscreen canvas.
 *
 * Generated rather than loaded so the demo ships no binary asset and works offline, and so the
 * texture doubles as documentation that `createTexture` accepts any canvas.
 */
function createGlazeTexture(): Texture {
    const canvas = document.createElement('canvas');

    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;

    const context = canvas.getContext('2d');

    if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
        context.strokeStyle = '#8fa8c8';
        context.lineWidth = 2;

        for (let index = 0; index <= 8; index++) {
            const offset = (index / 8) * TEXTURE_SIZE;

            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, TEXTURE_SIZE);
            context.moveTo(0, offset);
            context.lineTo(TEXTURE_SIZE, offset);
            context.stroke();
        }

        context.fillStyle = '#c8d8ee';

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if ((row + col) % 2 === 0) {
                    continue;
                }

                context.fillRect(col * TEXTURE_SIZE / 4, row * TEXTURE_SIZE / 4, TEXTURE_SIZE / 8, TEXTURE_SIZE / 8);
            }
        }
    }

    return createTexture(canvas, {
        repeat: [2, 1],
    });
}

/**
 * Creates the orbitable teapot view.
 *
 * @param options - The host element and mesh detail.
 * @returns The view handle, which owns everything it created.
 */
export function createTeapotScene(options: TeapotSceneOptions): TeapotScene {
    const segments = options.segments ?? 28;
    const context = createContext(options.host);
    const texture = createGlazeTexture();

    // Replaces the default rig with a warm key, a cool fill and a point light picking out the rim.
    context.lights.clear();
    context.lights.add(
        createAmbientLight({
            color: '#8899bb',
            intensity: 0.25,
        }),
        createDirectionalLight({
            direction: [-0.6, -0.8, -0.5],
            color: '#fff2e0',
            intensity: 0.75,
        }),
        createDirectionalLight({
            direction: [0.8, -0.2, 0.6],
            color: '#7fa8d8',
            intensity: 0.35,
        }),
        createPointLight({
            position: [0, 4.5, 2.5],
            color: '#ffd0a0',
            intensity: 14,
            distance: 12,
        })
    );

    const group = createGroup3D({
        y: -0.9,
        children: TEAPOT_PARTS.map(part => createParametric({
            id: part,
            surface: TEAPOT_SURFACES[part],
            uSegments: segments,
            vSegments: segments,
        })),
    });

    const scene = createScene(context, {
        children: [group],
    }) as Scene;

    const renderer = createRenderer(scene, {
        autoStart: true,
        autoStop: false,
    });

    const camera = createCamera(context, {
        position: [...CAMERA_POSITION],
        target: [0, 0.4, 0],
        fov: 42,
        interactions: {
            pivot: true,
            zoom: true,
            pan: true,
        },
    });

    // Self-disposes when the scene is destroyed below.
    createDevtools(context, scene, renderer, {
        label: 'Teapot',
    });

    camera.flush();

    let spinning = true;

    const tick = renderer.on('tick', event => {
        if (spinning) {
            camera.orbit(event.data.deltaTime * SPIN_SPEED, 0);
        }
    });

    return {
        context,
        scene,
        renderer,
        camera,

        setOptions(next: TeapotOptions): void {
            const preset = PRESETS[next.preset];
            const material: Material = {
                color: preset.color,
                specular: preset.specular,
                shininess: next.shininess,
                wireframe: next.wireframe,
                flatShading: next.flatShading,
                map: next.textured ? texture : undefined,
            };

            for (const child of group.children) {
                (child as Parametric).material = material;
            }

            scene.invalidate();
        },

        setSpinning(value: boolean): void {
            spinning = value;
        },

        destroy(): void {
            tick.dispose();
            renderer.destroy();
            camera.dispose();
            scene.destroy(true);
            context.destroy();
        },
    };
}
