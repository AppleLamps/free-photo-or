/**
 * API module for communicating with the serverless function
 */

const API_ENDPOINT = '/api/generate';
const ENHANCE_ENDPOINT = '/api/enhance';

/**
 * @typedef {Object} GenerateOptions
 * @property {string} [model] - Model to use (z-image-turbo, qwen-image)
 * @property {string} [image_size] - Image size preset or custom dimensions
 * @property {number} [num_inference_steps] - Number of inference steps
 * @property {number} [seed] - Seed for reproducibility
 * @property {boolean} [sync_mode] - Whether to use sync mode
 * @property {number} [num_images] - Number of images to generate
 * @property {boolean} [enable_safety_checker] - Enable safety checker
 * @property {string} [output_format] - Output format (png, jpeg, webp)
 * @property {string} [acceleration] - Acceleration level (none, regular, high)
 * @property {number} [guidance_scale] - CFG scale (Qwen only)
 * @property {string} [negative_prompt] - Negative prompt (Qwen only)
 * @property {boolean} [use_turbo] - Turbo mode (Qwen only)
 */

/**
 * @typedef {Object} GenerateResponse
 * @property {Array<{url: string}>} images - Generated images
 */

/**
 * Generate an image from a prompt
 * @param {string} prompt - Image description prompt
 * @param {GenerateOptions} [options] - Optional generation parameters
 * @returns {Promise<GenerateResponse>}
 * @throws {Error} If generation fails
 */
export async function generateImage(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt is required');
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
        throw new Error('Prompt cannot be empty');
    }

    // Build request body with prompt and options
    const requestBody = {
        prompt: trimmedPrompt,
        ...options
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
            throw new Error('Invalid response: no images returned');
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: please check your connection');
        }
        throw error;
    }
}

/**
 * Enhance a prompt using AI
 * @param {string} currentPrompt - The current prompt to enhance
 * @returns {Promise<string>} The enhanced prompt
 * @throws {Error} If enhancement fails
 */
export async function enhancePrompt(currentPrompt) {
    if (!currentPrompt || typeof currentPrompt !== 'string') {
        throw new Error('Prompt is required');
    }

    const trimmedPrompt = currentPrompt.trim();
    if (trimmedPrompt.length === 0) {
        throw new Error('Prompt cannot be empty');
    }

    try {
        const response = await fetch(ENHANCE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: trimmedPrompt }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.enhancedPrompt) {
            throw new Error('Invalid response: no enhanced prompt returned');
        }

        return data.enhancedPrompt;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: please check your connection');
        }
        throw error;
    }
}
