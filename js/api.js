/**
 * API module for communicating with the serverless function
 */

const API_ENDPOINT = '/api/generate';
const ENHANCE_ENDPOINT = '/api/enhance';

/**
 * @typedef {Object} GenerateOptions
 * @property {string} [model] - Model to use (z-image-turbo, wan-26-text-to-image, wan-26-image-to-image, nano-banana-pro-edit, fibo, etc.)
 * @property {string} [image_size] - Image size preset or custom dimensions
 * @property {number} [num_inference_steps] - Number of inference steps
 * @property {number} [seed] - Seed for reproducibility
 * @property {boolean} [sync_mode] - Whether to use sync mode
 * @property {number} [num_images] - Number of images to generate
 * @property {number} [max_images] - Optional max images per generation (Seedream, Wan)
 * @property {boolean} [enable_safety_checker] - Enable safety checker
 * @property {string} [output_format] - Output format (png, jpeg, webp)
 * @property {string} [acceleration] - Acceleration level (none, regular, high)
 * @property {number} [guidance_scale] - CFG scale (Qwen, FLUX Kontext, Fibo)
 * @property {string} [negative_prompt] - Negative prompt (Qwen, HiDream, Wan, Fibo)
 * @property {boolean} [use_turbo] - Turbo mode (Qwen only)
 * @property {string} [image_url] - Input image URL or data URI for editing (Qwen, FLUX Kontext, Wan text-to-image, Fibo)
 * @property {string[]} [image_urls] - Input image URLs/data URIs list (Seedream 4.5 Edit, Wan image-to-image, Nano Banana Pro)
 * @property {string} [aspect_ratio] - Aspect ratio (FLUX Kontext, Nano Banana Pro, Fibo)
 * @property {string} [safety_tolerance] - Safety tolerance level 1-6 (FLUX Kontext only)
 * @property {boolean} [enhance_prompt] - Enhance prompt (FLUX Kontext, Wan image-to-image)
 * @property {string} [resolution] - Resolution (1K, 2K, 4K) for Nano Banana Pro
 * @property {boolean} [limit_generations] - Limit generations per prompt to 1 (Nano Banana Pro)
 * @property {boolean} [enable_web_search] - Enable web search for image generation (Nano Banana Pro)
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
