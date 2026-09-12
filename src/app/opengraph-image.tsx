import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/content/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS: [string, string][] = [
  ["#e6edf3", "            ISPF Primary Option Menu"],
  ["#4fd1ff", "Option ===> 3.4_"],
  ["#5c6c7a", ""],
  ["#e6edf3", "   0  Settings      Terminal and user parameters"],
  ["#e6edf3", "   1  View          Display source data or listings"],
  ["#e6edf3", "   2  Edit          Create or change source data"],
  ["#33ff66", "   3  Utilities     Perform utility functions"],
  ["#e6edf3", "   6  Command       Enter TSO or Workstation commands"],
  ["#5c6c7a", ""],
  ["#4fd1ff", "F1=Help  F3=Exit  F7=Up  F8=Down"],
];

/** IBM Plex Mono TTF from Google Fonts (a legacy user agent makes the CSS list TTF files, which Satori can read). */
async function loadFont(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@${weight}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" },
    }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+\.(?:ttf|woff))\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null; // build still succeeds with the fallback font
  }
}

/** Open Graph card: a panel on the left, the pitch on the right. Generated at build time. */
export default async function OpenGraphImage() {
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);
  const fonts = [
    ...(regular ? [{ name: "IBM Plex Mono", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "IBM Plex Mono", data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#06090d",
          color: "#e6edf3",
          fontFamily: fonts.length ? "IBM Plex Mono, monospace" : "monospace",
          padding: 56,
          gap: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1.1,
            border: "2px solid #1f2b36",
            borderRadius: 12,
            background: "#0b1016",
            padding: 24,
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(51,255,102,0.12)",
          }}
        >
          {ROWS.map(([color, text], i) => (
            <div key={i} style={{ display: "flex", color, fontSize: 17, lineHeight: 1.6, whiteSpace: "pre" }}>
              {text || " "}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", color: "#5c6c7a", fontSize: 16, letterSpacing: 2 }}>------- ISPF LAB -------</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 10, lineHeight: 1 }}>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>Learn</div>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 700, color: "#33ff66", marginTop: 2, textShadow: "0 0 24px rgba(51,255,102,0.45)" }}>ISPF</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginTop: 6 }}>by typing.</div>
          </div>
          <div style={{ display: "flex", color: "#b9c5d0", fontSize: 19, lineHeight: 1.45, marginTop: 20 }}>
            A browser-based simulator of the z/OS ISPF workflow: option 3.4, member lists, the editor and its line commands — with 14 lessons that check what you actually do.
          </div>
          <div style={{ display: "flex", color: "#ffb000", fontSize: 15, marginTop: 26, letterSpacing: 1 }}>FREE · RUNS IN YOUR BROWSER · NOT AFFILIATED WITH IBM</div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
