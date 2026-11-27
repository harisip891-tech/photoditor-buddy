import type { AdjustmentPreset } from '../adjustments/merge';

/** Category names shown as tabs in the Filters panel. Order here is the order in the UI. */
export type FilterCategory =
  | 'CSSgram'
  | 'Film'
  | 'Vintage'
  | 'Black & White'
  | 'Japanese'
  | 'Korean'
  | 'Cinematic'
  | 'Sunset'
  | 'Pearl'
  | 'Portrait'
  | 'Food'
  | 'Landscape'
  | 'Street'
  | 'Neon'
  | 'Pastel'
  | 'Mood'
  | 'Cross Process'
  | 'Duotone'
  | 'Seasons'
  | 'Travel'
  | 'Retro Digital'
  | 'Minimal';

/** Recipe for a generated 3D LUT that a preset can carry in addition to slider values. */
export type LutRecipe =
  | { kind: 'duotone'; shadow: string; highlight: string }
  | { kind: 'gradientMap'; stops: [string, string, string] }
  | { kind: 'crossProcess'; strength: number }
  | {
      kind: 'cssgram';
      operations: CssgramOperation[];
      overlays: CssgramOverlay[];
    };

/** Colour operations from CSSgram's CSS filter chains. */
export type CssgramOperation = [
  'brightness' | 'contrast' | 'saturate' | 'grayscale' | 'sepia' | 'hue-rotate',
  number,
];

/** Spatial CSS overlays are represented by representative solid colours in the LUT. */
export type CssgramOverlay = [
  string,
  (
    | 'darken'
    | 'lighten'
    | 'screen'
    | 'multiply'
    | 'overlay'
    | 'soft-light'
    | 'exclusion'
    | 'color-dodge'
    | 'color-burn'
    | 'hue'
    | 'color'
  ),
  number,
];

/** One filter (a named look). Applying it means blending `preset` onto the current adjustments. */
export interface FilterDefinition {
  id: string;
  name: string;
  category: FilterCategory;
  preset: AdjustmentPreset;
  lut?: LutRecipe;
}
