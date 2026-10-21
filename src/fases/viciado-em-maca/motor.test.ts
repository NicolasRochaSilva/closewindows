import { describe, expect, it } from "vitest";
import { criarMotor, FALA_FIM, type Saida } from "./motor";

/* Sorte alta: o viciado nunca finge (fica deterministico). */
function montar() {
  const log = { erros: 0, fechou: 0, falas: [] as string[] };
  const saida: Saida = {
    erro: () => (log.erros += 1),
    fechou: () => (log.fechou += 1),
    fala: (t) => log.falas.push(t),
    som: () => {},
    mudou: () => {},
  };
  const motor = criarMotor(saida, { reduzirMovimento: false, sorte: () => 0.99 });
  let t = 0;
  motor.iniciar(t);
  const avancar = (seg: number) => {
    const fim = t + seg;
    while (t < fim - 1e-9) {
      t = Math.min(fim, t + 1 / 60);
      motor.passo(t);
    }
  };
  return { motor, log, avancar };
}

describe("o viciado em maçã", () => {
  it("esquerda e depois direita antes da maçã chegar: fecha sem erro", () => {
    const { motor, log, avancar } = montar();
    motor.tocarFolha("esq");
    avancar(0.1);
    motor.tocarFolha("dir");
    avancar(1.5);
    expect(log.erros).toBe(0);
    expect(log.fechou).toBe(1);
    expect(log.falas.at(-1)).toBe(FALA_FIM);
  });

  it("maçã no trinco: fechar conta erro; tirou a maçã, fecha", () => {
    const { motor, log, avancar } = montar();
    avancar(3);
    expect(motor.maca.estado).toBe("presa");
    motor.tocarFolha("esq");
    avancar(1);
    expect(log.erros).toBe(1);
    expect(motor.folhas.esq.estado).toBe("aberta");

    motor.tirarMaca();
    motor.tocarFolha("esq");
    avancar(0.1);
    motor.tocarFolha("dir");
    avancar(1.5);
    expect(log.erros).toBe(1);
    expect(log.fechou).toBe(1);
  });

  it("direita antes da esquerda: a esquerda emperra (erro) e reabrir a direita destrava", () => {
    const { motor, log, avancar } = montar();
    motor.tocarFolha("dir");
    avancar(1);
    expect(motor.folhas.dir.estado).toBe("fechada");
    motor.tocarFolha("esq");
    expect(log.erros).toBe(1);
    avancar(0.7);
    motor.tocarFolha("dir");
    expect(motor.folhas.dir.estado).toBe("abrindo");
    expect(log.fechou).toBe(0);
  });

  it("a maçã chega com a folha a meio caminho: a folha bate e conta erro", () => {
    const { motor, log, avancar } = montar();
    avancar(2);
    motor.tocarFolha("esq");
    avancar(1);
    expect(log.erros).toBe(1);
    expect(motor.maca.estado).toBe("presa");
  });

  it("sem passo() nada anda: parar o loop cancela tudo", () => {
    const { motor, log } = montar();
    motor.tocarFolha("esq");
    expect(motor.folhas.esq.estado).toBe("fechando");
    expect(log.fechou).toBe(0);
  });
});
