// Demo catalog for presentations (D-DESIGN-02). Names and colors follow the Unsplash photos in PHOTO_CREDITS.md.
// Replace with real products and photos before launch.
export const CATEGORIES = [
  { slug: "women", name: "Women" },
  { slug: "men", name: "Men" },
  { slug: "tops", name: "Tops" },
  { slug: "bottoms", name: "Bottoms" },
  { slug: "outerwear", name: "Outerwear" },
  { slug: "accessories", name: "Accessories" },
];

// Categories and fixtures from development that the demo catalog replaces (set inactive, never deleted).
export const RETIRED_CATEGORY_SLUGS = ["hoodies", "m02-training"];
export const RETIRED_PRODUCT_SLUGS = ["m02-training-shirt", "m02-training-towel"];

const APPAREL = ["XS", "S", "M", "L", "XL"];
const ONE = ["One size"];

// stock: quantity per size, same order as sizes; 0 shows the size as sold out.
export const PRODUCTS = [
  { slug: "relaxed-linen-top", code: "W-LINSH", name: "Relaxed Linen Top", price: 1490,
    categories: ["women", "tops"], sizes: APPAREL, stock: [4, 8, 10, 6, 0],
    description: "A breezy short-sleeve top in washed linen-cotton with a relaxed body and a gathered hem. Easy with trousers or a skirt.\n\nColor: Ivory · Relaxed fit · Machine wash cold, line dry." },
  { slug: "wide-leg-trousers", code: "W-WIDTR", name: "Wide-Leg Trousers", price: 1790,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [3, 7, 9, 5, 2],
    description: "High-rise trousers with a fluid wide leg and a comfortable elastic back waist. Smart enough for the office, easy enough for the weekend.\n\nColor: Sand · High rise · Machine wash cold." },
  { slug: "ribbed-knit-tank", code: "W-RIBTK", name: "Ribbed Knit Tank", price: 690,
    categories: ["women", "tops"], sizes: APPAREL, stock: [6, 12, 12, 8, 4],
    description: "A fitted rib-knit tank in soft stretch cotton. The layering piece that goes under everything.\n\nColor: Black · Slim fit · Machine wash cold." },
  { slug: "polka-dot-midi-skirt", code: "W-MIDSK", name: "Polka Dot Midi Skirt", price: 1290,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [2, 5, 0, 4, 3],
    description: "A flowing midi skirt in soft woven cotton with a white polka-dot print, a button front and a walking slit.\n\nColor: Red polka dot · Midi length · Machine wash cold." },
  { slug: "classic-denim-jacket", code: "W-DENJK", name: "Classic Denim Jacket", price: 2490,
    categories: ["women", "outerwear"], sizes: APPAREL, stock: [2, 4, 5, 3, 1],
    description: "A classic jacket in light washed denim with flap chest pockets and a point collar. Ages better with every wear.\n\nColor: Light wash · Regular fit · Wash inside out." },
  { slug: "everyday-crew-tee-women", code: "W-CRWTE", name: "Everyday Crew Tee", price: 590,
    categories: ["women", "tops"], sizes: APPAREL, stock: [10, 15, 15, 10, 6],
    description: "A clean crew-neck tee in breathable combed cotton. Regular fit, slightly longer body.\n\nColor: White · Regular fit · Machine wash warm." },
  { slug: "oxford-button-down", code: "M-OXFBD", name: "Oxford Button-Down", price: 1590,
    categories: ["men", "tops"], sizes: APPAREL, stock: [2, 6, 9, 9, 5],
    description: "A classic Oxford cloth shirt with a button-down collar and a chest pocket. Gets softer with every wash.\n\nColor: Light blue · Regular fit · Machine wash warm." },
  { slug: "heavyweight-crew-tee", code: "M-HVYTE", name: "Heavyweight Crew Tee", price: 790,
    categories: ["men", "tops"], sizes: APPAREL, stock: [5, 10, 14, 12, 8],
    description: "A structured tee in dense 240 gsm cotton jersey that holds its shape. Boxy fit with a ribbed neck.\n\nColor: Black · Boxy fit · Machine wash cold." },
  { slug: "stretch-twill-pants", code: "M-RLXCH", name: "Stretch Twill Pants", price: 1690,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [1, 6, 8, 7, 0],
    description: "High-rise pants in stretch cotton twill with a slim leg that moves with you. Your everyday trouser.\n\nColor: Rust · Slim fit · Machine wash cold." },
  { slug: "chambray-print-shirt", code: "M-UTLOS", name: "Chambray Print Shirt", price: 2290,
    categories: ["men", "tops"], sizes: APPAREL, stock: [0, 3, 6, 5, 2],
    description: "A soft cotton chambray shirt with a small white print, a point collar and three-quarter sleeves.\n\nColor: Indigo print · Regular fit · Machine wash cold." },
  { slug: "pique-polo", code: "M-PQPOL", name: "Piqué Polo", price: 1190,
    categories: ["men", "tops"], sizes: APPAREL, stock: [3, 7, 9, 6, 4],
    description: "A breathable cotton piqué polo with a two-button placket and a ribbed collar.\n\nColor: Sage · Regular fit · Machine wash cold." },
  { slug: "paperbag-shorts", code: "M-DRWSH", name: "Paperbag Shorts", price: 990,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [4, 8, 10, 8, 5],
    description: "High-waisted cotton twill shorts with a gathered paperbag waist, a button fly and rolled hems.\n\nColor: Olive · Relaxed fit · Machine wash cold." },
  { slug: "canvas-tote-bag", code: "A-CNVTB", name: "Canvas Tote Bag", price: 690,
    categories: ["women", "men", "accessories"], sizes: ONE, stock: [20],
    description: "A sturdy 12 oz cotton canvas tote with long handles and an inner pocket. Fits a laptop and the day's errands.\n\nColor: Natural · 40 × 38 cm." },
  { slug: "cotton-bucket-hat", code: "A-BKTHT", name: "Cotton Bucket Hat", price: 590,
    categories: ["women", "men", "accessories"], sizes: ONE, stock: [0],
    description: "A soft bucket hat in washed cotton twill with a short, packable brim.\n\nColor: Sage · One size." },
];
