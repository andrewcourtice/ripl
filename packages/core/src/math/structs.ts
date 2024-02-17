export class Box {

    constructor(
        public top: number,
        public left: number,
        public bottom: number,
        public right: number
    ) {}

    static empty() {
        return new Box(0, 0, 0, 0);
    }

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.bottom - this.top;
    }

}