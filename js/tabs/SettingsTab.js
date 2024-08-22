import {FileSystem} from "../fs/FileSystem.js";
import {SelectHelper} from "../util/SelectHelper.js";

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
     * A <ul> list of folders in this tab.
     * @type {HTMLUListElement|null}
     */
    $ulFolders = null;

    /**
     * The <select> of available image overlays.
     * @type {HTMLSelectElement|null}
     */
    $ddlOverlay = null;

    /**
     * The <img> showing the current overlay.
     * @type {HTMLImageElement|null}
     */
    $imgOverlayPreview = null;

    /**
     * Constructor
     * @param app {SUColorKit} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.#initDom();
       // this.refresh();
    }

    /**
     * Updates the counts in the settings tab.
     */
    refresh() {

        // set file counts
        this.$ulFolders.querySelectorAll('li').forEach($li => {
            let $span = $li.querySelector('span');
            let folder = $li.dataset.folder;
            this.#setSpanToFileCount($span, folder);
        })

        // update overlay list
        this.#buildOverlayList();

        // update preview
        this.app.showOverlayImage(this.$imgOverlayPreview);
    }

    /**
     * Fills the overlay image dropdown with all available options.
     */
    #buildOverlayList() {

        this.$ddlOverlay.innerHTML = '<option value="none">Choose Overlay</option>';

        let fileSystem = new FileSystem();
        let folder = fileSystem.getFolder('Overlay Images');

        // add each subfolder as an optgroup
        for (let i = 0; i < folder.folders.length; i++) {
            let subfolder = folder.folders[i];
            let optGroup = SelectHelper.createOptGroupForFolder(subfolder);
            this.$ddlOverlay.appendChild(optGroup);
        }

        // added files outside any subfolder as 'uncategorized' optgroup
        if (folder.files.length > 0)  {
            let optGroup = SelectHelper.createOptGroupForFolder(folder, 'Uncategorized');
            this.$ddlOverlay.appendChild(optGroup);
        }

        // select the current overlay
        let selection = this.app.getOverlayImage();
        console.log('selection', selection);
        if (selection) {
            this.$ddlOverlay.value = selection;
        }
    }

    /**
     * Fills a <span> with the count of files in the specified folder.
     * @param $span {HTMLSpanElement}
     * @param folderName {string}
     */
    #setSpanToFileCount($span, folderName) {
        if (!$span) return;
        let count = this.app.files.getFileCount(folderName, true) || 0;
        $span.innerText = '' + count;
    }

    /**
     * Initializes DOM elements used by this object.
     */
    #initDom() {

        // get elements for file counts
        this.$ulFolders = document.querySelector('ul.settings-folders');

        // the preview image
        this.$imgOverlayPreview = document.querySelector('.settings-overlay-panel img');

        // dropdown for overlay selection
        this.$ddlOverlay = document.querySelector('select#overlayImage');
        this.$ddlOverlay.addEventListener('change', () => {
            let selection = this.$ddlOverlay.value;
            this.app.setOverlayImage(selection);
            this.app.showOverlayImage(this.$imgOverlayPreview);
        })

        // set event listeners for buttons
        this.$btnManageNamedColors = document.querySelector('#manageNamedColors');
        this.$btnManageNamedColors.addEventListener('click', () => {
            SettingsTab.launchFileManager('Named Colors');
        });
    }

    /**
     * Launches the window that mimics a file manager that can be used
     * to alter the files that define the available color settings.
     * @param folder {string|null} optional folder name
     */
    static launchFileManager(folder = null) {

        // insert selection into url
        let url = './files.html';
        if (folder) {
            url += '?folder=' + folder;
        }

        // center new window over current window
        let w = 800;
        let h = 400;
        let screen = { x: 0, y: 0, width: 1024, height: 768 };
        try {
            screen.x = window.top.screenX;
            screen.y = window.top.screenY;
            screen.width = window.top.outerWidth;
            screen.height = window.top.outerHeight;
        }
        catch (e) {
            // happens when used as an application in puter.com
            console.log('app mode detected', e);
        }
        const y = screen.y + 75
        const x = screen.width / 2 + screen.x - ( w / 2);
        return window.open(url, 'fileManager', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`);
    }

}

