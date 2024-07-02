import {PixelColor} from "../util/PixelColor.js";
import {GSMColorPicker} from "../GSMColorPicker.js";
import {GuiUtil} from "../util/GuiUtil.js";

/**
 * Uses the pantone color list to generate a list of colors.
 */
export class ColorList {

    /**
     * The application's main class
     * @type {GSMColorPicker|null}
     */
    app = null;

    /**
     * The selected color
     * @type {PixelColor|null}
     */
    color = null;

    /**
     * DOM reference to the tab this list is within.
     * @type {null}
     */
    $tabView = null;

    /**
     * DOM reference to the selected list dropdown
     * @type {HTMLSelectElement|null}
     */
    $ddlSelectedList = null;

    /**
     * Current data being displayed.
     * @type {*|null}
     */
    data = null;

    /**
     * The JSON filename to load containing named colors.
     * @type {string}
     */
    dataSourceUrl = 'data/pantone-colors.json';
    //dataSourceUrl = 'data/web-colors.json';

    /**
     * The color selector element that previews the color
     * @type {HTMLElement|null}
     */
    colorSelector = null;

    /**
     * Checkbox to show the overlay image.
     * @type {HTMLInputElement|null}
     */
    showOverlayCheckbox = null;

    /**
     * Constructor
     * @param app {GSMColorPicker} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.#initDom();
        this.#buildDom();
        this.load();
        this.app.addColorListener((event) => {
            this.setColor(event.color);
            GuiUtil.setOverlay(this, event.showOverlay);
        });
    }

    /**
     * Loads the color data from the selected data source.
     */
    load() {
        fetch(this.dataSourceUrl)
            .then(response => response.json())
            .then(data => {
                this.data = data;
                //console.log(data);
                this.#buildDom();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    /**
     * Selects a color from outside this object.
     * @param color {PixelColor} - The color to be selected
     * @param fromList {boolean} - Whether the color was selected from the list
     */
    setColor(color, fromList = false) {

        if (color.equals(this.color)) {
            return;
        }

        // remove selection if not from the list
        if (!fromList) {
            document.querySelectorAll('tr.list-colors.selected').forEach(($tr) => {
                $tr.classList.remove('selected');
            })
        }

        // TODO: select a pantone color if any matches
        this.color = color;
        this.app.setColor(color);

        // update color preview
        this.colorSelector.style.backgroundColor = this.color.toHex();
        document.querySelector('#list_hexColor').value = this.color.toHex();

    }

    /**
     * Grabs references to the DOM elements.
     */
    #initDom() {
        this.$tabView = document.querySelector('#tab-list-view');
        this.colorSelector = document.querySelector('#tab-list-view .panel-color');
        this.showOverlayCheckbox = document.querySelector('#tab-list-view .overlay-check');
        this.$ddlSelectedList = document.querySelector('#named-list');

        // select and load the list of colors to display
        this.$ddlSelectedList.addEventListener('change', (event) => {
            switch (event.target.value) {
                case 'web':
                    this.dataSourceUrl = 'data/web-colors.json';
                    break;
                case 'pantone':
                    this.dataSourceUrl = 'data/pantone-colors.json';
                    break;
                case 'win16':
                    this.dataSourceUrl = 'data/win16-colors.json';
                    break;
                case 'win95':
                    this.dataSourceUrl = 'data/win95-colors.json';
                    break;
                case 'mac':
                    this.dataSourceUrl = 'data/mac-colors.json';
                    break;
                case 'tandy':
                    this.dataSourceUrl = 'data/tandy-colors.json';
                    break;
                case 'risc':
                    this.dataSourceUrl = 'data/risc-colors.json';
                    break;
                default:
                    alert('Unknown color list: ' + event.target.value);
                    break;
            }
            this.load();
        });
    }

    /**
     * Generates the list of colors from the current data set.
     */
    #buildDom() {

        // ignore if no data
        if (this.data === null) return;

        // build the list
        let colorCount = this.data.length;

        // clear the main content view
        let $container = document.querySelector('.list-container');
        $container.innerHTML = '';

        // create table to show color list
        let $table = document.createElement('table');
        {
            $container.appendChild($table);
            $table.classList.add('list-table');
        }

        // fill table
        for (let i = 0; i < colorCount; i++) {
            const color = this.data[i].color;//.values[i];
            const name = this.data[i].name;//.names[i];

            let $tr = this.#buildColorRow(color, name);
            $table.appendChild($tr);
        }

        // show overlay checkbox
        this.showOverlayCheckbox = document.getElementById("showImage");
        this.showOverlayCheckbox.addEventListener("input", (event) => {
            this.app.setOverlay(event.target.checked);
        });
    }

    /**
     * Builds one row in the color table.
     * @param color {string} the hex color starting with '#'
     * @param name {string} the name of the color
     * @return {HTMLTableRowElement}
     */
    #buildColorRow(color, name) {

        const $colorList = document.createElement('tr');
        {
            $colorList.classList.add('list-colors');

            const $color = document.createElement('td');
            {
                $colorList.appendChild($color);
                $color.classList.add('list-color');

                const $preview = document.createElement('div')
                {
                    $preview.classList.add('list-color-preview');
                    $preview.style.backgroundColor = color;
                    $color.appendChild($preview);
                }

                const $name = document.createElement('h3');
                {
                    $name.classList.add('list-color-name');
                    $name.appendChild(document.createTextNode(name));
                    $color.appendChild($name);
                }

                const $colorString = document.createElement('p');
                {
                    $colorString.classList.add('list-color-string');
                    $colorString.appendChild(document.createTextNode(color));
                    $color.appendChild($colorString);
                }

                // handle click event
                $color.addEventListener('click', _ => {

                    // highlight selection
                    document.querySelectorAll('tr.list-colors.selected').forEach(($tr) => {
                        $tr.classList.remove('selected');
                    })
                    $colorList.classList.add('selected');

                    // update color selection
                    let color = new PixelColor();
                    color.fromHex($colorString.textContent);
                    this.setColor(color, true);
                });

            }
        }

        return $colorList;
    }
}
