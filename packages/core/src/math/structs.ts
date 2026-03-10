/** An axis-aligned bounding box defined by its four edges. */
export class Box {

    constructor(
        public top: number,
        public left: number,
        public bottom: number,
        public right: number
    ) {}

    /** Creates a zero-sized box at the origin. */
    static empty() {
        return new Box(0, 0, 0, 0);
    }

    /** The horizontal span of the box. */
    get width() {
        return this.right - this.left;
    }

    /** The vertical span of the box. */
    get height() {
        return this.bottom - this.top;
    }

}