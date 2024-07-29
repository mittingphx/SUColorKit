
/**
 * Manages the help tab.
 */
export class HelpTab {

    /**
     * The scrollable area where help text is being displayed.
     * @type {HTMLElement}
     */
    $scrollArea = null;

    /**
     * The <span> displaying the title of the displayed help text.
     * @type {HTMLSpanElement}
     */
    $titleSpan = null;

    /**
     * @typedef {Object} IHelpSection
     * @property {string} id
     * @property {string} title
     * @property {number} top
     */

    /**
     * The list of sections in the help text defined with <a id="section">
     * @type {IHelpSection[]}
     */
    #sections = null;

    /**
     * Constructor
     * @param app {GSMColorPicker} - The application's main class.
     */
    constructor(app) {
        this.app = app;
        this.#initDom();
    }

    /**
     * Initializes DOM elements used by this object.
     */
    #initDom() {
        this.$scrollArea = document.querySelector("#tab-help-view .help-text");
        this.$titleSpan = document.querySelector("#tab-help-view h2 span");
        this.$titleSpan.textContent = '';

        // update title on scroll
        this.$scrollArea.addEventListener('scroll', () => {
            let selection = this.getVisibleSection();
            if (selection) {
                this.$titleSpan.textContent = '- ' + selection.title;
            }
            else {
                this.$titleSpan.textContent = '';
            }
        });
    }

    /**
     * Returns the section of the help text that is currently visible
     * based on the scroll position.
     * @returns {IHelpSection|null}
     */
    getVisibleSection() {

        // get positions upon first event (it's zeros if done too early)
        if (!this.#sections) {
            this.#sections = this.getSectionPositions();
        }

        // find bottom of visible area
        let scrollBottom = this.$scrollArea.scrollTop + this.$scrollArea.offsetHeight;

        // find section
        let selection = null;
        for (let i = 0; i < this.#sections.length; i++) {
            if (scrollBottom > this.#sections[i].top) {
                if (i + 1 === this.#sections.length) {
                    selection = this.#sections[i];
                    break;
                }
                if (scrollBottom < this.#sections[i + 1].top) {
                    selection = this.#sections[i];
                    break;
                }
            }
        }

        return selection;
    }

    /**
     * Returns the positions of the sections in the help text.
     * @returns {IHelpSection[]}
     */
    getSectionPositions() {
        let sections = [];
        this.$scrollArea.querySelectorAll('a')
            .forEach((anchor) => {
                if (!anchor.id) return;
                const rect = anchor.getBoundingClientRect();
                sections.push({
                    id: anchor.id,
                    top: rect.top,
                    title: anchor.getAttribute('title') || anchor.id
                });
            });
        return sections;
    }

}

