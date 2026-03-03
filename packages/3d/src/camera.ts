import {
    vec3Add,
    vec3Cross,
    vec3Distance,
    vec3Normalize,
    vec3Scale,
    vec3Sub,
} from './math/vector';

import {
    degreesToRadians,
} from '@ripl/core';

import {
    onDOMEvent,
    typeIsBoolean,
} from '@ripl/utilities';

import type {
    Scene,
} from '@ripl/core';

import type {
    Disposable,
} from '@ripl/utilities';

import type {
    Context3D,
} from './context';

import type {
    Vector3,
} from './math/vector';

export type CameraInteractionOption = boolean | CameraInteractionConfig;

export interface CameraInteractionConfig {
    enabled?: boolean;
    sensitivity?: number;
}

export interface CameraInteractions {
    zoom?: CameraInteractionOption;
    pivot?: CameraInteractionOption;
    pan?: CameraInteractionOption;
}

export interface CameraOptions {
    position?: Vector3;
    target?: Vector3;
    up?: Vector3;
    fov?: number;
    near?: number;
    far?: number;
    projection?: 'perspective' | 'orthographic';
    interactions?: boolean | CameraInteractions;
}

interface ResolvedInteraction {
    enabled: boolean;
    sensitivity: number;
}

const ORBIT_SENSITIVITY = 0.005;
const PAN_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.005;
const PINCH_ZOOM_SENSITIVITY = 0.01;

function resolveInteraction(option: CameraInteractionOption | undefined, fallback: boolean): ResolvedInteraction {
    if (option === undefined) {
        return {
            enabled: fallback,
            sensitivity: 1,
        };
    }

    if (typeIsBoolean(option)) {
        return {
            enabled: option,
            sensitivity: 1,
        };
    }

    return {
        enabled: option.enabled !== false,
        sensitivity: option.sensitivity ?? 1,
    };
}

export class Camera {

    private context: Context3D;
    private dirty = false;
    private scheduled = false;
    private disposables = new Set<Disposable>();
    private previousTouchAction = '';

    private _position: Vector3;
    private _target: Vector3;
    private _up: Vector3;
    private _fov: number;
    private _near: number;
    private _far: number;
    private _projection: 'perspective' | 'orthographic';

    public get position() {
        return this._position;
    }

    public set position(value: Vector3) {
        this._position = value;
        this.markDirty();
    }

    public get target() {
        return this._target;
    }

    public set target(value: Vector3) {
        this._target = value;
        this.markDirty();
    }

    public get up() {
        return this._up;
    }

    public set up(value: Vector3) {
        this._up = value;
        this.markDirty();
    }

    public get fov() {
        return this._fov;
    }

    public set fov(value: number) {
        this._fov = value;
        this.markDirty();
    }

    public get near() {
        return this._near;
    }

    public set near(value: number) {
        this._near = value;
        this.markDirty();
    }

    public get far() {
        return this._far;
    }

    public set far(value: number) {
        this._far = value;
        this.markDirty();
    }

    public get projection() {
        return this._projection;
    }

    public set projection(value: 'perspective' | 'orthographic') {
        this._projection = value;
        this.markDirty();
    }

    constructor(scene: Scene<Context3D>, options?: CameraOptions) {
        this.context = scene.context;

        this._position = options?.position ?? [0, 0, 5] as Vector3;
        this._target = options?.target ?? [0, 0, 0] as Vector3;
        this._up = options?.up ?? [0, 1, 0] as Vector3;
        this._fov = options?.fov ?? 60;
        this._near = options?.near ?? 0.1;
        this._far = options?.far ?? 1000;
        this._projection = options?.projection ?? 'perspective' as 'perspective' | 'orthographic';

        // Initial flush synchronously so the context is ready before first render
        this.dirty = true;
        this.flush();

        if (options?.interactions) {
            this.attachInteractions(options.interactions);
        }
    }

    private markDirty(): void {
        this.dirty = true;

        if (!this.scheduled) {
            this.scheduled = true;
            queueMicrotask(() => this.flush());
        }
    }

    public flush(): void {
        if (!this.dirty) {
            this.scheduled = false;
            return;
        }

        this.dirty = false;
        this.scheduled = false;

        this.context.setCamera(this._position, this._target, this._up);

        if (this._projection === 'perspective') {
            this.context.setPerspective(this._fov, this._near, this._far);
        } else {
            const dist = vec3Distance(this._position, this._target);
            const halfH = dist * Math.tan(degreesToRadians(this._fov) / 2);
            const aspect = this.context.width / (this.context.height || 1);
            const halfW = halfH * aspect;

            this.context.setOrthographic(
                -halfW, halfW,
                -halfH, halfH,
                this._near, this._far
            );
        }
    }

    public orbit(deltaTheta: number, deltaPhi: number): void {
        const offset = vec3Sub(this._position, this._target);
        const dist = vec3Distance(this._position, this._target);

        // Convert to spherical coordinates
        const theta = Math.atan2(offset[0], offset[2]) + deltaTheta;
        let phi = Math.acos(Math.max(-1, Math.min(1, offset[1] / dist))) + deltaPhi;

        // Clamp phi to avoid flipping
        phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));

        this._position = [
            this._target[0] + dist * Math.sin(phi) * Math.sin(theta),
            this._target[1] + dist * Math.cos(phi),
            this._target[2] + dist * Math.sin(phi) * Math.cos(theta),
        ];

        this.markDirty();
    }

    public pan(dx: number, dy: number): void {
        const forward = vec3Normalize(vec3Sub(this._target, this._position));
        const right = vec3Normalize(vec3Cross(forward, this._up));
        const upDir = vec3Cross(right, forward);

        const offset = vec3Add(
            vec3Scale(right, -dx),
            vec3Scale(upDir, dy)
        );

        this._position = vec3Add(this._position, offset);
        this._target = vec3Add(this._target, offset);

        this.markDirty();
    }

    public zoom(delta: number): void {
        const direction = vec3Normalize(vec3Sub(this._target, this._position));
        const dist = vec3Distance(this._position, this._target);
        const clampedDelta = Math.min(delta, dist - 0.01);

        this._position = vec3Add(this._position, vec3Scale(direction, clampedDelta));

        this.markDirty();
    }

    public lookAt(target: Vector3): void {
        this._target = target;
        this.markDirty();
    }

    private attachInteractions(interactions: boolean | CameraInteractions): void {
        const isBoolean = typeIsBoolean(interactions);
        const config = isBoolean ? {} as CameraInteractions : interactions;
        const fallback = isBoolean ? interactions : false;

        const zoomConfig = resolveInteraction(config.zoom, fallback);
        const pivotConfig = resolveInteraction(config.pivot, fallback);
        const panConfig = resolveInteraction(config.pan, fallback);

        const element = this.context.element as unknown as HTMLElement;

        this.previousTouchAction = element.style.touchAction;
        element.style.touchAction = 'none';

        let dragging = false;
        let isPanning = false;
        let lastX = 0;
        let lastY = 0;

        if (zoomConfig.enabled) {
            this.disposables.add(
                onDOMEvent(element, 'wheel', (event) => {
                    event.preventDefault();
                    const dist = vec3Distance(this._position, this._target);
                    const delta = event.deltaY * ZOOM_SENSITIVITY * zoomConfig.sensitivity * dist;
                    this.zoom(delta);
                })
            );
        }

        if (pivotConfig.enabled || panConfig.enabled) {
            this.disposables.add(
                onDOMEvent(element, 'pointerdown', (event) => {
                    dragging = true;
                    lastX = event.clientX;
                    lastY = event.clientY;
                    isPanning = (panConfig.enabled && (event.button === 1 || (event.button === 0 && event.shiftKey)));
                    element.setPointerCapture(event.pointerId);
                })
            );

            this.disposables.add(
                onDOMEvent(window, 'pointermove', (event) => {
                    if (!dragging) {
                        return;
                    }

                    const dx = event.clientX - lastX;
                    const dy = event.clientY - lastY;

                    lastX = event.clientX;
                    lastY = event.clientY;

                    if (isPanning && panConfig.enabled) {
                        const dist = vec3Distance(this._position, this._target);
                        this.pan(
                            dx * PAN_SENSITIVITY * panConfig.sensitivity * dist,
                            dy * PAN_SENSITIVITY * panConfig.sensitivity * dist
                        );
                    } else if (pivotConfig.enabled) {
                        this.orbit(
                            -dx * ORBIT_SENSITIVITY * pivotConfig.sensitivity,
                            -dy * ORBIT_SENSITIVITY * pivotConfig.sensitivity
                        );
                    }
                })
            );

            this.disposables.add(
                onDOMEvent(window, 'pointerup', () => {
                    dragging = false;
                    isPanning = false;
                })
            );
        }

        // Touch gestures: 1-finger orbit, 2-finger pan + pinch-to-zoom
        let lastTouchCenterX = 0;
        let lastTouchCenterY = 0;
        let lastPinchDist = 0;
        let touchCount = 0;

        const getTouchCenter = (touches: TouchList) => {
            let cx = 0;
            let cy = 0;

            for (let i = 0; i < touches.length; i++) {
                cx += touches[i].clientX;
                cy += touches[i].clientY;
            }

            return [cx / touches.length, cy / touches.length] as const;
        };

        const getPinchDistance = (touches: TouchList) => {
            const dx = touches[1].clientX - touches[0].clientX;
            const dy = touches[1].clientY - touches[0].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        this.disposables.add(
            onDOMEvent(element, 'touchstart', (event) => {
                event.preventDefault();
                touchCount = event.touches.length;

                const [cx, cy] = getTouchCenter(event.touches);
                lastTouchCenterX = cx;
                lastTouchCenterY = cy;

                if (touchCount >= 2) {
                    lastPinchDist = getPinchDistance(event.touches);
                    dragging = false;
                }
            })
        );

        this.disposables.add(
            onDOMEvent(element, 'touchmove', (event) => {
                event.preventDefault();

                const [cx, cy] = getTouchCenter(event.touches);
                const dx = cx - lastTouchCenterX;
                const dy = cy - lastTouchCenterY;

                lastTouchCenterX = cx;
                lastTouchCenterY = cy;

                if (event.touches.length >= 2) {
                    // Two-finger pan
                    if (panConfig.enabled) {
                        const dist = vec3Distance(this._position, this._target);
                        this.pan(
                            dx * PAN_SENSITIVITY * panConfig.sensitivity * dist,
                            dy * PAN_SENSITIVITY * panConfig.sensitivity * dist
                        );
                    }

                    // Pinch-to-zoom
                    if (zoomConfig.enabled) {
                        const pinchDist = getPinchDistance(event.touches);
                        const pinchDelta = lastPinchDist - pinchDist;
                        lastPinchDist = pinchDist;

                        const dist = vec3Distance(this._position, this._target);
                        this.zoom(pinchDelta * PINCH_ZOOM_SENSITIVITY * zoomConfig.sensitivity * dist);
                    }
                } else if (event.touches.length === 1 && pivotConfig.enabled) {
                    // Single-finger orbit
                    this.orbit(
                        -dx * ORBIT_SENSITIVITY * pivotConfig.sensitivity,
                        -dy * ORBIT_SENSITIVITY * pivotConfig.sensitivity
                    );
                }
            })
        );

        this.disposables.add(
            onDOMEvent(element, 'touchend', (event) => {
                event.preventDefault();
                touchCount = event.touches.length;

                if (touchCount > 0) {
                    const [cx, cy] = getTouchCenter(event.touches);
                    lastTouchCenterX = cx;
                    lastTouchCenterY = cy;

                    if (touchCount >= 2) {
                        lastPinchDist = getPinchDistance(event.touches);
                    }
                }
            })
        );
    }

    public dispose(): void {
        const element = this.context.element as unknown as HTMLElement;
        element.style.touchAction = this.previousTouchAction;

        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables.clear();
    }

}

export function createCamera(scene: Scene<Context3D>, options?: CameraOptions): Camera {
    return new Camera(scene, options);
}
