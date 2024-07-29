// noinspection JSUnusedGlobalSymbols

import {FileSystem} from "./FileSystem.js";

/**
 * Record of one file available within the virtual file system.
 */
export class FileSystemFile {
    /**
     * The id for this file which is > 0 if it's stored in localStorage (user supplied)
     * @type {number}
     */
    id = 0;

    /**
     * The name for this file.
     * @type {string}
     */
    name = "";

    /**
     * The folder this file is stored in
     * @type {string|FileSystemFolder|null}
     */
    folder = null;

    /**
     * The location of this file within the extension's package iff
     * this file is part of the default package.  This is null for all
     * user supplied files.
     * @type {string|null}
     */
    localUrl = null;

    /**
     * The contents of this file.  This is treated as base64 if
     * the file type is not .json
     * @type {string}
     */
    contents = "";

    /**
     * True iff the file is already loaded.
     * @type {boolean}
     */
    loaded = false;

    /**
     * Constructor
     * @param name {string} - The name for this file
     * @param localUrl {string|null} - The location for this file (optional)
     */
    constructor(name, localUrl = null) {
        this.name = name;
        this.localUrl = localUrl;
    }

    /**
     * Returns true iff this file is a user supplied file.
     * @returns {boolean}
     */
    isUserFile() {
        return this.id !== null && this.id > 0;
    }

    /**
     * Returns the mime type for this image files.
     * @returns {string}
     */
    getMimeType() {
        let filename;
        if (this.isUserFile()) {
            filename = this.name;
        }
        else {
            filename = this.localUrl;
        }
        let ext = filename.split('.').pop();
        switch (ext) {
            case 'json':
                return 'application/json';
            case 'jpg':
                return 'image/jpeg';
            default:
                return 'image/' + ext;
        }
    }

    /**
     * Gets the original data set loaded into a user file.
     * @returns {*}
     */
    getFileData() {

        // make sure this is a user file
        if (this.id === null || this.id < 1) {
            console.error('getFileData() called on non-user file');
            return null;
        }

        // parse the contents by extension
        let ext = this.name.split('.').pop();
        if (ext === 'json') {
            return JSON.parse(this.contents);
        }
        else {
            return atob(this.contents);
        }
    }

    /**
     * The immediate folder is treated as the category for this file.
     * @returns {string}
     */
    getCategory() {
        let category = FileSystem.getInstance().getFolderForFile(this);
        if (category === null || category.parent === null) {
            category = 'Uncategorized';
        }
        else {
            category = category.name;
        }
        return category;
    }

}

