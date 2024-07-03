import {PixelColor} from "../util/PixelColor.js";
import {GSMColorPicker} from "../GSMColorPicker.js";
import {FileSystem} from "../fs/FileSystem.js";
import {GuiUtil} from "../util/GuiUtil.js";

/**
 * Displays a range of colors on a canvas from which the user can click on
 * and that pixel's color becomes the selection.
 */
export class PhotoPicker {

    /**
     * Size of the canvas to display photos.
     * @type {{width: number, height: number}}
     */
    size = { width: 400, height: 275 };

    /**
     * References to the application's main class
     * @type {GSMColorPicker|null}
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
     * Dropdown for choosing the photo to display on the canvas.
     * @type {HTMLSelectElement|null}
     */
    $ddlPhoto = null;

    /**
     * The selected photo.
     * @type {string|null}
     */
    photo = null;

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
     * How much to scroll the image
     * @type {{x: number, y: number}}
     */
    #imageScroll = { x: 0, y: 0 };

    /**
     * The user's scaling of the image against the fill scale.
     * @type {number}
     */
    #userScale = 1.0;

    /**
     * Current image being displayed
     * @type {HTMLImageElement|null}
     */
    #image = null;

    /**
     * Last size the image was scaled to
     * @type {{width: number, height: number}}
     */
    #imageScale = {width: 0, height: 0};

    /**
     * Constructor
     * @param app {GSMColorPicker} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.color = new PixelColor();

        this.#initDom();
        this.#initCanvas();
        this.selectPhoto();
        this.#drawSelection();

        app.addColorListener((event) => {
            this.setColor(event.color);
            GuiUtil.setOverlay(this, event.showOverlay);
        });
    }


    /**
     * Changes the selected photo from the dropdown list.
     * @param {string|null} photo the image to display, or first from the list if null
     */
    selectPhoto(photo= null) {

        // select first photo if not specified
        if (!photo) {
            photo = this.$ddlPhoto.options[0].value;
        }

        // clear canvas
        this.ctx.clearRect(0, 0, this.size.width, this.size.height);

        // select and load image
        this.photo = photo;
        this.#loadImage(this.photo);

        // update dropdown if needed
        if (this.$ddlPhoto.value !== this.photo) {
            this.$ddlPhoto.value = this.photo;
        }

        this.#drawSelection();
    }

    /**
     * Sets the color selection to the pixel at the given coordinates.
     * @param x
     * @param y
     */
    selectColorAt(x, y) {

        // TODO: need to allow clicks anywhere in the photo

        // Get the pixel data at the mouse cursor position
        //console.log('getting pixel at ' + x + ','+y);
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        this.currentX = x;
        this.currentY = y;

        // Display the new pixel color
        const pixelColor = imageData.data;
        this.setColor(new PixelColor(pixelColor[0], pixelColor[1], pixelColor[2]));

        // update selection display
        this.#drawSelection();
    }

    /**
     * Sets the color selection by object.
     * @param color {PixelColor}
     */
    setColor(color) {
        if (color.equals(this.color)) {
            return;
        }
        this.color = color;
        this.app.setColor(color);

        // update selection display
        let hex = color.toHex();
        this.colorSelector.style.backgroundColor = hex;
        document.querySelector('#photos_hexColor').value = hex;

        this.#drawSelection();
    }

    /**
     * Initializes dom references and events.
     */
    #initDom() {

        this.colorSelector = document.querySelector('#tab-photos-view .panel-color');
        this.showOverlayCheckbox = document.querySelector('#tab-photos-view .overlay-check');

        // show overlay checkbox
        this.showOverlayCheckbox = document.getElementById("showImage");
        this.showOverlayCheckbox.addEventListener("input", (event) => {
            this.app.setOverlay(event.target.checked);
        });

        // the gradient chooser
        this.$ddlPhoto = document.querySelector('#tab-photos-view #photos-palette');
        this.$ddlPhoto.addEventListener('change', (event) => {
            this.selectPhoto(event.target.value);
        });

        // load options from filesystem
        this.#buildGradientDropdown();
    }

    /**
     * Grabs the DOM references and create the event listeners.
     */
    #initCanvas() {

        // get the canvas element and context
        this.canvas = document.querySelector('#tab-photos-view canvas');
        this.canvas.style.zIndex = '10';
        this.ctx = this.canvas.getContext('2d', {willReadFrequently: true});

        // create canvas to draw selection upon
        //let rect = this.canvas.getBoundingClientRect();
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.zIndex = '20';
        this.overlayCtx = this.overlayCanvas.getContext('2d', {willReadFrequently: false});
        this.overlayCanvas.width = this.size.width;
        this.overlayCanvas.height = this.size.height;
        this.canvas.parentElement.prepend(this.overlayCanvas);

        // mouse down and drags performs color selections
        this.mouseIsDown = false;
        this.overlayCanvas.addEventListener('mousedown', event => {
            this.mouseIsDown = true;
            this.selectColorAt(event.offsetX, event.offsetY);
        });
        this.overlayCanvas.addEventListener('mousemove', event => {
            if (!this.mouseIsDown) return;
            this.selectColorAt(event.offsetX, event.offsetY);
        });
        this.overlayCanvas.addEventListener('mouseup', () => {
            this.mouseIsDown = false;
        });

        // arrows move picture around
        let keyDown = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            PageUp: false,
            PageDown: false
        }
        let keyInterval = null;
        document.addEventListener('keydown', event => {
            switch (event.key) {
                case ' ':
                    keyDown = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
                    if (keyInterval != null) {
                        clearInterval(keyInterval);
                        keyInterval = null;
                    }
                    this.#userScale = 1.0;
                    this.#imageScroll = { x: 0, y: 0 };
                    this.#renderImage();
                    break;

                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                case 'PageUp':
                case 'PageDown':

                    // update key state
                    event.preventDefault();
                    keyDown[event.key] = true;

                    // start moving picture when first arrow pressed
                    if (keyInterval == null) {
                        let firstTime = new Date().getTime();
                        let lastTime = firstTime
                        keyInterval = setInterval(() => {

                            // get time delta
                            let now = new Date().getTime();
                            let diff = now - lastTime;
                            let elapsed = now - firstTime;

                            let pixelsPerSecond = 0.5;// * (elapsed / 1000);
                            //console.log('pixelsPerSecond: ' + pixelsPerSecond);
                            lastTime = now;

                            // move image
                            if (keyDown['ArrowLeft']) {
                                this.#imageScroll.x -= diff * pixelsPerSecond;
                            }
                            if (keyDown['ArrowRight']) {
                                this.#imageScroll.x += diff * pixelsPerSecond;
                            }
                            if (keyDown['ArrowUp']) {
                                this.#imageScroll.y -= diff * pixelsPerSecond;
                            }
                            if (keyDown['ArrowDown']) {
                                this.#imageScroll.y += diff * pixelsPerSecond;
                            }

                            // scale image
                            if (keyDown['PageUp']) {
                                this.#userScale *= 1.01;// * pixelsPerSecond;
                            }
                            if (keyDown['PageDown']) {
                                this.#userScale /= 1.01;// * pixelsPerSecond;
                            }
                            if (this.#userScale < 0.5) {
                                this.#userScale = 0.5;
                            }
                            if (this.#userScale > 5) {
                                this.#userScale = 5;
                            }

                            // limit scrolling to having the image half-way off the screen
                            let w = this.#imageScale.width;// / this.#userScale;
                            let h = this.#imageScale.height;// / this.#userScale;
                            let w0 = this.canvas.width;
                            let h0 = this.canvas.height;
                            let minX = -w / 2;
                            let minY = -h + h0 / 2;
                            let maxX = w / 2;
                            let maxY = h / 2 - h0 / 2;

                            //console.log('limits ' + minX + ' ' + minY + ' ' + maxX + ' ' + maxY);

                            if (this.#imageScroll.x < minX) {
                                this.#imageScroll.x = minX;
                            }
                            if (this.#imageScroll.y < minY) {
                                this.#imageScroll.y = minY;
                            }
                            if (this.#imageScroll.x > maxX) {
                                this.#imageScroll.x = maxX;
                            }
                            if (this.#imageScroll.y > maxY) {
                                this.#imageScroll.y = maxY;
                            }

                            this.#imageScroll.x = Math.floor(this.#imageScroll.x);
                            this.#imageScroll.y = Math.floor(this.#imageScroll.y);

                            // render image
                            this.#renderImage();
                        });
                    }
                    break;
            }
        });
        document.addEventListener('keyup', event => {
            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                case 'PageUp':
                case 'PageDown':

                    // update key state
                    event.preventDefault();
                    keyDown[event.key] = false;

                    // stop moving picture if all arrows released
                    if (keyInterval != null) {
                        let allKeysUp = true;
                        for (let key in keyDown) {
                            if (keyDown[key]) {
                                allKeysUp = false;
                                break;
                            }
                        }
                        if (allKeysUp) {
                            clearInterval(keyInterval);
                            keyInterval = null;
                        }
                    }

                    break;
            }
        });
    }

    /**
     * Renders the current image including current scale and scroll.
     */
    #renderImage() {
        let rect = {
            x: this.#imageScroll.x * this.#userScale,
            y: this.#imageScroll.y * this.#userScale,
            width: this.#imageScale.width * this.#userScale,
            height: this.#imageScale.height * this.#userScale
        };
        if (this.#image) {
            //console.log('rendering at ' + rect.x + ',' + rect.y + ' ' + rect.width + 'x' + rect.height);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.#image, rect.x, rect.y, rect.width, rect.height);
        }
    }

    /**
     * Loads an image into the canvas.
     * @param imgUrl {string} - The url of the image to load
     */
    #loadImage(imgUrl) {
        this.#imageScroll = { x: 0, y: 0 };
        if (this.photo.startsWith('file:')) {
            // image from localStorage
            let fileId = parseInt(this.photo.substring(5));
            FileSystem.loadFileById(fileId, (file) => {
                if (file == null) {
                    console.error('could not load file ' + fileId);
                    return;
                }
                const img = new Image();
                img.src = file.contents;
                img.onload = () => {
                    let rect = GuiUtil.fillCentered(this.canvas, img);
                    this.#imageScroll = { x: rect.x, y: rect.y };
                    this.#imageScale = { width: rect.width, height: rect.height };
                    this.#image = img;
                };
            });
        }
        else {
            // image from extension's folder
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                let rect = GuiUtil.fillCentered(this.canvas, img);
                this.#imageScroll = { x: rect.x, y: rect.y };
                this.#imageScale = { width: rect.width, height: rect.height };
                this.#image = img;
            };
        }
    }

    /**
     * Draws the current selection on the overlay canvas.
     */
    #drawSelection() {

        // selected 2d gradient
        this.overlayCtx.clearRect(0, 0, 400, 275);
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(this.currentX, this.currentY, 3.5, 0, 2 * Math.PI, false);
        this.overlayCtx.strokeStyle = 'black';
        this.overlayCtx.lineWidth = 1;
        this.overlayCtx.stroke();
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(this.currentX, this.currentY, 3, 0, 2 * Math.PI, false);
        this.overlayCtx.strokeStyle = 'yellow';
        this.overlayCtx.lineWidth = 1;
        this.overlayCtx.stroke();
    }

    /**
     * Builds the options for the gradient dropdown, which places each
     * subfolder of the 'Custom Palettes' folder in an optgroup, and
     * any files directly in the 'Custom Palettes' folder as 'Uncategorized'.
     * The first optgroup is the hardcoded shaders and is left alone.
     */
    #buildGradientDropdown() {

        let fileSystem = new FileSystem();
        let folder = fileSystem.getFolder('Photos');

        // add each subfolder as an optgroup
        for (let i = 0; i < folder.folders.length; i++) {
            let subfolder = folder.folders[i];
            let optGroup = this.#createOptGroupForFolder(subfolder);
            this.$ddlPhoto.appendChild(optGroup);
        }

        // added files outside any subfolder as 'uncategorized' optgroup
        if (folder.files.length > 0)  {
            let optGroup = this.#createOptGroupForFolder(folder, 'Uncategorized');
            this.$ddlPhoto.appendChild(optGroup);
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
            if (file.isUserFile()) {
                option.value = 'file:' + file.id;
            }
            else {
                option.value = file.localUrl;
            }
            option.innerHTML = file.name;
            optGroup.appendChild(option);
        }
        return optGroup;
    }
}
