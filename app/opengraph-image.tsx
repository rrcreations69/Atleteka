import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

// Default link-preview image (Facebook, Messenger, X) generated from lib/brand.ts.
// Product pages use their first product photo instead.
export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: 80, background: brand.colors.ink, color: "#ffffff" }}>
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: brand.colors.accent }}>{brand.announcement}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 112, fontWeight: 700, letterSpacing: 18, textTransform: "uppercase" }}>{brand.name}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 40, color: "#cfd3de" }}>{brand.tagline}</div>
      </div>
      <div style={{ display: "flex", width: 160, height: 10, background: brand.colors.primary }} />
    </div>,
    size,
  );
}
