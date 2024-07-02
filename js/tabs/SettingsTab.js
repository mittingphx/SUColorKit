
/**
 * Manages the settings tab.
 */
export class SettingsTab {

    /**
     * Button for managing named colors
     * @type {HTMLButtonElement|null}
     */
    $btnManageNamedColors = null;

    /**
     * Button for managing palette images
     * @type {HTMLButtonElement|null}
     */
    $btnManagePaletteImages = null;

    /**
     * Button for managing overlays
     * @type {HTMLButtonElement|null}
     */
    $btnManageOverlays = null;

    /**
     * Number of current named colors
     * @type {HTMLSpanElement|null}
     */
    $spanCountNamedColors = null;

    /**
     * Number of current palette images
     * @type {HTMLSpanElement|null}
     */
    $spanCountManagePaletteImages = null;

    /**
     * Number of current overlay images
     * @type {HTMLSpanElement|null}
     */
    $spanCountManageOverlays = null;


    /**
     * Constructor
     * @param app {GSMColorPicker} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.#initDom();
        //this.refresh();
    }

    /**
     * Updates the counts in the settings tab.
     */
    refresh() {
        this.$spanCountNamedColors.innerText = this.app.files.getFileCount('Named Colors', true);
        this.$spanCountManagePaletteImages.innerText = this.app.files.getFileCount('Custom Palettes', true);
        this.$spanCountManageOverlays.innerText = this.app.files.getFileCount('Overlay Images', true);
    }

    /**
     * Initializes DOM elements used by this object.
     */
    #initDom() {
        
        // get elements for file counts
        this.$spanCountManageOverlays = document.querySelector('.settings-overlay-images .settings-count span');
        this.$spanCountManagePaletteImages = document.querySelector('.settings-custom-palettes .settings-count span');
        this.$spanCountNamedColors = document.querySelector('.settings-named-colors .settings-count span');

        // set event listeners for buttons
        this.$btnManageNamedColors = document.querySelector('#manageNamedColors');
        this.$btnManageNamedColors.addEventListener('click', () => {
            this.#launchFileManager('Named Colors');
        });

        this.$btnManagePaletteImages = document.querySelector('#managePaletteImages');
        this.$btnManagePaletteImages.addEventListener('click', () => {
            this.#launchFileManager('Custom Palettes');
        });

        this.$btnManageOverlays = document.querySelector('#manageOverlays');
        this.$btnManageOverlays.addEventListener('click', () => {
            this.#launchFileManager('Overlay Images');
        });

    }

    /**
     * Launches the window that mimics a file manager that can be used
     * to alter the files that define the available color settings.
     */
    #launchFileManager(folder) {

        // insert selection into url
        let url = './files.html';
        if (folder) {
            url += '?folder=' + folder;
        }

        // center new window over current window
        let w = 800;
        let h = 400;
        const y = window.top.screenY + 75
        const x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
        return window.open(url, 'fileManager', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`);


/*
        window.open(url, 'fileManager',
            'toolbar=no,location=no,status=no,menubar=no,' +
            'scrollbars=yes,resizable=yes,width=800,height=400');*/
    }

}

