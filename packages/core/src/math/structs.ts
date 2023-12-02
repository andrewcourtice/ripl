export class Box {

    constructor(
        public readonly top: number,
        public readonly left: number,
        public readonly bottom: number,
        public readonly right: number
    ) {}

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.bottom - this.top;
    }

}