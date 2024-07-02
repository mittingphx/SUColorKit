//
// File:    FileViewer.js
// Project: Scott's Color Converter
// Author:  Scott Mitting
// Date:    June 2024
// Abstract:
//  Controller for the file viewer window.
//

import {FileSystemView} from "./fs/FileSystemView.js";

/**
 * Application class for the file viewer window.
 */
class FileViewerApp {

    /**
     * Constructor
     */
    constructor() {
        this.fileViewer = new FileSystemView();
        this.parseUrlParams();
    }

    /**
     * Handles URL parameters
     */
    parseUrlParams() {
        let urlParams = new URLSearchParams(window.location.search);
        let folder = urlParams.get('folder');
        if (folder) {
            this.fileViewer.selectFolder(folder);
        }
        let file = urlParams.get('file');
        if (file) {
            this.fileViewer.selectFile(file);
        }
    }
}

new FileViewerApp();
