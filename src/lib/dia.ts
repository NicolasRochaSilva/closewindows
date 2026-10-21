/**
 * O "dia" do jogo vira a meia-noite de Brasilia. Brasilia nao tem horario de
 * verao desde 2019, entao o fuso e fixo em -03:00.
 */
const FUSO = "-03:00";

/** "AAAA-MM-DD" do dia em Brasilia. */
export function diaDeHoje(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Intervalo [inicio, fim) do dia em Brasilia, em instantes UTC, para consultas. */
export function intervaloDoDia(dia: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${dia}T00:00:00${FUSO}`);
  return { inicio, fim: new Date(inicio.getTime() + 24 * 60 * 60 * 1000) };
}

/** Fase do dia: hash FNV-1a da data sobre a lista de fases jogaveis. Igual para todos. */
export function faseDoDia(dia: string, ids: readonly string[]): string {
  if (ids.length === 0) throw new Error("Nenhuma fase jogavel para sortear");
  let hash = 0x811c9dc5;
  for (const char of dia) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return ids[hash % ids.length];
}
