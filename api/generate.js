export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        prompt,
        image_size = 'landscape_4_3',
        num_inference_steps = 30,
        num_images = 1,
        seed,
        output_format = 'png',
        enable_safety_checker = true,
        sync_mode = false,
        acceleration = 'none'
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const FAL_KEY = process.env.FAL_KEY;

    if (!FAL_KEY) {
        return res.status(500).json({ error: 'FAL_KEY environment variable is not configured' });
    }

    // Build request payload with configurable parameters
    const payload = {
        prompt: prompt.trim(),
        image_size,
        num_inference_steps: parseInt(num_inference_steps, 10),
        num_images: parseInt(num_images, 10),
        enable_safety_checker,
        output_format,
        sync_mode,
        acceleration,
    };

    // Only include seed if provided
    if (seed !== undefined && seed !== null && seed !== '') {
        payload.seed = parseInt(seed, 10);
    }

    try {
        const response = await fetch('https://fal.run/fal-ai/z-image/turbo', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fal.ai API error:', errorText);
            return res.status(response.status).json({
                error: 'Failed to generate image',
                details: errorText
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
