import type { Metadata } from "next";
import { Jacquard_12, Press_Start_2P } from "next/font/google";
import "./globals.css";

const title = Jacquard_12({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-title-loaded",
  display: "swap",
});

const ui = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ui-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "closeWindows",
  description: "Feche todas as janelas. Um jogo colaborativo de puzzles em 16 bits, de estilo medieval.",
};

/* Roda antes da primeira pintura: aplica o tema salvo (padrao escuro). */
const THEME_SCRIPT = `try{var t=localStorage.getItem("cw_theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${title.variable} ${ui.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
