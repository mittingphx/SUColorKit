import {PixelColor} from "./PixelColor.js";

/**
 * Draws the two gradients on a canvas using two callback functions
 * to provide the pixel data, similar to a shader in 3D graphics.
 */
export class GradientShader {

    /**
     * The canvas to render on
     * @type {HTMLCanvasElement|null}
     */
    canvas = null;

    /**
     * The 2D context of the canvas
     * @type {CanvasRenderingContext2D|null}
     */
    ctx = null;

    /**
     * The width to render both gradients
     * @type {number}
     */
    width = 200;

    /**
     * The height of the main color selector
     * @type {number}
     */
    height = 100;

    /**
     * The height of the optional 2nd color selector
     * @type {number}
     */
    altHeight = 25;

    /**
     * The space between the 2 color selectors
     * @type {number}
     */
    margin = 5;

    /**
     * This callback is for choosing pixel values in selectors
     * @callback pixelCallback
     * @param {PixelColor} pixel - the pixel object to set to a color
     * @param {x} number - the x coordinate of the pixel
     * @param {y} number - the y coordinate of the pixel
     * @param {w} number - the width of the gradient area
     * @param {h} number - the height of the gradient area
     */

    /**
     * Function to call to render the color of the main 2D color
     * selector at the top.
     * @type {pixelCallback|null}
     */
    fnMainSelectorColor = null;

    /**
     * Functoin to call to render the color of the secondary color
     * selector at the bottom, which selects the range of colors used
     * on the main color selector.
     * @type {pixelCallback|null}
     */
    fnAltSelectorColor = null;

    /**
     * Constructor takes canvas and its context.
     * @param canvas {HTMLCanvasElement}
     * @param ctx {CanvasRenderingContext2D}
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    /**
     * Renders the gradients based on the current callback functions.
     */
    render() {

        let hasAlt = this.fnAltSelectorColor !== null;
        if (this.fnMainSelectorColor === null) {
            console.error('Call to GradientView.render() without setting fnMainSelectorColor.');
        }

        // get dimensions
        let mainWidth = this.width, mainHeight = this.height;
        let totalWidth = mainWidth;
        let totalHeight = hasAlt ? mainHeight + this.altHeight + this.margin : mainHeight;
        let imageStripe = totalWidth * 4;

        // grab canvas pixel data
        this.canvas.width = totalWidth;
        this.canvas.height = totalHeight;
        let bitmap = this.ctx.getImageData(0, 0, totalWidth, totalHeight);

        // main 2d selector
        let color = new PixelColor();
        let offset = 0;
        for (let y = 0; y < mainHeight; y++) {
            for (let x = 0; x < mainWidth; x++) {
                this.fnMainSelectorColor(color, x, y, mainWidth, mainHeight);
                //let offset = y * w * 4 + x * 4;
                color.writeTo(bitmap.data, offset);
                offset += 4;
            }
        }

        // alternate selector
        if (!hasAlt) return;

        let altWidth = mainWidth;
        let altHeight = this.altHeight;
        let altTop = mainHeight + this.margin;

        offset = altTop * imageStripe;
        for (let y = 0; y < altHeight; y++) {
            for (let x = 0; x < altWidth; x++) {
                this.fnAltSelectorColor(color, x, y, altWidth, altHeight);
                //let offset = (altTop + y) * w * 4 + x * 4;
                color.writeTo(bitmap.data, offset);
                offset += 4;
            }
        }

        // output to canvas
        this.ctx.putImageData(bitmap, 0, 0);
    }
}
