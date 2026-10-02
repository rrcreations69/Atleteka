// Draws flat-lay product illustrations for the demo catalog and writes transparent WebP cut-outs
// (1200×1500). The storefront supplies the backdrop: --photo on cards, the slide color in the hero.
// Usage: node scripts/demo-catalog/generate-images.mjs [outDir]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PRODUCTS } from "./catalog.mjs";

const W = 1200, H = 1500;
const outDir = process.argv[2] ?? path.join(".verification", "demo-catalog");

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Each shape returns { body: main silhouette path(s), details: seams and trims }.
const SHAPES = {
  tee: () => ({
    body: ["M470 300 Q600 380 730 300 L905 345 L1065 525 L965 610 L880 545 L880 1170 L320 1170 L320 545 L235 610 L135 525 L295 345 Z"],
    details: [
      { d: "M470 300 Q600 395 730 300", w: 22, o: 0.18 },
      { d: "M880 545 L880 1170 M320 545 L320 1170", w: 3, o: 0.25 },
      { d: "M320 1140 L880 1140", w: 3, o: 0.3 },
      { d: "M965 610 L1040 545 M235 610 L160 545", w: 3, o: 0.3 },
    ],
  }),
  tank: () => ({
    body: ["M440 250 L525 250 Q600 430 675 250 L760 250 Q770 430 870 505 L870 1170 L330 1170 L330 505 Q430 430 440 250 Z"],
    details: [
      { d: "M525 250 Q600 430 675 250 M440 250 Q430 430 330 505 M760 250 Q770 430 870 505", w: 14, o: 0.16 },
      ...Array.from({ length: 13 }, (_, i) => ({ d: `M${370 + i * 38} 560 L${370 + i * 38} 1150`, w: 3, o: 0.12 })),
      { d: "M330 1140 L870 1140", w: 3, o: 0.3 },
    ],
  }),
  shirt: () => ({
    body: ["M470 285 L730 285 L905 340 L1045 1010 L940 1040 L870 610 L870 1190 Q600 1225 330 1190 L330 610 L260 1040 L155 1010 L295 340 Z"],
    details: [
      { d: "M470 285 L600 400 L545 245 Z M730 285 L600 400 L655 245 Z", w: 4, o: 0.35, fill: 0.08 },
      { d: "M600 400 L600 1205", w: 4, o: 0.3 },
      { d: "M955 985 L1040 960 M245 985 L160 960", w: 4, o: 0.3 },
      { d: "M390 500 L500 500 L500 625 Q445 650 390 625 Z", w: 4, o: 0.3 },
      { d: "M870 610 L870 1190 M330 610 L330 1190", w: 3, o: 0.2 },
    ],
    buttons: [470, 590, 710, 830, 950, 1070].map((y) => [600, y]),
  }),
  polo: () => ({
    body: ["M470 300 L730 300 L905 345 L1065 525 L965 610 L880 545 L880 1170 L320 1170 L320 545 L235 610 L135 525 L295 345 Z"],
    details: [
      { d: "M470 300 L600 380 L520 255 Z M730 300 L600 380 L680 255 Z", w: 4, o: 0.35, fill: 0.08 },
      { d: "M565 380 L565 560 L635 560 L635 380", w: 4, o: 0.3 },
      { d: "M965 610 L1040 545 M235 610 L160 545", w: 10, o: 0.18 },
      { d: "M320 1140 L880 1140", w: 3, o: 0.3 },
    ],
    buttons: [[600, 430], [600, 510]],
  }),
  jacket: (cropped = false) => {
    const hem = cropped ? 1010 : 1190;
    return {
      body: [`M455 290 L745 290 L925 345 L1060 1000 L945 1035 L880 620 L880 ${hem} L320 ${hem} L320 620 L255 1035 L140 1000 L275 345 Z`],
      details: [
        { d: "M455 290 L600 430 L520 230 Z M745 290 L600 430 L680 230 Z", w: 4, o: 0.38, fill: 0.1 },
        { d: `M600 430 L600 ${hem}`, w: 6, o: 0.35 },
        { d: "M375 520 L520 520 L520 690 L375 690 Z M680 520 L825 520 L825 690 L680 690 Z", w: 4, o: 0.35 },
        { d: "M370 520 L525 520 L525 580 Q448 600 370 580 Z M675 520 L830 520 L830 580 Q752 600 675 580 Z", w: 4, o: 0.38, fill: 0.08 },
        { d: `M320 ${hem - 70} L880 ${hem - 70}`, w: 4, o: 0.3 },
        { d: "M960 980 L1050 955 M240 980 L150 955", w: 4, o: 0.3 },
      ],
      buttons: (cropped ? [500, 640, 780, 900] : [500, 660, 820, 980, 1110]).map((y) => [625, y]),
    };
  },
  trousers: (wide = false) => {
    const [hl, hr, il, ir] = wide ? [270, 930, 625, 575] : [395, 805, 640, 560];
    return {
      body: [`M380 240 L820 240 L${hr} 1330 L${il} 1330 L600 640 L${ir} 1330 L${hl} 1330 Z`],
      details: [
        { d: "M380 240 L820 240 L822 305 L378 305 Z", w: 4, o: 0.3, fill: 0.08 },
        { d: "M600 305 L600 640 M600 305 Q640 470 600 560", w: 4, o: 0.3 },
        { d: "M395 330 Q470 360 455 470 M805 330 Q730 360 745 470", w: 4, o: 0.3 },
        { d: `M${(hl + 600) / 2 + 20} 700 L${(hl + ir) / 2} 1320 M${(hr + 600) / 2 - 20} 700 L${(hr + il) / 2} 1320`, w: 3, o: 0.18 },
      ],
      buttons: [[600, 272]],
    };
  },
  shorts: () => ({
    body: ["M370 330 L830 330 L900 860 L640 880 L600 640 L560 880 L300 860 Z"],
    details: [
      { d: "M370 330 L830 330 L834 410 L366 410 Z", w: 4, o: 0.3, fill: 0.08 },
      ...Array.from({ length: 15 }, (_, i) => ({ d: `M${385 + i * 30} 338 L${385 + i * 30} 402`, w: 3, o: 0.15 })),
      { d: "M585 410 Q560 500 520 540 M615 410 Q640 500 680 540", w: 6, o: 0.45, color: "#f4f2ee" },
      { d: "M385 440 Q470 470 450 580 M815 440 Q730 470 750 580", w: 4, o: 0.3 },
      { d: "M302 830 L558 850 M642 850 L898 830", w: 4, o: 0.3 },
    ],
  }),
  skirt: () => ({
    body: ["M420 300 L780 300 L915 1260 Q600 1300 285 1260 Z"],
    details: [
      { d: "M420 300 L780 300 L784 365 L416 365 Z", w: 4, o: 0.3, fill: 0.08 },
      { d: "M500 365 L440 1270 M600 365 L600 1285 M700 365 L760 1270", w: 4, o: 0.18 },
      { d: "M430 420 Q470 520 450 620 M770 420 Q730 520 750 620", w: 4, o: 0.28 },
      { d: "M300 1230 Q600 1270 900 1230", w: 3, o: 0.3 },
    ],
    buttons: [[600, 332]],
  }),
  tote: () => ({
    body: ["M330 560 L870 560 L895 1240 L305 1240 Z", "M455 565 Q455 250 600 250 Q745 250 745 565 L700 565 Q700 300 600 300 Q500 300 500 565 Z"],
    details: [
      { d: "M330 620 L870 620", w: 4, o: 0.25 },
      { d: "M470 640 L470 760 M730 640 L730 760", w: 4, o: 0.2 },
      { d: "M450 900 L750 900 L750 1060 L450 1060 Z", w: 3, o: 0.18 },
    ],
  }),
  cap: () => ({
    body: ["M330 860 Q320 470 600 450 Q880 470 870 860 Z", "M300 830 Q600 780 900 830 Q985 900 930 975 Q600 1130 270 975 Q215 900 300 830 Z"],
    details: [
      { d: "M600 455 L600 860 M600 455 Q460 520 440 860 M600 455 Q740 520 760 860", w: 4, o: 0.25 },
      { d: "M330 860 Q600 790 870 860", w: 6, o: 0.25 },
      { d: "M300 880 Q600 1000 900 880", w: 4, o: 0.28 },
      { d: "M330 905 Q600 1040 870 905 Q850 960 600 1040 Q350 960 330 905 Z", w: 0, o: 0, fill: 0.18 },
    ],
    buttons: [[600, 455]],
  }),
};

function svgFor(product) {
  const key = product.shape;
  const spec = key === "croppedJacket" ? SHAPES.jacket(true) : key === "wideTrousers" ? SHAPES.trousers(true) : SHAPES[key]();
  const seam = shade(product.color, product.color === "#f6f4ef" ? -0.35 : -0.38);
  const light = product.color === "#f6f4ef" || product.color === "#e3d8c2";
  const body = spec.body.map((d) => `<path d="${d}"/>`).join("");
  const details = spec.details.map((x) => x.fill
    ? `<path d="${x.d}" fill="${shade(product.color, -x.fill)}" stroke="${x.color ?? seam}" stroke-width="${x.w}" stroke-opacity="${x.o}" stroke-linejoin="round"/>`
    : `<path d="${x.d}" fill="none" stroke="${x.color ?? seam}" stroke-width="${x.w}" stroke-opacity="${x.o}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const buttons = (spec.buttons ?? []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${light ? "#d8d4cc" : shade(product.color, 0.25)}" stroke="${seam}" stroke-opacity="0.4" stroke-width="3"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="weave" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <clipPath id="garment">${body}</clipPath>
    <linearGradient id="light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.06"/></linearGradient>
  </defs>
  <g transform="translate(14 26)" fill="#000" opacity="0.16" filter="url(#shadow)">${body}</g>
  <g fill="${product.color}">${body}</g>
  <rect width="${W}" height="${H}" fill="${product.color}" clip-path="url(#garment)" filter="url(#weave)"/>
  <rect width="${W}" height="${H}" fill="url(#light)" clip-path="url(#garment)"/>
  ${details}${buttons}
</svg>`;
}

// Detail crop: the upper-center area where collars, plackets and trims sit.
const DETAIL = { left: 300, top: 200, width: 600, height: 750 };

await mkdir(outDir, { recursive: true });
for (const product of PRODUCTS) {
  const png = await sharp(Buffer.from(svgFor(product))).png().toBuffer();
  const front = await sharp(png).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
  const detail = await sharp(png).extract(DETAIL).resize(W, H).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
  await writeFile(path.join(outDir, `${product.slug}-1.webp`), front);
  await writeFile(path.join(outDir, `${product.slug}-2.webp`), detail);
  console.log(`${product.slug}: ${(front.length / 1024).toFixed(0)} KB + ${(detail.length / 1024).toFixed(0)} KB`);
}
