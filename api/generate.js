module.exports = async function handler(req, res) {
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
        model = 'z-image-turbo',
        image_size = 'landscape_4_3',
        num_inference_steps = 30,
        num_images = 1,
        seed,
        output_format = 'png',
        enable_safety_checker = true,
        sync_mode = false,
        acceleration = 'none',
        // Qwen-specific parameters
        guidance_scale = 2.5,
        negative_prompt = '',
        use_turbo = false,
        image_url = null,
        // FLUX Kontext parameters
        aspect_ratio = '1:1',
        safety_tolerance = '2',
        enhance_prompt = false
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const FAL_KEY = process.env.FAL_KEY;

    if (!FAL_KEY) {
        return res.status(500).json({ error: 'FAL_KEY environment variable is not configured' });
    }

    // Determine API endpoint and build payload based on model
    let apiEndpoint;
    let payload;

    if (model === 'qwen-image') {
        // Qwen Image model
        apiEndpoint = 'https://fal.run/fal-ai/qwen-image';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10),
            num_images: parseInt(num_images, 10),
            enable_safety_checker,
            output_format: output_format === 'webp' ? 'png' : output_format, // Qwen only supports png/jpeg
            sync_mode,
            guidance_scale: parseFloat(guidance_scale),
            use_turbo,
        };

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }

        // Add acceleration if provided (Qwen supports none, regular, high)
        if (acceleration && acceleration !== 'none') {
            payload.acceleration = acceleration;
        }

        // Add input image URL if provided (for image editing)
        if (image_url) {
            payload.image_url = image_url;
        }
    } else if (model === 'flux-kontext') {
        // FLUX.1 Kontext [pro] model - requires image_url
        if (!image_url) {
            return res.status(400).json({ error: 'FLUX Kontext requires an input image' });
        }

        apiEndpoint = 'https://fal.run/fal-ai/flux-pro/kontext';
        payload = {
            prompt: prompt.trim(),
            image_url,
            num_images: parseInt(num_images, 10),
            output_format: output_format === 'webp' ? 'jpeg' : output_format, // Kontext only supports jpeg/png
            sync_mode,
            guidance_scale: parseFloat(guidance_scale),
            safety_tolerance: safety_tolerance,
            enhance_prompt,
        };

        // Add aspect ratio if provided
        if (aspect_ratio) {
            payload.aspect_ratio = aspect_ratio;
        }

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'hidream-i1-fast') {
        // HiDream I1 Fast model
        apiEndpoint = 'https://fal.run/fal-ai/hidream-i1-fast';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10) || 50,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: false, // Disabled by default for HiDream
            output_format: output_format === 'webp' ? 'jpeg' : output_format, // HiDream only supports jpeg/png
            sync_mode,
        };

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else {
        // Z-Image Turbo model (default)
        apiEndpoint = 'https://fal.run/fal-ai/z-image/turbo';
        payload = {
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
    }

    try {
        const response = await fetch(apiEndpoint, {
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
