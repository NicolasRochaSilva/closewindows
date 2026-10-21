/*
 * Onde a janela de login mora na tela. A capa (cartaz) ocupa a metade esquerda
 * em paisagem, ou o alto em retrato; a janela fica no resto. Mesmos cortes que
 * .capa em console.module.css — mudou aqui, mude la.
 */
export const CAPA_LADO = 0.5;
export const CAPA_TOPO = 0.27;
export const LARGURA_DEITADA = 720;

/** Medidas que precisam caber na regiao (unidades do mundo, com folga para peitoril e moldura). */
export type Janela = { altura: number; largura: number };

export function enquadrar(largura: number, altura: number, janela: Janela, tanMeioFov: number) {
  const deitada = largura >= altura && largura >= LARGURA_DEITADA;
  const r = deitada
    ? { x: largura * CAPA_LADO, y: 0, l: largura * (1 - CAPA_LADO), a: altura }
    : { x: 0, y: altura * CAPA_TOPO, l: largura, a: altura * (1 - CAPA_TOPO) };
  const pxPorUnidade = Math.min(r.a / janela.altura, r.l / janela.largura);
  return {
    pxPorUnidade,
    distancia: altura / (2 * pxPorUnidade * tanMeioFov),
    /* A camera desliza paralela a parede (sem lens shift): o vidro segue de frente e o <Html transform> acerta. */
    desvioX: (largura / 2 - (r.x + r.l / 2)) / pxPorUnidade,
    desvioY: (r.y + r.a / 2 - altura / 2) / pxPorUnidade,
  };
}
