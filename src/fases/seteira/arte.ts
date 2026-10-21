/**
 * A arte da Seteira em mapas de letras (cores em Pixels.tsx). Casa = 12x12
 * pixels de arte = 48px. A sala tem uma fileira de parede a mais no topo
 * (fileira -1) para a seteira caber em 1x2 casas.
 */
import type { Retangulo } from "./Pixels";
import { ALTURA, LARGURA, MAPA, ehParede, letra, type Casa } from "./turnos";

export const CASA = 12;
/** Fileiras desenhadas: a do topo (-1) + as do mapa. */
export const FILEIRAS = ALTURA + 1;
export const ARTE_L = LARGURA * CASA;
export const ARTE_A = FILEIRAS * CASA;

export const FECHADOR = [
  "....oooo....",
  "...ohhhho...",
  "..ohhhhhho..",
  "..ohssssho..",
  "..osossoso..",
  "..ohssssho..",
  "..otthhtto..",
  ".ottttttTTo.",
  ".ostttttTso.",
  "..otttttTo..",
  "..obo..obo..",
  "..ooo..ooo..",
] as const;

export const ESQUELETO = [
  "...oooooo...",
  "..owwwwwwo..",
  ".owwwwwwwOo.",
  ".owoowwooOo.",
  ".owroowroOo.",
  "..owwoowOo..",
  "...owowowo..",
  "..oowwwwoo..",
  ".owoOwwOowo.",
  ".owowOOwowo.",
  "...owoowo...",
  "..oow..woo..",
] as const;

/* Lâmina do chao nas tres fases. As fendas ficam no mesmo lugar nas tres. */
export const LAMINA_BAIXA = [
  "............",
  "............",
  "............",
  "............",
  "............",
  ".BB..BB..BB.",
  "............",
  "............",
  "............",
  "............",
  "...BB..BB...",
  "............",
] as const;

export const LAMINA_BRILHO = [
  "............",
  "............",
  "............",
  "............",
  ".g...g...g..",
  ".BB..BB..BB.",
  "............",
  "............",
  "............",
  "...g...g....",
  "...BB..BB...",
  "............",
] as const;

export const LAMINA_ERGUIDA = [
  "............",
  ".l...l...l..",
  ".li..li..li.",
  ".li..li..li.",
  ".li..li..li.",
  ".BB..BB..BB.",
  "...l...l....",
  "...li..li...",
  "...li..li...",
  "...li..li...",
  "...BB..BB...",
  "............",
] as const;

export const PENDULO = [
  ".....ii.....",
  ".....ii.....",
  ".....ii.....",
  "....IiiI....",
  "..IIiiiiII..",
  ".Iiiiiiiiil.",
  "Iliiiiiiiill",
  "Illliiiillll",
  ".IllllllllI.",
  "..IIllllII..",
  "....IIII....",
  "............",
] as const;

export const SOMBRA = [
  "...BBBBBB...",
  ".BBBBBBBBBB.",
  ".BBBBBBBBBB.",
  "...BBBBBB...",
] as const;

/* Pegada de po de osso: onde o esqueleto pisa no proximo turno. */
export const PEGADA = [
  "............",
  "............",
  "............",
  "............",
  "............",
  "...OO.......",
  "...OO...OO..",
  "........OO..",
  "............",
  "............",
  "............",
  "............",
] as const;

export const GOLPE = [
  "............",
  ".r...r....r.",
  "..r..r...r..",
  "...r.rr.r...",
  "....rffr....",
  ".rrrffffrrr.",
  "....rffr....",
  "...r.rr.r...",
  "..r..r...r..",
  ".r...r....r.",
  "............",
  "............",
] as const;

/* Chama da tocha: dois quadros reta (sem vento) e dois deitada (ventania). */
export const CHAMA = {
  reta: [
    [
      "...ff...",
      "...ff...",
      "..fGGf..",
      "..fGGf..",
      ".fGggGf.",
      ".fGggGf.",
      ".fGggGf.",
      "..fGGf..",
      "..IIII..",
      "...II...",
    ],
    [
      "........",
      "...fff..",
      "..fGGf..",
      ".fGGGf..",
      ".fGggGf.",
      ".fGggGf.",
      ".fGggGf.",
      "..fGGf..",
      "..IIII..",
      "...II...",
    ],
  ],
  vento: [
    [
      "......ff",
      ".....fG.",
      "....fGf.",
      "...fGGf.",
      "..fGgGf.",
      ".fGggf..",
      ".fGggGf.",
      "..fGGf..",
      "..IIII..",
      "...II...",
    ],
    [
      "........",
      "......ff",
      ".....fGf",
      "...ffGf.",
      "..fGgGf.",
      ".fGggf..",
      ".fGggGf.",
      "..fGGf..",
      "..IIII..",
      "...II...",
    ],
  ],
} as const;

/* A seteira: 1 casa de largura por 2 de altura (fileiras -1 e 0), vista de frente. */
export const SETEIRA_ARTE = [
  "DDDDDDDDDDDD",
  "SSSDSSSSSDSS",
  "SSSDSSSSSDSS",
  "DDDDDDDDDDDD",
  "SDSSSSSSSSDS",
  "SDBBBBBBBBDS",
  "DDBKKKKKKBDD",
  "SSBKK*KKKBSS",
  "SSBKKKKKKBSS",
  "DDBKKKKNKBDD",
  "SDBNNNKKKBDS",
  "SDBNNNNNKBDS",
  "DDBNNNNNNBII",
  "SSBNN*NNNBSI",
  "SSBNNNNNNBSI",
  "DDBYNNNNNBII",
  "SDBYYNNNNBDS",
  "SDBYYYNNNBDS",
  "DDBYYYYYNBDD",
  "SSBYYYYYYBSS",
  "SSBBBBBBBBSS",
  "DLLLLLLLLLLD",
  "SDDDDDDDDDDS",
  "SDSSSSSSSSDS",
] as const;

/** A portinhola de madeira com cintas de ferro, do tamanho do vao (8x18). */
export const PORTINHOLA = [
  "XXXXXXXX",
  "XHWMHWMX",
  "XIIIIIIX",
  "XIlIIlIX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XIIIIIIX",
  "XIlIIlIX",
  "XHWMHWMX",
  "XHWMHWMX",
  "XXXXXXXX",
] as const;

export const FERROLHO = ["lllllG", "iiiiiG"] as const;

export const SETA = [
  "...p...",
  "..ppp..",
  ".ppppp.",
  "ppppppp",
  "..ppp..",
  "..ppp..",
  "..ppp..",
] as const;

export const AMPULHETA = [
  "ppppp",
  ".p.p.",
  "..p..",
  ".p.p.",
  "ppppp",
] as const;

/* ---------- O chao e as paredes, gerados uma vez ---------- */

const chao = (c: Casa) => c.y >= 0 && c.y < ALTURA && !ehParede(c);
/* Ruido deterministico por casa, para as rachaduras nao mudarem a cada render. */
const sorte = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function casaDeFundo(x: number, y: number): Retangulo[] {
  const ox = x * CASA;
  const oy = (y + 1) * CASA;
  const r = (dx: number, dy: number, w: number, h: number, c: string): Retangulo => ({ x: ox + dx, y: oy + dy, w, h, c });
  const aqui = { x, y };

  if (!chao(aqui)) {
    /* Parede com chao embaixo mostra a face de tijolo; o resto e o topo escuro. */
    if (chao({ x, y: y + 1 })) {
      const junta = x % 2 ? 3 : 8;
      return [
        r(0, 0, 12, 12, "D"),
        r(0, 0, 12, 1, "S"),
        r(0, 6, 12, 1, "S"),
        r(0, 5, 12, 1, "B"),
        r(0, 11, 12, 1, "B"),
        r(junta, 0, 1, 5, "B"),
        r(11 - junta, 6, 1, 5, "B"),
      ];
    }
    const borda: Retangulo[] = [r(0, 0, 12, 12, "B")];
    if (chao({ x: x - 1, y })) borda.push(r(0, 0, 1, 12, "D"));
    if (chao({ x: x + 1, y })) borda.push(r(11, 0, 1, 12, "D"));
    if (chao({ x, y: y - 1 })) borda.push(r(0, 0, 12, 1, "D"));
    return borda;
  }

  const lajota: Retangulo[] = [r(0, 0, 12, 12, "c"), r(11, 0, 1, 12, "j"), r(0, 11, 12, 1, "j"), r(1, 1, 3, 1, "C"), r(1, 2, 1, 2, "C")];
  /* Sombra da parede de cima no chao: da profundidade da vista 3/4. */
  if (!chao({ x, y: y - 1 })) lajota.push(r(0, 0, 11, 2, "j"));
  const s = sorte(x, y);
  if (s % 3 === 0) lajota.push(r(5 + (s % 4), 6, 2, 1, "j"), r(7 + (s % 4) - 2, 7, 1, 2, "j"));

  const l = letra(aqui);
  if (l === ">" || l === "<") lajota.push(r(1, 1, 10, 10, "I"), r(1, 1, 10, 1, "i"), r(1, 1, 1, 10, "i"));
  /* Trilho do pendulo: um sulco atravessando a fileira. */
  if (l === "~") lajota.push(r(0, 9, 12, 2, "B"), r(0, 8, 12, 1, "j"));
  return lajota;
}

export const FUNDO: Retangulo[] = [];
for (let y = -1; y < ALTURA; y += 1) for (let x = 0; x < LARGURA; x += 1) FUNDO.push(...casaDeFundo(x, y));

export const TOCHAS: Casa[] = [];
MAPA.forEach((linha, y) => [...linha].forEach((l, x) => l === "T" && TOCHAS.push({ x, y })));

/** Poca de luz da tocha em degraus (circulo de pixel), em pixels de arte. */
export function pocaDeLuz(raio: number): Retangulo[] {
  const saida: Retangulo[] = [];
  for (let dy = -raio; dy < raio; dy += 2) {
    const meia = Math.floor(Math.sqrt(raio * raio - (dy + 1) * (dy + 1)) / 2) * 2;
    if (meia > 0) saida.push({ x: raio - meia, y: raio + dy, w: meia * 2, h: 2, c: "g" });
  }
  return saida;
}
