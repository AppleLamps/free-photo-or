/**
 * Main application entry point
 */

import { generateImage } from './api.js';
import { state } from './state.js';
import { generateId } from './utils.js';
import { initGallery, showPlaceholder, removePlaceholder, initLightbox, closeLightbox } from './gallery.js';

/**
 * Initialize the application
 */
function init() {
    // Get DOM elements
    const galleryContainer = document.getElementById('gallery');
    const emptyState = document.getElementById('empty-state');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');

    // Initialize gallery
    if (galleryContainer && emptyState) {
        initGallery(galleryContainer, emptyState);
    }

    // Initialize lightbox
    initLightbox();

    // Set up event listeners
    if (generateBtn && promptInput) {
        generateBtn.addEventListener('click', () => handleGenerate(promptInput, generateBtn));

        // Handle Enter key
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate(promptInput, generateBtn);
            }
        });
    }

    console.log('AI Image Generator initialized');
}

/**
 * Handle image generation
 * @param {HTMLInputElement} input - Prompt input element
 * @param {HTMLButtonElement} button - Generate button element
 */
async function handleGenerate(input, button) {
    const prompt = input.value.trim();

    if (!prompt) {
        input.focus();
        shakeElement(input);
        return;
    }

    // Disable input while generating
    setLoading(input, button, true);

    // Show placeholder card
    showPlaceholder();

    try {
        const response = await generateImage(prompt);

        if (response.images && response.images.length > 0) {
            const imageUrl = response.images[0].url;

            // Add to state
            state.addImage({
                id: generateId(),
                url: imageUrl,
                prompt: prompt,
                createdAt: Date.now()
            });

            // Clear input
            input.value = '';
        }
    } catch (error) {
        console.error('Generation failed:', error);
        removePlaceholder();
        showError(error.message || 'Failed to generate image. Please try again.');
    } finally {
        setLoading(input, button, false);
    }
}

/**
 * Set loading state for input and button
 * @param {HTMLInputElement} input
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 */
function setLoading(input, button, isLoading) {
    input.disabled = isLoading;
    button.disabled = isLoading;

    if (isLoading) {
        button.classList.add('input-bar__button--loading');
        button.innerHTML = '⏳';
    } else {
        button.classList.remove('input-bar__button--loading');
        button.innerHTML = '✨';
    }
}

/**
 * Shake element to indicate error
 * @param {HTMLElement} element
 */
function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.5s ease';

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast--error';
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #ef4444;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: fadeInUp 0.3s ease;
  `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add shake animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
