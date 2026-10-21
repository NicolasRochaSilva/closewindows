import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Jacquard_12, Press_Start_2P } from "next/font/google";
import "./globals.css";

/* Casca: serifa editorial para titulos, Geist para interface, mono para numeros. */
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-display-loaded" });
const shell = Geist({ subsets: ["latin"], variable: "--font-shell-loaded" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono-loaded" });

/* Pixel-medievais: herdadas da v1, usadas pelas fases que quiserem. */
const title = Jacquard_12({ weight: "400", subsets: ["latin"], variable: "--font-title-loaded", display: "swap" });
const ui = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-ui-loaded", display: "swap" });

export const metadata: Metadata = {
  title: "closeWindows",
  description: "Toda fase é fechar uma janela. Cada janela é um mundo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${display.variable} ${shell.variable} ${mono.variable} ${title.variable} ${ui.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
