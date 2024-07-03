import {PixelColor} from "./util/PixelColor.js";
import {FileSystem} from "./fs/FileSystem.js";

import {PanelTabs} from "./tabs/PanelTabs.js";
import {ColorList} from "./tabs/ColorList.js";
import {PhotoPicker} from "./tabs/PhotoPicker.js";
import {SettingsTab} from "./tabs/SettingsTab.js";
import {ColorSelector} from "./tabs/colorSelector.js";
import {GradientPicker} from "./tabs/GradientPicker.js";
import {ColorListener} from "./util/ColorListener.js";

/**
 * Main application class.
 */
export class GSMColorPicker {

    /**
     * The color object that holds the current color
     * @type {PixelColor|null}
     */
    color = null;

    /**
     * The button that closes the color selector
     * @type {HTMLElement|null}
     */
    closeButton = null;

    /**
     * The tabs that are currently displayed.
     * @type {PanelTabs}
     */
    tabs = null;

    /**
     * The color selector.
     * @type {ColorSelector}
     */
    colorSelector = null;

    /**
     * The color list.
     * @type {ColorList}
     */
    colorList = null;

    /**
     * The gradient picker.
     * @type {GradientPicker}
     */
    gradientPicker = null;

    /**
     * The photo pixel selector.
     * @type {PhotoPicker}
     */
    photoPicker = null;

    /**
     * True when the overload image should be displayed
     * @type {boolean}
     */
    showOverlay = false;

    /**
     * Objects listening for color changes.
     * @type {ColorListener[]}
     */
    colorListeners = [];

    /**
     * Handler for the settings tab.
     * @type {null|SettingsTab}
     */
    settingsTab = null;

    /**
     * Access to the virtual file system used by the application.
     * @type {FileSystem}
     */
    files = null;

    /**
     * Constructor sets up interactive elements of the application.
     */
    constructor() {

        // create filesystem
        this.files = new FileSystem();

        // the master color selection
        this.color = new PixelColor(0, 0, 0);
        this.showOverlay = false;

        // create instances of all interactive code
        this.colorSelector = new ColorSelector(this);
        this.colorSelector.refresh();
        this.colorList = new ColorList(this);
        this.gradientPicker = new GradientPicker(this);
        this.photoPicker = new PhotoPicker(this);
        this.settingsTab = new SettingsTab(this);
        this.tabs = new PanelTabs(this);

        // load color from local storage
        if (this.#loadLocalStorage()) {
            this.refresh();
        }
        
        // initialize event listeners
        this.#initDomEvents();

    }


    /**
     * Sets the app's selected color and updates all panels.
     * @param color
     */
    setColor(color) {
        this.color = color;
        this.#saveLocalStorage();
        this.refresh();
    }

    /**
     * Sets the overlay checkbox state.
     *
     * @param {boolean} checked The new checkbox state
     */
    setOverlay(checked) {
        this.showOverlay = checked;
        this.refresh();
    }

    /**
     * Closes the color selector.
     */
    close() {
        window.close();
    }

    /**
     * Updates the GUI to match the current selection.
     */
    refresh() {
        for (let listener of this.colorListeners) {
            listener.color = this.color;
            listener.showOverlay = this.showOverlay;
            listener.trigger();
        }
    }

    /**
     * Adds a listener for color changes.
     * @param callback {function} - The function to be called when the color changes
     */
    addColorListener(callback) {
        this.colorListeners.push(new ColorListener(callback));
    }

    /**
     * Initializes DOM elements used by this object.
     */
    #initDomEvents() {
        // action buttons in header
        this.closeButton = document.querySelector(".action-close");
        this.closeButton.addEventListener("click", () => {
            this.close();
        });

        // TODO: implement hamburger menu
    }


    /**
     * Loads the color object's values from localStorage if they exist.
     *
     * This function checks if there is a saved color value in localStorage with the key 'GSMColorPicker'.
     * If a saved value exists, it is loaded into the color object using the `fromHex()` method.
     *
     * @return {boolean} Returns true if a value was loaded
     */
    #loadLocalStorage() {
        let savedData = localStorage.getItem('GSMColorPicker');
        if (savedData) {
            let data = JSON.parse(savedData);

            let color = new PixelColor(0, 0, 0);
            color.fromHex(data.color);
            this.setColor(color);

            this.setOverlay(data.showOverlay);
            return true;
        }
        return false;
    }

    /**
     * Saves the color object's values to localStorage.
     *
     * This function saves the color object's values to localStorage with the key 'GSMColorPicker'.
     * The color value is stored as a hexadecimal string representation.
     *
     * @return {string} Returns the serialized data
     */
    #saveLocalStorage() {
        let savedData = JSON.stringify({
            color: this.color.hex,
            showOverlay: this.showOverlay
        });
        localStorage.setItem('GSMColorPicker', savedData);
        return savedData;
    }
}

export let app = new GSMColorPicker();
