import localFont from "next/font/local";

/** Cormorant Garamond: inscriptions, titles and display type. */
export const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-wght-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Garamond", "Times New Roman", "serif"],
});

/** EB Garamond: reading text, wall labels and interface. */
export const garamond = localFont({
  src: [
    { path: "../fonts/eb-garamond-latin-wght-normal.woff2", weight: "400 800", style: "normal" },
    { path: "../fonts/eb-garamond-latin-wght-italic.woff2", weight: "400 800", style: "italic" },
  ],
  variable: "--font-garamond",
  display: "swap",
  fallback: ["Garamond", "Georgia", "serif"],
});
