import {FileSystemFolder} from "./FileSystemFolder.js";
import {FileSystemFile} from "./FileSystemFile.js";

/**
 * @typedef {Object} IHasFolders
 * @property {FileSystemFolder[]} folders
 */

/**
 * Overall representation of the virtual file system.  This is a simplified
 * system where there is only one-level of folders and folders cannot contain
 * other folders.  There is also no root folder.  Files belong only to one of
 * the folders.
 */
export class FileSystem {

    /**
     * Singleton instance of the file system.
     * @type {FileSystem|null}
     */
    static #instance = null;

    /**
     * The folders in the file system.
     * @type {FileSystemFolder[]}
     */
    folders = []

    /**
     * Data stored in local storage for maintaining the filesystem.
     * @type {{nextFileId: number}}
     */
    #metadata = {
        nextFileId: 1
    };

    /**
     * Constructor
     */
    constructor() {
        FileSystem.#instance = this;
        this.reload();
    }

    /**
     * Returns the singleton instance of the file system.
     * @returns {FileSystem}
     */
    static getInstance() {
        if (FileSystem.#instance === null) {
            FileSystem.#instance = new FileSystem();
        }
        return FileSystem.#instance;
    }

    /**
     * Reloads the file system from local storage
     */
    reload() {
        this.folders = [];
        this.#loadMetaData();
        this.#insertBuiltInFiles();
        this.#loadUserFiles();
    }

    /**
     * Gets a file record by name from the file system.
     * @param name {string} name of the file
     * @param folder {string|FileSystemFolder} folder by object or name
     * @returns {FileSystemFile|null}
     */
    getFile(name, folder) {

        // root folder does not allow files
        if (folder === null) {
            console.error('getFolder: folder is null');
            return null;
        }

        // get folder and name
        let folderName;
        if (typeof folder === 'string') {
            folderName = folder;
            folder = this.getFolder(folderName);
            if (folder === null) {
                console.error('getFolder: could not find folder ' + folderName);
                return null;
            }
        }
        else {
            folderName = folder.name;
        }

        // grab file from the folder
        let f = folder.getFile(name);
        if (f === null) {
            console.error('getFolder: could not find file + ' + name + ' in folder ' + folderName);
            return null;
        }
        return f;
    }

    /**
     * Returns a folder by name.
     * @param name {string|FileSystemFolder} name to search for.
     * @param parent {IHasFolders|null} optional parent folder, default is root folder
     * @param createIfMissing {boolean} whether to create the folder if it is not found
     * @returns {FileSystemFolder|null}
     */
    getFolder(name, parent = null, createIfMissing = false) {

        // require the first argument
        if (!name) {
            console.error('getFolder: name is null');
            return null;
        }

        // use folder's name if passed as first argument
        if (typeof name !== "string") {
            if (name instanceof FileSystemFolder) {
                return this.getFolder(name.name);
            }
            else {
                console.error('getFolder: name is not a string or FileSystemFolder');
                return null;
            }
        }

        // use root at parent if not specified
        if (parent === null) {
            parent = this;
        }

        // recursively search through each folder within the path to
        // return the folder if found
        let parts = name.split('/');
        for (let i = 0; i < parent.folders.length; i++) {
            if (parent.folders[i].name === parts[0]) {
                if (parts.length > 1) {
                    return this.getFolder(parts.slice(1).join('/'), parent.folders[i]);
                }
                return parent.folders[i];
            }
        }

        // recursively create the folder if requested
        if (createIfMissing) {
            let folder = new FileSystemFolder(parts[0]);
            parent.folders.push(folder);
            if (parts.length > 1) {
                return this.getFolder(parts.slice(1).join('/'), folder);
            }
            return folder;
        }

        return null;
    }

    /**
     * Returns the number of files in the given folder.
     * @param folderName {string} name of the file to search for.
     * @param recursive {boolean} whether to search recursively
     */
    getFileCount(folderName, recursive) {
        let f = this.getFolder(folderName);
        return f ? f.getFileCount(recursive) : 0;
    }

    /**
     * Loads a file from localStorage by id directly
     * @param fileId {number} - The id of the file
     * @param callback {function} - The function to call when the file is loaded
     */
    static loadFileById(fileId, callback) {
        let item = localStorage.getItem('file_' + fileId);
        if (item === null) {
            callback(null);
            return;
        }
        let fileData = JSON.parse(item);
        let file = new FileSystemFile(fileData.name);
        file.id = fileId;
        file.contents = fileData.data;
        callback(file);
    }

    /**
     * Adds a user-supplied files to the file system within localStorage
     * @param folder {FileSystemFolder|string} - The folder to add the file to (or the name of the folder)
     * @param file {FileSystemFile} - The file to add
     */
    addFile(folder, file) {

        // Get the folder if the name is passed in
        if (typeof folder === 'string') {
            folder = this.getFolder(folder);
        }

        // check we have a valid folder argument
        if (folder === null) {
            console.error('addFile: folder is null');
            return;
        }

        // assign unique id and add to parent folder
        file.id = this.#metadata.nextFileId++;
        file.folder = folder.getFullPath();
        folder.files.push(file);

        // write to the local storage
        this.saveFile(file);

        // TODO: this file.contents.target.result might be from an HTMLInputFileElement
        /*
        let folderPath = folder.getFullPath();
        let fileData = {
            name: file.name,
            folder: folderPath,
            data: file.contents.target.result
        };
        let serialized = JSON.stringify(fileData);

        // save to localStorage
        console.log({fileData:fileData, serialized:serialized});
        localStorage.setItem('file_' + id, serialized);
*/
        // rewrite the file system's metadata and reload
        this.#saveMetaData();
        this.reload();
    }

    /**
     * Overwrites the data for a file in localStorage
     * @param file {FileSystemFile}
     */
    saveFile(file) {

        let fileData = {
            name: file.name,
            folder: file.folder,
            contents: file.contents
        };
        let serialized = JSON.stringify(fileData);
        console.log('saving', {fileData:fileData, serialized:serialized});
        localStorage.setItem('file_' + file.id, serialized);
    }

    /**
     * Deletes a user supplied file.
     * @param file
     */
    deleteFile(file) {
        if (file.id === null || file.id < 1) {
            alert('This file cannot be deleted');
            return;
        }
        localStorage.removeItem('file_' + file.id);
        this.#saveMetaData();

        //alert('Deleted file #' + file.id + ' named ' + file.name);

        this.reload();
    }

    /**
     * Flattens the recursive list of folders into an array.
     * @returns {FileSystemFolder[]}
     */
    getRecursiveFolders() {
        let folderList = [];
        for (let i = 0; i < this.folders.length; i++) {
            folderList.push(this.folders[i]);
        }
        let startIndex = 0;
        let foundChildren = this.folders.length > 0;
        while (foundChildren) {
            foundChildren = false;
            let nextStartIndex = folderList.length;
            for (let i = startIndex; i < nextStartIndex; i++) {
                for (let j = 0; j < folderList[i].folders.length; j++) {
                    folderList.push(folderList[i].folders[j]);
                    foundChildren = true;
                }
            }
            startIndex = nextStartIndex;
        }
        return folderList;
    }

    /**
     * Finds the folder that contains the given file.
     * @param file {FileSystemFile}
     */
    getFolderForFile(file) {
        let folderList = this.getRecursiveFolders();
        for (let i = 0; i < folderList.length; i++) {
            if (folderList[i].containsFile(file)) {
                return folderList[i];
            }
        }
        return null;
    }

    /**
     * Recursively sets all parent references in sub-folders.
     * @param folderList {FileSystemFolder[]} - The list of folders to set
     * @param parent {FileSystemFolder} - The parent folder
     */
    static #setParentFolders(folderList, parent) {
        for (let i = 0; i < folderList.length; i++) {
            folderList[i].parent = parent;
            FileSystem.#setParentFolders(folderList[i].folders, folderList[i]);
        }
    }

    /**
     * Loads meta data from local storage.
     */
    #loadMetaData() {
        if (localStorage.getItem('fileSystem') !== null) {
            this.#metadata = JSON.parse(localStorage.getItem('fileSystem'));
        }
    }

    /**
     * Saves meta data to local storage.
     */
    #saveMetaData() {
        localStorage.setItem('fileSystem', JSON.stringify(this.#metadata));
    }

    /**
     * Loads all user-supplied files from localStorage
     */
    #loadUserFiles() {
        this.#loadMetaData();

        for (let i = 1; i < this.#metadata.nextFileId; i++) {
            let fileId = 'file_' + i;

            // check if file exists (won't if deleted)
            let item = localStorage.getItem(fileId);
            if (item === null) {
                continue;
            }

            // load into file object
            let fileData = JSON.parse(item);
            let file = new FileSystemFile(fileData.name);
            file.id = i;
            file.contents = fileData.data;

            // add to folder
            let folder = this.getFolder(fileData.folder);
            if (folder === null) {
                console.error('could not find folder for user file ' + fileData.name);
                // add to first folder (should never happen)
                folder = this.folders[0];
            }

            console.log('Loaded #' + file.id + ' named ' + file.name + ' from folder ' + fileData.folder);
            folder.files.push(file);

        }
    }

    /**
     * Adds all files built-in to this file package.
     */
    #insertBuiltInFiles() {
        this.folders = [];

        /*
        // idea of a cleaner way to load up the built-in files?

        this.add('Named Colors/Modern/Web Colors', 'data/web-colors.json');
        this.add('Named Colors/Modern/Pantone&reg;', 'data/pantone-colors.json');
        this.add('Named Colors/Classic Desktop Computers/Windows 3.x and OS/2', 'data/win16-colors.json');
        this.add('Named Colors/Classic Desktop Computers/Windows 95/98/Me', 'data/win95-colors.json');
        this.add('Named Colors/Classic Desktop Computers/Macintosh', 'data/mac-colors.json');
        this.add('Named Colors/Classic Desktop Computers/Tandy 1000 and PCjr', 'data/tandy-colors.json');
        this.add('Named Colors/Classic Desktop Computers/Acorn Risc-OS', 'data/risc-colors.json');
        this.add('Custom Palettes/Classic Desktop Computers/Photoshop&reg; 3.0', 'images/ps3-palette.png');
        this.add('Custom Palettes/Classic Desktop Computers/VGA 256 Color', 'images/palette-vga256.png');
        this.add('Custom Palettes/Classic Desktop Computers/Windows 16 Color', 'images/palette-win16.png');
        this.add('Custom Palettes/Video Game Consoles/Atari 2600', 'images/palette-2600.png');
        this.add('Custom Palettes/Video Game Consoles/Nintendo', 'images/palette-nes.png');
        this.add('Custom Palettes/Video Game Consoles/Sega Master System', 'images/palette-ms.png');
        this.add('Overlay Images/Logo', 'images/color-picker-logo.png');

        */

        this.folders.push(new FileSystemFolder("Named Colors"));
        this.folders[0].folders.push(new FileSystemFolder("Modern"));
        this.folders[0].folders[0].files.push(new FileSystemFile("Web Colors", "data/web-colors.json"));
        this.folders[0].folders[0].files.push(new FileSystemFile("Pantone&reg;", "data/pantone-colors.json"));
        this.folders[0].folders.push(new FileSystemFolder("Classic Desktop Computers"));
        this.folders[0].folders[1].files.push(new FileSystemFile("Windows 3.x and OS/2", "data/win16-colors.json"));
        this.folders[0].folders[1].files.push(new FileSystemFile("Windows 95/98/Me", "data/win95-colors.json"));
        this.folders[0].folders[1].files.push(new FileSystemFile("Macintosh", "data/mac-colors.json"));
        this.folders[0].folders[1].files.push(new FileSystemFile("Tandy 1000 and PCjr", "data/tandy-colors.json"));
        this.folders[0].folders[1].files.push(new FileSystemFile("Acorn Risc-OS", "data/risc-colors.json"));

        this.folders.push(new FileSystemFolder("Custom Palettes"));
        this.folders[1].folders.push(new FileSystemFolder("Classic Desktop Computers"));
        this.folders[1].folders[0].files.push(new FileSystemFile("Photoshop&reg; 3.0", "images/ps3-palette.png"));
        this.folders[1].folders[0].files.push(new FileSystemFile("VGA 256 Color", "images/palette-vga256.png"));
        this.folders[1].folders[0].files.push(new FileSystemFile("Windows 16 Color", "images/palette-win16.png"));
        this.folders[1].folders.push(new FileSystemFolder("Video Game Consoles"));
        this.folders[1].folders[1].files.push(new FileSystemFile("Atari 2600", "images/palette-atari2600.png"));
        this.folders[1].folders[1].files.push(new FileSystemFile("Nintendo", "images/palette-nes.png"));
        this.folders[1].folders[1].files.push(new FileSystemFile("Sega Master System", "images/palette-segasms.png"));

        this.folders.push(new FileSystemFolder("Photos"));
        this.folders[2].folders.push(new FileSystemFolder("Built In"));
        this.folders[2].folders[0].files.push(new FileSystemFile("Green Hill", "images/image-hill2.avif"));
        this.folders[2].folders[0].files.push(new FileSystemFile("Parrots", "images/image-parrots2.avif"));

        this.folders.push(new FileSystemFolder("Overlay Images"));
        this.folders[3].folders.push(new FileSystemFolder("Built In"));
        this.folders[3].folders[0].files.push(new FileSystemFile("Logo", "images/color-picker-logo.png"));

        FileSystem.#setParentFolders(this.folders, null);
    }
}