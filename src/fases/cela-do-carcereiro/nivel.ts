/*
 * Regras da cela, sem React: o Jogo desenha, o teste resolve por busca.
 *
 *   #  parede          @  o fechador
 *   .  chao            $  caixote
 *   J  a janela (na parede de cima): sem tranca, nao fecha
 *   T  a tranca no gancho (na parede): anda contra ela e pega
 *   o  ralo no chao (so desenho: e chao, e onde um caixote cabe)
 */
export const MAPA = [
  "####J####",
  "##..$...#",
  "##@.###.#",
  "###$#...#",
  "###....##",
  "###.#.###",
  "#...$$###",
  "##.##o###",
  "T...#####",
  "#########",
] as const;

export const LARGURA = MAPA[0].length;
export const ALTURA = MAPA.length;

export type Dir = "cima" | "baixo" | "esq" | "dir";
export type Pos = { x: number; y: number };

export type Estado = {
  jogador: Pos;
  /** Indice fixo por caixote: o Jogo usa como chave para animar cada um. */
  caixotes: Pos[];
  tranca: boolean;
  olhar: Dir;
};

/** O que aconteceu no passo; o Jogo escolhe som e fala por aqui. */
export type Evento = "andou" | "empurrou" | "bateu" | "pegou" | "semTranca" | "fechou";

export const PASSO: Record<Dir, Pos> = {
  cima: { x: 0, y: -1 },
  baixo: { x: 0, y: 1 },
  esq: { x: -1, y: 0 },
  dir: { x: 1, y: 0 },
};

export const celula = (x: number, y: number) => MAPA[y]?.[x] ?? "#";
const ehChao = (x: number, y: number) => ".@$o".includes(celula(x, y));

function achar(c: string): Pos[] {
  const achados: Pos[] = [];
  MAPA.forEach((linha, y) => [...linha].forEach((ch, x) => ch === c && achados.push({ x, y })));
  return achados;
}

export const JANELA = achar("J")[0];
export const GANCHO = achar("T")[0];
export const RALO = achar("o")[0];

export function inicial(): Estado {
  return { jogador: achar("@")[0], caixotes: achar("$"), tranca: false, olhar: "baixo" };
}

export function mover(e: Estado, d: Dir): { estado: Estado; evento: Evento } {
  const { x: dx, y: dy } = PASSO[d];
  const x = e.jogador.x + dx;
  const y = e.jogador.y + dy;
  const virado = { ...e, olhar: d };
  const alvo = celula(x, y);

  if (alvo === "T") return e.tranca ? { estado: virado, evento: "bateu" } : { estado: { ...virado, tranca: true }, evento: "pegou" };
  if (alvo === "J") return { estado: virado, evento: e.tranca ? "fechou" : "semTranca" };
  if (!ehChao(x, y)) return { estado: virado, evento: "bateu" };

  const i = e.caixotes.findIndex((c) => c.x === x && c.y === y);
  if (i < 0) return { estado: { ...virado, jogador: { x, y } }, evento: "andou" };

  const bx = x + dx;
  const by = y + dy;
  if (!ehChao(bx, by) || e.caixotes.some((c) => c.x === bx && c.y === by)) return { estado: virado, evento: "bateu" };
  const caixotes = e.caixotes.map((c, j) => (j === i ? { x: bx, y: by } : c));
  return { estado: { ...virado, jogador: { x, y }, caixotes }, evento: "empurrou" };
}

const LETRAS: [string, Dir][] = [["u", "cima"], ["d", "baixo"], ["l", "esq"], ["r", "dir"]];
const chave = (e: Estado) =>
  `${e.jogador.x},${e.jogador.y}|${e.caixotes.map((c) => `${c.x},${c.y}`).sort().join(";")}|${e.tranca ? 1 : 0}`;

/**
 * Busca em largura: a menor sequencia de passos (u/d/l/r) que fecha a janela
 * a partir de `ini`, ou null se dali nao tem mais saida. O nivel e pequeno
 * (poucos milhares de estados), da para chamar a cada empurrao.
 */
export function resolver(ini: Estado = inicial()): string | null {
  const vistos = new Set([chave(ini)]);
  let fila: [Estado, string][] = [[ini, ""]];
  while (fila.length) {
    const prox: [Estado, string][] = [];
    for (const [e, caminho] of fila) {
      for (const [letra, d] of LETRAS) {
        const { estado, evento } = mover(e, d);
        if (evento === "fechou") return caminho + letra;
        const k = chave(estado);
        if (vistos.has(k)) continue;
        vistos.add(k);
        prox.push([estado, caminho + letra]);
      }
    }
    fila = prox;
  }
  return null;
}
