
/**
 * Class for handling mouse drags elegantly.
 */
export class MouseDrag {

    /**
     * Element that is being dragged
     * @type {HTMLElement}
     */
    $target = null;

    /**
     * True if the element is being dragged
     * @type {boolean}
     */
    dragging = false;

    /**
     * Start x location of the drag
     * @type {number}
     */
    x0 = 0;

    /**
     * Start y location of the drag
     * @type {number}
     */
    y0 = 0;

    /**
     * Current x location of the drag (when dragging)
     * @type {number}
     */
    x = 0;

    /**
     * Current y location of the drag (when dragging)
     * @type {number}
     */
    y = 0;

    /**
     * The callback when the element is dragged
     * @type {function(MouseDrag, MouseEvent)}ß
     */
    onDrag = (drag, event) => {
        console.log('no onDrag event', drag, event);
    };

    /**
     * Last mouse event sent to mousemove
     * @type {MouseEvent}
     */
    lastEvent = null;

    /**
     * Constructor takes the element to be dragged.
     * @param $element {HTMLElement|string} - Either the element or a selector to the element
     * @param onDrag {function(MouseDrag, MouseEvent)} - The callback when the element is dragged
     */
    constructor($element, onDrag = null) {

        // grab target
        if (typeof $element === 'string') {
            $element = document.querySelector($element);
        }
        if (!$element) {
            console.error('No element found to drag');
            return;
        }
        this.$target = $element;

        // init properties
        this.dragging = false;
        this.x0 = 0;
        this.y0 = 0;
        this.x = 0;
        this.y = 0;

        // assign event callback
        this.onDrag = onDrag;

        // init events
        this.#initDom();
    }

    /**
     * Returns the distance between the last event and the current event
     * @return {number}
     */
    distance() {
        let x1 = this.x0;
        let y1 = this.y0;
        let x2 = this.lastEvent.clientX;
        let y2 = this.lastEvent.clientY;
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Initializes the mouse event listeners
     */
    #initDom() {
        this.$target.addEventListener('mousedown', (event) => {
            this.dragging = true;
            this.#setEvent(event);
            this.x0 = this.x;
            this.y0 = this.y;
        });
        this.$target.addEventListener('mousemove', (event) => {
            if (this.dragging) {
                this.#setEvent(event);
                this.onDrag(this, event);
            }
        });
        this.$target.addEventListener('mouseup', (event) => {
            this.#setEvent(event);
            this.dragging = false;
        });
    }

    /**
     * Stores the last mouse event that was sent
     * @param event {MouseEvent}
     */
    #setEvent(event) {
        this.lastEvent = event;
        this.x = event.clientX;
        this.y = event.clientY;
    }
}
