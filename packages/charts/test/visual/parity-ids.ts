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

/**
 * Scenes where canvas and SVG are **known** to diverge, each pinned to a band around the mismatch
 * measured when it was characterized rather than to the parity threshold. They keep a decided gap
 * honest: the suite stays green, the number is on the record, and either direction fails — a
 * regression that widens the gap, or a fix that closes it without anyone updating the band.
 *
 * - `group-shadow` — `svg.md` S-18, measured at **14.3%**. `<feDropShadow>` writes
 *   `dx`/`dy`/`stdDeviation` in the filter's user space, which inherits every ancestor `<g>`
 *   transform; canvas shadow geometry is explicitly CTM-independent, so inside a `scale(2)` group
 *   SVG casts the shadow at twice the offset and blur. Not fixed: `<feDropShadow>` takes one scalar
 *   `stdDeviation` and an axis-aligned offset, so counter-transforming it closes the uniform-scale
 *   case and still cannot reproduce canvas under rotation or a non-uniform scale.
 * - `filter-shadow-order` — `svg.md` S-20, measured at **9.1%**. `_resolveElementFilter` emits
 *   `filter="url(#shadow-…) <cssFilter>"`, so a CSS `blur()` blurs the shape **and** its drop
 *   shadow; canvas derives the shadow from the filtered result and does not re-blur it. Not fixed:
 *   correcting the order means composing both into one `<filter>` chain rather than concatenating
 *   two `filter` list entries.
 */
export const KNOWN_DIVERGENCE_SCENES = [
    {
        id: 'group-shadow',
        maxMismatch: 0.18,
    },
    {
        id: 'filter-shadow-order',
        maxMismatch: 0.12,
    },
] as const;

/** A single parity scene id, whether it must match or is a pinned known divergence. */
export type ParitySceneId = typeof PARITY_SCENE_IDS[number] | typeof KNOWN_DIVERGENCE_SCENES[number]['id'];

/** Every scene the harness mounts, in mount order. */
export const ALL_PARITY_SCENE_IDS = [
    ...PARITY_SCENE_IDS,
    ...KNOWN_DIVERGENCE_SCENES.map(scene => scene.id),
] as ParitySceneId[];

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
