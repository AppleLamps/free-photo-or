# ✨ AI Image Generator

A beautiful, lightweight AI image generator powered by [Fal.ai](https://fal.ai/). Built with vanilla JavaScript (ES Modules) and deployable to Vercel with zero build configuration.

![Light Mode UI](https://img.shields.io/badge/UI-Light%20Mode-ffffff)
![No Build Tools](https://img.shields.io/badge/Build-None%20Required-green)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black)

## Features

- 🎨 **AI Image Generation** - Generate images from text prompts using Fal.ai's Z-Image Turbo model
- ✨ **Prompt Enhancement** - AI-powered prompt improvement using OpenRouter (Grok 4 Fast)
- 🖼️ **Grid Gallery** - Responsive thumbnail grid with click-to-expand lightbox
- 🌟 **Golden Shimmer Loading** - Beautiful golden loading animation while generating
- ⚙️ **Full Settings Panel** - Configure image size, steps, number of images, format, and more
- 💾 **Persistent Storage** - Images saved to localStorage
- 🔍 **Lightbox View** - Click any thumbnail for full-screen preview with download option
- 📋 **Copy Prompt** - Copy prompts directly from the lightbox
- ⬇️ **Download Images** - Save generated images directly
- ☀️ **Light Mode** - Clean, modern light theme with black accents
- 🚀 **Zero Build** - No Webpack, Vite, or bundlers needed

## Tech Stack

- **Frontend:** HTML5, CSS3 (Variables + Flexbox/Grid), Vanilla JS (ES6 Modules)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Storage:** localStorage
- **APIs:**
  - Fal.ai Z-Image Turbo (image generation)
  - OpenRouter / Grok 4 Fast (prompt enhancement)

## Project Structure

```
├── api/
│   ├── generate.js       # Vercel serverless function (Fal.ai proxy)
│   └── enhance.js        # Vercel serverless function (OpenRouter proxy)
├── css/
│   ├── base.css          # Reset, variables, light mode colors
│   ├── layout.css        # Main container, centering
│   ├── components.css    # Input bar, buttons, modal, settings panel
│   └── gallery.css       # Grid layout, cards, shimmer animations
├── js/
│   ├── app.js            # Main entry point, settings management
│   ├── api.js            # Client-side API wrapper
│   ├── state.js          # State management & localStorage
│   ├── utils.js          # Helper functions
│   └── gallery.js        # Gallery rendering & lightbox
├── index.html            # Main HTML file
├── vercel.json           # Vercel configuration
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (for Vercel CLI, optional for local dev)
- [Fal.ai API Key](https://fal.ai/) - Sign up and get your API key
- [OpenRouter API Key](https://openrouter.ai/) - For prompt enhancement feature (optional)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ai-image-generator.git
   cd ai-image-generator
   ```

2. **Install Vercel CLI** (if not already installed)

   ```bash
   npm install -g vercel
   ```

3. **Set up environment variables**

   ```bash
   # Create .env.local file
   echo "FAL_KEY=your_fal_api_key_here" > .env.local
   echo "OPENROUTER_API_KEY=your_openrouter_key_here" >> .env.local
   ```

4. **Run locally with Vercel**

   ```bash
   vercel dev
   ```

5. **Open in browser**

   ```
   http://localhost:3000
   ```

### Deploy to Vercel

1. **Push to GitHub** (or GitLab/Bitbucket)

2. **Import in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository

3. **Add Environment Variables**
   - `FAL_KEY` - Your Fal.ai API key
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (optional, for prompt enhancement)

4. **Deploy!**

Or use the CLI:

```bash
vercel --prod
```

## API Parameters

The generate serverless function accepts these parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | *required* | Image description |
| `image_size` | string/object | `square_hd` | Size preset or `{width, height}` |
| `num_inference_steps` | integer | `30` | Quality (higher = better, slower) |
| `num_images` | integer | `2` | Number of images to generate (1-4) |
| `seed` | integer | *random* | For reproducible results |
| `output_format` | string | `png` | `jpeg`, `png`, or `webp` |
| `enable_safety_checker` | boolean | `false` | NSFW content filter |
| `sync_mode` | boolean | `false` | Wait for completion |
| `acceleration` | string | `none` | `none`, `regular`, or `high` |

### Image Size Presets

- `square_hd` - High-def square (default)
- `square` - Standard square
- `portrait_4_3` - Portrait 4:3
- `portrait_16_9` - Portrait 16:9
- `landscape_4_3` - Landscape 4:3
- `landscape_16_9` - Landscape 16:9
- `custom` - Custom dimensions (256-2048px)

## Usage

1. Type a description of the image you want to create
2. (Optional) Click the ✨ sparkle button to enhance your prompt with AI
3. Click the send button or press Enter to generate
4. Watch the golden shimmer while your images generate
5. Click any thumbnail for fullscreen view
6. Use the download button or copy the prompt from the lightbox

### Settings Panel

Click the settings icon (grid) to configure:

- Image size preset or custom dimensions
- Number of inference steps (1-50)
- Number of images per generation (1-4)
- Output format (PNG, JPEG, WebP)
- Acceleration mode
- Seed for reproducibility
- Safety checker toggle

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [Fal.ai](https://fal.ai/) for the amazing Z-Image Turbo model
- [OpenRouter](https://openrouter.ai/) for AI prompt enhancement
- [Vercel](https://vercel.com/) for serverless hosting
