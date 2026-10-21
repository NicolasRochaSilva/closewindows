/**
 * Catalogo da campanha: so METADADOS, sem componentes, para o servidor poder
 * importar (desbloqueio, tempo-alvo, fase do dia). O codigo de cada fase vive
 * em src/fases/<id>/ e e ligado em cartuchos.ts.
 *
 * Fase nova: crie src/fases/<id>/meta.ts, acrescente UMA linha em FASES e UMA
 * em cartuchos.ts.
 */
import type { FaseMeta, Mundo } from "@/console/contrato";
import { meta as soFechar } from "./so-fechar/meta";
import { meta as viciadoEmMaca } from "./viciado-em-maca/meta";
import { meta as janelaChuvosa } from "./janela-chuvosa/meta";
import { meta as janelasHidra } from "./janelas-hidra/meta";
import { meta as janelaDeMemoria } from "./janela-de-memoria/meta";
import { meta as celaDoCarcereiro } from "./cela-do-carcereiro/meta";
import { meta as dragaoNaJanela } from "./dragao-na-janela/meta";

export const MUNDOS: Mundo[] = [
  { id: "basico", nome: "O Básico", ordem: 1 },
  { id: "intemperies", nome: "Intempéries", ordem: 2 },
  { id: "cabeca", nome: "Cabeça", ordem: 3 },
  /* Pixel art 16 bits medieval no estilo do Nicolas (v1): fases dungeon-like. */
  { id: "masmorra", nome: "A Masmorra", ordem: 4 },
];

/* Fases ainda sem cartucho entram aqui como "em obras": aparecem trancadas na parede. */
const emObras = (id: string, mundo: string, ordem: number, nome: string): FaseMeta => ({
  id,
  mundo,
  ordem,
  nome,
  autor: "",
  tempoAlvo: 30,
  tipo: "dom",
  emObras: true,
});

export const FASES: FaseMeta[] = [
  soFechar,
  viciadoEmMaca,
  janelaChuvosa,
  janelasHidra,
  janelaDeMemoria,
  emObras("seteira", "masmorra", 6, "A Seteira"),
  celaDoCarcereiro,
  dragaoNaJanela,
].sort((a, b) => a.ordem - b.ordem);

export const faseMeta = (id: string) => FASES.find((f) => f.id === id);

/** Fases que ja podem ser jogadas (tem cartucho). */
export const jogaveis = () => FASES.filter((f) => !f.emObras);

/**
 * Fases abertas para quem ja fechou `fechadas`: a primeira jogavel sempre; as
 * outras so quando a anterior (na ordem) foi fechada ao menos uma vez.
 */
export function desbloqueadas(fechadas: ReadonlySet<string>): Set<string> {
  const abertas = new Set<string>();
  const lista = jogaveis();
  lista.forEach((fase, i) => {
    if (i === 0 || fechadas.has(lista[i - 1].id)) abertas.add(fase.id);
  });
  return abertas;
}
