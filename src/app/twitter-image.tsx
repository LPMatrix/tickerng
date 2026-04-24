import { ImageResponse } from "next/og";
import { ShareCardMarkup } from "./og/share-card";

export const alt = "TickerNG — NGX stock research";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<ShareCardMarkup />, { ...size });
}
