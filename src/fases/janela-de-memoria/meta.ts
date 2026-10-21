import type { FaseMeta } from "@/console/contrato";

export const meta: FaseMeta = {
  id: "janela-de-memoria",
  mundo: "cabeca",
  ordem: 5,
  nome: "A Janela de Memória",
  autor: "brunooutcore",
  /* 3 rodadas (3, 4 e 5 lembranças) + a janela final: ~35s jogando limpo. */
  tempoAlvo: 40,
  tipo: "dom",
};
