/** Fixed palettes that do not change with the light/dark theme. */

export interface Swatch {
  base: string;
  shadow: string;
}

/** Each unit on the path has its own colour (banner, nodes, popovers). */
export const UNIT_COLORS: Record<string, Swatch> = {
  green: { base: "#58CC02", shadow: "#46A302" },
  purple: { base: "#CE82FF", shadow: "#A568CC" },
  teal: { base: "#00CD9C", shadow: "#00A47D" },
  blue: { base: "#1CB0F6", shadow: "#1899D6" },
  orange: { base: "#FF9600", shadow: "#CC7800" },
  red: { base: "#FF4B4B", shadow: "#EA2B2B" },
  pink: { base: "#FF86D0", shadow: "#CC6BA6" },
};

export const unitColor = (name: string): Swatch => UNIT_COLORS[name] ?? UNIT_COLORS.green;

/** Gold: skills (and challenges) that have reached Legendary. */
export const LEGENDARY: Swatch = { base: "#FFC800", shadow: "#E5A000" };

/** Dark text that stays readable on gold surfaces. */
export const ON_GOLD = "#6B4600";

/** Achievement badge backgrounds. */
export const BADGE_COLORS: Record<string, Swatch> = {
  red: { base: "#FF4B4B", shadow: "#EA2B2B" },
  green: { base: "#58CC02", shadow: "#46A302" },
  blue: { base: "#1CB0F6", shadow: "#1899D6" },
  purple: { base: "#CE82FF", shadow: "#A568CC" },
  orange: { base: "#FF9600", shadow: "#CC7800" },
  gold: { base: "#FFC800", shadow: "#E5A000" },
};

/** Horizontal offsets (px) that give the path its winding shape. */
export const PATH_WAVE = [0, -45, -70, -45, 0, 45, 70, 45];
