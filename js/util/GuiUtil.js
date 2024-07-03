/**
 * @typedef {Object} IHasColorSelector
 * @property {HTMLElement} colorSelector
 * @property {HTMLInputElement} showOverlayCheckbox
 */

/**
 * Common helper functions for GUI.
 */
export class GuiUtil {

    /**
     * Sets the overlay checkbox state.
     * @param {IHasColorSelector} obj - The object that contains the checkbox and selector
     * @param {boolean} checked The new checkbox state
     * @return {void} This function does not return a value.
     */
    static setOverlay(obj, checked) {
        if (obj.showOverlayCheckbox.checked !== checked) {
            obj.showOverlayCheckbox.checked = checked;
        }
        if (checked) {
            if (!obj.colorSelector.classList.contains('panel-color-overlay')) {
                obj.colorSelector.classList.add('panel-color-overlay');
            }
        }
        else {
            if (obj.colorSelector.classList.contains('panel-color-overlay')) {
                obj.colorSelector.classList.remove('panel-color-overlay');
            }
        }
    }

    /**
     * @typedef {Object} ISize
     * @property {number} width of the object
     * @property {number} height of the object
     */

    /**
     * @typedef {Object} IRect
     * @property {number} width of the object
     * @property {number} height of the object
     * @property {number} x position of the object
     * @property {number} y position of the object
     */

    /**
     * Returns the size to use for filling the canvas while
     * maintaining its aspect ratio.
     * @param imgSize {ISize} image size
     * @param fillSize {ISize} canvas size
     * @return {ISize} size to use to fill the area while keeping the image's aspect ratio.
     */
    static aspectRatioFill(imgSize, fillSize) {
        let ratio = imgSize.width / imgSize.height;
        let ret = {
            width: fillSize.width,
            height: fillSize.width / ratio
        };
        if (ret.height < fillSize.height) {
            ret.height = fillSize.height;
            ret.width = ret.height * ratio;
        }
        ret.width = Math.floor(ret.width);
        ret.height = Math.floor(ret.height);
        return ret;
    }

    /**
     * Draws an image centered on a canvas while maintaining its
     * aspect ratio and filling the entire canvas.
     * @param canvas {HTMLCanvasElement} canvas to fill
     * @param img {HTMLImageElement} image to scale
     * @param offset {{x:number,y:number}|null} offset to draw the image (optional)
     * @return {IRect} size and position used to render image
     */
    static fillCentered(canvas, img, offset = null) {
        if (!offset) {
            offset = {x:0,y:0};
        }

        let ctx = canvas.getContext('2d');
        let size = GuiUtil.aspectRatioFill(img, canvas);

        let x = 0;
        let y = 0;
        if (size.width > canvas.width) {
            x = Math.floor((canvas.width - size.width) / 2);
        }
        if (size.height > canvas.height) {
            y = Math.floor((canvas.height - size.height) / 2);
        }

        x += offset.x;
        y += offset.y;

        console.log('rendering image at ' + x + ','+ y + ' ' + size.width + 'x' + size.height);
        ctx.drawImage(img, x, y, size.width, size.height);

        return {
            width: size.width,
            height: size.height,
            x: x,
            y: y
        };
    }

}