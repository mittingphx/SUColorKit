import {FileSystemFile} from "./FileSystemFile.js";
import {FileSystem} from "./FileSystem.js";

/**
 * Record of one folder available within the virtual file system.
 */
export class FileSystemFolder {
    /**
     * The name for this folder.
     * @type {string}
     */
    name = "";

    /**
     * The files within this folder.
     * @type {FileSystemFile[]}
     */
    files = [];

    /**
     * The sub-folders within this folder.
     * @type {FileSystemFolder[]}
     */
    folders = [];

    /**
     * The folder that contains this folder.
     * @type {FileSystemFolder|null}
     */
    parent = null;

    /**
     * Constructor
     * @param name {string} - The name for this folder
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * Gets the full path to this folder in the file system.
     * @returns {string}
     */
    getFullPath() {
        let ret = this.name;
        let parent = this.parent;
        while (parent !== null) {
            ret = parent.name + "/" + ret;
            parent = parent.parent;
        }
        return ret;
    }

    /**
     * Returns a file by name.
     * @param name {string} name to search for.
     * @returns {FileSystemFile|null}
     */
    getFile(name) {
        let index = this.getFileIndex(name);
        if (index >= 0) {
            return this.files[index];
        }
        return null;
    }

    /**
     * Returns the index of a file by name into the files array.
     * @param name {string} name of the file to find
     * @returns {number} -1 if not found
     */
    getFileIndex(name) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].name === name) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Searches for a file in this folder by id.
     * @param id {number}
     * @returns {FileSystemFile|null}
     */
    getFileById(id) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].id === id) {
                return this.files[i];
            }
        }
        return null;
    }

    /**
     * Returns the number of files in this folder.
     * @param recursive {boolean} if true then all subfolder's files will be counted
     * @returns {number}
     **/
    getFileCount(recursive = false) {
      let count = this.files.length;
      if (recursive) {
        for (let i = 0; i < this.folders.length; i++) {
          count += this.folders[i].getFileCount(true);
        }
      }
      return count;
    }

    /**
     * Returns true iff this file is found within this fonder.
     * @param file {FileSystemFile|string} the file or name to search for
     * @returns {boolean}
     */
    containsFile(file) {

        // treat string as name
        if (typeof file === "string") {
            return this.getFile(file) !== null;
        }

        // use id if available
        if (file.id !== null && file.id > 0) {
            return this.getFileById(file.id) !== null;
        }

        // otherwise use name
        return this.getFile(file.name) !== null;
    }

    /**
     * Removes references to a file within this folder.  Does not delete the file.
     * @param file {FileSystemFile} the file to remove from this folder
     */
    removeFile(file) {
        let index = this.files.indexOf(file);
        if (index >= 0) {
            this.files.splice(index, 1);
        }
    }

    /**
     * Adds a FileSystemFile object to this folder.
     * @param file {FileSystemFile}
     */
    addFileObject(file) {
        this.files.push(file);
        FileSystem.getInstance().addFile(this.name, file);
    }

    /**
     * Adds a file to the localStorage file system from text data.
     * @param name {string} name to store the file as
     * @param contents {string} the text contents of the file.
     */
    addFileAsText(name, contents) {
        let file = new FileSystemFile(name);
        file.contents = contents;
        this.addFileObject(file);
    }

    /**
     * Adds a file to the localStorage file system from base64 data.
     * @param name {string} name to store the file as
     * @param base64 {string} the base64 contents of the file.
     */
    addFileAsBase64(name, base64) {
        let file = new FileSystemFile(name);
        file.contents = base64;
        this.addFileObject(file);
    }

}
