/**
 * A Seteira: a masmorra por turnos, sem React. O mundo inteiro e funcao do
 * turno `t` (lâminas, pêndulo e esqueleto andam num ciclo fixo), entao o
 * estado do jogo e so onde o fechador esta e em que turno.
 *
 * Ordem de um turno (estilo Rogue): o fechador age, depois o mundo anda.
 * Dano se a casa de destino tem perigo AGORA (pisou nele) ou DEPOIS que o
 * mundo anda (o perigo chegou nele). Trocar de lugar com o esqueleto cai no
 * primeiro caso.
 */

export type Casa = { x: number; y: number };
export type Acao = "cima" | "baixo" | "esquerda" | "direita" | "esperar";
export type Estado = { jogador: Casa; t: number };

/*
 * # parede · T parede com tocha · S a seteira (na parede norte)
 * . chao · > lâminas em onda para a direita · < em onda para a esquerda
 * ~ fileira do pêndulo · @ comeco
 */
export const MAPA = [
  "###S###",
  "#.....#",
  "#.....#",
  "#.....#",
  "##...##",
  "##~~~##",
  "#T...T#",
  "##>>>##",
  "##...##",
  "##<<<##",
  "##.@.##",
  "#######",
] as const;

export const LARGURA = MAPA[0].length;
export const ALTURA = MAPA.length;

const achar = (letra: string): Casa => {
  const y = MAPA.findIndex((linha) => linha.includes(letra));
  return { x: MAPA[y].indexOf(letra), y };
};

export const COMECO = achar("@");
export const SETEIRA = achar("S");
export const INICIAL: Estado = { jogador: COMECO, t: 0 };

const mod = (n: number, m: number) => ((n % m) + m) % m;

export const letra = (c: Casa) => MAPA[c.y]?.[c.x] ?? "#";
export const ehParede = (c: Casa) => "#TS".includes(letra(c));

/* ---------- Lâminas do chão: erguida → baixa → brilhando → erguida ---------- */

export type FaseLamina = "erguida" | "baixa" | "brilho";
const CICLO_LAMINA: FaseLamina[] = ["erguida", "baixa", "brilho"];

/** Fase da lâmina na casa `c` no turno `t`, ou null se ali nao tem lâmina. */
export function lamina(c: Casa, t: number): FaseLamina | null {
  const l = letra(c);
  if (l === ">") return CICLO_LAMINA[mod(t - c.x, 3)];
  if (l === "<") return CICLO_LAMINA[mod(t + c.x, 3)];
  return null;
}

/* ---------- Pêndulo: varre a fileira de ponta a ponta ---------- */

export const FILEIRA_PENDULO = MAPA.findIndex((linha) => linha.includes("~"));
const VARREDURA = [2, 3, 4, 3];

export const pendulo = (t: number): Casa => ({ x: VARREDURA[mod(t, VARREDURA.length)], y: FILEIRA_PENDULO });

/* ---------- Esqueleto: ronda a borda da camara em sentido horario ---------- */

export const RONDA: Casa[] = [
  { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  { x: 5, y: 2 }, { x: 5, y: 3 },
  { x: 4, y: 3 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 },
  { x: 1, y: 2 },
];
/* Fase da ronda no turno 0: escolhida para o caminho mais curto ter que esperar por ele na camara. */
const RONDA_INICIO = 2;

export const esqueleto = (t: number): Casa => RONDA[mod(t + RONDA_INICIO, RONDA.length)];

/* ---------- Perigo e o turno ---------- */

const mesma = (a: Casa, b: Casa) => a.x === b.x && a.y === b.y;

export type Perigo = "lamina" | "pendulo" | "esqueleto";

export function perigo(c: Casa, t: number): Perigo | null {
  if (lamina(c, t) === "erguida") return "lamina";
  if (mesma(pendulo(t), c)) return "pendulo";
  if (mesma(esqueleto(t), c)) return "esqueleto";
  return null;
}

const DELTA: Record<Acao, Casa> = {
  cima: { x: 0, y: -1 },
  baixo: { x: 0, y: 1 },
  esquerda: { x: -1, y: 0 },
  direita: { x: 1, y: 0 },
  esperar: { x: 0, y: 0 },
};

export type Resultado =
  /** Parede no caminho: nao gasta turno. */
  | { tipo: "parede" }
  | { tipo: "andou"; estado: Estado }
  /** `onde` e a casa do golpe; o jogo volta para INICIAL depois de mostrar. */
  | { tipo: "dano"; onde: Casa; por: Perigo; t: number }
  /** Empurrou a seteira: o mundo para nesse turno. */
  | { tipo: "fechou" };

export function passo(estado: Estado, acao: Acao): Resultado {
  const d = DELTA[acao];
  const destino = { x: estado.jogador.x + d.x, y: estado.jogador.y + d.y };
  if (mesma(destino, SETEIRA)) return { tipo: "fechou" };
  if (ehParede(destino)) return { tipo: "parede" };

  const agora = perigo(destino, estado.t);
  if (agora) return { tipo: "dano", onde: destino, por: agora, t: estado.t };
  const depois = perigo(destino, estado.t + 1);
  if (depois) return { tipo: "dano", onde: destino, por: depois, t: estado.t + 1 };

  return { tipo: "andou", estado: { jogador: destino, t: estado.t + 1 } };
}

/** A casa vizinha `c` vista do fechador vira acao (toque na casa); longe ou na diagonal, null. */
export function acaoPara(de: Casa, c: Casa): Acao | null {
  const dx = c.x - de.x;
  const dy = c.y - de.y;
  if (dx === 0 && dy === 0) return "esperar";
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1) return "direita";
  if (dx === -1) return "esquerda";
  return dy === 1 ? "baixo" : "cima";
}
