import { clamp } from '../math/clamp';
import { hexToRgb, hslToRgb, rgbToHsl, type Rgb } from '../math/color';
import type { CssgramOperation, CssgramOverlay, FilterDefinition } from './types';

// CSSgram colour recipes adapted from https://github.com/una/CSSgram (MIT).
// Copyright (c) 2015 Una Kravets. See THIRD_PARTY_CSSGRAM_LICENSE.txt.
// Gradients are approximated by a representative tint and optional vignette;
// the result is a portable 3D LUT rather than a DOM-only CSS effect.
const RECIPES: [string, CssgramOperation[], CssgramOverlay[], number][] = [
  ['Aden', [['hue-rotate',-20],['contrast',0.9],['saturate',0.85],['brightness',1.2]], [['#420a0e','darken',0.1]], 0],
  ['Reyes', [['sepia',0.22],['brightness',1.1],['contrast',0.85],['saturate',0.75]], [['#efcdad','soft-light',0.5]], 0],
  ['Gingham', [['brightness',1.05],['hue-rotate',-10]], [['#e6e6fa','soft-light',1]], 0],
  ['Mayfair', [['contrast',1.1],['saturate',1.1]], [['#ffc8c8','overlay',0.24]], 12],
  ['Rise', [['brightness',1.05],['sepia',0.2],['contrast',0.9],['saturate',0.9]], [['#e8c598','overlay',0.35]], 10],
  ['Valencia', [['contrast',1.08],['brightness',1.08],['sepia',0.08]], [['#3a0339','exclusion',0.5]], 0],
  ['Lark', [['contrast',0.9]], [['#22253f','color-dodge',1],['#f2f2f2','darken',0.8]], 0],
  ['Stinson', [['contrast',0.75],['saturate',0.85],['brightness',1.15]], [['#f09580','soft-light',0.2]], 0],
  ['Clarendon', [['contrast',1.2],['saturate',1.35]], [['#7fbbe3','overlay',0.2]], 0],
  ['Nashville', [['sepia',0.2],['contrast',1.2],['brightness',1.05],['saturate',1.2]], [['#f7b099','darken',0.56],['#004696','lighten',0.4]], 0],
  ['Brooklyn', [['contrast',0.9],['brightness',1.1]], [['#a8dfc1','overlay',0.4]], 0],
  ['1977', [['contrast',1.1],['brightness',1.1],['saturate',1.3]], [['#f36abc','screen',0.3]], 0],
  ['Walden', [['brightness',1.1],['hue-rotate',-10],['sepia',0.3],['saturate',1.6]], [['#0044cc','screen',0.3]], 0],
  ['Hudson', [['brightness',1.2],['contrast',0.9],['saturate',1.1]], [['#a6b1ff','multiply',0.5]], 18],
  ['Perpetua', [], [['#738e6c','soft-light',0.5]], 0],
  ['Earlybird', [['contrast',0.9],['sepia',0.2]], [['#d0ba8e','overlay',0.6]], 24],
  ['Toaster', [['contrast',1.5],['brightness',0.9]], [['#804e0f','screen',0.7]], 12],
  ['Lo-fi', [['saturate',1.1],['contrast',1.5]], [], 22],
  ['X-Pro II', [['sepia',0.3]], [['#e6e7e0','color-burn',0.6]], 24],
  ['Slumber', [['saturate',0.66],['brightness',1.05]], [['#45290c','lighten',0.4],['#7d6918','soft-light',0.5]], 0],
  ['Brannan', [['sepia',0.5],['contrast',1.4]], [['#a12cc7','lighten',0.31]], 0],
  ['Kelvin', [], [['#382c34','color-dodge',1],['#b77d21','overlay',1]], 0],
  ['Maven', [['sepia',0.25],['brightness',0.95],['contrast',0.95],['saturate',1.5]], [['#03e61a','hue',0.2]], 0],
  ['Inkwell', [['sepia',0.3],['contrast',1.1],['brightness',1.1],['grayscale',1]], [], 0],
  ['Moon', [['grayscale',1],['contrast',1.1],['brightness',1.1]], [['#a0a0a0','soft-light',1],['#383838','lighten',1]], 0],
  ['Willow', [['grayscale',0.5],['contrast',0.95],['brightness',0.9]], [['#d8cdcb','color',1]], 0],
];

/** CSSgram-inspired looks usable in previews, full-resolution exports and batch editing. */
export const CSSGRAM_FILTERS: FilterDefinition[] = RECIPES.map(
  ([name, operations, overlays, vignette]) => ({
    id: 'cssgram-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    category: 'CSSgram',
    preset: vignette ? { vignette, vignetteFeather: 70 } : {},
    lut: { kind: 'cssgram', operations, overlays },
  }),
);

const unit = (v: number): number => clamp(v, 0, 1);
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

function operation(rgb: Rgb, [kind, amount]: CssgramOperation): Rgb {
  const [r, g, b] = rgb;
  const gray = 0.213 * r + 0.715 * g + 0.072 * b;
  let out: Rgb;
  switch (kind) {
    case 'brightness':
      out = [r * amount, g * amount, b * amount];
      break;
    case 'contrast':
      out = rgb.map((v) => (v - 0.5) * amount + 0.5) as Rgb;
      break;
    case 'saturate':
      out = rgb.map((v) => mix(gray, v, amount)) as Rgb;
      break;
    case 'grayscale':
      out = rgb.map((v) => mix(v, gray, amount)) as Rgb;
      break;
    case 'sepia':
      out = [
        mix(r, 0.393 * r + 0.769 * g + 0.189 * b, amount),
        mix(g, 0.349 * r + 0.686 * g + 0.168 * b, amount),
        mix(b, 0.272 * r + 0.534 * g + 0.131 * b, amount),
      ];
      break;
    case 'hue-rotate': {
      const angle = (amount * Math.PI) / 180;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      out = [
        gray + c * (r - gray) + s * (-0.213 * r - 0.715 * g + 0.928 * b),
        gray + c * (g - gray) + s * (0.143 * r + 0.140 * g - 0.283 * b),
        gray + c * (b - gray) + s * (-0.787 * r + 0.715 * g + 0.072 * b),
      ];
      break;
    }
  }
  return out.map(unit) as Rgb;
}

function blendChannel(base: number, tint: number, mode: CssgramOverlay[1]): number {
  switch (mode) {
    case 'darken':
      return Math.min(base, tint);
    case 'lighten':
      return Math.max(base, tint);
    case 'screen':
      return 1 - (1 - base) * (1 - tint);
    case 'multiply':
      return base * tint;
    case 'overlay':
      return base <= 0.5 ? 2 * base * tint : 1 - 2 * (1 - base) * (1 - tint);
    case 'soft-light': {
      const d = base <= 0.25 ? ((16 * base - 12) * base + 4) * base : Math.sqrt(base);
      return tint <= 0.5
        ? base - (1 - 2 * tint) * base * (1 - base)
        : base + (2 * tint - 1) * (d - base);
    }
    case 'exclusion':
      return base + tint - 2 * base * tint;
    case 'color-dodge':
      return base === 0 ? 0 : tint === 1 ? 1 : Math.min(1, base / (1 - tint));
    case 'color-burn':
      return base === 1 ? 1 : tint === 0 ? 0 : 1 - Math.min(1, (1 - base) / tint);
    default:
      return base;
  }
}

/** Evaluates the colour portion of a CSSgram recipe at one RGB point. */
export function cssgramColor(
  rgb: Rgb,
  operations: CssgramOperation[],
  overlays: CssgramOverlay[],
): Rgb {
  // CSS overlays are composited before the wrapper's CSS filter chain.
  for (const [hex, mode, alpha] of overlays) {
    const tint = hexToRgb(hex);
    let blended: Rgb;
    if (mode === 'hue' || mode === 'color') {
      const [, s, l] = rgbToHsl(rgb);
      const [h, ts] = rgbToHsl(tint);
      blended = hslToRgb([h, mode === 'hue' ? s : ts, l]);
    } else {
      blended = rgb.map((v, i) => blendChannel(v, tint[i]!, mode)) as Rgb;
    }
    rgb = rgb.map((v, i) => unit(mix(v, blended[i]!, alpha))) as Rgb;
  }
  for (const op of operations) rgb = operation(rgb, op);
  return rgb;
}
