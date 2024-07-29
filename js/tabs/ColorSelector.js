import {PixelColor} from "../util/PixelColor.js";
import {SUColorKit} from "../SUColorKit.js";
import {GuiUtil} from "../util/GuiUtil.js";

/**
 * UI controller for the sliders color selector.
 *
 * @class
 */
export class ColorSelector {

    /**
     * References to the application's main class
     * @type {SUColorKit|null}
     */
    app = null;

    /**
     * The red value text box
     * @type {HTMLInputElement|null}
     */
    redInput = null;

    /**
     * The green value text box
     * @type {HTMLInputElement|null}
     */
    greenInput = null;

    /**
     * The blue value text box
     * @type {HTMLInputElement|null}
     */
    blueInput = null;

    /**
     * The slider for the red value
     * @type {HTMLInputElement|null}
     */
    redSlider = null;

    /**
     * The slider for the green value
     * @type {HTMLInputElement|null}
     */
    greenSlider = null;

    /**
     * The slider for the blue value
     * @type {HTMLInputElement|null}
     */
    blueSlider = null;

    /**
     * Hue value text box
     * @type {HTMLInputElement|null}
     */
    hueInput = null;

    /**
     * Saturation value text box
     * @type {HTMLInputElement|null}
     */
    satInput = null;

    /**
     * Value value text box
     * @type {HTMLInputElement|null}
     */
    valInput = null;

    /**
     * The slider for the hue value
     * @type {HTMLInputElement|null}
     */
    hueSlider = null;

    /**
     * The slider for the saturation value
     * @type {HTMLInputElement|null}
     */
    satSlider = null;

    /**
     * The slider for the value value
     * @type {HTMLInputElement|null}
     */
    valSlider = null;

    /**
     * The color selector element that previews the color
     * @type {HTMLElement|null}
     */
    colorSelector = null;

    /**
     * The copy button for the hex value
     * @type {HTMLInputElement|null}
     */
    hexCopyButton = null;

    /**
     * The text box for the hex value
     * @type {HTMLInputElement|null}
     */
    hexInput = null;

    /**
     * Checkbox to show the overlay image.
     * @type {HTMLInputElement|null}
     */
    showOverlayCheckbox = null;

    /**
     * The color object that holds the current color
     * @type {PixelColor|null}
     */
    color = null;
    
    /**
     * Initializes a new instance of the ColorSelector class.
     * @param {SUColorKit} app - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.color = new PixelColor(0, 0, 0);
        this.colorSelector = document.querySelector(".panel-color");
        this.colorSelector.style.backgroundColor = this.color.toHex();
        this.#initDomEvents();

        this.app.addColorListener((event) => {
            this.setColor(event.color);
            GuiUtil.setOverlay(this, event.showOverlay);
        });
    }

    /**
     * Updates the color from outside this object.
     * @param color {PixelColor}
     */
    setColor(color) {
        if (color.equals(this.color)) {
            return;
        }
        this.color = color;
        this.app.setColor(color);

        this.refresh();
    }

    /**
     * Refreshes the color selector and input fields with the current color values.
     *
     * This function updates the background color of the color selector element with the
     * hexadecimal representation of the current color. It also updates the values of
     * the red, green, blue, hue, saturation, value, and hex input fields with the
     * corresponding values from the color object.
     *
     * @return {void} This function does not return a value.
     */
    refresh() {
        // update color preview
        //this.colorSelector.style.backgroundColor = this.color.hex;
        this.colorSelector.style.backgroundColor = this.color.toString();

        // update input fields
        this.redInput.value = this.color.red.toString();
        this.greenInput.value = this.color.green.toString();
        this.blueInput.value = this.color.blue.toString();

        this.hueInput.value = this.color.hue.toString();
        this.satInput.value = this.color.sat.toString();
        this.valInput.value = this.color.val.toString();

        // update sliders
        this.redSlider.value = this.color.red.toString();
        this.greenSlider.value = this.color.green.toString();
        this.blueSlider.value = this.color.blue.toString();

        this.hueSlider.value = this.color.hue.toString();
        this.satSlider.value = this.color.sat.toString();
        this.valSlider.value = this.color.val.toString();

        // update hex input
        this.hexInput.value = this.color.hex;
    }

    /**
     * Initializes event listeners for the input elements in the DOM to
     * update the color object and refresh the UI.
     *
     * @return {void} This function does not return a value.
     */
    #initDomEvents() {

        // rgb text boxes
        this.redInput = document.getElementById("red2");
        this.redInput.addEventListener("input", (event) => {
            this.color.fromRGB(event.target.value, this.color.green, this.color.blue);
            this.refresh();
        });
        this.greenInput = document.getElementById("green2");
        this.greenInput.addEventListener("input", (event) => {
            this.color.fromRGB(this.color.red, event.target.value, this.color.blue);
            this.refresh();
        });
        this.blueInput = document.getElementById("blue2");
        this.blueInput.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromRGB(this.color.red, this.color.green, event.target.value);
            this.setColor(color);
        });

        // rgb sliders
        this.redSlider = document.getElementById("redSlider2");
        this.redSlider.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromRGB(event.target.value, this.color.green, this.color.blue);
            this.setColor(color);
        });
        this.greenSlider = document.getElementById("greenSlider2");
        this.greenSlider.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromRGB(this.color.red, event.target.value, this.color.blue);
            this.setColor(color);
        });
        this.blueSlider = document.getElementById("blueSlider2");
        this.blueSlider.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromRGB(this.color.red, this.color.green, event.target.value);
            this.setColor(color);
        });

        // hsv text boxes
        this.hueInput = document.getElementById("hue2");
        this.hueInput.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromHSV(event.target.value, this.color.sat, this.color.val);
            this.setColor(color);
        });
        this.satInput = document.getElementById("sat2");
        this.satInput.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromHSV(this.color.hue, event.target.value, this.color.val);
            this.setColor(color);
        });
        this.valInput = document.getElementById("val2");
        this.valInput.addEventListener("input", (event) => {

            let color = new PixelColor();
            color.fromHSV(this.color.hue, this.color.sat, event.target.value);
            this.setColor(color);
        });

        // hsv sliders
        this.hueSlider = document.getElementById("hueSlider2");
        this.hueSlider.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromHSV(event.target.value, this.color.sat, this.color.val);
            this.setColor(color);
        });
        this.satSlider = document.getElementById("satSlider2");
        this.satSlider.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromHSV(this.color.hue, event.target.value, this.color.val);
            this.setColor(color);
        });
        this.valSlider = document.getElementById("valSlider2");
        this.valSlider.addEventListener("input", (event) => {

            let color = new PixelColor();
            color.fromHSV(this.color.hue, this.color.sat, event.target.value);
            this.setColor(color);
        });

        // hex text box
        this.hexInput = document.getElementById("gradient_hexColor");
        this.hexInput.addEventListener("input", (event) => {
            let color = new PixelColor();
            color.fromHex(event.target.value);
            this.setColor(color);
        });

        // hex copy button
        this.hexCopyButton = document.getElementById("gradient_hexButton");
        this.hexCopyButton.addEventListener("click", () => {
            navigator.clipboard.writeText(this.hexInput.value)
                .then(() => {
                    console.log('Hex value copied to clipboard');
                })
                .catch((error) => {
                    console.error('Failed to copy hex value to clipboard:', error);
                });
        });

        // show overlay checkbox
        this.showOverlayCheckbox = document.getElementById("gradient_showImage");
        this.showOverlayCheckbox.addEventListener("input", (event) => {
            this.app.setOverlay(event.target.checked);
        });

    }
}
