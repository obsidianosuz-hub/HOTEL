export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

// Generate a full Tailwind-like palette from a single base color
export function generatePalette(baseHex) {
  const rgb = hexToRgb(baseHex || '#0f766e');
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Define lightness values for tailwind shades 50-950
  const lightnessMap = {
    50: 95, 100: 90, 200: 80, 300: 70, 400: 60,
    500: l, // Use the actual color as 500
    600: Math.max(l - 10, 10),
    700: Math.max(l - 20, 8),
    800: Math.max(l - 30, 6),
    900: Math.max(l - 40, 4),
    950: Math.max(l - 50, 2)
  };

  const palette = {};
  for (const [shade, lightness] of Object.entries(lightnessMap)) {
    const { r, g, b } = hslToRgb(h, s, lightness);
    palette[shade] = `${r} ${g} ${b}`; // format for CSS variable 'r g b'
  }
  return palette;
}

export function applyTheme(hexColor) {
  if (!hexColor) return;
  const palette = generatePalette(hexColor);
  const root = document.documentElement;
  for (const [shade, rgbString] of Object.entries(palette)) {
    root.style.setProperty(`--color-brand-${shade}`, rgbString);
  }
}
