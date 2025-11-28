/**
 * API module for communicating with the serverless function
 */

const API_ENDPOINT = '/api/generate';

/**
 * @typedef {Object} GenerateResponse
 * @property {Array<{url: string}>} images - Generated images
 */

/**
 * Generate an image from a prompt
 * @param {string} prompt - Image description prompt
 * @returns {Promise<GenerateResponse>}
 * @throws {Error} If generation fails
 */
export async function generateImage(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt is required');
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
        throw new Error('Prompt cannot be empty');
    }

    try {
        const response = await fetch(API_ENDPOINT, {
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
