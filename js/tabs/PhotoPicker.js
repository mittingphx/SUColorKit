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
        this.ctx.clearRect(0, 0, 200, 250);

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
        this.overlayCanvas.width = 400;
        this.overlayCanvas.height = 275;
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
    }

    /**
     * Loads an image into the canvas.
     * @param imgUrl {string} - The url of the image to load
     */
    #loadImage(imgUrl) {
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
                    this.ctx.drawImage(img, 0, 0, 400, 275);
                };
            });
        }
        else {
            // image from extension's folder
            const img = new Image();
            img.src = imgUrl;
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, 400, 275);
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
            option.value = file.localUrl;
            option.innerHTML = file.name;
            optGroup.appendChild(option);
        }
        return optGroup;
    }
}
