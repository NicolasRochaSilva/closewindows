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

export const MUNDOS: Mundo[] = [
  { id: "basico", nome: "O Básico", ordem: 1 },
  { id: "intemperies", nome: "Intempéries", ordem: 2 },
  { id: "cabeca", nome: "Cabeça", ordem: 3 },
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
  emObras("janela-chuvosa", "intemperies", 3, "A Janela Chuvosa"),
  emObras("janelas-hidra", "cabeca", 4, "As Janelas Hidra"),
  emObras("janela-de-memoria", "cabeca", 5, "A Janela de Memória"),
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
