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
        max_images,
        seed,
        output_format = 'png',
        enable_safety_checker = false,
        sync_mode = false,
        acceleration = 'none',
        // Qwen-specific parameters
        guidance_scale = 2.5,
        negative_prompt = '',
        use_turbo = false,
        image_url = null,
        image_urls = [],
        // FLUX Kontext parameters
        aspect_ratio = '1:1',
        safety_tolerance = '2',
        enhance_prompt = false
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate num_images
    const parsedNumImages = parseInt(num_images, 10);
    if (!Number.isInteger(parsedNumImages) || parsedNumImages < 1 || parsedNumImages > 4) {
        return res.status(400).json({ error: '`num_images` must be an integer between 1 and 4' });
    }

    const FAL_KEY = process.env.FAL_KEY;

    if (!FAL_KEY) {
        return res.status(500).json({ error: 'FAL_KEY environment variable is not configured' });
    }

    // Determine API endpoint and build payload based on model
    let apiEndpoint;
    let payload;

    // Normalize image URLs for models that require them
    const normalizedImageUrls = Array.isArray(image_urls)
        ? image_urls.filter((url) => typeof url === 'string' && url.trim() !== '')
        : [];
    if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
        normalizedImageUrls.push(image_url.trim());
    }

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
    } else if (model === 'hunyuan-image') {
        // Hunyuan Image 3.0 model
        apiEndpoint = 'https://fal.run/fal-ai/hunyuan-image/v3/text-to-image';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10) || 28,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: false, // Disabled by default for Hunyuan
            output_format: output_format === 'webp' ? 'png' : output_format, // Hunyuan only supports jpeg/png
            sync_mode,
            guidance_scale: parseFloat(guidance_scale) || 7.5,
        };

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add enable_prompt_expansion if provided
        if (enhance_prompt !== undefined) {
            payload.enable_prompt_expansion = enhance_prompt;
        }

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'flux-dev') {
        // FLUX.1 [dev] model
        apiEndpoint = 'https://fal.run/fal-ai/flux/dev';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10) || 50,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: false, // Disabled by default for FLUX.1 [dev]
            output_format: output_format === 'webp' ? 'jpeg' : output_format, // FLUX.1 [dev] only supports jpeg/png
            sync_mode,
            guidance_scale: parseFloat(guidance_scale) || 3.5,
            acceleration,
        };

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'flux-kontext-lora-t2i') {
        // FLUX Kontext LoRA Text-to-Image model
        apiEndpoint = 'https://fal.run/fal-ai/flux-kontext-lora/text-to-image';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10) || 30,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: false, // Disabled by default
            output_format: output_format === 'webp' ? 'png' : output_format, // Only supports jpeg/png
            sync_mode,
            guidance_scale: parseFloat(guidance_scale) || 2.5,
            acceleration,
        };

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'piflow') {
        // Piflow model - fast with good quality
        apiEndpoint = 'https://fal.run/fal-ai/piflow';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_inference_steps: parseInt(num_inference_steps, 10) || 8,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: false, // Disabled by default
            output_format: output_format === 'webp' ? 'jpeg' : output_format, // Only supports jpeg/png
            sync_mode,
        };

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'seedream-45') {
        // ByteDance Seedream 4.5 Text-to-Image
        apiEndpoint = 'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: enable_safety_checker ?? false, // default to lowest safety
            sync_mode,
        };

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }

        // Support optional multi-image generation if provided
        if (max_images !== undefined && max_images !== null && max_images !== '') {
            payload.max_images = parseInt(max_images, 10);
        }
    } else if (model === 'seedream-45-edit') {
        // ByteDance Seedream 4.5 Image-to-Image (edit)
        if (!normalizedImageUrls.length) {
            return res.status(400).json({ error: 'Seedream 4.5 Edit requires at least one input image' });
        }

        apiEndpoint = 'https://fal.run/fal-ai/bytedance/seedream/v4.5/edit';
        payload = {
            prompt: prompt.trim(),
            image_size,
            num_images: parseInt(num_images, 10),
            enable_safety_checker: enable_safety_checker ?? false, // lowest safety by default
            sync_mode,
            image_urls: normalizedImageUrls.slice(-10), // API allows up to 10 inputs
        };

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }

        // Support optional multi-image generation if provided
        if (max_images !== undefined && max_images !== null && max_images !== '') {
            payload.max_images = parseInt(max_images, 10);
        }
    } else if (model === 'reve') {
        // Reve model - text rendering and aesthetic quality
        apiEndpoint = 'https://fal.run/fal-ai/reve/text-to-image';
        payload = {
            prompt: prompt.trim(),
            aspect_ratio: aspect_ratio || '3:2',
            num_images: parseInt(num_images, 10),
            output_format,
            sync_mode,
        };
    } else if (model === 'nano-banana-pro-edit') {
        // Nano Banana Pro Edit - image-to-image editing (requires image_urls)
        if (normalizedImageUrls.length === 0) {
            return res.status(400).json({ error: 'Nano Banana Pro Edit requires at least one input image' });
        }

        apiEndpoint = 'https://fal.run/fal-ai/nano-banana-pro/edit';
        payload = {
            prompt: prompt.trim(),
            image_urls: normalizedImageUrls,
            num_images: parseInt(num_images, 10),
            output_format: output_format || 'png',
            sync_mode,
        };

        // Add aspect_ratio if provided
        if (aspect_ratio) {
            payload.aspect_ratio = aspect_ratio;
        }

        // Add resolution if provided (1K, 2K, 4K)
        const resolution = req.body.resolution || '1K';
        payload.resolution = resolution;

        // Add optional parameters
        if (req.body.limit_generations !== undefined) {
            payload.limit_generations = req.body.limit_generations;
        }
        if (req.body.enable_web_search !== undefined) {
            payload.enable_web_search = req.body.enable_web_search;
        }
    } else if (model === 'fibo') {
        // Fibo - text-to-image with optional reference image
        apiEndpoint = 'https://fal.run/bria/fibo/generate';
        payload = {
            prompt: prompt.trim(),
            seed: seed !== undefined && seed !== null && seed !== '' ? parseInt(seed, 10) : 5555,
            steps_num: parseInt(num_inference_steps, 10) || 50,
            guidance_scale: parseFloat(guidance_scale) || 5,
            sync_mode,
        };

        // Add aspect_ratio if provided
        if (aspect_ratio) {
            payload.aspect_ratio = aspect_ratio;
        }

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add optional reference image
        if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
            payload.image_url = image_url.trim();
        }
    } else if (model === 'wan-26-text-to-image') {
        // Wan v2.6 Text-to-Image
        apiEndpoint = 'https://fal.run/wan/v2.6/text-to-image';
        payload = {
            prompt: prompt.trim(),
            image_size,
            max_images: parseInt(num_images, 10), // uses max_images instead of num_images
            enable_safety_checker: enable_safety_checker ?? false, // default to lowest safety
            sync_mode,
        };

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add optional reference image (0 or 1 image)
        if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
            payload.image_url = image_url.trim();
        }

        // Add seed if provided
        if (seed !== undefined && seed !== null && seed !== '') {
            payload.seed = parseInt(seed, 10);
        }
    } else if (model === 'wan-26-image-to-image') {
        // Wan v2.6 Image-to-Image - requires 1-3 input images
        if (normalizedImageUrls.length < 1 || normalizedImageUrls.length > 3) {
            return res.status(400).json({ error: 'Wan v2.6 Image-to-Image requires 1-3 input images' });
        }

        apiEndpoint = 'https://fal.run/wan/v2.6/image-to-image';
        payload = {
            prompt: prompt.trim(),
            image_urls: normalizedImageUrls.slice(0, 3), // API allows 1-3 inputs
            image_size,
            num_images: parseInt(num_images, 10), // uses num_images (1-4)
            enable_safety_checker: enable_safety_checker ?? false, // default to lowest safety
            sync_mode,
        };

        // Add negative prompt if provided
        if (negative_prompt && negative_prompt.trim() !== '') {
            payload.negative_prompt = negative_prompt.trim();
        }

        // Add enable_prompt_expansion if provided (default true)
        if (enhance_prompt !== undefined) {
            payload.enable_prompt_expansion = enhance_prompt;
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
