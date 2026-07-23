import type {
    SVGContextElement,
    SVGContextElementDefinition,
} from './types';

/** SVG-specific image element wrapping a `CanvasImageSource` as an SVG `<image>` tag. */
export class SVGImage implements SVGContextElement {

    /** Unique identifier for this element. */
    public readonly id: string;
    /** The rendering definition describing this image's SVG `<image>` node. */
    public definition: SVGContextElementDefinition;

    constructor(id: string, href: string, x: number, y: number, width: number, height: number) {
        this.id = id;

        this.definition = {
            tag: 'image',
            styles: {},
            attributes: {
                href,
                x: x.toString(),
                y: y.toString(),
                width: width.toString(),
                height: height.toString(),
                preserveAspectRatio: 'none',
            },
        };
    }
}
