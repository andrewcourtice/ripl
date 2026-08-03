/**
 * The canonical list of canvas↔SVG parity scenes. Imported by both `parity.ts` (to render each
 * scene through both backends) and `parity.spec.ts` (to diff the two) so the two never drift.
 *
 * Each id seeds a divergence the rendering-context audit named and the core/svg work fixed:
 *
 * - `group-gradient` — a gradient set on a `Group` must resolve **once**, against the group's
 *   composed box, on both backends (`canvas.md` 3, `svg.md` S-4). SVG used to emit a `url(#…)` per
 *   leaf against each leaf's own box, restarting the ramp on every child.
 * - `group-opacity` — a group at `0.5` containing a leaf at `0.5` must paint the leaf at `0.25`
 *   on both backends (`canvas.md` 11, `svg.md` S-5).
 */
export const PARITY_SCENE_IDS = [
    'group-gradient',
    'group-opacity',
] as const;

/** A single parity scene id. */
export type ParitySceneId = typeof PARITY_SCENE_IDS[number];

/** The width, in CSS pixels, every parity surface is mounted at. */
export const PARITY_WIDTH = 260;

/** The height, in CSS pixels, every parity surface is mounted at. */
export const PARITY_HEIGHT = 140;

/** The result of diffing the canvas screenshot of a scene against the SVG screenshot of the same scene. */
export interface ParityDiff {
    /** Width, in pixels, the two screenshots were compared at; `0` when their dimensions disagree. */
    width: number;
    /** Height, in pixels, the two screenshots were compared at; `0` when their dimensions disagree. */
    height: number;
    /** Fraction of pixels, from 0 to 1, whose colour differs by more than the per-channel tolerance. */
    mismatch: number;
    /** The largest single-channel difference found anywhere in the frame, from 0 to 255. */
    maxDelta: number;
}

/** The comparison entry point the parity page exposes to Playwright. */
export interface ParityHarness {
    /**
     * Decodes two base64 PNG screenshots of the same scene and diffs them **against each other**,
     * with no stored baseline involved.
     *
     * @param left - Base64 PNG of the canvas surface.
     * @param right - Base64 PNG of the SVG surface.
     * @param tolerance - Per-channel difference, from 0 to 255, a pixel may vary by before it counts as a mismatch.
     */
    diff(left: string, right: string, tolerance: number): Promise<ParityDiff>;
}

declare global {
    interface Window {
        /** The parity comparison harness, installed by `parity.ts` once every scene has rendered. */
        riplParity: ParityHarness;
    }
}
