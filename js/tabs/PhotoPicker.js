// noinspection JSUnresolvedReference

import {PixelColor} from "../util/PixelColor.js";
import {SUColorKit} from "../SUColorKit.js";
import {FileSystem} from "../fs/FileSystem.js";
import {GuiUtil} from "../util/GuiUtil.js";
import {SelectHelper} from "../util/SelectHelper.js";
import {SettingsTab} from "./SettingsTab.js";

/**
 * Displays a range of colors on a canvas from which the user can click on
 * and that pixel's color becomes the selection.
 */
export class PhotoPicker {

    /**
     * Size of the canvas to display photos.
     * @type {{width: number, height: number}}
     */
    size = {width: 400, height: 275};

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
     * The panel containing the photo selector
     * @type {HTMLDivElement|null}
     */
    $divChoosePanel = null;

    /**
     * Dropdown for choosing the photo to display on the canvas.
     * @type {HTMLSelectElement|null}
     */
    $ddlPhoto = null;

    /**
     * The button to save the screenshot to the virtual filesystem
     * @type {HTMLButtonElement|null}
     */
    $btnSaveScreenshot = null;

    /**
     * The button to open the file manager
     * @type {HTMLButtonElement|null}
     */
    $btnManagePhotos = null;

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
    #imageScroll = {x: 0, y: 0};

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
     * @param app {SUColorKit} - The application's main class.
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
    selectPhoto(photo = null) {

        // select first photo if not specified
        if (!photo) {
            photo = this.$ddlPhoto.options[0].value;
        }

        // clear canvas
        this.ctx.clearRect(0, 0, this.size.width, this.size.height);

        // select and load image
        this.photo = photo;
        this.#loadImage(this.photo);

        // screenshots have extra controls
        if (this.photo.startsWith('data:')) {
            this.$divChoosePanel.classList.add('screenshot-mode');
        }
        else {
            this.$divChoosePanel.classList.remove('screenshot-mode');
        }

        // show the selected value on the dropdown
        this.#updatePhotoDropdownValue(this.photo);

        // show highlighted pixel
        this.#drawSelection();
    }

    /**
     * Updates the dropdown value if needed.
     * @param value {string} the new value
     */
    #updatePhotoDropdownValue(value) {
        let isScreenshot = value.startsWith('data:');
        if (isScreenshot) {
            // add the "website screenshot" option if needed
            let found = false;
            for (let i = 0; i < this.$ddlPhoto.options.length; i++) {
                if (this.$ddlPhoto.options[i].value === 'Website Screenshot') {
                    this.$ddlPhoto.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.$ddlPhoto.options.add(new Option('Website Screenshot', 'Website Screenshot', true, true));
            }
        }
        else {
            // remove the "website screenshot" option
            let removeIndex = -1;
            for (let i = 0; i < this.$ddlPhoto.options.length; i++) {
                if (this.$ddlPhoto.options[i].value === 'Website Screenshot') {
                    removeIndex = i;
                    break;
                }
            }
            if (removeIndex >= 0) {
                this.$ddlPhoto.options.remove(removeIndex);
            }

            // update selection
            if (this.$ddlPhoto.value !== value) {
                this.$ddlPhoto.value = value;
            }
        }
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
     * Takes a screenshot of the webpage in the current tab and displays
     * it as a photo you can select colors from, with an option to save
     * it to the virtual filesystem.
     */
    takeScreenshot() {
        if (chrome && chrome.tabs) {
            try {
                chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
                    if (!dataUrl) {
                        alert('Could not grab screenshot of web page.');
                        return;
                    }
                    this.selectPhoto(dataUrl);
                });
            }
            catch (e) {
                console.error(e);
                alert('Chrome is required to take a screenshot.');
            }
        }
        else {
            alert('Chrome is required to take a screenshot.');
        }
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

        // the options box
        this.$divChoosePanel = document.querySelector('#tab-photos-view .panel-choose-palette');

        // the gradient chooser
        this.$ddlPhoto = document.querySelector('#tab-photos-view #photos-palette');
        this.$ddlPhoto.addEventListener('change', (event) => {
            this.selectPhoto(event.target.value);
        });

        // load options from filesystem
        this.#buildPhotoDropdown();

        // the save screenshot button
        this.$btnSaveScreenshot = document.querySelector('#photos-save-screenshot');
        this.$btnSaveScreenshot.addEventListener('click', () => {
            let name = prompt('Enter a name for the screenshot', 'screenshot.png');
            if (name) {
                // save the screenshot to the filesystem's Photos folder using this name
                let fileSystem = new FileSystem();
                let folder = fileSystem.getFolder('Photos');

                // the file data should be stored in this.photo if we're looking at a screenshot
                let newFile = folder.addFileAsBase64(name, this.photo);

                // reload the file system
                this.#buildPhotoDropdown();

                // select the new photo
                for (let i = 0; i < this.$ddlPhoto.options.length; i++) {
                    if (this.$ddlPhoto.options[i].value === 'file:' + newFile.id) {
                        this.$ddlPhoto.selectedIndex = i;
                        break;
                    }
                }
            }
            else {
                alert('No name selected so the screenshot was not saved.');
            }
        });

        // the manage photos button
        this.$btnManagePhotos = document.querySelector('#photos-manage');
        this.$btnManagePhotos.addEventListener('click', () => {
            SettingsTab.launchFileManager('Photos');
        });
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
                    keyDown = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
                    if (keyInterval != null) {
                        clearInterval(keyInterval);
                        keyInterval = null;
                    }
                    this.#userScale = 1.0;
                    this.#imageScroll = {x: 0, y: 0};
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
                        let lastTime = new Date().getTime()
                        keyInterval = setInterval(() => {

                            // get time delta
                            let now = new Date().getTime();
                            let diff = now - lastTime;

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
                                let oldW = this.#imageScale.width * this.#userScale;
                                let oldH = this.#imageScale.height * this.#userScale;
                                this.#userScale *= 1.01;// * pixelsPerSecond;
                                let newW = this.#imageScale.width * this.#userScale;
                                let newH = this.#imageScale.height * this.#userScale;
                                this.#imageScroll.x -= (newW - oldW) / 2;
                                this.#imageScroll.y -= (newH - oldH) / 2;
                            }
                            if (keyDown['PageDown']) {
                                let oldW = this.#imageScale.width * this.#userScale;
                                let oldH = this.#imageScale.height * this.#userScale;
                                this.#userScale /= 1.01;// * pixelsPerSecond;
                                let newW = this.#imageScale.width * this.#userScale;
                                let newH = this.#imageScale.height * this.#userScale;
                                this.#imageScroll.x -= (newW - oldW) / 2;
                                this.#imageScroll.y -= (newH - oldH) / 2;
                            }
                            if (this.#userScale < 0.5) {
                                this.#userScale = 0.5;
                            }
                            if (this.#userScale > 5) {
                                this.#userScale = 5;
                            }

                            // limit scrolling to having the image half-way off the screen
                            let w = this.#imageScale.width / this.#userScale;
                            let h = this.#imageScale.height / this.#userScale;
                            let w0 = this.canvas.width;
                            let h0 = this.canvas.height;
                            let minX = 0 - (w / 2);
                            let minY = 0 - (h / 2);
                            let maxX = w0 - (w / 2);
                            let maxY = h0 - (h / 2);

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
        this.#imageScroll = {x: 0, y: 0};
        if (imgUrl.startsWith('file:')) {
            // image from localStorage
            let fileId = parseInt(imgUrl.substring(5));
            FileSystem.loadFileById(fileId, (file) => {
                if (file == null) {
                    console.error('could not load file ' + fileId);
                    return;
                }
                const img = new Image();
                img.src = file.contents;
                img.onload = () => {
                    let rect = GuiUtil.fillCentered(this.canvas, img);
                    this.#imageScroll = {x: rect.x, y: rect.y};
                    this.#imageScale = {width: rect.width, height: rect.height};
                    this.#image = img;
                };
            });
        /* } else if (imgUrl.startsWith('data:')) { // same code in "else" works fine
            // image from data URL
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                let rect = GuiUtil.fillCentered(this.canvas, img);
                this.#imageScroll = {x: rect.x, y: rect.y};
                this.#imageScale = {width: rect.width, height: rect.height};
                this.#image = img;
            }; */
        } else {
            // image from extension's folder
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                let rect = GuiUtil.fillCentered(this.canvas, img);
                this.#imageScroll = {x: rect.x, y: rect.y};
                this.#imageScale = {width: rect.width, height: rect.height};
                this.#image = img;
            };
        }
    }

    /**
     * Draws the current selection on the overlay canvas.
     */
    #drawSelection() {
        this.overlayCtx.clearRect(0, 0, 400, 275);
        GuiUtil.drawSelectionCircle(this.overlayCtx, this.currentX, this.currentY);
    }

    /**
     * Builds the options for the gradient dropdown, which places each
     * subfolder of the 'Custom Palettes' folder in an optgroup, and
     * any files directly in the 'Custom Palettes' folder as 'Uncategorized'.
     * The first optgroup is the hardcoded shaders and is left alone.
     */
    #buildPhotoDropdown() {

        let fileSystem = new FileSystem();
        let folder = fileSystem.getFolder('Photos');

        // add each subfolder as an optgroup
        for (let i = 0; i < folder.folders.length; i++) {
            let subfolder = folder.folders[i];
            let optGroup = SelectHelper.createOptGroupForFolder(subfolder);
            this.$ddlPhoto.appendChild(optGroup);
        }

        // added files outside any subfolder as 'uncategorized' optgroup
        if (folder.files.length > 0) {
            let optGroup = SelectHelper.createOptGroupForFolder(folder, 'Uncategorized');
            this.$ddlPhoto.appendChild(optGroup);
        }
    }
}
