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
  /** Home page brand section. */
  statement: {
    heading: "Everyday pieces, made to last.",
    body: "Wardrobe staples for women and men: easy shirts, honest trousers and layers you'll reach for every day. Simple to shop, delivered anywhere in the Philippines.",
  },
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
