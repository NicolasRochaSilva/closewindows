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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${title.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
