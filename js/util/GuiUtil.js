/**
 * @typedef {Object} IHasColorSelector
 * @property {HTMLElement} colorSelector
 * @property {HTMLInputElement} showOverlayCheckbox
 */

/**
 * Common helper functions for GUI.
 */
export class GuiUtil {

    /**
     * Sets the overlay checkbox state.
     * @param {IHasColorSelector} obj - The object that contains the checkbox and selector
     * @param {boolean} checked The new checkbox state
     * @return {void} This function does not return a value.
     */
    static setOverlay(obj, checked) {
        if (obj.showOverlayCheckbox.checked !== checked) {
            obj.showOverlayCheckbox.checked = checked;
        }
        if (checked) {
            if (!obj.colorSelector.classList.contains('panel-color-overlay')) {
                obj.colorSelector.classList.add('panel-color-overlay');
            }
        }
        else {
            if (obj.colorSelector.classList.contains('panel-color-overlay')) {
                obj.colorSelector.classList.remove('panel-color-overlay');
            }
        }

    }


}