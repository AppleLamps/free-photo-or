/**
 * Gallery module for rendering the grid
 */

import { createElement, downloadImage } from './utils.js';
import { state } from './state.js';

/** @type {HTMLElement|null} */
let galleryElement = null;

/** @type {HTMLElement|null} */
let emptyStateElement = null;

/** @type {HTMLElement[]} */
let placeholderElements = [];

/** @type {Map<string, NodeJS.Timeout>} */
let confirmationTimeouts = new Map();

/** @type {Set<string>} */
let pendingDeletions = new Set();

/**
 * Reset confirmation state for an image
 * @param {string} imageId - Image ID
 */
function resetConfirmationState(imageId) {
    pendingDeletions.delete(imageId);

    const timeout = confirmationTimeouts.get(imageId);
    if (timeout) {
        clearTimeout(timeout);
        confirmationTimeouts.delete(imageId);
    }

    // Reset button appearance
    const deleteBtn = document.querySelector(`[data-id="${imageId}"] .gallery__delete-btn`);
    if (deleteBtn) {
        deleteBtn.classList.remove('gallery__delete-btn--confirm');
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Delete image';
    }
}

/**
 * Handle first delete button press
 * @param {string} imageId - Image ID
 */
function handleFirstDeletePress(imageId) {
    pendingDeletions.add(imageId);

    const deleteBtn = document.querySelector(`[data-id="${imageId}"] .gallery__delete-btn`);
    if (deleteBtn) {
        deleteBtn.classList.add('gallery__delete-btn--confirm');
        deleteBtn.textContent = '!';
        deleteBtn.title = 'Tap again to confirm';
    }

    // Auto-reset after 3 seconds
    const timeout = setTimeout(() => {
        resetConfirmationState(imageId);
    }, 3000);

    confirmationTimeouts.set(imageId, timeout);
}

/**
 * Initialize the gallery
 * @param {HTMLElement} container - Gallery container element
 * @param {HTMLElement} emptyState - Empty state element
 */
export function initGallery(container, emptyState) {
    galleryElement = container;
    emptyStateElement = emptyState;

    // Subscribe to state changes
    state.subscribe(handleStateChange);

    // Initial render
    renderGallery();
}

/**
 * Handle state changes
 * @param {string} action
 * @param {Object} data
 */
function handleStateChange(action, data) {
    switch (action) {
        case 'add':
            // Preload image before showing to ensure seamless transition
            preloadAndShowImage(data);
            break;
        case 'remove':
            removeImageCard(data.id);
            updateEmptyState();
            break;
        case 'clear':
            // Clean up all confirmation states
            confirmationTimeouts.forEach(timeout => clearTimeout(timeout));
            confirmationTimeouts.clear();
            pendingDeletions.clear();
            renderGallery();
            break;
    }
}

/**
 * Preload image and show with seamless transition
 * @param {Object} image - Image data
 */
function preloadAndShowImage(image) {
    const img = new Image();
    img.src = image.url;

    const showImage = () => {
        removePlaceholder();
        prependImageCard(image, true); // true = already loaded
        updateEmptyState();
    };

    if (img.complete) {
        showImage();
    } else {
        img.onload = showImage;
        img.onerror = showImage; // Still show on error
    }
}

/**
 * Render the full gallery
 */
function renderGallery() {
    if (!galleryElement) return;

    galleryElement.innerHTML = '';

    const images = state.getImages();

    if (images.length === 0) {
        updateEmptyState();
        return;
    }

    images.forEach(image => {
        const card = createImageCard(image);
        galleryElement.appendChild(card);
    });

    updateEmptyState();
}

/**
 * Update empty state visibility
 */
function updateEmptyState() {
    if (!emptyStateElement) return;

    const hasImages = state.getImages().length > 0 || placeholderElements.length > 0;
    emptyStateElement.style.display = hasImages ? 'none' : 'flex';
}

/**
 * Create an image card element
 * @param {Object} image - Image data
 * @param {boolean} [preloaded=false] - Whether image is already loaded
 * @returns {HTMLElement}
 */
function createImageCard(image, preloaded = false) {
    const card = createElement('div', {
        className: 'gallery__card',
        dataset: { id: image.id }
    });

    // Delete button
    const deleteBtn = createElement('button', {
        className: 'gallery__delete-btn',
        title: 'Delete image',
        onClick: (e) => {
            e.stopPropagation();

            if (pendingDeletions.has(image.id)) {
                // Second press - confirm deletion
                resetConfirmationState(image.id);
                state.removeImage(image.id);
            } else {
                // First press - show confirmation
                handleFirstDeletePress(image.id);
            }
        }
    }, '✕');

    // Image element
    const img = createElement('img', {
        className: preloaded ? 'gallery__image gallery__image--loaded' : 'gallery__image gallery__image--loading',
        src: image.url,
        alt: image.prompt,
        loading: 'lazy'
    });

    if (!preloaded) {
        img.onload = () => {
            img.classList.remove('gallery__image--loading');
            img.classList.add('gallery__image--loaded');
        };
    }

    card.appendChild(deleteBtn);
    card.appendChild(img);

    // Click to open lightbox
    card.addEventListener('click', () => openLightbox(image));

    return card;
}

/**
 * Prepend a new image card to the gallery
 * @param {Object} image - Image data
 * @param {boolean} [preloaded=false] - Whether image is already loaded
 */
function prependImageCard(image, preloaded = false) {
    if (!galleryElement) return;

    const card = createImageCard(image, preloaded);
    galleryElement.insertBefore(card, galleryElement.firstChild);
}

/**
 * Remove an image card from the gallery
 * @param {string} id - Image ID
 */
function removeImageCard(id) {
    if (!galleryElement) return;

    const card = galleryElement.querySelector(`[data-id="${id}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 200);

        // Clean up confirmation state when image is removed
        resetConfirmationState(id);
    }
}

/**
 * Show loading placeholder
 */
export function showPlaceholder() {
    if (!galleryElement) return;

    const placeholder = createElement('div', {
        className: 'gallery__placeholder'
    });

    placeholderElements.push(placeholder);
    galleryElement.insertBefore(placeholder, galleryElement.firstChild);
    updateEmptyState();
}

/**
 * Remove loading placeholder
 */
export function removePlaceholder() {
    const placeholder = placeholderElements.pop();
    if (placeholder) {
        placeholder.remove();
    }
}

/**
 * Remove all loading placeholders
 */
export function removeAllPlaceholders() {
    placeholderElements.forEach(p => p.remove());
    placeholderElements = [];
    updateEmptyState();
}

/**
 * Open lightbox modal
 * @param {Object} image - Image data
 */
function openLightbox(image) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;

    const modalImage = modal.querySelector('.modal__image');
    const modalPrompt = modal.querySelector('.modal__prompt');
    const downloadBtn = modal.querySelector('.modal__download-btn');
    const copyBtn = modal.querySelector('.modal__copy-btn');
    const actionsContainer = modal.querySelector('.modal__actions');

    if (modalImage) {
        modalImage.src = image.url;
        modalImage.alt = image.prompt;
    }

    if (modalPrompt) {
        modalPrompt.textContent = image.prompt;
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => downloadImage(image.url, `ai-image-${image.id}.png`);
    }

    if (copyBtn) {
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(image.prompt);
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        };
    }

    // Add or update Remix button
    if (actionsContainer) {
        // Remove existing remix button if any
        const existingRemixBtn = actionsContainer.querySelector('.modal__remix-btn');
        if (existingRemixBtn) {
            existingRemixBtn.remove();
        }

        // Create new remix button
        const remixBtn = createElement('button', {
            className: 'modal__button modal__remix-btn',
            onClick: () => {
                window.dispatchEvent(new CustomEvent('remix-image', { detail: image }));
            }
        }, 'Remix ♻️');

        // Insert before download button
        actionsContainer.insertBefore(remixBtn, downloadBtn);
    }

    modal.classList.add('modal--active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close lightbox modal
 */
export function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;

    modal.classList.remove('modal--active');
    document.body.style.overflow = '';
}

/**
 * Initialize lightbox event listeners
 */
export function initLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLightbox();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}
