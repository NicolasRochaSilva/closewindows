/*
 * O ritmo do dragao, sem tela nem som: so tempo (segundos) e a posicao da
 * folha. O Jogo pergunta "em que fase ele esta?" a cada quadro e "deu certo?"
 * a cada empurrao. Tudo testavel em ritmo.test.ts.
 */

/** calmo: empurrao inutil. inspira/fogo/finta: pego. folego: a janela de acerto. */
export type Fase = "calmo" | "inspira" | "fogo" | "finta" | "folego";
export type Trecho = { fase: Fase; dur: number };
export type Julgamento = "acerto" | "pego" | "empurrao";

const t = (fase: Fase, dur: number): Trecho => ({ fase, dur });

/** Um padrao por pancada (indice = passo atual da folha). Cada um termina no folego. */
export const PADROES: Trecho[][] = [
  /* 1: uma baforada longa, ritmo de ensino. */
  [t("calmo", 1), t("inspira", 1.2), t("fogo", 0.8), t("folego", 1)],
  /* 2: baforada dupla; a inspirada do meio e armadilha. */
  [t("calmo", 0.8), t("inspira", 0.8), t("fogo", 0.5), t("inspira", 0.3), t("fogo", 0.5), t("folego", 0.8)],
  /* 3: finta (boca fecha, sem fumaca) e rajada tripla rapida. */
  [
    t("calmo", 0.6),
    t("inspira", 0.6),
    t("finta", 0.5),
    t("inspira", 0.3),
    t("fogo", 0.35),
    t("inspira", 0.2),
    t("fogo", 0.35),
    t("inspira", 0.2),
    t("fogo", 0.35),
    t("folego", 0.6),
  ],
];

/** Pancadas para fechar: a folha anda de 0 (aberta) a PASSOS (fechada). */
export const PASSOS = PADROES.length;
/** Folga nas bordas do folego: o ouvido humano adianta e atrasa um pouco. */
export const FOLGA = 0.1;
/** Depois de um acerto ou de ser pego, o dragao se recompoe antes de recomecar. */
export const REACAO = 0.7;

export const duracao = (padrao: Trecho[]) => padrao.reduce((s, p) => s + p.dur, 0);

export type Momento = { fase: Fase; indice: number; dur: number; dentro: number };

/** Onde o dragao esta `tempo` segundos depois do inicio do padrao (o padrao se repete). */
export function momentoEm(padrao: Trecho[], tempo: number): Momento {
  const ciclo = duracao(padrao);
  let resto = ((tempo % ciclo) + ciclo) % ciclo;
  for (let indice = 0; indice < padrao.length; indice += 1) {
    const { fase, dur } = padrao[indice];
    if (resto < dur) return { fase, indice, dur, dentro: resto };
    resto -= dur;
  }
  const ultimo = padrao.length - 1;
  return { fase: padrao[ultimo].fase, indice: ultimo, dur: padrao[ultimo].dur, dentro: padrao[ultimo].dur };
}

/** O que acontece com um empurrao `tempo` segundos depois do inicio do padrao. */
export function julgar(padrao: Trecho[], tempo: number): Julgamento {
  const ciclo = duracao(padrao);
  const folego = padrao[padrao.length - 1].dur;
  const noCiclo = ((tempo % ciclo) + ciclo) % ciclo;
  /* O folego e o ultimo trecho: folga antes dele (fim do fogo) e depois (comeco do proximo calmo). */
  if (noCiclo >= ciclo - folego - FOLGA) return "acerto";
  if (noCiclo < FOLGA && tempo >= ciclo) return "acerto";
  return momentoEm(padrao, tempo).fase === "calmo" ? "empurrao" : "pego";
}

/** O passo da folha depois de um julgamento: acerto avanca, pego recua, empurrao nao mexe. */
export function proximoPasso(passo: number, j: Julgamento) {
  if (j === "acerto") return Math.min(PASSOS, passo + 1);
  if (j === "pego") return Math.max(0, passo - 1);
  return passo;
}

export type Ritmo = ReturnType<typeof criarRitmo>;

/** A partida: passo da folha + relogio do padrao, que recomeca a cada acerto ou erro. */
export function criarRitmo(agora: number) {
  let passo = 0;
  let inicio = agora;
  let ocupadoAte = agora;

  return {
    get passo() {
      return passo;
    },
    get fechou() {
      return passo >= PASSOS;
    },
    /** null enquanto o dragao reage (ou depois de fechar): nada a julgar. */
    momento(agora: number): Momento | null {
      if (passo >= PASSOS || agora < ocupadoAte) return null;
      return momentoEm(PADROES[passo], agora - inicio);
    },
    /** null = empurrao ignorado (reacao em curso ou ja fechou). */
    empurrar(agora: number): Julgamento | null {
      if (passo >= PASSOS || agora < ocupadoAte) return null;
      const j = julgar(PADROES[passo], agora - inicio);
      passo = proximoPasso(passo, j);
      if (j !== "empurrao") {
        ocupadoAte = agora + REACAO;
        inicio = ocupadoAte;
      }
      return j;
    },
  };
}
