/**
 * Main application entry point
 */

import { generateImage, enhancePrompt } from './api.js';
import { state } from './state.js';
import { generateId } from './utils.js';
import { initGallery, showPlaceholder, removePlaceholder, removeAllPlaceholders, initLightbox, closeLightbox } from './gallery.js';
import { getRandomPrompt } from './prompts.js';

/**
 * Get current generation settings from the UI
 * @returns {Object} Generation options
 */
function getGenerationSettings() {
    const modelSelect = document.getElementById('setting-model');
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
    // Qwen-specific elements
    const guidanceInput = document.getElementById('setting-guidance');
    const negativePromptInput = document.getElementById('setting-negative-prompt');
    const turboCheckbox = document.getElementById('setting-turbo');
    // FLUX Kontext elements
    const aspectRatioSelect = document.getElementById('setting-aspect-ratio');
    const enhancePromptCheckbox = document.getElementById('setting-enhance-prompt');

    const model = modelSelect?.value || 'z-image-turbo';

    // Get input image data URI if available (stored globally)
    const inputImageDataUri = window.__inputImageDataUri || null;

    const settings = {
        model,
        num_inference_steps: parseInt(stepsInput?.value || 30, 10),
        num_images: parseInt(numImagesSelect?.value || 2, 10),
        output_format: formatSelect?.value || 'webp',
        enable_safety_checker: safetyCheckbox?.checked ?? false,
        sync_mode: syncCheckbox?.checked ?? false,
    };

    // Model-specific settings
    if (model === 'qwen-image') {
        // Qwen-specific settings
        settings.guidance_scale = parseFloat(guidanceInput?.value || 2.5);
        settings.use_turbo = turboCheckbox?.checked ?? false;
        const negativePrompt = negativePromptInput?.value?.trim();
        if (negativePrompt) {
            settings.negative_prompt = negativePrompt;
        }
        // Qwen also supports acceleration
        settings.acceleration = accelerationSelect?.value || 'none';
        // Add input image if available
        if (inputImageDataUri) {
            settings.image_url = inputImageDataUri;
        }
    } else if (model === 'flux-kontext') {
        // FLUX Kontext settings
        settings.guidance_scale = parseFloat(guidanceInput?.value || 3.5);
        settings.aspect_ratio = aspectRatioSelect?.value || '1:1';
        settings.enhance_prompt = enhancePromptCheckbox?.checked ?? false;
        settings.safety_tolerance = '5'; // More permissive safety level
        // Input image is required for Kontext
        if (inputImageDataUri) {
            settings.image_url = inputImageDataUri;
        }
    } else {
        // Z-Image Turbo settings
        settings.acceleration = accelerationSelect?.value || 'none';
    }

    // Handle image size
    const imageSizeValue = imageSizeSelect?.value || 'square_hd';
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
    const surpriseBtn = document.getElementById('surprise-btn');

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

    // Set up surprise me button listener
    if (surpriseBtn && promptInput) {
        surpriseBtn.addEventListener('click', () => handleSurpriseMe(promptInput));
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

    // Listen for remix-image event from lightbox
    window.addEventListener('remix-image', handleRemixImage);

    console.log('AI Image Generator initialized');
}

/**
 * Initialize settings UI interactions
 */
function initSettingsUI() {
    const modelSelect = document.getElementById('setting-model');
    const imageSizeSelect = document.getElementById('setting-image-size');
    const customSizeGroup = document.getElementById('custom-size-group');
    const stepsInput = document.getElementById('setting-steps');
    const stepsValue = document.getElementById('steps-value');
    const guidanceInput = document.getElementById('setting-guidance');
    const guidanceValue = document.getElementById('guidance-value');

    // Model-specific settings groups
    const stepsGroup = document.getElementById('steps-group');
    const guidanceGroup = document.getElementById('guidance-group');
    const negativePromptGroup = document.getElementById('negative-prompt-group');
    const turboGroup = document.getElementById('turbo-group');
    const accelerationGroup = document.getElementById('acceleration-group');

    // Toggle settings based on model selection
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            updateSettingsForModel(modelSelect.value);
        });
    }

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

    // Update guidance value display
    if (guidanceInput && guidanceValue) {
        guidanceInput.addEventListener('input', () => {
            guidanceValue.textContent = guidanceInput.value;
        });
    }

    // Initialize image upload handlers
    initImageUpload();
}

/**
 * Initialize image upload handlers for Qwen image editing
 */
function initImageUpload() {
    const imageInput = document.getElementById('setting-input-image');
    const imageLabel = document.getElementById('image-upload-label');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewImg = document.getElementById('image-preview-img');
    const imageClearBtn = document.getElementById('image-preview-clear');

    // Initialize global storage for image data URI
    window.__inputImageDataUri = null;

    if (!imageInput || !imageLabel || !imagePreview || !imagePreviewImg || !imageClearBtn) {
        return;
    }

    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file, imageLabel, imagePreview, imagePreviewImg);
        }
    });

    // Handle drag and drop
    imageLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageLabel.classList.add('image-upload__label--dragover');
    });

    imageLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        imageLabel.classList.remove('image-upload__label--dragover');
    });

    imageLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        imageLabel.classList.remove('image-upload__label--dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file, imageLabel, imagePreview, imagePreviewImg);
            // Update the input to reflect the dropped file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
        }
    });

    // Handle clear button
    imageClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearImageUpload(imageInput, imageLabel, imagePreview, imagePreviewImg);
    });
}

/**
 * Handle an uploaded image file
 * @param {File} file - The image file
 * @param {HTMLElement} label - The upload label element
 * @param {HTMLElement} preview - The preview container
 * @param {HTMLImageElement} previewImg - The preview image element
 */
function handleImageFile(file, label, preview, previewImg) {
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
        showError('Image file is too large (max 10MB)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUri = e.target?.result;
        if (dataUri) {
            // Store the data URI globally
            window.__inputImageDataUri = dataUri;
            // Show preview
            previewImg.src = dataUri;
            preview.classList.remove('image-upload__preview--hidden');
            label.style.display = 'none';
        }
    };
    reader.onerror = () => {
        showError('Failed to read image file');
    };
    reader.readAsDataURL(file);
}

/**
 * Clear the uploaded image
 * @param {HTMLInputElement} input - The file input
 * @param {HTMLElement} label - The upload label element
 * @param {HTMLElement} preview - The preview container
 * @param {HTMLImageElement} previewImg - The preview image element
 */
function clearImageUpload(input, label, preview, previewImg) {
    window.__inputImageDataUri = null;
    input.value = '';
    previewImg.src = '';
    preview.classList.add('image-upload__preview--hidden');
    label.style.display = 'flex';
}

/**
 * Update visible settings based on selected model
 * @param {string} model - The selected model ID
 */
function updateSettingsForModel(model) {
    const stepsGroup = document.getElementById('steps-group');
    const stepsInput = document.getElementById('setting-steps');
    const stepsValue = document.getElementById('steps-value');
    const guidanceGroup = document.getElementById('guidance-group');
    const guidanceInput = document.getElementById('setting-guidance');
    const guidanceValue = document.getElementById('guidance-value');
    const negativePromptGroup = document.getElementById('negative-prompt-group');
    const turboGroup = document.getElementById('turbo-group');
    const accelerationGroup = document.getElementById('acceleration-group');
    const formatSelect = document.getElementById('setting-format');
    const inputImageGroup = document.getElementById('input-image-group');
    const inputImageHint = document.getElementById('input-image-hint');
    const imageSizeGroup = document.getElementById('image-size-group');
    const aspectRatioGroup = document.getElementById('aspect-ratio-group');
    const enhancePromptGroup = document.getElementById('enhance-prompt-group');

    if (model === 'qwen-image') {
        // Show Qwen-specific settings
        guidanceGroup?.classList.remove('settings-group--hidden');
        negativePromptGroup?.classList.remove('settings-group--hidden');
        turboGroup?.classList.remove('settings-group--hidden');
        inputImageGroup?.classList.remove('settings-group--hidden');
        imageSizeGroup?.classList.remove('settings-group--hidden');
        aspectRatioGroup?.classList.add('settings-group--hidden');
        enhancePromptGroup?.classList.add('settings-group--hidden');
        stepsGroup?.classList.remove('settings-group--hidden');
        accelerationGroup?.classList.remove('settings-group--hidden');

        // Update hint for optional image
        if (inputImageHint) {
            inputImageHint.textContent = 'Optional: Upload an image to edit with your prompt';
        }

        // Update guidance scale for Qwen (default 2.5)
        if (guidanceInput && guidanceValue) {
            guidanceInput.value = '2.5';
            guidanceValue.textContent = '2.5';
        }

        // Update steps range for Qwen (default 30, max higher)
        if (stepsInput) {
            stepsInput.max = '50';
            if (parseInt(stepsInput.value) > 50) {
                stepsInput.value = '30';
                if (stepsValue) stepsValue.textContent = '30';
            }
        }

        // Update format options (Qwen only supports png/jpeg)
        if (formatSelect) {
            const webpOption = formatSelect.querySelector('option[value="webp"]');
            if (webpOption) {
                webpOption.disabled = true;
                if (formatSelect.value === 'webp') {
                    formatSelect.value = 'png';
                }
            }
        }
    } else if (model === 'flux-kontext') {
        // Show FLUX Kontext settings
        guidanceGroup?.classList.remove('settings-group--hidden');
        negativePromptGroup?.classList.add('settings-group--hidden');
        turboGroup?.classList.add('settings-group--hidden');
        inputImageGroup?.classList.remove('settings-group--hidden');
        imageSizeGroup?.classList.add('settings-group--hidden');
        aspectRatioGroup?.classList.remove('settings-group--hidden');
        enhancePromptGroup?.classList.remove('settings-group--hidden');
        stepsGroup?.classList.add('settings-group--hidden');
        accelerationGroup?.classList.add('settings-group--hidden');

        // Update hint for required image
        if (inputImageHint) {
            inputImageHint.textContent = 'Required: Upload an image to edit';
        }

        // Update guidance scale for Kontext (default 3.5)
        if (guidanceInput && guidanceValue) {
            guidanceInput.value = '3.5';
            guidanceValue.textContent = '3.5';
        }

        // Update format options (Kontext only supports jpeg/png)
        if (formatSelect) {
            const webpOption = formatSelect.querySelector('option[value="webp"]');
            if (webpOption) {
                webpOption.disabled = true;
                if (formatSelect.value === 'webp') {
                    formatSelect.value = 'jpeg';
                }
            }
        }
    } else {
        // Show Z-Image Turbo settings (default)
        guidanceGroup?.classList.add('settings-group--hidden');
        negativePromptGroup?.classList.add('settings-group--hidden');
        turboGroup?.classList.add('settings-group--hidden');
        inputImageGroup?.classList.add('settings-group--hidden');
        imageSizeGroup?.classList.remove('settings-group--hidden');
        aspectRatioGroup?.classList.add('settings-group--hidden');
        enhancePromptGroup?.classList.add('settings-group--hidden');
        stepsGroup?.classList.remove('settings-group--hidden');
        accelerationGroup?.classList.remove('settings-group--hidden');

        // Reset steps range for Z-Image Turbo
        if (stepsInput) {
            stepsInput.max = '30';
            if (parseInt(stepsInput.value) > 30) {
                stepsInput.value = '30';
                if (stepsValue) stepsValue.textContent = '30';
            }
        }

        // Re-enable webp format
        if (formatSelect) {
            const webpOption = formatSelect.querySelector('option[value="webp"]');
            if (webpOption) {
                webpOption.disabled = false;
            }
        }
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

        // Always remove all placeholders first
        removeAllPlaceholders();

        if (response.images && response.images.length > 0) {
            // Add each generated image to state with settings for remix
            response.images.forEach((image) => {
                state.addImage({
                    id: generateId(),
                    url: image.url,
                    prompt: prompt,
                    createdAt: Date.now(),
                    settings: { ...settings }
                });
            });

            // Clear input and reset height
            input.value = '';
            autoResizeTextarea(input);
        }
    } catch (error) {
        console.error('Generation failed:', error);
        // Remove all placeholders on error
        removeAllPlaceholders();
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
 * Handle "Surprise Me" button - fill input with random creative prompt
 * @param {HTMLTextAreaElement} input - Prompt input element
 */
async function handleSurpriseMe(input) {
    const randomPrompt = getRandomPrompt();

    // Clear existing text
    input.value = '';

    // Typing animation effect
    let index = 0;
    const typingSpeed = 15; // ms per character

    const typeNextChar = () => {
        if (index < randomPrompt.length) {
            input.value += randomPrompt[index];
            index++;
            autoResizeTextarea(input);
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // Done typing - flash and focus
            flashInput(input);
            input.focus();
        }
    };

    typeNextChar();
}

/**
 * Handle remix-image event from lightbox
 * @param {CustomEvent} event - Custom event with image data
 */
function handleRemixImage(event) {
    const image = event.detail;
    if (!image) return;

    const promptInput = document.getElementById('prompt-input');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');

    // 1. Set the prompt input value
    if (promptInput) {
        promptInput.value = image.prompt || '';
        autoResizeTextarea(promptInput);
    }

    // 2. Restore settings if available
    if (image.settings) {
        restoreSettings(image.settings);
    }

    // 3. Open the settings panel
    if (settingsBtn && settingsPanel) {
        openSettings(settingsBtn, settingsPanel);
    }

    // 4. Close the lightbox
    closeLightbox();

    // 5. Flash input to indicate readiness
    if (promptInput) {
        flashInput(promptInput);
        promptInput.focus();
    }
}

/**
 * Restore settings from saved image data
 * @param {Object} settings - Saved generation settings
 */
function restoreSettings(settings) {
    // Image size
    const imageSizeSelect = document.getElementById('setting-image-size');
    const customSizeGroup = document.getElementById('custom-size-group');
    const widthInput = document.getElementById('setting-width');
    const heightInput = document.getElementById('setting-height');

    if (imageSizeSelect && settings.image_size) {
        if (typeof settings.image_size === 'object') {
            // Custom size
            imageSizeSelect.value = 'custom';
            if (customSizeGroup) customSizeGroup.classList.remove('settings-group--hidden');
            if (widthInput) widthInput.value = settings.image_size.width || 1024;
            if (heightInput) heightInput.value = settings.image_size.height || 768;
        } else {
            imageSizeSelect.value = settings.image_size;
            if (customSizeGroup) customSizeGroup.classList.add('settings-group--hidden');
        }
    }

    // Inference steps
    const stepsInput = document.getElementById('setting-steps');
    const stepsValue = document.getElementById('steps-value');
    if (stepsInput && settings.num_inference_steps !== undefined) {
        stepsInput.value = settings.num_inference_steps;
        if (stepsValue) stepsValue.textContent = settings.num_inference_steps;
    }

    // Number of images
    const numImagesSelect = document.getElementById('setting-num-images');
    if (numImagesSelect && settings.num_images !== undefined) {
        numImagesSelect.value = settings.num_images;
    }

    // Output format
    const formatSelect = document.getElementById('setting-format');
    if (formatSelect && settings.output_format) {
        formatSelect.value = settings.output_format;
    }

    // Acceleration
    const accelerationSelect = document.getElementById('setting-acceleration');
    if (accelerationSelect && settings.acceleration) {
        accelerationSelect.value = settings.acceleration;
    }

    // Seed
    const seedInput = document.getElementById('setting-seed');
    if (seedInput) {
        seedInput.value = settings.seed !== undefined ? settings.seed : '';
    }

    // Safety checker
    const safetyCheckbox = document.getElementById('setting-safety');
    if (safetyCheckbox && settings.enable_safety_checker !== undefined) {
        safetyCheckbox.checked = settings.enable_safety_checker;
    }

    // Sync mode
    const syncCheckbox = document.getElementById('setting-sync');
    if (syncCheckbox && settings.sync_mode !== undefined) {
        syncCheckbox.checked = settings.sync_mode;
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

    const sendIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>`;
    const loadingIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

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
    const newHeight = Math.min(textarea.scrollHeight, 150);
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
