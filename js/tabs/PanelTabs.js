

/**
 * Maintains tab functionality for the color selector.
 */
export class PanelTabs {

    /**
     * Reference to the main application
     * @type {GSMColorPicker|null}
     */
    app = null;

    /**
     * Reference to the gradient tab
     * @type {HTMLElement|null}
     */
    $tabGradient = null;

    /**
     * Reference to the list tab
     * @type {HTMLElement|null}
     */
    $tabList = null;

    /**
     * Reference to the photos list tab.
     * @type {HTMLElement|null}
     */
    $tabPhotos = null;

    /**
     * Reference to the settings tab
     * @type {HTMLElement|null}
     */
    $tabSettings = null;

    /**
     * Reference to the about tab
     * @type {HTMLElement|null}
     */
    $tabAbout = null;

    /**
     * Array with all references to tabs.
     * @type {[]}
     */
    #tabs = [];

    /**
     * The last tab that was selected, which gets stored in localStorage
     * and restored on page load.
     * @type {string}
     */
    #lastSelected = 'tab-gradient';

    /**
     * Constructor grabs DOM references and sets up event listeners.
     */
    constructor(app) {
        this.app = app;

        //this.$tabSliders = document.querySelector("#tab-sliders");
        this.#tabs = [
            this.$tabGradient = document.querySelector("#tab-gradient"),
            this.$tabList = document.querySelector("#tab-list"),
            this.$tabPhotos = document.querySelector("#tab-photos"),
            this.$tabSettings = document.querySelector("#tab-settings"),
            this.$tabAbout = document.querySelector("#tab-about")
        ];

        // check if tabs exist
        for (const $tab of this.#tabs) {
            if (!$tab) {
                console.error("tab not found");
            }
        }
        this.#initDomEvents();

        // load last selected tab
        const lastSelected = localStorage.getItem("lastSelected");
        if (lastSelected) {
            this.#lastSelected = lastSelected;
        }
        this.#showTab(document.querySelector('#' + this.#lastSelected));
    }

    /**
     * Turns off the active status on all tabs.
     */
    #clearActive() {
        for (const $tab of this.#tabs) {
            $tab.classList.remove("active");
        }
        for (const $tab of document.querySelectorAll('.panel-tab-view')) {
            $tab.classList.remove("active");
        }
    }

    /**
     * Displays the selected tab's view
     * @param $tab {HTMLElement} the tab element who needs its view displayed
     */
    #showTab($tab) {
        if (!$tab) {
            console.error('#showTab: tab not found');
            return;
        }

        this.#clearActive()
        $tab.classList.add("active");
        document.querySelector('#' + $tab.id + '-view').classList.add("active");
        if ($tab.id === 'tab-settings') {
            this.app.settingsTab.refresh();
        }

        // store selected tab
        this.#lastSelected = $tab.id;
        localStorage.setItem("lastSelected", this.#lastSelected);
    }

    /**
     * Creates the event handlers for the tabs.
     */
    #initDomEvents() {
        for (const $tab of this.#tabs) {
            $tab.addEventListener("click", () => {
                this.#showTab($tab);
            });
        }
    }
}
