/**
 * State management module with localStorage persistence
 */

const STORAGE_KEY = 'ai-image-generator-images';

/**
 * @typedef {Object} ImageData
 * @property {string} id - Unique identifier
 * @property {string} url - Image URL
 * @property {string} prompt - Generation prompt
 * @property {number} createdAt - Timestamp
 */

/**
 * State class to manage images
 */
class State {
    constructor() {
        /** @type {ImageData[]} */
        this.images = [];
        this.listeners = new Set();
        this.load();
    }

    /**
     * Load images from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.images = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.images = [];
        }
    }

    /**
     * Save images to localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.images));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    /**
     * Get all images
     * @returns {ImageData[]}
     */
    getImages() {
        return [...this.images];
    }

    /**
     * Add a new image (prepend to start)
     * @param {ImageData} image
     */
    addImage(image) {
        this.images.unshift(image);
        this.save();
        this.notifyListeners('add', image);
    }

    /**
     * Remove an image by ID
     * @param {string} id
     */
    removeImage(id) {
        const index = this.images.findIndex(img => img.id === id);
        if (index !== -1) {
            const removed = this.images.splice(index, 1)[0];
            this.save();
            this.notifyListeners('remove', removed);
        }
    }

    /**
     * Get image by ID
     * @param {string} id
     * @returns {ImageData|undefined}
     */
    getImage(id) {
        return this.images.find(img => img.id === id);
    }

    /**
     * Clear all images
     */
    clearAll() {
        this.images = [];
        this.save();
        this.notifyListeners('clear', null);
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     * @param {string} action - Type of action
     * @param {ImageData|null} data - Related data
     */
    notifyListeners(action, data) {
        this.listeners.forEach(listener => listener(action, data));
    }
}

// Export singleton instance
export const state = new State();
