import type { CSSProperties } from "react";
import { brand } from "./brand";

type Mood = (typeof brand.heroMoods)[number];

/** CSS variables for a home color mood (D-DESIGN-05); the home canvas carries them so the page follows the hero. */
export function moodVars(mood: Mood): CSSProperties {
  return {
    "--home-field": mood.field, "--home-word": mood.word, "--home-text": mood.text,
    "--home-page": mood.page, "--home-tile": mood.tile, "--home-chip": mood.chip,
  } as CSSProperties;
}
