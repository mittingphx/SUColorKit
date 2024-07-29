import {PixelColor} from "./util/PixelColor.js";
import {FileSystem} from "./fs/FileSystem.js";

import {PanelTabs} from "./tabs/PanelTabs.js";
import {ColorList} from "./tabs/ColorList.js";
import {PhotoPicker} from "./tabs/PhotoPicker.js";
import {SettingsTab} from "./tabs/SettingsTab.js";
import {ColorSelector} from "./tabs/colorSelector.js";
import {GradientPicker} from "./tabs/GradientPicker.js";
import {ColorListener} from "./util/ColorListener.js";
import {MouseDrag} from "./util/MouseDrag.js";
import {HelpTab} from "./tabs/HelpTab.js";

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
     * The <div> containing the title and action buttons.
     * @type {HTMLElement|null}
     */
    $header = null;

    /**
     * The button that closes the color selector
     * @type {HTMLElement|null}
     */
    closeButton = null;

    /**
     * The button that opens the action menu.
     * @type {HTMLElement|null}
     */
    menuButton = null;

    /**
     * The <select> functioning as the action menu
     * @type {HTMLSelectElement|null}
     */
    menuDropdown = null;

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
     * @type {SettingsTab}
     */
    settingsTab = null;

    /**
     * Handler for the help tab.
     * @type {HelpTab}
     */
    helpTab = null;

    /**
     * Access to the virtual file system used by the application.
     * @type {FileSystem}
     */
    files = null;

    /**
     * The current setting for the overlay image.
     * @type {string|null}
     */
    selectedOverlay = null;

    /**
     * Constructor sets up interactive elements of the application.
     */
    constructor() {

        // create filesystem
        this.files = new FileSystem();

        // the master color selection
        this.color = new PixelColor(0, 0, 0);
        this.showOverlay = false;

        // load color from local storage
        let loadedLocalStorage = this.#loadLocalStorage();

        // create instances of all interactive code
        this.colorSelector = new ColorSelector(this);
        this.colorSelector.refresh();
        this.colorList = new ColorList(this);
        this.gradientPicker = new GradientPicker(this);
        this.photoPicker = new PhotoPicker(this);
        this.settingsTab = new SettingsTab(this);
        this.helpTab = new HelpTab(this);
        this.tabs = new PanelTabs(this);

        // refresh if we loaded from local storage earlier
        // note: had to separate this because the object constructors
        // were having initially incorrect selections because the data
        // they loaded from the app class wasn't loaded yet
        if (loadedLocalStorage) {
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
     * Changes the image displayed in the color selector over the
     * selected color.
     * @param selection {string|null}
     */
    setOverlayImage(selection) {

        // if no selection, use default
        if (!selection) {
            selection = 'images/color-picker-logo-small.png';
        }

        // update image and save to local storage
        this.selectedOverlay = selection;
        this.#saveLocalStorage();
        this.updateOverlayImage();
    }

    /**
     * Returns the image selected as the overlay over the selected color.
     * @return {string}
     */
    getOverlayImage() {
        return this.selectedOverlay;
    }

    /**
     * Loads the overlay image into a <img> tag.
     * @param $img {HTMLImageElement}
     * @param w {number} optional width to set
     * @param h {number} optional height to set
     */
    showOverlayImage($img, w = 50, h = 50) {

        // if no selection, use default
        if (!this.selectedOverlay) {
            this.selectedOverlay = 'images/color-picker-logo.png';
        }

        // hide image if no overlay selected
        if (this.selectedOverlay === 'none') {
            $img.src = '';
            $img.style.display = 'none';
            return;
        }

        // show image if selected
        $img.style.display = 'block';

        // show embedded image if selected
        if (!this.selectedOverlay.startsWith('file:')) {
            $img.src = this.selectedOverlay;
            $img.width = w;
            $img.height = h;
            return;
        }

        // otherwise, load the image the user uploaded from local storage
        let fileId = parseInt(this.selectedOverlay.substring(5));
        FileSystem.loadFileById(fileId, (file) => {
            if (file == null) {
                console.error('could not load file ' + fileId);
                return;
            }
            $img.src = file.contents;
            $img.width = w;
            $img.height = h;
        });
    }

    /**
     * Updates the CSS class that displays the overlay image.
     */
    updateOverlayImage() {

        // this is experimental code that rewrites CSS on the fly (seems to work)
        let $style = document.createElement('style');
        let overlay = this.selectedOverlay;

        if (overlay.startsWith('file:')) {
            let fileId = parseInt(overlay.substring(5));
            overlay = FileSystem.loadFileById(fileId).contents;
        }

        $style.innerHTML = `
            .panel-color-overlay {
                background-image: url('${overlay}');
                background-size: contain;
            }
        `;
        document.body.appendChild($style);
    }

    /**
     * Closes the color selector.
     */
    close() {
        // HeyPuter exit
        this.getPuter((puter) => {
            puter.exit();
        });

        // normal exit
        window.close();
    }

    /**
     * If running the Puter.com o/s, the callback will be sent the puter object.
     * @param callback {function(*)}
     */
    getPuter(callback) {
        if (this.getApplicationType() === 'puter-app') {
            let puter = window['puter'];
            if (typeof puter === 'undefined') {
                console.warn('Puter.com is not running');
            }
            else {
                callback(puter);
            }
        }
    }


    /**
     * Returns the application type.
     * @return {string}
     */
    getApplicationType() {
        let url = new URL(window.location.href);
        if (url.searchParams.get('mode') === 'HeyPuter') {
            return 'puter-app';
        }
        return 'chrome-extension';
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

        // get header, allow dragging to make become separate window
        this.$header = document.querySelector(".panel-header");
        new MouseDrag(this.$header, (drag, _) => {
            if (drag.distance() > 5) {
                this.#moveToBrowserWindow();
            }
        });

        // action buttons in header
        this.closeButton = document.querySelector(".action-close");
        this.closeButton.addEventListener("click", () => {
            this.close();
        });

        this.menuButton = document.querySelector(".action-menu");
        this.menuDropdown = document.querySelector('.action-dropdown');
        this.#clearActionDropdownSelection();
        this.menuDropdown.addEventListener('change', (event) => {
            let value = event.target.value;
            this.#clearActionDropdownSelection();
            switch (value) {
                case 'about':
                    this.tabs.show('about');
                    break;
                case 'upload':
                    this.tabs.show('settings');
                    this.settingsTab.launchFileManager();
                    break;
                case 'backup':
                    alert('TODO: implement backup/export');
                    break;
                case 'restore':
                    alert('TODO: implement restore/import');
                    break; 
                case 'settings':
                    this.tabs.show('settings');
                    break;
                case 'help':
                    this.tabs.show('about');
                    break;
                case 'exit':
                    this.close();
                    break;
            }
        });

        // if in a new window, hide the header but place the action button next to the tabs
        if (window.isNewWindow) {
            // hide header
            this.$header.style.display = 'none';

            // move action button
            this.menuButton.remove();
            document.querySelector('.panel-tabs').append(this.menuButton)

            // move dropdown menu directly over action button
            this.menuDropdown.style.right = '11px';
            this.menuDropdown.style.top = '13px';

            // clean up border radius
            let $panel = document.querySelector('.panel');
            $panel.style.borderTopLeftRadius = '0px';
            $panel.style.borderTopRightRadius = '0px';
        }

    }

    /**
     * Clears the <select> selected value, so it behaves like a menu.
     */
    #clearActionDropdownSelection() {
        this.menuDropdown.selectedIndex = -1;
        for (let option of this.menuDropdown.options) {
            option.selected = false;
        }
    }

    /**
     * Opens a new browser window and moves the current app within it.
     */
    #moveToBrowserWindow() {

        // only run when attached to browser instead of in a new window
        if (window.isNewWindow) {
            return;
        }

        // only allow one window to be created
        if (window.createdWindow === true) {
            return;
        }
        window.createdWindow = true;

        // create the window over where the mouse is now
        let win = window.open('#', '_blank',
            'width=425,height=375,' +
            'top=' + (window.top.screenY - 25) +
            ',left=' + (window.top.screenX) +
            ',resizable,scrollbars');
        win.document.head.append(document.head.childNodes)
        win.document.body.append(document.body.childNodes);
        win.isNewWindow = true;

        // close this window
        window.close();
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

            this.selectedOverlay = data.selectedOverlay;
            this.updateOverlayImage();

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
            showOverlay: this.showOverlay,
            selectedOverlay: this.selectedOverlay
        });
        localStorage.setItem('GSMColorPicker', savedData);
        return savedData;
    }
}

export let app = new GSMColorPicker();
