/**
 * Utility class for common pixel math operations.
 */
export class PixelMath {

    /**
     * Keeps the red, green, and blue values between 0 and 255.
     * @param r {number|object}
     * @param {number} [r.red] - The red value of the color.
     * @param {number} [r.green] - The green value of the color.
     * @param {number} [r.blue] - The blue value of the color.
     * @param g {number}
     * @param b {number}
     * @returns {number[]|boolean} - returns array of 3 numbers if numbers are passed in, otherwise true if the object is clamped or false if not
     */
    static clampRGB(r, g, b) {

        // grab value if using object overload
        let object = null;
        if (typeof r === 'object') {
            object = r;
            r = object.red;
            g = object.green;
            b = object.blue;
        }

        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
            console.log('clampRGB: NaN passed in', arguments);
            return false;
        }

        // do clamping
        if (r < 0) {
            r = 0;
        } else if (r > 255) {
            r = 255;
        }
        if (g < 0) {
            g = 0;
        } else if (g > 255) {
            g = 255;
        }
        if (b < 0) {
            b = 0;
        } else if (b > 255) {
            b = 255;
        }

        // return boolean of whether object is updated in object mode
        if (object) {
            if (r !== object.r || g !== object.g || b !== object.b) {
                object.red = r;
                object.green = g;
                object.blue = b;
                return true;
            }
            return false;
        }

        // otherwise return array
        return [r, g, b];
    }

    /**
     * Keeps the hue between 0 and 360 and the saturation and value between 0 and 100.
     * @param h {number|object}
     * @param {number} [h.hue] - The hue value of the color.
     * @param {number} [h.sat] - The saturation value of the color.
     * @param {number} [h.val] - The value (brightness) value of the color.
     * @param s {number}
     * @param v {number}
     * @returns {number[]|boolean} - returns array of 3 numbers if numbers are passed in, otherwise true if the object is clamped or false if not     */
    static clampHSV(h, s, v) {

        // grab value if using object overload
        let object = null;
        if (typeof h === 'object') {
            object = h;
            h = object.hue;
            s = object.sat;
            v = object.val;
        }

        if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(v)) {
            console.log('clampHSV: NaN passed in', arguments);
            return false;
        }

        // do clamping
        while (h < 0) {
            h += 360;
        }
        while (h > 360) {
            h -= 360;
        }
        if (s < 0) {
            s = 0;
        } else if (s > 100) {
            s = 100;
        }
        if (v <= 0) {
            v = 0.001; // zeros do bad things
        } else if (v > 100) {
            v = 100;
        }


        // return boolean of whether object is updated in object mode
        if (object) {
            if (h !== object.hue || s !== object.sat || v !== object.val) {
                object.hue = h;
                object.sat = s;
                object.val = v;
                return true;
            }
            return false;
        }

        // otherwise return array
        return [h, s, v];
    }

    /**
     * Converts HSV color values to RGB color values.
     *
     * @param {number} h - The hue value of the color (0-360).
     * @param {number} s - The saturation value of the color (0-100).
     * @param {number} v - The value (brightness) value of the color (0-100).
     * @return {number[]} An array containing the red, green, and blue values of the color (0-255).
     */
    static hsvToRgb(h, s, v) {
        let r, g, b;

        // zeros do bad things
        if (s < 0.001) {
            s = 0.001;
        }
        if (v < 0.001) {
            v = 0.001;
        }

        s = s / 100.0;
        v = v / 100.0;

        if (s === 0) {
            r = g = b = v;
        } else {
            const hp = h / 60.0;
            const c = v * s;
            const x = c * (1 - Math.abs((hp % 2) - 1));
            const [p1, p2, p3] = hp < 1 ? [c, x, 0] :
                hp < 2 ? [x, c, 0] :
                    hp < 3 ? [0, c, x] :
                        hp < 4 ? [0, x, c] :
                            hp < 5 ? [x, 0, c] :
                                [c, 0, x];
            const m = v - c;
            r = (p1 + m) * 255;
            g = (p2 + m) * 255;
            b = (p3 + m) * 255;
        }

        return [r, g, b];
    }

    /**
     * Converts RGB values to HSV format.
     *
     * @param {number} r - The red value (0-255).
     * @param {number} g - The green value (0-255).
     * @param {number} b - The blue value (0-255).
     * @return {number[]} An array containing the hue, saturation, and value (brightness).
     */
    static rgbToHsv(r, g, b) {
        r = r / 255;
        g = g / 255;
        b = b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const v = max;
        const c = max - min;
        let h;

        if (c === 0) {
            h = 0;
        } else if (max === r) {
            h = 60 * (((g - b) / c) % 6);
        } else if (max === g) {
            h = 60 * ((b - r) / c + 2);
        } else {
            h = 60 * ((r - g) / c + 4);
        }

        const s = v === 0 ? 1.0 : c / v;

        return [h, s * 100.0, v * 100.0];
    }


    /**
     * Converts a decimal number to its corresponding hexadecimal representation.
     *
     * @param {number} c - The decimal number to convert.
     * @return {string} The hexadecimal representation of the decimal number.
     */
    static decToHex(c) {

        let hex = "";
        while (c > 0) {
            let remainder = Math.floor(c % 16);
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(remainder - 10 + 97) + hex;
            }
            c = Math.floor(c / 16);
        }

        while (hex.length < 2) { // pad with leading zero
            hex = "0" + hex;
        }
        return hex;
    }

    /**
     * Converts a hexadecimal color code to its corresponding RGB values.
     *
     * @param {string} hexColor - The hexadecimal color code to convert.
     * @return {number[]} An array containing the red, green, and blue values of the color (0-255).
     */
    static hexToRgb(hexColor) {

        if (!hexColor) {
            return [0,0,0];
        }
        hexColor = hexColor.trim();

        let red = parseInt(hexColor.substring(1, 3), 16);
        let green = parseInt(hexColor.substring(3, 5), 16);
        let blue = parseInt(hexColor.substring(5), 16);

        return [red, green, blue];
    }
}