import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders_Stencil, Jacquard_12, Press_Start_2P } from "next/font/google";
import "./globals.css";

/* Casca: estencil so para o que e "pintado no muro"; Archivo para o resto. */
const estencil = Big_Shoulders_Stencil({ subsets: ["latin"], variable: "--font-estencil-loaded" });
const casca = Archivo({ subsets: ["latin"], variable: "--font-casca-loaded" });

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
  themeColor: "#2b303c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${estencil.variable} ${casca.variable} ${title.variable} ${ui.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
