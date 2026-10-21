import { Instrument_Serif } from "next/font/google";

/* Serifa de legenda de gravura. A casca nao carrega mais essa fonte: a fase traz a sua. */
export const serifa = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--memoria-serifa",
});
