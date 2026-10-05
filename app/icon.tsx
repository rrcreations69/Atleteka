import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

// Browser tab icon generated from lib/brand.ts: the store's first letter on its primary color.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: brand.colors.primary, color: "#ffffff", fontSize: 44, fontWeight: 700, borderRadius: 8 }}>
      {brand.name.trim().charAt(0).toUpperCase()}
    </div>,
    size,
  );
}
