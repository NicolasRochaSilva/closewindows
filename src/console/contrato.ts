import type { ComponentType } from "react";

/**
 * Contrato do cartucho: tudo que uma fase precisa saber do console, e nada mais.
 * Ver docs/superpowers/specs/2026-10-21-closewindows-v2-design.md, secao 3.
 */

export type Qualidade = "alta" | "media" | "baixa";

export type Mundo = { id: string; nome: string; ordem: number };

export type FaseMeta = {
  /** kebab-case, igual ao nome da pasta. Imutavel depois de publicada. */
  id: string;
  mundo: string;
  /** Ordem global da campanha. */
  ordem: number;
  nome: string;
  autor: string;
  /** Segundos. Passou disso, a nota desconta. */
  tempoAlvo: number;
  /**
   * "dom": Jogo/Previa sao componentes DOM (CSS, SVG, canvas 2D, Pixi, three em canvas proprio...).
   * "three": Jogo/Previa sao conteudo de cena R3F, desenhados no canvas unico do console.
   */
  tipo: "dom" | "three";
  /** Ainda sem cartucho: aparece trancada na parede. */
  emObras?: boolean;
};

export type FaseApi = {
  /** +1 tentativa. Chame a cada erro do jogador. */
  erro(): void;
  /** Venceu. Chame UMA vez, no fim da animacao de fechar. */
  fechou(): void;
  /** Balao de texto de um personagem da fase. */
  fala(texto: string, quem?: string): void;
  qualidade: Qualidade;
  reduzirMovimento: boolean;
  /** O jogador ja fechou essa fase antes. */
  jaFechou: boolean;
};

export type Cartucho = {
  /** A fase em si. Ocupa a tela toda (dom: uma caixa; three: uma view do canvas). */
  Jogo: ComponentType<{ api: FaseApi }>;
  /** Versao leve que roda ao vivo na parede. Sem input, sem som. */
  Previa: ComponentType<{ qualidade: Qualidade }>;
};
