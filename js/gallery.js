/**
 * Gallery module for rendering the masonry grid
 */

import { createElement, downloadImage, escapeHtml } from './utils.js';
import { state } from './state.js';

/** @type {HTMLElement|null} */
let galleryElement = null;

/** @type {HTMLElement|null} */
let emptyStateElement = null;

/** @type {HTMLElement|null} */
let placeholderElement = null;

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
            removePlaceholder();
            prependImageCard(data);
            updateEmptyState();
            break;
        case 'remove':
            removeImageCard(data.id);
            updateEmptyState();
            break;
        case 'clear':
            renderGallery();
            break;
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

    const hasImages = state.getImages().length > 0 || placeholderElement;
    emptyStateElement.style.display = hasImages ? 'none' : 'flex';
}

/**
 * Create an image card element
 * @param {Object} image - Image data
 * @returns {HTMLElement}
 */
function createImageCard(image) {
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
            if (confirm('Delete this image?')) {
                state.removeImage(image.id);
            }
        }
    }, '✕');

    // Image element
    const img = createElement('img', {
        className: 'gallery__image gallery__image--loading',
        src: image.url,
        alt: image.prompt,
        loading: 'lazy'
    });

    img.onload = () => {
        img.classList.remove('gallery__image--loading');
        img.classList.add('gallery__image--loaded');
    };

    // Overlay
    const overlay = createElement('div', { className: 'gallery__overlay' }, [
        createElement('p', { className: 'gallery__prompt' }, escapeHtml(image.prompt)),
        createElement('div', { className: 'gallery__actions' }, [
            createElement('button', {
                className: 'gallery__action-btn',
                title: 'Download',
                onClick: (e) => {
                    e.stopPropagation();
                    downloadImage(image.url, `ai-image-${image.id}.png`);
                }
            }, '⬇'),
            createElement('button', {
                className: 'gallery__action-btn',
                title: 'View fullscreen',
                onClick: (e) => {
                    e.stopPropagation();
                    openLightbox(image);
                }
            }, '⤢')
        ])
    ]);

    card.appendChild(deleteBtn);
    card.appendChild(img);
    card.appendChild(overlay);

    // Click to open lightbox
    card.addEventListener('click', () => openLightbox(image));

    return card;
}

/**
 * Prepend a new image card to the gallery
 * @param {Object} image - Image data
 */
function prependImageCard(image) {
    if (!galleryElement) return;

    const card = createImageCard(image);
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
    }
}

/**
 * Show loading placeholder
 */
export function showPlaceholder() {
    if (!galleryElement) return;

    placeholderElement = createElement('div', {
        className: 'gallery__placeholder',
        id: 'generation-placeholder'
    });

    galleryElement.insertBefore(placeholderElement, galleryElement.firstChild);
    updateEmptyState();
}

/**
 * Remove loading placeholder
 */
export function removePlaceholder() {
    if (placeholderElement) {
        placeholderElement.remove();
        placeholderElement = null;
    }
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
