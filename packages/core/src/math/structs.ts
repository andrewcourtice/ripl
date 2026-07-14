/** An axis-aligned bounding box defined by its four edges. */
export class Box {

    constructor(
        /** The y-coordinate of the box's top edge. */
        public top: number,
        /** The x-coordinate of the box's left edge. */
        public left: number,
        /** The y-coordinate of the box's bottom edge. */
        public bottom: number,
        /** The x-coordinate of the box's right edge. */
        public right: number
    ) {}

    /** Creates a zero-sized box at the origin. */
    public static empty() {
        return new Box(0, 0, 0, 0);
    }

    /** The horizontal span of the box. */
    public get width() {
        return this.right - this.left;
    }

    /** The vertical span of the box. */
    public get height() {
        return this.bottom - this.top;
    }

}