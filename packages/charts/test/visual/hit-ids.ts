/**
 * The canonical list of canvas↔SVG hit-test scenes. Imported by both `hit.ts` (to build each scene
 * and record what a click reached) and `hit.spec.ts` (to drive the click) so the two never drift.
 *
 * These pin `svg.md` S-19: `SVGContext._isPointIn` used to hand `isPointInFill`/`isPointInStroke` a
 * point in the SVG root's user space, which SVG 2 specifies to read in the **element's own** space.
 * Every scene therefore transforms its target so the two spaces disagree, and clicks a point that
 * lies inside the rendered shape but **outside** its untransformed geometry — a hit test that
 * skips the mapping has to miss.
 *
 * Canvas maps the point itself through `Element.getWorldTransform`, so it is the reference: an
 * SVG-only failure is S-19 and nothing else.
 */

/** A backend a hit scene is mounted through. */
export type HitBackend = 'canvas' | 'svg';

/** The backends every scene is mounted through, in mount order. */
export const HIT_BACKENDS = ['canvas', 'svg'] as const satisfies readonly HitBackend[];

/** A single hit-test scene: what to build, where to click, and what the click must reach. */
export interface HitScene {
    /** Scene identifier, used for the mount's `data-hit` attribute and the test title. */
    id: string;
    /** What the scene transforms, for the test title to read as a sentence. */
    description: string;
    /** The point, in surface coordinates, the spec clicks on every backend. */
    point: [number, number];
    /** Id of the element the click must reach on every backend. */
    target: string;
}

/** The scenes, ordered by how sharply they discriminate an unmapped hit point. */
export const HIT_SCENES = [
    {
        id: 'translated',
        description: 'a rect inside a translated group',
        point: [130, 70],
        target: 'translated-target',
    },
    {
        id: 'scaled',
        description: 'a rect inside a scaled group',
        point: [70, 70],
        target: 'scaled-target',
    },
    {
        id: 'rotated',
        description: 'a rect rotated about its own centre',
        point: [122, 102],
        target: 'rotated-target',
    },
] as const satisfies readonly HitScene[];

/** A single hit-scene id. */
export type HitSceneId = typeof HIT_SCENES[number]['id'];

/** The width, in CSS pixels, every hit surface is mounted at. */
export const HIT_WIDTH = 200;

/** The height, in CSS pixels, every hit surface is mounted at. */
export const HIT_HEIGHT = 140;

/** One element-level `click` the harness observed. */
export interface HitRecord {
    /** The scene whose surface was clicked. */
    scene: string;
    /** The backend that surface was rendered through. */
    backend: HitBackend;
    /** Id of the element that received the click. */
    target: string;
}

/** The recorder the hit page exposes to Playwright. */
export interface HitHarness {
    /** Every element-level `click` observed since the last {@link HitHarness.reset}, in order. */
    records: HitRecord[];
    /** Drops every recorded click, so one scene's assertions cannot see another's. */
    reset(): void;
}

declare global {
    interface Window {
        /** The hit-test recorder, installed by `hit.ts` once every scene has rendered. */
        riplHit: HitHarness;
    }
}
