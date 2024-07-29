import {PixelColor} from "../util/PixelColor.js";
import {SUColorKit} from "../SUColorKit.js";
import {GradientShader} from "../util/GradientShader.js";
import {FileSystem} from "../fs/FileSystem.js";
import {GuiUtil} from "../util/GuiUtil.js";

/**
 * Displays a range of colors on a canvas from which the user can click on
 * and that pixel's color becomes the selection.
 */
export class GradientPicker {

    /**
     * References to the application's main class
     * @type {SUColorKit|null}
     */
    app = null;

    /**
     * The selected color
     * @type {PixelColor|null}
     */
    color = null;

    /**
     * Canvas showing colors.
     * @type {HTMLCanvasElement|null}
     */
    canvas = null;

    /**
     * 2D rendering context of the canvas.
     * @type {CanvasRenderingContext2D|null}
     */
    ctx = null;

    /**
     * Canvas hovering over color selector to draw the selection without
     * messing up the pixel reader.
     * @type {HTMLCanvasElement|null}
     */
    overlayCanvas = null;

    /**
     * The context of the overlay canvas.
     * @type {CanvasRenderingContext2D|null}
     */
    overlayCtx = null;

    /**
     * The color selector element that previews the color
     * @type {HTMLElement|null}
     */
    colorSelector = null;

    /**
     * Checkbox to show the overlay image.
     * @type {HTMLInputElement|null}
     */
    showOverlayCheckbox = null;

    /**
     * The type of gradient to display (default sat/val)
     * @type {string}
     */
    gradientType = 'sat/val';

    /**
     * Dropdown for choosing the type of gradient to display
     * on the canvas.
     * @type {HTMLSelectElement|null}
     */
    $ddlGradientType = null;

    /**
     * The last selected hue in sat/val mode
     * @type {number} 0-360
     */
    currentHue = 0;

    /**
     * The last selected saturation in hue/val mode
     * @type {number} 0-100
     */
    currentSat = 0;

    /**
     * The last selected value (brightness) in hue/sat mode
     * @type {number} 0-100
     */
    currentVal = 0;

    /**
     * The last selected value in red mode
     * @type {number} 0-255
     */
    currentRed = 0;

    /**
     * The last selected value in green mode
     * @type {number} 0-255
     */
    currentGreen = 0;

    /**
     * The last selected value in blue mode
     * @type {number} 0-255
     */
    currentBlue = 0;

    /**
     * The last selected position x
     * @type {number} 0-200
     */
    currentX = 0;

    /**
     * The last selected position y
     * @type {number} 0-100
     */
    currentY = 0;

    /**
     * The last selected x position of the alternate gradient
     * @type {number} 0-200
     */
    currentZ = 0;

    /**
     * Shader used to draw the gradients
     * @type {GradientShader|null}
     */
    #shader = null;

    /**
     * All available shaders
     */
    #shaders = {
        'sat/val': {
            fnMain: (color, x, y, w, h) => {
                let sat = (x / (w - 1)) * 100.0;
                let val = (1 - (y / (h - 1))) * 100.0;
                color.fromHSV(this.currentHue, sat, val);
            },
            fnAlt: (color, x, y, w, _) => {
                let hue = (x / (w - 1)) * 360.0;
                color.fromHSV(hue, 100, 100);
            }
        },
        'hue/val': {
            fnMain: (color, x, y, w, h) => {
                let hue = (x / (w - 1)) * 360.0;
                let val = (1 - (y / (h - 1))) * 100.0;
                color.fromHSV(hue, this.currentSat, val);
            },
            fnAlt: (color, x, y, w, _) => {
                let sat = (x / (w - 1)) * 100.0;
                color.fromHSV(this.currentHue, sat, 100);
            }
        },
        'hue/sat': {
            fnMain: (color, x, y, w, h) => {
                let hue = (x / (w - 1)) * 360.0;
                let sat = (1 - (y / (h - 1))) * 100.0;
                color.fromHSV(hue, sat, this.currentVal);
            },
            fnAlt: (color, x, y, w, _) => {
                let val = (x / (w - 1)) * 100.0;
                color.fromHSV(this.currentHue, this.currentSat, val);
            }
        },
        'red': {
            fnMain: (color, x, y, w, h) => {
                let green = (x / (w - 1)) * 255.0;
                let blue = (1 - (y / (h - 1))) * 255.0;
                color.fromRGB(this.currentRed, green, blue);
            },
            fnAlt: (color, x, y, w, _) => {
                let red = (x / (w - 1)) * 100.0;
                color.fromRGB(red, this.currentGreen, this.currentBlue);
            }
        },
        'green': {
            fnMain: (color, x, y, w, h) => {
                let red = (x / (w - 1)) * 255.0;
                let blue = (1 - (y / (h - 1))) * 255.0;
                color.fromRGB(red, this.currentGreen, blue);
            },
            fnAlt: (color, x, y, w, _) => {
                let green = (x / (w - 1)) * 100.0;
                color.fromRGB(this.currentRed, green, this.currentBlue);
            }
        },
        'blue': {
            fnMain: (color, x, y, w, h) => {
                let red = (x / (w - 1)) * 255.0;
                let green = (1 - (y / (h - 1))) * 255.0;
                color.fromRGB(red, green, this.currentBlue);
            },
            fnAlt: (color, x, y, w, _) => {
                let blue = (x / (w - 1)) * 100.0;
                color.fromRGB(this.currentRed, this.currentGreen, blue);
            }
        }
    };

    /**
     * Constructor
     * @param app {SUColorKit} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.color = new PixelColor();

        this.#initDom();
        this.#initCanvas();
        this.selectGradientType();
        this.#drawSelection();

        app.addColorListener((event) => {
            this.setColor(event.color);
            GuiUtil.setOverlay(this, event.showOverlay);
        });
    }


    /**
     * Changes the type of range of colors displayed, selected
     * from the dropdown list.
     * @param {string} gradientType (default sat/val)
     */
    selectGradientType(gradientType = 'sat/val') {
        this.ctx.clearRect(0, 0, 200, 130);
        this.gradientType = gradientType;

        // load shader if available
        if (this.#shaders[this.gradientType]) {
            this.#shader.fnMainSelectorColor = this.#shaders[this.gradientType].fnMain;
            this.#shader.fnAltSelectorColor = this.#shaders[this.gradientType].fnAlt;
        }
        // load image if not
        else {
            this.#shader.fnMainSelectorColor = null;
            this.#shader.fnAltSelectorColor = null;
            this.#loadImage(this.gradientType);
        }

        /*
        this.#shader.fnMainSelectorColor = null;
        this.#shader.fnAltSelectorColor = null;
        switch (this.gradientType) {
            case 'sat/val':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let sat = (x / (w - 1)) * 100.0;
                    let val = (1 - (y / (h - 1))) * 100.0;
                    color.fromHSV(this.currentHue, sat, val);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let hue = (x / (w - 1)) * 360.0;
                    color.fromHSV(hue, 100, 100);
                };
                break;
            case 'hue/val':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let hue = (x / (w - 1)) * 360.0;
                    let val = (1 - (y / (h - 1))) * 100.0;
                    color.fromHSV(hue, this.currentSat, val);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let sat = (x / (w - 1)) * 100.0;
                    color.fromHSV(this.currentHue, sat, 100);
                };
                break;
            case 'hue/sat':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let hue = (x / (w - 1)) * 360.0;
                    let sat = (1 - (y / (h - 1))) * 100.0;
                    color.fromHSV(hue, sat, this.currentVal);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let val = (x / (w - 1)) * 100.0;
                    color.fromHSV(this.currentHue, this.currentSat, val);
                };
                break;
            case 'red':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let green = (x / (w - 1)) * 255.0;
                    let blue = (1 - (y / (h - 1))) * 255.0;
                    color.fromRGB(this.currentRed, green, blue);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let red = (x / (w - 1)) * 100.0;
                    color.fromRGB(red, this.currentGreen, this.currentBlue);
                };
                break;
            case 'green':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let red = (x / (w - 1)) * 255.0;
                    let blue = (1 - (y / (h - 1))) * 255.0;
                    color.fromRGB(red, this.currentGreen, blue);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let green = (x / (w - 1)) * 100.0;
                    color.fromRGB(this.currentRed, green, this.currentBlue);
                };
                break;
            case 'blue':
                this.#shader.fnMainSelectorColor = (color, x, y, w, h) => {
                    let red = (x / (w - 1)) * 255.0;
                    let green = (1 - (y / (h - 1))) * 255.0;
                    color.fromRGB(red, green, this.currentBlue);
                };
                this.#shader.fnAltSelectorColor = (color, x, y, w, h) => {
                    let blue = (x / (w - 1)) * 100.0;
                    color.fromRGB(this.currentRed, this.currentGreen, blue);
                };
                break;


            default:
                this.#loadImage(this.gradientType);
                break;
        }
         */

        // update dropdown if needed
        if (this.$ddlGradientType.value !== this.gradientType) {
            this.$ddlGradientType.value = this.gradientType;
        }

        // render shader if provided
        if (this.#shader.fnMainSelectorColor) {
            this.#shader.render();
        }
        this.#drawSelection();
    }

    /**
     * Sets the color selection to the pixel at the given coordinates.
     * @param x
     * @param y
     */
    selectColorAt(x, y) {

        // detect clicks in secondary area below main color selector
        if (this.#usesZ()) {
            if (y > 105 && y < 130) {
                let updateXY = true;
                this.currentZ = x;
                switch (this.gradientType) {
                    case 'sat/val':
                        this.currentHue = Math.round((x / 200) * 360);
                        break;
                    case 'hue/val':
                        this.currentSat = Math.round((x / 200) * 100);
                        break;
                    case 'hue/sat':
                        this.currentVal = Math.round((x / 200) * 100);
                        break;
                    case 'red':
                        this.currentRed = Math.round((x / 200) * 255);
                        break;
                    case 'green':
                        this.currentGreen = Math.round((x / 200) * 255);
                        break;
                    case 'blue':
                        this.currentBlue = Math.round((x / 200) * 255);
                        break;
                    default:
                        // no special action needed for palettes based on images
                        updateXY = false;
                        break;
                }

                // rerun last click to get the new color value as the
                // secondary parameter changes
                if (updateXY) {
                    console.log('set the z at ' + x);
                    x = this.currentX;
                    y = this.currentY;
                    this.#drawSelection();
                    this.#shader.render();
                }
            }

            // ignore clicks below main color selector
            if (y > 100) return;
        }


        // Get the pixel data at the mouse cursor position
        //console.log('getting pixel at ' + x + ','+y);
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        this.currentX = x;
        this.currentY = y;


        // Display the new pixel color
        const pixelColor = imageData.data;
        const NO_RECALC = false;
        this.setColor(new PixelColor(pixelColor[0], pixelColor[1], pixelColor[2]), NO_RECALC);

        this.#drawSelection();
    }

    /**
     * Sets the color selection by object.
     * @param color {PixelColor}
     * @param recalc {boolean} - whether to recalculate the current x/y/z values
     */
    setColor(color, recalc = true) {
        if (color.equals(this.color)) {
            return;
        }
        this.color = color;
        this.app.setColor(color);

        // update selection display
        let hex = color.toHex();
        this.colorSelector.style.backgroundColor = hex;
        document.querySelector('#gradient_hexColor').value = hex;

        // update selections
        this.currentRed = color.red;
        this.currentGreen = color.green;
        this.currentBlue = color.blue;
        this.currentHue = color.hue;
        this.currentSat = color.sat;
        this.currentVal = color.val;

        if (recalc) {
            switch (this.gradientType) {
                case 'sat/val':
                    this.currentX = Math.round((color.sat / 100) * 200);
                    this.currentY = Math.round((1 - (color.val / 100)) * 100);
                    this.currentZ = Math.round((color.hue / 360) * 200);
                    break;
                case 'hue/val':
                    this.currentX = Math.round((color.hue / 360) * 200);
                    this.currentY = Math.round((1 - (color.val / 100)) * 100);
                    this.currentZ = Math.round((color.sat / 100) * 200);
                    break;
                case 'hue/sat':
                    this.currentX = Math.round((color.hue / 360) * 200);
                    this.currentY = Math.round((1 - (color.sat / 100)) * 100);
                    this.currentZ = Math.round((color.val / 100) * 200);
                    break;
                case 'red':
                    this.currentX = Math.round((color.green / 255) * 200);
                    this.currentY = Math.round((1 - (color.blue / 255)) * 100);
                    this.currentZ = Math.round((color.red / 255) * 200);
                    break;
                case 'green':
                    this.currentX = Math.round((color.red / 255) * 200);
                    this.currentY = Math.round((1 - (color.blue / 255)) * 100);
                    this.currentZ = Math.round((color.green / 255) * 200);
                    break;
                case 'blue':
                    this.currentX = Math.round((color.red / 255) * 200);
                    this.currentY = Math.round((1 - (color.green / 255)) * 100);
                    this.currentZ = Math.round((color.blue / 255) * 200);
                    break;
            }
        }

        // update gradients view
        if (this.#usesShader()) {
            this.#shader.render();
        }
        this.#drawSelection();
    }

    /**
     * Returns true if the color selector was built with a shader function.
     * @returns {boolean}
     */
    #usesShader() {
        switch (this.gradientType) {
            case 'sat/val':
            case 'hue/val':
            case 'hue/sat':
                return true;
            case 'red':
            case 'green':
            case 'blue':
                return true;
            default:
                return false;
        }
    }

    /**
     * Returns true if the color selector has a secondary 1-d value that
     * is used to control the color of the 2-d gradient.
     */
    #usesZ() {
        switch (this.gradientType) {
            case 'sat/val':
            case 'hue/val':
            case 'hue/sat':
                return true;
            case 'red':
            case 'green':
            case 'blue':
                return true;
            default:
                return false;
        }
    }

    /**
     * Initializes dom references and events.
     */
    #initDom() {

        this.colorSelector = document.querySelector('#tab-gradient-view .panel-color');
        this.showOverlayCheckbox = document.querySelector('#tab-gradient-view .overlay-check');

        // show overlay checkbox
        this.showOverlayCheckbox = document.getElementById("showImage");
        this.showOverlayCheckbox.addEventListener("input", (event) => {
            this.app.setOverlay(event.target.checked);
        });

        // the gradient chooser
        this.$ddlGradientType = document.querySelector('#tab-gradient-view #gradient-palette');
        this.$ddlGradientType.addEventListener('change', (event) => {
            this.selectGradientType(event.target.value);
        });

        // load options from filesystem
        this.#buildGradientDropdown();

        // clicking on a component label changes the palette
        document.querySelectorAll('.rgb label,.hsv label').forEach((element) => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                let target = element.getAttribute('for').replace('Slider2','');
                switch (target) {
                    case 'red':
                        this.selectGradientType('red');
                        break;
                    case 'green':
                        this.selectGradientType('green');
                        break;
                    case 'blue':
                        this.selectGradientType('blue');
                        break;
                    case 'hue':
                        this.selectGradientType('sat/val');
                        break;
                    case 'sat':
                        this.selectGradientType('hue/val');
                        break;
                    case 'val':
                        this.selectGradientType('hue/sat');
                        break;
                }
            });
        });
    }

    /**
     * Grabs the DOM references and create the event listeners.
     */
    #initCanvas() {

        // get the canvas element and context
        this.canvas = document.querySelector('#tab-gradient-view canvas');
        this.canvas.style.zIndex = '10';
        this.ctx = this.canvas.getContext('2d', {willReadFrequently: true});
        this.#shader = new GradientShader(this.canvas, this.ctx);

        // create canvas to draw selection upon
        //let rect = this.canvas.getBoundingClientRect();
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d', {willReadFrequently: false});
        this.overlayCanvas.width = 200;
        this.overlayCanvas.height = 130;
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.zIndex = '20';
        this.canvas.parentElement.prepend(this.overlayCanvas);

        // detect the panel the mouse is over
        function getMousePanel(x, y) {
            if (y > 105 && y < 130) {
                return 'z';
            } else if (y > 0 && y < 100) {
                return 'xy';
            } else {
                return null;
            }
        }

        // mouse down and drags performs color selections
        this.mouseIsDown = false;
        this.mousePanel = null; // xy or z
        this.overlayCanvas.addEventListener('mousedown', event => {
            // Get the mouse cursor position
            const x = event.offsetX;
            const y = event.offsetY;

            // detect panel to lock mouse to
            if (this.#usesZ()) {
                this.mousePanel = getMousePanel(x, y);
                if (this.mousePanel === null) return;
            }

            // select the color
            this.selectColorAt(x, y);
            this.mouseIsDown = true;
        });

        this.overlayCanvas.addEventListener('mousemove', event => {
            if (!this.mouseIsDown) return;

            // Get the mouse cursor position
            const x = event.offsetX;
            const y = event.offsetY;

            // make sure movement is within panel mouse is locked to
            if (this.#usesZ()) {
                if (getMousePanel(x, y) !== this.mousePanel) return;
            }

            // select the color
            this.selectColorAt(x, y);
        });
        window.addEventListener('mouseup', () => {
            this.mouseIsDown = false;
            this.mousePanel = null;
        });
    }

    /**
     * Loads an image into the canvas.
     * @param imgUrl {string} - The url of the image to load
     */
    #loadImage(imgUrl) {
        if (this.gradientType.startsWith('file:')) {
            // image from localStorage
            let fileId = parseInt(this.gradientType.substring(5));
            FileSystem.loadFileById(fileId, (file) => {
                if (file == null) {
                    console.error('could not load file ' + fileId);
                    return;
                }
                const img = new Image();
                img.src = file.contents;
                img.onload = () => {
                    this.ctx.drawImage(img, 0, 0, 200, 130);
                };
            });
        }
        else {
            // image from extension's folder
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, 200, 130);
            };
        }
    }


    /**
     * Draws the current selection on the overlay canvas.
     */
    #drawSelection() {

        // selected 2d gradient
        this.overlayCtx.clearRect(0, 0, 200, 130);
        GuiUtil.drawSelectionCircle(this.overlayCtx, this.currentX, this.currentY);

        // selected 1d alternative gradient
        if (this.#usesZ()) {
            this.overlayCtx.beginPath();
            this.overlayCtx.rect(this.currentZ - 1.5, 105, 4, 25);
            this.overlayCtx.strokeStyle = 'black';
            this.overlayCtx.lineWidth = 1;
            this.overlayCtx.stroke();
            this.overlayCtx.beginPath();
            this.overlayCtx.rect(this.currentZ - 1, 106, 3, 23);
            this.overlayCtx.strokeStyle = 'yellow';
            this.overlayCtx.lineWidth = 1;
            this.overlayCtx.stroke();
        }
    }

    /**
     * Builds the options for the gradient dropdown, which places each
     * subfolder of the 'Custom Palettes' folder in an optgroup, and
     * any files directly in the 'Custom Palettes' folder as 'Uncategorized'.
     * The first optgroup is the hardcoded shaders and is left alone.
     */
    #buildGradientDropdown() {

        let fileSystem = new FileSystem();
        let folder = fileSystem.getFolder('Custom Palettes');

        // clear ddl except first hard-coded optgroup (the shaders)
        let $gradientOptGroup = this.$ddlGradientType.firstElementChild;
        this.$ddlGradientType.innerHTML = '';
        this.$ddlGradientType.appendChild($gradientOptGroup);

        // add each subfolder as an optgroup
        for (let i = 0; i < folder.folders.length; i++) {
            let subfolder = folder.folders[i];
            let optGroup = this.#createOptGroupForFolder(subfolder);
            this.$ddlGradientType.appendChild(optGroup);
        }

        // added files outside any subfolder as 'uncategorized' optgroup
        if (folder.files.length > 0)  {
            let optGroup = this.#createOptGroupForFolder(folder, 'Uncategorized');
            this.$ddlGradientType.appendChild(optGroup);
        }
    }

    /**
     * Creates an optgroup for a dropdown list of all the files in a folder.
     * @param fsFolder {FileSystemFolder} the folder to create the optgroup for
     * @param folderName {string|null} the name of the folder (optional, default is folder name)
     * @returns {HTMLOptGroupElement}
     */
    #createOptGroupForFolder(fsFolder, folderName = null) {
        let optGroup = document.createElement('optgroup');
        optGroup.label = folderName || fsFolder.name;
        for (let j = 0; j < fsFolder.files.length; j++) {
            //console.log(subfolder.files[j]);
            let file = fsFolder.files[j];
            let option = document.createElement('option');
            option.value = file.localUrl;
            option.innerHTML = file.name;
            optGroup.appendChild(option);
        }
        return optGroup;
    }
}


/*
let colors = [];
let list = document.querySelectorAll('.innerbox');
for (let i = 0; i < list.length; i++) {
    let name = list[i].querySelector('.colornamespan>a').innerText;
    let color = list[i].querySelector('.colorhexspan>a').innerText;
    colors.push({name:name,color:color});
}
console.log(JSON.stringify(colors));
*/