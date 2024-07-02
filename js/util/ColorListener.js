
/**
 * A class that listens for color updates.
 */
export class ColorListener {

    /**
     * Function to be called with this object.
     * @type {function|null}
     */
    callback = null;

    /**
     * The color to be passed to the callback.
     * @type {PixelColor|null}
     */
    color = null;

    /**
     * Flag to indicate if the color overlay should be shown.
     * @type {boolean}
     */
    showOverlay = false;

    /**
     * @param {function} callback
     */
    constructor(callback) {
        this.callback = callback;
    }

    /**
     * Triggers the callback with this data.
     */
    trigger() {
        this.callback(this);
    }
}
