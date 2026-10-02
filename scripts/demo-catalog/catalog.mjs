// Demo catalog for presentations (D-DESIGN-02). Replace with real products and photos before launch.
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
  { slug: "relaxed-linen-shirt", code: "W-LINSH", name: "Relaxed Linen Shirt", shape: "shirt", color: "#d9cdb8", bg: "#ecebe7", price: 1490,
    categories: ["women", "tops"], sizes: APPAREL, stock: [4, 8, 10, 6, 0],
    description: "A breezy linen-cotton shirt with a relaxed fit, dropped shoulders and a soft collar. Wear it buttoned or open over a tank.\n\nColor: Oat · Relaxed fit · Machine wash cold, line dry." },
  { slug: "wide-leg-trousers", code: "W-WIDTR", name: "Wide-Leg Trousers", shape: "wideTrousers", color: "#3b3a3c", bg: "#ecebe7", price: 1790,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [3, 7, 9, 5, 2],
    description: "High-rise trousers with a fluid wide leg and a comfortable elastic back waist. Smart enough for the office, easy enough for the weekend.\n\nColor: Charcoal · High rise · Machine wash cold." },
  { slug: "ribbed-knit-tank", code: "W-RIBTK", name: "Ribbed Knit Tank", shape: "tank", color: "#1f1f1f", bg: "#e9e7e2", price: 690,
    categories: ["women", "tops"], sizes: APPAREL, stock: [6, 12, 12, 8, 4],
    description: "A fitted rib-knit tank in soft stretch cotton. The layering piece that goes under everything.\n\nColor: Black · Slim fit · Machine wash cold." },
  { slug: "cotton-midi-skirt", code: "W-MIDSK", name: "Cotton Midi Skirt", shape: "skirt", color: "#6c6b48", bg: "#edece8", price: 1290,
    categories: ["women", "bottoms"], sizes: APPAREL, stock: [2, 5, 0, 4, 3],
    description: "An A-line midi skirt in midweight cotton twill with soft pleats and side pockets.\n\nColor: Olive · Midi length · Machine wash cold." },
  { slug: "cropped-denim-jacket", code: "W-DENJK", name: "Cropped Denim Jacket", shape: "croppedJacket", color: "#7d97b3", bg: "#ecebe7", price: 2490,
    categories: ["women", "outerwear"], sizes: APPAREL, stock: [2, 4, 5, 3, 1],
    description: "A boxy, cropped jacket in washed denim with chest pockets and a point collar. Ages better with every wear.\n\nColor: Washed blue · Boxy fit · Wash inside out." },
  { slug: "everyday-crew-tee-women", code: "W-CRWTE", name: "Everyday Crew Tee", shape: "tee", color: "#f6f4ef", bg: "#e2e0db", price: 590,
    categories: ["women", "tops"], sizes: APPAREL, stock: [10, 15, 15, 10, 6],
    description: "A clean crew-neck tee in breathable combed cotton. Regular fit, slightly longer body.\n\nColor: White · Regular fit · Machine wash warm." },
  { slug: "oxford-button-down", code: "M-OXFBD", name: "Oxford Button-Down", shape: "shirt", color: "#b9cce0", bg: "#ecebe7", price: 1590,
    categories: ["men", "tops"], sizes: APPAREL, stock: [2, 6, 9, 9, 5],
    description: "A classic Oxford cloth shirt with a button-down collar and a chest pocket. Gets softer with every wash.\n\nColor: Light blue · Regular fit · Machine wash warm." },
  { slug: "heavyweight-crew-tee", code: "M-HVYTE", name: "Heavyweight Crew Tee", shape: "tee", color: "#1f1f1f", bg: "#e9e7e2", price: 790,
    categories: ["men", "tops"], sizes: APPAREL, stock: [5, 10, 14, 12, 8],
    description: "A structured tee in dense 240 gsm cotton jersey that holds its shape. Boxy fit with a ribbed neck.\n\nColor: Black · Boxy fit · Machine wash cold." },
  { slug: "relaxed-chino", code: "M-RLXCH", name: "Relaxed Chino", shape: "trousers", color: "#bfa77f", bg: "#ecebe7", price: 1690,
    categories: ["men", "bottoms"], sizes: APPAREL, stock: [1, 6, 8, 7, 0],
    description: "Cotton twill chinos with a relaxed straight leg and a touch of stretch. Your everyday trouser.\n\nColor: Khaki · Relaxed fit · Machine wash cold." },
  { slug: "utility-overshirt", code: "M-UTLOS", name: "Utility Overshirt", shape: "jacket", color: "#2c3a52", bg: "#e9e7e2", price: 2290,
    categories: ["men", "outerwear"], sizes: APPAREL, stock: [0, 3, 6, 5, 2],
    description: "A heavy cotton overshirt with flap chest pockets. Wear it as a light jacket on cooler evenings.\n\nColor: Navy · Regular fit · Machine wash cold." },
  { slug: "pique-polo", code: "M-PQPOL", name: "Piqué Polo", shape: "polo", color: "#2f4a3a", bg: "#ecebe7", price: 1190,
    categories: ["men", "tops"], sizes: APPAREL, stock: [3, 7, 9, 6, 4],
    description: "A breathable cotton piqué polo with a two-button placket and a ribbed collar.\n\nColor: Forest · Regular fit · Machine wash cold." },
  { slug: "drawstring-shorts", code: "M-DRWSH", name: "Drawstring Shorts", shape: "shorts", color: "#b5afa3", bg: "#ecebe7", price: 990,
    categories: ["men", "bottoms"], sizes: APPAREL, stock: [4, 8, 10, 8, 5],
    description: "Easy cotton shorts with an elastic drawstring waist and a 7-inch inseam.\n\nColor: Stone · Relaxed fit · Machine wash cold." },
  { slug: "canvas-tote-bag", code: "A-CNVTB", name: "Canvas Tote Bag", shape: "tote", color: "#e3d8c2", bg: "#e7e5e0", price: 690,
    categories: ["women", "men", "accessories"], sizes: ONE, stock: [20],
    description: "A sturdy 12 oz cotton canvas tote with long handles and an inner pocket. Fits a laptop and the day's errands.\n\nColor: Natural · 40 × 38 cm." },
  { slug: "cotton-bucket-hat", code: "A-BKTHT", name: "Cotton Bucket Hat", shape: "cap", color: "#262626", bg: "#ecebe7", price: 590,
    categories: ["women", "men", "accessories"], sizes: ONE, stock: [0],
    description: "A soft bucket hat in washed cotton twill with a short, packable brim.\n\nColor: Black · One size." },
];
