/*
 * A regra da hidra, sem React: quem e a original, como cada cabeca mente na
 * sombra e onde cada janela fica na praca. Tudo em pixels da caixa da fase.
 *
 * Regra que o jogador deduz: ha um sol so. A sombra honesta aponta para longe
 * do pe do sol (o ponto do horizonte embaixo dele) e mede `razao` vezes a
 * altura de quem a projeta. A estatua e a janela original sao honestas; as
 * copias mentem no angulo, no comprimento, ou nos dois.
 */

export type Mentira = { giro: number; escala: number };

export type Cabeca = {
  id: number;
  /** 0 = original; 1 = cabecas do comeco; 2+ = filhas de um corte errado. */
  geracao: number;
  mentira: Mentira;
};

export type Sol = { x: number; elevacao: number };

export type Rng = () => number;

export const HONESTA: Mentira = { giro: 0, escala: 1 };
export const CABECAS_INICIAIS = 3;
export const CABECAS_MAX = 8;

/* Faixa de angulo que uma sombra pode ter na tela: sempre para baixo do horizonte. */
const ANG_MIN = (12 * Math.PI) / 180;
const ANG_MAX = Math.PI - ANG_MIN;
const GRAU = Math.PI / 180;

/** PRNG pequeno e determinista (mulberry32): mesma semente, mesma praca. */
export function rngDe(semente: number): Rng {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (rng: Rng, a: number, b: number) => a + (b - a) * rng();
const sinal = (rng: Rng) => (rng() < 0.5 ? -1 : 1);

/** Quanto mais nova a cabeca, melhor ela mente. */
export function mentiraDaGeracao(geracao: number, rng: Rng, irma?: Mentira): Mentira {
  if (geracao <= 0) return HONESTA;
  /* 1a geracao: a sombra cai para o lado errado. */
  if (geracao === 1) return { giro: sinal(rng) * entre(rng, 80, 120) * GRAU, escala: entre(rng, 0.9, 1.1) };
  /* 2a: lado certo, comprimento errado. Irmas mentem em sentidos opostos. */
  if (geracao === 2) {
    const curta = irma ? irma.escala > 1 : rng() < 0.5;
    return { giro: 0, escala: curta ? entre(rng, 0.4, 0.5) : entre(rng, 1.9, 2.2) };
  }
  /* Dai em diante: um desvio so, menor, mas ainda visivel no celular. */
  return rng() < 0.5
    ? { giro: sinal(rng) * entre(rng, 34, 44) * GRAU, escala: 1 }
    : { giro: 0, escala: rng() < 0.5 ? 0.58 : 1.7 };
}

/** Angulo (radianos, tela com y para baixo) da sombra honesta de quem pisa em `base`. */
export function anguloHonesto(base: { x: number; y: number }, pe: { x: number; y: number }) {
  const a = Math.atan2(base.y - pe.y, base.x - pe.x);
  return Math.min(ANG_MAX, Math.max(ANG_MIN, a));
}

/** Sombra de uma cabeca: angulo e razao (comprimento / altura). */
export function sombra(
  mentira: Mentira,
  base: { x: number; y: number },
  pe: { x: number; y: number },
  razaoHonesta: number,
) {
  const honesto = anguloHonesto(base, pe);
  let angulo = honesto;
  if (mentira.giro !== 0) {
    /* Se o giro empurra a sombra para cima do horizonte, ela gira para o outro lado. */
    const dentro = (a: number) => a >= ANG_MIN && a <= ANG_MAX;
    const ida = honesto + mentira.giro;
    const volta = honesto - mentira.giro;
    angulo = dentro(ida) ? ida : dentro(volta) ? volta : Math.min(ANG_MAX, Math.max(ANG_MIN, ida));
  }
  return { angulo, razao: razaoHonesta * mentira.escala };
}

/** Sol baixo = sombra longa. Elevacao em graus. */
export const razaoDoSol = (elevacao: number) => 0.3 / Math.tan(elevacao * GRAU);

/** Sol sorteado num dos lados do ceu; `lado` mantem o lado entre um erro e outro. */
export function sortearSol(rng: Rng, lado?: -1 | 1): Sol {
  const l = lado ?? sinal(rng);
  const x = entre(rng, 0.05, 0.24);
  return { x: l < 0 ? x : 1 - x, elevacao: entre(rng, 13, 26) };
}

export function criarHidra(rng: Rng): Cabeca[] {
  const cabecas: Cabeca[] = [{ id: 0, geracao: 0, mentira: HONESTA }];
  for (let i = 1; i < CABECAS_INICIAIS; i += 1) cabecas.push({ id: i, geracao: 1, mentira: mentiraDaGeracao(1, rng) });
  return embaralhar(cabecas, rng);
}

/** Corta a cabeca `id` (errada): no lugar dela nascem duas filhas, mentirosas melhores. */
export function cortar(cabecas: Cabeca[], id: number, rng: Rng, proximoId: number): Cabeca[] {
  const mae = cabecas.find((c) => c.id === id);
  if (!mae || mae.geracao === 0) return cabecas;
  const geracao = Math.max(2, mae.geracao + 1);
  const a = mentiraDaGeracao(geracao, rng);
  const b = mentiraDaGeracao(geracao, rng, a);
  return cabecas.flatMap((c) =>
    c.id === id
      ? [
          { id: proximoId, geracao, mentira: a },
          { id: proximoId + 1, geracao, mentira: b },
        ]
      : [c],
  );
}

export function embaralhar<T>(lista: T[], rng: Rng): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/* ---------- Geometria da praca ---------- */

/** Arte da janela em unidades locais: largura 100 (sem as folhas), altura 150. */
export const JAN_L = 100;
export const JAN_A = 150;
/** Com as folhas abertas a janela ocupa ~1,6 vez a largura da moldura. */
const JAN_L_ABERTA = 164;
/** Estatua (pedestal + manequim) em unidades locais. */
export const EST_A = 230;

export type Praca = { largura: number; altura: number; horizonte: number };
export type Lugar = { x: number; y: number; s: number };

export function praca(largura: number, altura: number): Praca {
  /* Retrato tem ceu menor: o chao precisa caber mais janelas. */
  const fracao = largura / altura < 0.8 ? 0.3 : 0.36;
  return { largura, altura, horizonte: Math.round(altura * fracao) };
}

export const peDoSol = (p: Praca, sol: Sol) => ({ x: sol.x * p.largura, y: p.horizonte });

/**
 * Lugares de `n` janelas no chao, em fileiras escalonadas; a de tras e menor
 * (perspectiva). Nenhum alvo invade o vizinho: a altura cabe na fileira e a
 * largura aberta cabe na coluna.
 */
export function arranjo(p: Praca, n: number, rng: Rng): Lugar[] {
  const chao = p.altura - p.horizonte;
  /* A faixa de baixo fica livre: e onde as sombras da fileira da frente deitam (e onde o console poe as falas). */
  const retrato = p.largura / p.altura < 0.8;
  const topo = p.horizonte + chao * (retrato ? 0.2 : 0.22);
  const fundo = p.horizonte + chao * (retrato ? 0.74 : 0.64);
  const util = p.largura * 0.9;
  /* Retrato: menos fileiras e mais altas, senao a sombra de uma fileira some atras da proxima. */
  const colunas = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * util) / (fundo - topo) / (retrato ? 0.6 : 1.25)))));
  const fileiras = Math.ceil(n / colunas);
  /* Fileiras equilibradas (8 = 4 + 4, nao 6 + 2), e as impares deslocadas meio vao: a sombra de tras passa entre as da frente. */
  const porFileira = Array.from({ length: fileiras }, (_, f) => Math.floor(n / fileiras) + (f < n % fileiras ? 1 : 0));
  const maisLarga = porFileira[0];
  const passoY = (fundo - topo) / fileiras;
  const passoX = util / (maisLarga + (fileiras > 1 ? 0.5 : 0));
  const sMax = Math.min((passoY * 0.92) / JAN_A, (passoX * 0.9) / JAN_L_ABERTA, (chao * 0.27) / JAN_A);
  /* Varias fileiras se espalham pela faixa toda (vao livre para as sombras); uma so fica no meio dela. */
  const passoReal = fileiras > 1 ? passoY : (JAN_A * sMax) / 0.92;
  const inicio0 = topo + (fundo - topo - passoReal * fileiras) / 2;

  const lugares: Lugar[] = [];
  porFileira.forEach((nestaFileira, f) => {
    const profundidade = fileiras === 1 ? 1 : 0.76 + (0.24 * f) / (fileiras - 1);
    const s = sMax * profundidade;
    const y = inicio0 + passoReal * (f + 1) - passoReal * 0.04 * rng();
    const desvio = fileiras === 1 ? 0 : f % 2 ? passoX / 4 : -passoX / 4;
    const folga = Math.max(0, passoX - JAN_L_ABERTA * s) / 2;
    for (let c = 0; c < nestaFileira; c += 1) {
      const x = p.largura / 2 + (c - (nestaFileira - 1) / 2) * passoX + desvio + (rng() * 2 - 1) * folga * 0.7;
      lugares.push({ x, y, s });
    }
  });
  return lugares;
}

/**
 * A estatua mora ao fundo, do lado do sol mas sempre mais perto do centro que
 * ele (o sol anda entre 5% e 24% da largura): a sombra dela desce em diagonal
 * para o meio da praca, nunca vira coluna nem fio.
 */
export function lugarDaEstatua(p: Praca, lado: -1 | 1): Lugar {
  const chao = p.altura - p.horizonte;
  const s = Math.min((chao * 0.26) / EST_A, p.largura / 760);
  const x = p.largura * 0.33;
  return { x: lado < 0 ? x : p.largura - x, y: p.horizonte + chao * 0.17, s };
}

/** Matriz SVG que deita a silhueta local (y para cima negativo) no chao, na direcao da sombra. */
export function matrizSombra(l: Lugar, angulo: number, razao: number) {
  const c = -l.s * razao * Math.cos(angulo);
  const d = -l.s * razao * Math.sin(angulo);
  return `matrix(${l.s} 0 ${c} ${d} ${l.x} ${l.y})`;
}

const DIRECOES = ["para a direita", "para baixo e à direita", "para baixo", "para baixo e à esquerda", "para a esquerda"];

/** Descricao da sombra para leitor de tela: a mesma pista que o olho tem. */
export function descreverSombra(angulo: number, razao: number) {
  const direcao = DIRECOES[Math.round((angulo / Math.PI) * 4)];
  return `sombra ${direcao}, ${razao.toFixed(1).replace(".", ",")} vez a altura`;
}
