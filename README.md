# ✨ AI Image Generator

A lightweight, single-page AI image generator powered by [Fal.ai](https://fal.ai/). Built with vanilla JavaScript (ES Modules) and deployable to Vercel with zero build configuration.

![Dark Mode UI](https://img.shields.io/badge/UI-Dark%20Mode-1a1a1a)
![No Build Tools](https://img.shields.io/badge/Build-None%20Required-green)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black)

## Features

- 🎨 **AI Image Generation** - Generate images from text prompts using Fal.ai's Z-Image Turbo model
- 🖼️ **Masonry Gallery** - Responsive grid layout (1/2/3+ columns)
- ✨ **Golden Shimmer Loading** - Beautiful loading animation while generating
- 💾 **Persistent Storage** - Images saved to localStorage
- 🔍 **Lightbox View** - Click any image for full-screen preview
- ⬇️ **Download Images** - Save generated images directly
- 🌙 **Dark Mode** - Easy on the eyes
- 🚀 **Zero Build** - No Webpack, Vite, or bundlers needed

## Tech Stack

- **Frontend:** HTML5, CSS3 (Variables + Flexbox/Grid), Vanilla JS (ES6 Modules)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Storage:** localStorage
- **API:** Fal.ai Z-Image Turbo

## Project Structure

```
├── api/
│   └── generate.js       # Vercel serverless function (Fal.ai proxy)
├── css/
│   ├── base.css          # Reset, variables, dark mode colors
│   ├── layout.css        # Main container, centering
│   ├── components.css    # Input bar, buttons, modal
│   └── gallery.css       # Masonry grid, cards, shimmer animations
├── js/
│   ├── app.js            # Main entry point
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

3. **Add Environment Variable**
   - Name: `FAL_KEY`
   - Value: Your Fal.ai API key

4. **Deploy!**

Or use the CLI:

```bash
vercel --prod
```

## API Parameters

The serverless function accepts these parameters in the POST body:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | *required* | Image description |
| `image_size` | string/object | `landscape_4_3` | Size preset or `{width, height}` |
| `num_inference_steps` | integer | `30` | Quality (higher = better, slower) |
| `num_images` | integer | `1` | Number of images to generate |
| `seed` | integer | *random* | For reproducible results |
| `output_format` | string | `png` | `jpeg`, `png`, or `webp` |
| `enable_safety_checker` | boolean | `true` | NSFW content filter |

### Image Size Presets

- `square_hd` - High-def square
- `square` - Standard square
- `portrait_4_3` - Portrait 4:3
- `portrait_16_9` - Portrait 16:9
- `landscape_4_3` - Landscape 4:3 (default)
- `landscape_16_9` - Landscape 16:9

## Usage

1. Type a description of the image you want to create
2. Click the ✨ button or press Enter
3. Watch the golden shimmer while your image generates
4. Hover over images to see options (download, view)
5. Click any image for fullscreen view

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [Fal.ai](https://fal.ai/) for the amazing Z-Image Turbo model
- [Vercel](https://vercel.com/) for serverless hosting
