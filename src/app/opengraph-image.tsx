import { ImageResponse } from "next/og";
import { IDENTITY_DISPLAY } from "@/data/site";

/**
 * OG / Twitter share image — authored composition, not a screenshot.
 *
 * Communicates identity: name, role, positioning, and the site's editorial
 * grid language (hairline frame, mono metadata rows, oversized display type).
 * Reads from the single identity source so it updates when real values land.
 * Rendered at build/request time by Next's image convention — no binary
 * asset to keep in sync.
 *
 * NOTE: while IDENTITY.displayName is the placeholder "folio", this card
 * honestly shows that placeholder; replace it in src/data/site.ts.
 */

export const alt = `${IDENTITY_DISPLAY.name} — ${IDENTITY_DISPLAY.role}. ${IDENTITY_DISPLAY.positioningShort}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const year = new Date().getFullYear();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          color: "#ededed",
          padding: 28,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid rgba(255,255,255,0.16)",
            padding: "44px 52px",
          }}
        >
          {/* Metadata row */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#88888e",
              }}
            >
              Portfolio — {IDENTITY_DISPLAY.role}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 6,
                color: "#88888e",
              }}
            >
              [ {year} ]
            </div>
          </div>

          {/* Identity block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: "#ededed",
                  display: "flex",
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: 8,
                  textTransform: "uppercase",
                  color: "#88888e",
                }}
              >
                Selected work & case studies
              </div>
            </div>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                fontSize: IDENTITY_DISPLAY.name.length > 12 ? 96 : 128,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {IDENTITY_DISPLAY.name}
            </div>
            <div
              style={{
                marginTop: 26,
                display: "flex",
                maxWidth: 860,
                fontSize: 30,
                lineHeight: 1.4,
                color: "#a9a9b0",
              }}
            >
              {IDENTITY_DISPLAY.positioningShort}
            </div>
          </div>

          {/* Footer row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.16)",
              paddingTop: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 4,
                color: "#88888e",
              }}
            >
              {IDENTITY_DISPLAY.role.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 4,
                color: "#88888e",
              }}
            >
              DEMO CONTENT
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
