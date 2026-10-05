// Store brand settings: the one file to edit when rebranding the store for a new owner.
// Everything customer-facing that names the store or sets its brand colors reads from here.

export const brand = {
  /** Store name: header wordmark, page titles, emails, PayMongo checkout, social sharing. */
  name: "Atleteka",
  /**
   * Optional logo shown in the header and footer instead of the text wordmark. Put the file in /public
   * and set e.g. { src: "/logo.svg", width: 140, height: 32 } (pixel size as displayed). The footer sits
   * on a dark background, so `footerSrc` can point to a light version of the logo.
   */
  logo: null as null | { src: string; width: number; height: number; footerSrc?: string },
  /** One line describing the store (home page heading for screen readers). */
  tagline: "Everyday clothing for women and men",
  /** Default description for search engines and link previews. */
  description: "Comfortable, well-made clothing for women and men, delivered across the Philippines.",
  /** The thin bar above the header. */
  announcement: "Nationwide delivery · Shipping paid on delivery",
  /** Short text under the name in the footer. */
  footerBlurb: "Everyday clothing for women and men, made to last. Philippines · PHP.",
  /**
   * Home page color moods (D-DESIGN-05). The featured products in the home hero take these in turn, and the
   * rest of the home page takes the active mood's light tints. `field` is the hero background, `word` the
   * giant wordmark behind the garment, `text` the hero text and button color (keep strong contrast with
   * `field`), and `page`, `tile`, `chip` the page, product tile and category tile tints (keep them light:
   * the text on them is near-black).
   */
  heroMoods: [
    { name: "Indigo", field: "#1d2a40", word: "#2c3d5c", text: "#ffffff", page: "#e8edf5", tile: "#d6dfec", chip: "#c3d0e3" },
    { name: "Sand", field: "#ddd6b8", word: "#c2b78a", text: "#1d1c12", page: "#f6f2e4", tile: "#ebe4ca", chip: "#ddd3b0" },
    { name: "Espresso", field: "#3a2e1f", word: "#4d3d29", text: "#ffffff", page: "#f4ece2", tile: "#e8dacb", chip: "#dac6b0" },
    { name: "Sage", field: "#cfdcc9", word: "#a9bfa1", text: "#142019", page: "#edf3ea", tile: "#dce8d8", chip: "#c8d9c2" },
  ],
  /**
   * Brand colors. Keep enough contrast: `ink` and `primary` carry white or black text, and `accent` is only
   * used on dark (ink/navy) backgrounds.
   */
  colors: {
    ink: "#181a2f", // main text, dark surfaces, footer and announcement bar
    navy: "#242e49", // secondary dark surface (home brand section, hovers)
    slate: "#37415c", // secondary text
    primary: "#b4182d", // primary buttons and highlights
    primaryHover: "#54162b", // primary button hover
    accent: "#fda481", // small accents on dark surfaces
  },
};

/** CSS variables for the brand colors; the root layout applies them on top of app/globals.css. */
export function brandColorCss() {
  const c = brand.colors;
  return `:root{--foreground:${c.ink};--card-foreground:${c.ink};--popover-foreground:${c.ink};--secondary-foreground:${c.ink};` +
    `--accent-foreground:${c.ink};--ring:${c.ink};--navy:${c.navy};--muted-foreground:${c.slate};--primary:${c.primary};` +
    `--wine:${c.primaryHover};--apricot:${c.accent}}`;
}
