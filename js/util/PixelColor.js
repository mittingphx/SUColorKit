import { PixelMath } from "./PixelMath.js";

/**
 * Represents a color with red, green, and blue values.
 *
 * @class
 */
export class PixelColor {

    /**
     * The red value of the color.  Range 0-255.
     * @type {number}
     */
    red = 0;

    /**
     * The green value of the color.  Range 0-255.
     * @type {number}
     */
    green = 0;

    /**
     * The blue value of the color.  Range 0-255.
     * @type {number}
     */
    blue = 0;

    /**
     * The hue value of the color.  Range 0-360.
     * @type {number}
     */
    hue = 0;

    /**
     * The saturation value of the color.  Range 0-100.
     * @type {number}
     */
    sat = 0;

    /**
     * The value (brightness) of the color.  Range 0-100.
     * @type {number}
     */
    val = 0;

    /**
     * The hex color value of this color.
     * @type {string}
     */
    hex = "";

    /**
     * Initializes a new instance of the PixelColor class with the specified
     * red, green, and blue values.
     *
     * @param {number} red - The red value of the color.
     * @param {number} green - The green value of the color.
     * @param {number} blue - The blue value of the color.
     */
    constructor(red = 0, green = 0, blue = 0) {
        this.fromRGB(red, green, blue);
    }

    /**
     * Returns true iff the color objects are equal.
     * @param other {PixelColor} - The other color object.
     * @return {boolean}
     */
    equals(other) {
        if (other === null) {
            return false;
        }
        return this.red === other.red && this.green === other.green && this.blue === other.blue;
    }

    /**
     * Converts the RGB values of the color object to a hexadecimal
     * string representation.
     *
     * @return {string} The hexadecimal string representation of the
     *      color object.
     */
    toHex() {
        let [r, g, b] = this.toRGB();
        return `#${PixelMath.decToHex(r)}${PixelMath.decToHex(g)}${PixelMath.decToHex(b)}`;
    }

    /**
     * Converts the RGB values of the color object to HSV format and
     * returns the HSV values as an array.
     *
     * @return {Array} An array containing the HSV values [hue,
     *      saturation, value] of the color object.
     */
    toHSV() {
        let [h, s, v] = PixelMath.rgbToHsv(this.red, this.green, this.blue);
        return [h, s, v];
    }

    /**
     * Returns an array containing the red, green, and blue values of
     * the color object.
     *
     * @return {number[]} An array with three elements representing the
     *      red, green, and blue values of the color object.
     */
    toRGB() {
        return [this.red, this.green, this.blue];
    }

    /**
     * Sets the red, green, and blue values of the color object
     * based on the input hex color.
     *
     * @param {string} hexColor - The hex color value to convert to
     *      RGB and set the color object's values.
     * @return {void} This function does not return a value.
     */
    fromHex(hexColor) {
        // add # if not present
        if (hexColor.length > 0 && hexColor[0] !== '#') {
            hexColor = `#${hexColor}`;
        }

        // do conversion on expanded hex
        let convertHex = this.expandHex(hexColor);
        let [r, g, b] = PixelMath.hexToRgb(convertHex);
        this.fromRGB(r, g, b)

        // don't change hex input while typing
        this.hex = hexColor;
    }

    /**
     * If the hexcolor is not in the format #RRGGBB, expand it to #RRGGBB
     * by converting #RGB to #RRGGBB and filling in any missing values with 0.
     * @param hexColor
     * @returns {string}
     */
    expandHex(hexColor) {
        // use black for empty string
        if (hexColor.length === 0) {
            return '#000000';
        }

        // add # if not present
        if (hexColor[0] !== '#') {
            hexColor = `#${hexColor}`;
        }

        // convert #RGB to #RRGGBB
        if (hexColor.length <= 4) {
            while (hexColor.length < 4) {
                hexColor += '0';
            }
            return `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
        }

        // append 0 if missing values
        if (hexColor.length < 7) {
            while (hexColor.length < 7) {
                hexColor += '0';
            }
        }

        return hexColor;
    }

    /**
     * Sets the red, green, and blue values of the color object based
     * on the input HSV values.
     *
     * @param {number} h - The hue value to set.
     * @param {number} s - The saturation value to set.
     * @param {number} v - The value (brightness) value to set.
     * @return {void} This function does not return a value.
     */
    fromHSV(h, s, v) {
        this.hue = h;
        this.sat = s;
        this.val = v;
        let [r, g, b] = PixelMath.hsvToRgb(h, s, v);
        this.red = r;
        this.green = g;
        this.blue = b;
        this.hex = this.toHex();
        this.#updateCalculatedValues();
    }

    /**
     * Sets the red, green, and blue values of the color object based on the input RGB values.
     *
     * @param {number} r - The red value to set.
     * @param {number} g - The green value to set.
     * @param {number} b - The blue value to set.
     * @return {void} This function does not return a value.
     */
    fromRGB(r, g, b) {
        this.red = r;
        this.green = g;
        this.blue = b;
        let [h, s, v] = PixelMath.rgbToHsv(r, g, b);
        this.hue = h;
        this.sat = s;
        this.val = v;
        this.hex = this.toHex();
        this.#updateCalculatedValues();
    }

    /**
     * Writes pixel data to the given array starting at the given offset.
     * @param data {Uint8ClampedArray}
     * @param offset {number}
     */
    writeTo(data, offset) {
        data[offset++] = Math.floor(this.red);
        data[offset++] = Math.floor(this.green);
        data[offset++] = Math.floor(this.blue);
        data[offset++] = 255;
    }

    /**
     * Converts the color object to an RGB string representation.
     *
     * @return {string} The RGB string representation of the color object.
     */
    toString() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    /**
     * Updates the calculated values of the color object.
     *
     * This function converts the RGB values of the color object to
     * HSV format and updates the hue, saturation, and value properties
     * of the object. It also updates the hex property with the
     * hexadecimal representation of the color.
     *
     * @return {void} This function does not return a value.
     */
    #updateCalculatedValues() {
        
        // keep adjusting until correct (up to 10 tries)
        var correct = false;
        for (let tries = 0; tries < 2; tries++) {
            correct = true;
            if (PixelMath.clampRGB(this)) {
                correct = false;
                let [h, s, v] = PixelMath.rgbToHsv(this.red, this.green, this.blue);
                this.hue = h;
                this.sat = s;
                this.val = v;
            }
            if (PixelMath.clampHSV(this)) {
                correct = false;
                let [r, g, b] = PixelMath.hsvToRgb(this.hue, this.sat, this.val);
                this.red = r;
                this.green = g;
                this.blue = b;
            }

            if (correct) break;
        }

        // convert to hex
        this.hex = this.toHex();
    }
}
