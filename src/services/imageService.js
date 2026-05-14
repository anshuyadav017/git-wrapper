const Jimp = require('jimp');

const LANGUAGE_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Swift: '#fa7343',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB'
};

let fontCache = {};

const loadFontCached = async (fontType) => {
  if (!fontCache[fontType]) {
    try {
      fontCache[fontType] = await Jimp.loadFont(fontType);
    } catch (e) {
      console.error(`Font loading failed for ${fontType}`);
      return null;
    }
  }
  return fontCache[fontType];
};

const getLanguageColor = (lang) => LANGUAGE_COLORS[lang] || '#8b949e';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 139, g: 148, b: 158 };
}

const drawGradient = (image, startColor, endColor, width, height) => {
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);
  
  for (let y = 0; y < height; y++) {
    const ratio = y / height;
    const r = Math.floor(startRgb.r + (endRgb.r - startRgb.r) * ratio);
    const g = Math.floor(startRgb.g + (endRgb.g - startRgb.g) * ratio);
    const b = Math.floor(startRgb.b + (endRgb.b - startRgb.b) * ratio);
    
    for (let x = 0; x < width; x++) {
      image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
    }
  }
};

const drawWrappedCard = async (stats) => {
  try {
    const width = 1000;
    const height = 600;

    const image = new Jimp(width, height, 0x0d1117ff);

    const accentColor = getLanguageColor(stats.topLanguages[0]?.name);
    const accentRgb = hexToRgb(accentColor);

    // Better gradient background
    drawGradient(image, '#0d1117', '#161b22', width, height);

    // Add accent color overlay
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < Math.min(width, width * 0.3); x++) {
        const alpha = 0.08 * (1 - x / (width * 0.3));
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        image.setPixelColor(
          Jimp.rgbaToInt(
            Math.floor(pixel.r + accentRgb.r * alpha),
            Math.floor(pixel.g + accentRgb.g * alpha),
            Math.floor(pixel.b + accentRgb.b * alpha),
            255
          ),
          x, y
        );
      }
    }

    // Load fonts (cached)
    const fontLarge = await loadFontCached(Jimp.FONT_SANS_32_WHITE);
    const fontMedium = await loadFontCached(Jimp.FONT_SANS_16_WHITE);
    const fontSmall = await loadFontCached(Jimp.FONT_SANS_12_WHITE);

    // Avatar with enhanced circular mask and glow
    try {
      const avatarImg = await Jimp.read(stats.avatarUrl);
      avatarImg.resize(140, 140);

      const mask = new Jimp(140, 140, 0x00000000);
      for (let y = 0; y < 140; y++) {
        for (let x = 0; x < 140; x++) {
          const dx = x - 70;
          const dy = y - 70;
          if (dx * dx + dy * dy <= 4900) {
            mask.setPixelColor(0xffffffff, x, y);
          }
        }
      }

      avatarImg.mask(mask, 0, 0);
      image.composite(avatarImg, 70, 60);

      // Avatar glow ring
      const glowRadius = 75;
      for (let i = 0; i < 4; i++) {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
          const x = Math.round(140 + Math.cos(angle) * (glowRadius + i * 2));
          const y = Math.round(130 + Math.sin(angle) * (glowRadius + i * 2));
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const alpha = (4 - i) / 4 * 0.6;
            const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
            image.setPixelColor(
              Jimp.rgbaToInt(
                Math.floor(pixel.r + accentRgb.r * alpha),
                Math.floor(pixel.g + accentRgb.g * alpha),
                Math.floor(pixel.b + accentRgb.b * alpha),
                255
              ),
              x, y
            );
          }
        }
      }
    } catch (e) {
      console.error('Avatar loading failed:', e.message);
    }

    // Username and badge
    if (fontLarge) {
      image.print(fontLarge, 270, 90, `@${stats.username}`);
    }
    if (fontMedium) {
      image.print(fontMedium, 270, 145, stats.personalityBadge || '🌟 Developer');
      image.print(fontSmall, 270, 175, `${stats.followersCount} followers • ${stats.followingCount} following`);
    }

    // Enhanced stats tiles
    const statValues = [
      { label: 'Commits', value: stats.totalCommits.toString(), x: 50, y: 250 },
      { label: 'Streak', value: `${stats.longestStreak}d`, x: 300, y: 250 },
      { label: 'PRs', value: stats.totalPRs.toString(), x: 550, y: 250 },
      { label: 'Stars', value: stats.totalStars.toString(), x: 800, y: 250 }
    ];

    for (const stat of statValues) {
      for (let y = stat.y; y < stat.y + 100; y++) {
        for (let x = stat.x; x < stat.x + 150; x++) {
          if (y >= height || x >= width) continue;
          if (y >= stat.y && y < stat.y + 3) {
            image.setPixelColor(Jimp.rgbaToInt(accentRgb.r, accentRgb.g, accentRgb.b, 255), x, y);
          } else if (y >= stat.y + 3) {
            image.setPixelColor(0x21262dff, x, y);
          }
        }
      }
      
      if (fontLarge) {
        image.print(fontLarge, stat.x + 20, stat.y + 20, stat.value);
      }
      if (fontSmall) {
        image.print(fontSmall, stat.x + 20, stat.y + 65, stat.label);
      }
    }

    // Language bar
    if (stats.topLanguages.length > 0) {
      const barY = 400;
      const barWidth = 900;
      const barHeight = 35;

      for (let y = barY; y < barY + barHeight; y++) {
        for (let x = 50; x < 950; x++) {
          image.setPixelColor(0x21262dff, x, y);
        }
      }

      let currentX = 50;
      for (const lang of stats.topLanguages) {
        const segmentWidth = Math.floor((lang.percentage / 100) * barWidth);
        const langColor = hexToRgb(getLanguageColor(lang.name));

        for (let y = barY; y < barY + barHeight; y++) {
          for (let x = currentX; x < currentX + segmentWidth && x < 950; x++) {
            image.setPixelColor(
              Jimp.rgbaToInt(langColor.r, langColor.g, langColor.b, 255),
              x, y
            );
          }
        }
        currentX += segmentWidth;
      }

      let legendX = 50;
      for (const lang of stats.topLanguages) {
        const langColor = hexToRgb(getLanguageColor(lang.name));

        for (let y = 450; y < 455; y++) {
          for (let x = legendX; x < legendX + 12; x++) {
            if (x < width) {
              image.setPixelColor(Jimp.rgbaToInt(langColor.r, langColor.g, langColor.b, 255), x, y);
            }
          }
        }
        if (fontSmall) {
          image.print(fontSmall, legendX + 18, 450, `${lang.name} ${lang.percentage}%`);
        }
        legendX += 280;
      }
    }

    // Roast section
    if (fontSmall) {
      image.print(fontSmall, 50, 520, '💭 Roast:');
      const roastText = (stats.roast || 'Your code speaks volumes...').substring(0, 120);
      image.print(fontSmall, 60, 540, `"${roastText}"`);
    }

    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('Card generation failed:', error.message);
    const fallback = new Jimp(800, 450, 0x0d1117ff);
    return await fallback.getBufferAsync(Jimp.MIME_PNG);
  }
};

const drawCompareCard = async (stats1, stats2) => {
  try {
    const width = 1000;
    const height = 500;

    const image = new Jimp(width, height, 0x0d1117ff);

    const leftColor = '#58a6ff';
    const rightColor = '#f85149';
    const leftRgb = hexToRgb(leftColor);
    const rightRgb = hexToRgb(rightColor);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < 500; x++) {
        const alpha = Math.max(0, 0.15 * (1 - x / 500));
        image.setPixelColor(
          Jimp.rgbaToInt(
            Math.floor(leftRgb.r * alpha),
            Math.floor(leftRgb.g * alpha),
            Math.floor(leftRgb.b * alpha),
            255
          ),
          x, y
        );
      }
      for (let x = 500; x < width; x++) {
        const alpha = Math.max(0, 0.15 * ((x - 500) / 500));
        image.setPixelColor(
          Jimp.rgbaToInt(
            Math.floor(rightRgb.r * alpha),
            Math.floor(rightRgb.g * alpha),
            Math.floor(rightRgb.b * alpha),
            255
          ),
          x, y
        );
      }
    }

    const font = await loadFontCached(Jimp.FONT_SANS_16_WHITE);
    const fontBold = await loadFontCached(Jimp.FONT_SANS_32_WHITE);
    const fontLarge = await loadFontCached(Jimp.FONT_SANS_64_WHITE);

    try {
      const avatar1 = await Jimp.read(stats1.avatarUrl);
      avatar1.resize(80, 80);
      image.composite(avatar1, 210, 40);

      const avatar2 = await Jimp.read(stats2.avatarUrl);
      avatar2.resize(80, 80);
      image.composite(avatar2, 710, 40);
    } catch (_e) {
      // Avatar loading failed
    }

    if (fontBold) {
      image.print(fontBold, 200, 130, `@${stats1.username}`);
      image.print(fontBold, 700, 130, `@${stats2.username}`);
    }
    if (font) {
      image.print(font, 220, 155, stats1.personalityBadge || '');
      image.print(font, 720, 155, stats2.personalityBadge || '');
    }
    if (fontLarge) {
      image.print(fontLarge, 460, 60, 'VS');
    }

    const metrics = [
      { label: 'Commits', v1: stats1.totalCommits, v2: stats2.totalCommits },
      { label: 'Streak', v1: stats1.longestStreak, v2: stats2.longestStreak },
      { label: 'PRs', v1: stats1.totalPRs, v2: stats2.totalPRs },
      { label: 'Stars', v1: stats1.totalStars, v2: stats2.totalStars },
      { label: 'Languages', v1: stats1.topLanguages.length, v2: stats2.topLanguages.length },
      { label: 'Following', v1: stats1.followingCount, v2: stats2.followingCount }
    ];

    let y = 200;
    if (font) {
      for (const metric of metrics) {
        image.print(font, 50, y, metric.label);
        image.print(font, 220, y, metric.v1.toString());
        image.print(font, 720, y, metric.v2.toString());
        y += 45;
      }
    }

    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('Compare card generation failed:', error.message);
    const fallback = new Jimp(800, 450, 0x0d1117ff);
    return await fallback.getBufferAsync(Jimp.MIME_PNG);
  }
};

module.exports = {
  drawWrappedCard,
  drawCompareCard
};
