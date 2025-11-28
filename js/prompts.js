/**
 * Creative prompt suggestions for the "Surprise Me" feature
 */

export const creativePrompts = [
    // Photorealistic
    "A majestic snow leopard resting on a Himalayan cliff at golden hour, photorealistic, National Geographic style, 8K resolution",
    "An elderly Japanese fisherman mending nets at dawn in a misty harbor, documentary photography, natural lighting",
    "A hidden waterfall in an ancient forest with sunbeams piercing through the canopy, hyper-realistic nature photography",

    // 3D Render
    "A cozy floating island with a tiny cottage, windmill, and garden, 3D render, soft lighting, Pixar style",
    "Futuristic space station interior with holographic displays and neon accents, 3D render, Unreal Engine 5",
    "A magical library where books fly between shelves, isometric 3D render, whimsical lighting",

    // Oil Painting
    "A Venetian carnival masquerade at twilight, oil painting style, baroque influences, rich colors and dramatic lighting",
    "Storm clouds gathering over a lone lighthouse on rocky cliffs, oil painting, romanticism style, moody atmosphere",
    "A mystical forest spirit emerging from ancient oak trees, oil painting, Pre-Raphaelite style",

    // Cyberpunk
    "A neon-lit ramen shop in a rainy Tokyo alley, cyberpunk aesthetic, volumetric fog, reflections on wet pavement",
    "A cyborg street musician playing holographic instruments in a dystopian marketplace, cyberpunk, vibrant neon colors",
    "Aerial view of a mega-city at night with flying vehicles and massive LED billboards, cyberpunk 2077 style",

    // Fantasy
    "A dragon made of living gemstones perched atop a crystal mountain, fantasy art, iridescent scales, magical atmosphere",
    "An underwater elven city with bioluminescent architecture and coral spires, fantasy concept art",
    "A traveling merchant's caravan crossing a bridge made of giant autumn leaves, whimsical fantasy illustration",

    // Surreal
    "A giant whale swimming through clouds above a Victorian city, surrealist art, dreamy atmosphere",
    "A staircase that transforms into a flowing river of stars, surreal digital art, M.C. Escher inspired",
    "A room where gravity pulls in multiple directions with floating furniture, surrealist interior",

    // Anime/Manga
    "A samurai standing in a field of red spider lilies under a blood moon, anime style, dramatic composition",
    "A magical girl summoning cherry blossom petals in a glowing enchanted forest, anime art, Studio Ghibli inspired",
    "A mecha robot powering up in a thunderstorm, anime style, dynamic pose, lightning effects",

    // Vintage/Retro
    "A 1950s diner on Mars with rocket ships parked outside, retro-futurism, chrome and pastel colors",
    "A Victorian lady inventor in her steampunk workshop surrounded by brass automatons, vintage illustration style",
    "An Art Deco poster featuring a jazz club in the roaring twenties, geometric patterns, gold and black",

    // Abstract/Artistic
    "The concept of time visualized as melting clocks flowing through a galaxy, abstract digital art",
    "Human emotions represented as swirling colors and shapes, abstract expressionism, vivid palette",
    "Music visualized as architectural structures, synesthesia art, flowing geometric forms",

    // Nature/Macro
    "A dewdrop on a spider web reflecting an entire miniature world, macro photography, morning light",
    "Bioluminescent mushrooms in a fairy ring deep in an enchanted forest, magical realism, ethereal glow",
    "The northern lights dancing over a frozen lake with perfect reflections, astrophotography style",

    // Architecture
    "A treehouse village connected by rope bridges in an ancient redwood forest, architectural visualization",
    "A futuristic eco-city built into a mountainside with vertical gardens, sustainable architecture concept",
    "An abandoned cathedral reclaimed by nature with trees growing through stained glass windows",

    // Food Art
    "A miniature world built entirely from sushi and Japanese cuisine, food photography, creative composition",
    "A magical tea party where the cups and treats float in mid-air, whimsical food illustration",

    // Portrait/Character
    "A wise old wizard with a beard containing tiny galaxies and nebulae, fantasy portrait, magical lighting",
    "A forest guardian with antlers made of flowering branches and eyes like amber, ethereal portrait",
    "A time traveler from 3000 AD wearing biomechanical armor, sci-fi character design"
];

/**
 * Get a random creative prompt
 * @returns {string}
 */
export function getRandomPrompt() {
    const index = Math.floor(Math.random() * creativePrompts.length);
    return creativePrompts[index];
}
