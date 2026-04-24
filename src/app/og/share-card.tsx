import type { ReactElement } from "react";

const accent = "#0d5c3d";
const ink = "#1a1a1a";
const muted = "#6b6b6b";

/** Markup for Open Graph / X (Twitter) link previews (Satori / ImageResponse). */
export function ShareCardMarkup(): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(160deg, #faf9f7 0%, #e8f0ec 45%, #dce8e2 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
          <div
            style={{ width: 20, height: 52, background: accent, borderRadius: 6 }}
          />
          <div
            style={{ width: 20, height: 88, background: accent, borderRadius: 6 }}
          />
          <div
            style={{ width: 20, height: 52, background: accent, borderRadius: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: ink,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            TickerNG
          </div>
          <div style={{ fontSize: 32, color: muted, marginTop: 12, fontWeight: 500 }}>
            Nigerian Exchange (NGX) research, powered by AI
          </div>
        </div>
      </div>
    </div>
  );
}
