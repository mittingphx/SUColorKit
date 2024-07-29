/**
 * Static methods to help building <select> features.
 */
export class SelectHelper {

    /**
     * Creates an optgroup for a dropdown list of all the files in a folder.
     * @param fsFolder {FileSystemFolder} the folder to create the optgroup for
     * @param folderName {string|null} the name of the folder (optional, default is folder name)
     * @returns {HTMLOptGroupElement}
     */
    static createOptGroupForFolder(fsFolder, folderName = null) {
        let optGroup = document.createElement('optgroup');
        optGroup.label = folderName || fsFolder.name;
        for (let j = 0; j < fsFolder.files.length; j++) {
            //console.log(subfolder.files[j]);
            let file = fsFolder.files[j];
            let option = document.createElement('option');
            if (file.isUserFile()) {
                option.value = 'file:' + file.id;
            }
            else {
                option.value = file.localUrl;
            }
            option.innerHTML = file.name;
            optGroup.appendChild(option);
        }
        return optGroup;
    }
}
