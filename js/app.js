/**
 * Main application entry point
 */

import { generateImage, enhancePrompt } from './api.js';
import { state } from './state.js';
import { generateId } from './utils.js';
import { initGallery, showPlaceholder, removePlaceholder, initLightbox, closeLightbox } from './gallery.js';

/**
 * Get current generation settings from the UI
 * @returns {Object} Generation options
 */
function getGenerationSettings() {
    const imageSizeSelect = document.getElementById('setting-image-size');
    const stepsInput = document.getElementById('setting-steps');
    const numImagesSelect = document.getElementById('setting-num-images');
    const formatSelect = document.getElementById('setting-format');
    const accelerationSelect = document.getElementById('setting-acceleration');
    const seedInput = document.getElementById('setting-seed');
    const safetyCheckbox = document.getElementById('setting-safety');
    const syncCheckbox = document.getElementById('setting-sync');
    const widthInput = document.getElementById('setting-width');
    const heightInput = document.getElementById('setting-height');

    const settings = {
        num_inference_steps: parseInt(stepsInput?.value || 30, 10),
        num_images: parseInt(numImagesSelect?.value || 1, 10),
        output_format: formatSelect?.value || 'png',
        acceleration: accelerationSelect?.value || 'none',
        enable_safety_checker: safetyCheckbox?.checked ?? true,
        sync_mode: syncCheckbox?.checked ?? false,
    };

    // Handle image size
    const imageSizeValue = imageSizeSelect?.value || 'landscape_4_3';
    if (imageSizeValue === 'custom') {
        settings.image_size = {
            width: parseInt(widthInput?.value || 1024, 10),
            height: parseInt(heightInput?.value || 768, 10)
        };
    } else {
        settings.image_size = imageSizeValue;
    }

    // Handle seed (only include if provided)
    const seedValue = seedInput?.value;
    if (seedValue && seedValue.trim() !== '') {
        settings.seed = parseInt(seedValue, 10);
    }

    return settings;
}

/**
 * Initialize the application
 */
function init() {
    // Get DOM elements
    const galleryContainer = document.getElementById('gallery');
    const emptyState = document.getElementById('empty-state');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const enhanceBtn = document.getElementById('enhance-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');

    // Initialize gallery
    if (galleryContainer && emptyState) {
        initGallery(galleryContainer, emptyState);
    }

    // Initialize lightbox
    initLightbox();

    // Set up event listeners
    if (generateBtn && promptInput) {
        generateBtn.addEventListener('click', () => handleGenerate(promptInput, generateBtn));

        // Handle Enter key (Shift+Enter for new line)
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate(promptInput, generateBtn);
            }
        });

        // Auto-resize textarea
        promptInput.addEventListener('input', () => autoResizeTextarea(promptInput));
    }

    // Set up enhance button listener
    if (enhanceBtn && promptInput) {
        enhanceBtn.addEventListener('click', () => handleEnhance(promptInput, enhanceBtn));
    }

    // Set up settings panel
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => toggleSettings(settingsBtn, settingsPanel));

        if (settingsClose) {
            settingsClose.addEventListener('click', () => closeSettings(settingsBtn, settingsPanel));
        }

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (settingsPanel.classList.contains('settings-panel--active') &&
                !settingsPanel.contains(e.target) &&
                !settingsBtn.contains(e.target)) {
                closeSettings(settingsBtn, settingsPanel);
            }
        });
    }

    // Initialize settings UI interactions
    initSettingsUI();

    console.log('AI Image Generator initialized');
}

/**
 * Initialize settings UI interactions
 */
function initSettingsUI() {
    const imageSizeSelect = document.getElementById('setting-image-size');
    const customSizeGroup = document.getElementById('custom-size-group');
    const stepsInput = document.getElementById('setting-steps');
    const stepsValue = document.getElementById('steps-value');

    // Toggle custom size fields
    if (imageSizeSelect && customSizeGroup) {
        imageSizeSelect.addEventListener('change', () => {
            if (imageSizeSelect.value === 'custom') {
                customSizeGroup.classList.remove('settings-group--hidden');
            } else {
                customSizeGroup.classList.add('settings-group--hidden');
            }
        });
    }

    // Update steps value display
    if (stepsInput && stepsValue) {
        stepsInput.addEventListener('input', () => {
            stepsValue.textContent = stepsInput.value;
        });
    }
}

/**
 * Toggle settings panel
 */
function toggleSettings(button, panel) {
    const isActive = panel.classList.contains('settings-panel--active');
    if (isActive) {
        closeSettings(button, panel);
    } else {
        openSettings(button, panel);
    }
}

/**
 * Open settings panel
 */
function openSettings(button, panel) {
    panel.classList.add('settings-panel--active');
    button.classList.add('input-bar__icon-btn--active');
}

/**
 * Close settings panel
 */
function closeSettings(button, panel) {
    panel.classList.remove('settings-panel--active');
    button.classList.remove('input-bar__icon-btn--active');
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

    // Get generation settings
    const settings = getGenerationSettings();
    const numImages = settings.num_images;

    // Disable input while generating
    setLoading(input, button, true);

    // Show placeholder cards for each image
    for (let i = 0; i < numImages; i++) {
        showPlaceholder();
    }

    try {
        const response = await generateImage(prompt, settings);

        if (response.images && response.images.length > 0) {
            // Remove placeholders
            for (let i = 0; i < numImages; i++) {
                removePlaceholder();
            }

            // Add each generated image to state
            response.images.forEach((image) => {
                state.addImage({
                    id: generateId(),
                    url: image.url,
                    prompt: prompt,
                    createdAt: Date.now()
                });
            });

            // Clear input
            input.value = '';
        }
    } catch (error) {
        console.error('Generation failed:', error);
        // Remove all placeholders on error
        for (let i = 0; i < numImages; i++) {
            removePlaceholder();
        }
        showError(error.message || 'Failed to generate image. Please try again.');
    } finally {
        setLoading(input, button, false);
    }
}

/**
 * Handle prompt enhancement
 * @param {HTMLInputElement} input - Prompt input element
 * @param {HTMLButtonElement} button - Enhance button element
 */
async function handleEnhance(input, button) {
    const prompt = input.value.trim();

    if (!prompt) {
        input.focus();
        shakeElement(input);
        return;
    }

    // Set loading state
    setEnhanceLoading(button, true);
    input.disabled = true;

    try {
        const enhanced = await enhancePrompt(prompt);

        // Update input with enhanced prompt
        input.value = enhanced;

        // Trigger visual flash to show update
        flashInput(input);

        // Focus input
        input.focus();
    } catch (error) {
        console.error('Enhancement failed:', error);
        showError(error.message || 'Failed to enhance prompt. Please try again.');
    } finally {
        setEnhanceLoading(button, false);
        input.disabled = false;
    }
}

/**
 * Set loading state for enhance button
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 */
function setEnhanceLoading(button, isLoading) {
    button.disabled = isLoading;

    if (isLoading) {
        button.classList.add('input-bar__icon-btn--loading');
    } else {
        button.classList.remove('input-bar__icon-btn--loading');
    }
}

/**
 * Flash input to indicate update
 * @param {HTMLTextAreaElement} input
 */
function flashInput(input) {
    input.classList.remove('input-bar__input--flash');
    input.offsetHeight; // Trigger reflow
    input.classList.add('input-bar__input--flash');

    // Auto-resize after content update
    autoResizeTextarea(input);

    setTimeout(() => {
        input.classList.remove('input-bar__input--flash');
    }, 600);
}

/**
 * Set loading state for input and button
 * @param {HTMLTextAreaElement} input
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 */
function setLoading(input, button, isLoading) {
    input.disabled = isLoading;
    button.disabled = isLoading;

    const sendIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    const loadingIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    if (isLoading) {
        button.classList.add('input-bar__button--loading');
        button.innerHTML = loadingIcon;
    } else {
        button.classList.remove('input-bar__button--loading');
        button.innerHTML = sendIcon;
    }
}

/**
 * Auto-resize textarea based on content
 * @param {HTMLTextAreaElement} textarea
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
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
