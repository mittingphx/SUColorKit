// noinspection JSUnusedGlobalSymbols

import {FileSystem} from "./FileSystem.js";
import {FileSystemFolder} from "./FileSystemFolder.js";
import {FileSystemFile} from "./FileSystemFile.js";

/**
 * Controller for the file system view window.
 */
export class FileSystemView {

    /**
     * When true, the subfolders the files are in are treated as
     * categories instead of selectable folders, allowing for two
     * levels of subfolders to be displayed together.
     * @type {boolean}
     */
    showSubfolderAsCategory = true;

    /**
     * Panel for list of folders.
     * @type {HTMLDivElement|null}
     */
    $folderView = null;

    /**
     * Panel for list of files.
     * @type {HTMLDivElement|null}
     */
    $filesView = null;

    /**
     * Actual file display area.
     * @type {HTMLDivElement|null}
     */
    $fileViewContents = null;

    /**
     * Panel for file contents.
     * @type {HTMLDivElement|null}
     */
    $fileView = null;

    /**
     * The input for the filename in the file contents pane.
     * @type {HTMLInputElement|null}
     */
    $txtFilename = null;

    /**
     * The dropdown for the category in the file contents pane.
     * @type {HTMLSelectElement|null}
     */
    $ddlCategory = null;

    /**
     * The button to save changes in the file contents pane.
     * @type {HTMLButtonElement|null}
     */
    $btnSave = null;

    /**
     * The button to cancel changes in the file contents pane.
     * @type {HTMLButtonElement|null}
     */
    $btnCancel = null;

    /**
     * Navigation bar in header.
     * @type {HTMLSpanElement|null}
     */
    $headingNav = null;

    /**
     * Button to add files
     * @type {HTMLButtonElement|null}
     */
    $btnAdd = null;

    /**
     * Button to delete selected file
     * @type {HTMLButtonElement|null}
     */
    $btnDelete = null;

    /**
     * Button to returns files to factory install state.
     * @type {HTMLButtonElement|null}
     */
    $btnFactoryReset = null;

    /**
     * Hidden file upload box.
     * @type {HTMLInputElement|null}
     */
    $upload = null;

    /**
     * The folder we're viewing.
     * @type {FileSystemFolder|null}
     */
    #selectedFolder = null

    /**
     * The file we're viewing.
     * @type {FileSystemFile|null}
     */
    #selectedFile = null

    /**
     * The file system we're viewing.
     * @type {FileSystem|null}
     */
    #fileSystem = null

    /**
     * Constructor
     */
    constructor() {

        // initialize the file system
        this.#fileSystem = new FileSystem();

        // setup dom
        this.#initDom();

        // select the first folder
        this.$folderView.querySelector('li').click();
    }

    /**
     * Chooses a folder to view.
     * @param folder {FileSystemFolder|string} folder object to view.
     * @param fromRefresh {boolean} DO NOT USE.  skips refresh when true
     */
    selectFolder(folder, fromRefresh = false) {

        // get folder by name when string passed in
        if (typeof folder === 'string') {
            folder = this.#fileSystem.getFolder(folder);
        }

        // nothing to do if folder is already selected
        if (this.#selectedFolder === folder) {
            return;
        }

        // change selection
        this.#selectedFolder = folder;
        this.#selectedFile = null;

        // build view
        if (!fromRefresh) {
            this.refresh();
        }
    }

    /**
     * Chooses a file to view
     * @param file {FileSystemFile|string} file object to view
     */
    selectFile(file) {

        // get file by name when string passed in
        if (typeof file === 'string') {
            file = this.#fileSystem.getFile(file, this.#selectedFolder);
        }

        // nothing to do if file is already selected
        if (this.#selectedFile === file) {
            return;
        }

        // set selected file
        this.#selectedFile = file;

        // render view
        this.refresh();
    }

    /**
     * Builds the file system view.
     * @param forceReload {boolean} - true when folder data should be reloaded (this loses file selection)
     */
    refresh(forceReload = false) {

        console.log('refresh forceReload:' + forceReload);

        // force folder data reload
        if (forceReload) {
            this.selectFolder(this.#selectedFolder.name, true);
        }

        // build all views
        this.#buildHeader();
        this.#buildFolders();
        this.#buildFiles();
        this.#buildFile();
    }

    /**
     * Gets the type of file based on its extension.
     * @param filename {string} - The name of the file to check
     * @returns {string}
     */
    static getFileTypeByExt(filename) {
        let ext = filename.split('.').pop();
        switch (ext) {
            case 'json':
                return 'text';
            default:
                return 'image';
        }
    }

    /**
     * Grabs the DOM components.
     */
    #initDom() {
        // panels
        this.$headingNav = document.querySelector('.heading span');
        this.$folderView = document.querySelector('.folders-view');
        this.$filesView = document.querySelector('.files-view');
        this.$fileView = document.querySelector('.file-view');
        this.$fileViewContents = document.querySelector('.file-view-contents');

        // property form
        this.$txtFilename = document.querySelector('#txtFilename');
        this.$ddlCategory = document.querySelector('#ddlCategory');


        // buttons
        this.$btnAdd = document.querySelector('.add-button');
        this.$btnDelete = document.querySelector('.delete-button');
        this.$btnFactoryReset = document.querySelector('.reset-button');
        this.$btnSave = document.querySelector('.save-button');
        this.$btnCancel = document.querySelector('.cancel-button');

        // file handling
        this.$upload = document.querySelector('#fileUpload');

        // add event listeners
        this.$btnAdd.addEventListener('click', (_) => {
            if (!this.#selectedFolder) {
                alert('No folder selected to upload to')
                return;
            }
            this.$upload.click();
        });
        this.$btnDelete.addEventListener('click', (_) => {

            if (!this.#selectedFile) {
                alert('No file selected to delete')
                return;
            }
            this.#fileSystem.deleteFile(this.#selectedFile);
            this.refresh(true);
        });
        this.$btnFactoryReset.addEventListener('click', (_) => {
            alert('TODO: factory reset');
        });
        this.$upload.addEventListener('change', (event) => {

            if (!this.#selectedFolder) {
                alert('No folder selected to upload to')
                return;
            }

            // get files
            let files = event.target.files;

            // add each file
            for (let i = 0; i < files.length; i++) {
                let name = files[i].name;
                let ext = name.split('.').pop();
                if (ext === 'json') {
                    let reader = new FileReader();
                    reader.onload = (text) => {
                        this.#selectedFolder.addFileAsText(name, text.target.result);

                        // refresh the view
                        this.refresh(true);

                        // select the new file
                        let file = this.#selectedFolder.getFile(name);
                        this.selectFile(file);
                    } ;
                    reader.readAsText(files[i]);
                } else {
                    let reader = new FileReader();
                    reader.onload = (base64) => {
                        this.#selectedFolder.addFileAsBase64(name, base64.target.result);

                        // refresh the view
                        this.refresh(true);

                        // select the new file
                        let file = this.#selectedFolder.getFile(name);
                        this.selectFile(file);
                    } ;
                    reader.readAsDataURL(files[i]);
                }
            }

            // refresh the view
            this.refresh(true);
        });

        this.$btnSave.addEventListener('click', () => {
            let file = this.#selectedFile;
            if (!file) {
                alert('No file selected to save')
                return;
            }
            file.name = this.$txtFilename.value;
            file.folder = this.#selectedFolder.getFullPath() + '/' + this.$ddlCategory.selectedOptions[0].text;
            this.#fileSystem.saveFile(file);
            this.refresh(true);
        });

        this.$btnCancel.addEventListener('click', () => {
            this.selectFile(null);
            this.refresh(true);
        });

        this.$ddlCategory.addEventListener('change', () => {
            if (this.$ddlCategory.value === '-new') {
                let newValue = prompt('Enter new category name', 'Category');
                if (newValue !== null) {
                    let insertAt = this.$ddlCategory.options.length - 2;
                    let option = new Option(newValue, newValue, true, true);
                    this.$ddlCategory.add(option, this.$ddlCategory.options[insertAt]);
                }
            }
        });

        // select first folder by default and paint
        this.selectFolder(this.#fileSystem.folders[0]);
    }

    /**
     * Builds the window header.
     */
    #buildHeader() {
        let $span = this.$headingNav;
        $span.innerHTML = '<b>Color Picker Files</b>';
        if (this.#selectedFolder) {
            let parent = this.#selectedFolder.parent;
            while (parent) {
                $span.innerHTML += ' > <em>' + parent.name + '</em>';
                parent = parent.parent;
            }
            $span.innerHTML += ' > <em>' + this.#selectedFolder.name + '</em>';
            if (this.#selectedFile) {
                $span.innerHTML += ' > <span>' + this.#selectedFile.name + '</span>';
            }
        }
    }

    /**
     * Builds the folder list view.
     */
    #buildFolders() {
        let $ul = document.createElement('ul');

        // grab either root or selected folder
        let parent = this.#selectedFolder === null
            ? this.#fileSystem
            : this.#selectedFolder;

        // show siblings instead of children if at a leaf folder depth 2+
        if (parent.folders.length === 0 && parent !== this.#fileSystem && parent.parent !== null) {
            parent = parent.parent;
        }
        // show root if at depth of 1
        else if (parent.parent === null) {
            parent = this.#fileSystem;
        }

        // show link to one folder up
        if (parent !== this.#fileSystem) {
            parent.$li = document.createElement('li');
            parent.$li.innerHTML = `<i class="lni lni-arrow-up"></i> <a href="#" title="Open parent folder">[up one folder]</a>`;
            parent.$li.addEventListener('click', () => {
                if (this.#selectedFolder.parent){
                    this.selectFolder(this.#selectedFolder.parent);
                }
                else {
                    this.selectFolder(parent.parent);
                }
            });
            $ul.appendChild(parent.$li);
        }

        // show folders
        for (let i = 0; i < parent.folders.length; i++) {
            let folder = parent.folders[i];
            let $li = this.#createFolderListItem(folder);
            $ul.appendChild($li);
        }

        this.$folderView.innerHTML = '';
        this.$folderView.appendChild($ul);
    }

    /**
     * Creates the <li> to use for a folder in its <ul>
     * @param folder {FileSystemFolder} folder to create the list item for
     * @returns {HTMLLIElement}
     */
    #createFolderListItem(folder) {
        let $li = document.createElement('li');
        $li.innerHTML = `<i class="lni lni-folder"></i> <a href="#">${folder.name}</a>`;
        if (folder === this.#selectedFolder) {
            $li.classList.add('selected');
        }
        $li.addEventListener('click', () => {
            this.selectFolder(folder);
        });
        return $li;
    }

    /**
     * Creates the <li> to use for a file in its <ul>
     * @param file {FileSystemFile} file to create the list item for
     * @returns {HTMLLIElement}
     */
    #createFileListItem(file) {
        let $li = document.createElement('li');
        $li.innerHTML = `<i class="lni lni-empty-file"></i> <a href="#">${file.name}</a>`;
        if (file === this.#selectedFile) {
            $li.classList.add('selected');
        }
        $li.addEventListener('click', () => {
            this.selectFile(file);
        });
        return $li;
    }

    /**
     * Adds <li> for files in a folder's <ul>
     * @param $ul {HTMLUListElement} <ul> to add files to
     * @param folder {FileSystemFolder} folder to add files from
     */
    #listFilesFromFolder($ul, folder) {
        for (let i = 0; i < folder.files.length; i++) {
            let file = folder.files[i];
            let $li = this.#createFileListItem(file);
            $ul.appendChild($li);
        }
    }

    /**
     * Builds the files and subfolders in the selected folder.
     */
    #buildFiles() {

        console.log('--- buildFiles ---');

        let $ul = document.createElement('ul');

        // get the current folder
        let currentFolder = this.#selectedFolder;
        //this.getSelectedFolder();

        // show files in that folder if found
        if (currentFolder != null) {
            if (this.showSubfolderAsCategory) {

                // show the files that exist directly within the folder first
                this.#listFilesFromFolder($ul, currentFolder);

                // show leaf subfolder as categories
                for (let i = 0; i < currentFolder.folders.length; i++) {
                    let folder = currentFolder.folders[i];

                    let $li = document.createElement('li');
                    $li.classList.add('subfolder');
                    $li.innerHTML = `<b>${folder.name}</b>`;
                    $ul.appendChild($li);

                    this.#listFilesFromFolder($ul, folder);
                }
            }
            else {
                // show as standard folders

                // show folders
                for (let i = 0; i < currentFolder.folders.length; i++) {
                    let folder = currentFolder.folders[i];
                    let $li = this.#createFolderListItem(folder);
                    $ul.appendChild($li);
                }

                // show files
                this.#listFilesFromFolder($ul, currentFolder);
            }
        }

        // add to view
        this.$filesView.innerHTML = '';
        this.$filesView.appendChild($ul);
    }

    /**
     * Builds the file contents view tab.
     */
    #buildFile() {

        // get the current file
        let currentFile = this.#selectedFile;
        if (currentFile === null) {
            this.$fileView.classList.add('file-view-empty');
            return;
        }
        this.$fileView.classList.remove('file-view-empty');
        this.$txtFilename.value = currentFile.name;

        // mark system files as readonly
        if (currentFile.isUserFile() === false) {
            this.$fileView.classList.add('file-view-readonly');
            this.$ddlCategory.disabled = true;
            this.$txtFilename.disabled = true;
            this.$btnSave.disabled = true;
            this.$btnCancel.disabled = true;
        }
        else {
            this.$fileView.classList.remove('file-view-readonly');
            this.$ddlCategory.disabled = false;
            this.$txtFilename.disabled = false;
            this.$btnSave.disabled = false;
            this.$btnCancel.disabled = false;
        }

        // build the category dropdown from the selected folder
        this.$ddlCategory.innerHTML = '';
        if (this.#selectedFolder) {
            if (this.#selectedFolder.files.length > 0) {
                this.$ddlCategory.options.add(new Option('-- Uncategorized --', '-'));
            }
            for (let i = 0; i < this.#selectedFolder.folders.length; i++) {
                let name = this.#selectedFolder.folders[i].name;
                this.$ddlCategory.options.add(new Option(name, name));
            }
        }
        this.$ddlCategory.options.add(new Option('-- New Category --', '-new'));

        // select the category, adding it if it doesn't exist
        let category = currentFile.getCategory();
        if (category === 'Uncategorized') {
            category = '-';
        }
        let hasCategory = false;
        for (let i = 0; i < this.$ddlCategory.options.length; i++) {
            if (this.$ddlCategory.options[i].value === category) {
                hasCategory = true;
                break;
            }
        }
        if (hasCategory === false) {let newOption = new Option(category, category, true, true);
            let insertAt = this.$ddlCategory.options[this.$ddlCategory.options.length - 1];
            this.$ddlCategory.add(newOption, insertAt);
        }
        this.$ddlCategory.value = category;

        // show the contents if already loaded
        if (currentFile.loaded) {
            this.$fileViewContents.innerHTML = currentFile.contents;
            return;
        }

        // load the contents
        this.$fileViewContents.innerHTML += 'Loading...';
        let mimeType = currentFile.getMimeType();
        if (currentFile.isUserFile()) {
            // load from localStorage
            if (mimeType.startsWith('image/')) {
                this.$fileViewContents.innerHTML = '<img alt="" src="' + currentFile.contents + '">';
            }
            else {
                this.$fileViewContents.innerHTML = currentFile.contents;
            }
        }
        else {
            // load from extension codebase
            if (mimeType.startsWith('image/')) {
                this.$fileViewContents.innerHTML = '<img alt="" src="' + currentFile.localUrl + '">';
            }
            else {
                fetch(currentFile.localUrl).then(response => response.text()).then(contents => {
                    currentFile.contents = contents;
                    currentFile.loaded = true;
                    this.$fileViewContents.innerHTML = currentFile.contents;
                });
            }
        }
    }
}

