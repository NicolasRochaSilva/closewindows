import { cubicBezier } from "motion/react";
import { DURATION, EASE_HINGE, EASE_WOOD } from "@/lib/motion";

/*
 * O motor da fase 2, sem DOM: folhas, maca e o viciado num relogio so.
 * Quem chama `passo(agora)` a cada quadro e quem desenha; tudo que tem tempo
 * mora na agenda daqui, entao parar o loop cancela tudo de uma vez (na v1 eram
 * cadeias async soltas que sobreviviam ao unmount).
 */

export type Lado = "esq" | "dir";
export type Pose = "mastigando" | "mirando" | "arremessou" | "rindo" | "bravo" | "pegando" | "derrotado";
export type EstadoFolha = "aberta" | "fechando" | "fechada" | "abrindo" | "batendo";
export type EstadoMaca = "mao" | "voando" | "presa" | "caindo";
export type Som = "creak" | "thud" | "latch" | "toss" | "plop" | "bite";

/** Angulo da folha aberta (graus). A esquerda usa o negativo. */
export const ABERTA = 132;
/** Alavanca do trinco: aberta (de pe) e travada. */
export const TRINCO_ABERTO = -80;

/* Geometria em px do miolo da arte (ver Cena.tsx). */
export const TRINCO = { x: 200, y: 511 };
export const SOLTA = { x: 136, y: 160 };
export const CHAO = 612;
export const GRAVIDADE = 1600;
const VOO = 0.95;

/* Onde a folha encosta: na maca entalada ou na outra folha ja fechada. */
const CONTATO_MACA = 24;
const CONTATO_FOLHA = 8;

const FALAS = {
  presa: ["Maçã no trinco. Clássico.", "Cesta!", "Três pontos.", "Ops. Escorregou."],
  bateu: ["Hahaha. Tem maçã aí.", "Fecha não, ué.", "Força não resolve, campeão.", "Tá entalada. Que pena."],
  chegouAntes: ["A maçã chegou primeiro.", "Lento.", "Quase. Só que não."],
  ordem: ["Esquerda primeiro, gênio.", "A direita fecha por cima. Todo mundo sabe.", "Ordem, campeão."],
  tirou: ["Ei! Essa tava mordida!", "Desperdício.", "Tudo bem, tenho mais.", "Era minha favorita."],
  finta: ["Brincadeirinha.", "Pulou, né?", "Hehe."],
  quicou: ["Ah, qual é.", "Hmpf."],
  pressa: ["Opa! Vai fechar? Pera aí.", "Nananinanão."],
} as const;

const DEMORA: [number, string][] = [
  [14, "Pode desistir. O pomar é grande."],
  [28, "Eu tenho a tarde toda."],
];

export const FALA_FIM = "Tudo bem. Tenho mais maçã em casa.";

type Curva = (t: number) => number;
const dobradica = cubicBezier(...EASE_HINGE);
const madeira = cubicBezier(...EASE_WOOD);
const acelera: Curva = (t) => t * t;

type Trecho = { para: number; dur: number; curva: Curva; fim?: () => void };

/** Um numero que anda por trechos (angulo de folha, alavanca). */
class Animavel {
  valor: number;
  private fila: (Trecho & { de: number; t0: number })[] = [];
  constructor(valor: number) {
    this.valor = valor;
  }
  ir(agora: number, trechos: Trecho[]) {
    let de = this.valor;
    this.fila = trechos.map((t) => {
      const item = { ...t, de, t0: Number.NaN };
      de = t.para;
      return item;
    });
    if (this.fila[0]) this.fila[0].t0 = agora;
  }
  passo(agora: number) {
    while (this.fila.length) {
      const t = this.fila[0];
      const p = t.dur > 0 ? Math.min(1, (agora - t.t0) / t.dur) : 1;
      this.valor = t.de + (t.para - t.de) * t.curva(p);
      if (p < 1) return;
      this.valor = t.para;
      this.fila.shift();
      if (this.fila[0]) this.fila[0].t0 = t.t0 + t.dur;
      t.fim?.();
    }
  }
}

export type Saida = {
  erro(): void;
  fechou(): void;
  fala(texto: string): void;
  som(nome: Som): void;
  /** Algo que a interface desenha com React mudou (pose, maca presa, folhas). */
  mudou(): void;
};

type Opcoes = { reduzirMovimento: boolean; sorte?: () => number };

export function criarMotor(saida: Saida, { reduzirMovimento, sorte = Math.random }: Opcoes) {
  const folhas = {
    esq: { estado: "aberta" as EstadoFolha, angulo: new Animavel(-ABERTA) },
    dir: { estado: "aberta" as EstadoFolha, angulo: new Animavel(ABERTA) },
  };
  const trinco = new Animavel(TRINCO_ABERTO);
  const maca = { estado: "mao" as EstadoMaca, x: 0, y: 0, vx: 0, vy: 0, giro: 0, vgiro: 0, alfa: 1, x0: 0, y0: 0, t0: 0, tremor: 0 };
  let pose: Pose = "mastigando";
  let venceu = false;
  let arremessos = 0;
  let tiradas = 0;
  let fintou = false;
  let reagiu = false;
  let relogio = 0;
  const usadas = new Map<string, number>();
  const agenda: { t: number; fn: () => void; tag?: string }[] = [];

  const agendar = (seg: number, fn: () => void, tag?: string) => {
    if (tag) cancelar(tag);
    agenda.push({ t: relogio + seg, fn, tag });
  };
  const cancelar = (tag: string) => {
    for (let i = agenda.length - 1; i >= 0; i -= 1) if (agenda[i].tag === tag) agenda.splice(i, 1);
  };

  /* Fala em rodizio: nao repete a mesma ate passar pela lista. */
  const fala = (grupo: keyof typeof FALAS) => {
    if (venceu) return;
    const lista = FALAS[grupo];
    const i = usadas.get(grupo) ?? 0;
    usadas.set(grupo, i + 1);
    saida.fala(lista[i % lista.length]);
  };

  const posar = (p: Pose) => {
    if (pose === p || (venceu && p !== "derrotado")) return;
    pose = p;
    saida.mudou();
  };
  const voltarAMastigar = (de: Pose, seg: number) =>
    agendar(seg, () => pose === de && posar("mastigando"), "pose");

  /* Ele acelera a cada maca que voce tira dele. */
  const preparo = () => Math.max(0.55, 0.7 - 0.05 * tiradas);
  const reacao = () => Math.max(0.15, 0.3 - 0.05 * tiradas);
  const descanso = () => Math.max(0.3, 1.3 - 0.35 * tiradas);

  function mirar() {
    if (venceu) return;
    if (maca.estado === "presa") return; // so volta a mirar quando voce tirar
    if (maca.estado !== "mao" || pose === "pegando" || pose === "bravo") {
      agendar(0.3, mirar, "mira");
      return;
    }
    posar("mirando");
    agendar(preparo(), soltar, "mira");
  }

  function soltar() {
    if (venceu) return;
    /* Do 3o arremesso em diante ele as vezes finge (nunca duas vezes seguidas). */
    if (arremessos >= 2 && !fintou && sorte() < 0.3) {
      fintou = true;
      posar("mastigando");
      saida.som("bite");
      fala("finta");
      agendar(0.7, mirar, "mira");
      return;
    }
    fintou = false;
    arremessos += 1;
    Object.assign(maca, {
      estado: "voando",
      x0: SOLTA.x,
      y0: SOLTA.y,
      x: SOLTA.x,
      y: SOLTA.y,
      t0: relogio,
      vx: (TRINCO.x - SOLTA.x) / VOO,
      vy: (TRINCO.y - SOLTA.y - 0.5 * GRAVIDADE * VOO * VOO) / VOO,
      giro: 0,
      vgiro: reduzirMovimento ? 0 : 420,
      alfa: 1,
    });
    posar("arremessou");
    saida.som("toss");
    saida.mudou();
  }

  function chegou() {
    maca.x = TRINCO.x;
    maca.y = TRINCO.y;
    if (folhas.esq.estado === "fechada" && folhas.dir.estado === "fechada") {
      /* Bate no vidro fechado e cai. */
      Object.assign(maca, { estado: "caindo", vx: -70, vy: -260, vgiro: reduzirMovimento ? 0 : -300 });
      saida.som("plop");
      fala("quicou");
      posar("bravo");
      agendar(0.9, pegar, "mira");
      saida.mudou();
      return;
    }
    maca.estado = "presa";
    maca.giro = 0;
    saida.som("plop");
    const atropeladas = (["esq", "dir"] as Lado[]).filter((l) => folhas[l].estado === "fechando");
    atropeladas.forEach((l) => bater(l, "maca"));
    if (atropeladas.length) fala("chegouAntes");
    else fala("presa");
    if (pose === "arremessou") posar("rindo");
    voltarAMastigar("rindo", 1);
    saida.mudou();
  }

  function pegar() {
    if (venceu) return;
    posar("pegando");
    agendar(
      0.45,
      () => {
        posar("mastigando");
        saida.som("bite");
        agendar(descanso(), mirar, "mira");
      },
      "mira",
    );
  }

  /* A folha bate (na maca ou na outra folha) e volta aberta. Isso e um erro. */
  function bater(lado: Lado, motivo: "maca" | "ordem") {
    const f = folhas[lado];
    const sinal = lado === "esq" ? -1 : 1;
    const contato = sinal * (motivo === "maca" ? CONTATO_MACA : CONTATO_FOLHA);
    f.estado = "batendo";
    f.angulo.ir(relogio, [
      {
        para: contato,
        dur: 0.22,
        curva: acelera,
        fim: () => {
          saida.som("thud");
          if (motivo === "maca") maca.tremor = 1;
        },
      },
      {
        para: sinal * ABERTA,
        dur: DURATION.base,
        curva: madeira,
        fim: () => {
          f.estado = "aberta";
          saida.mudou();
        },
      },
    ]);
    saida.erro();
    if (pose === "mastigando") posar("rindo");
    voltarAMastigar("rindo", 0.9);
    saida.mudou();
  }

  function fechar(lado: Lado) {
    const f = folhas[lado];
    f.estado = "fechando";
    saida.som("creak");
    f.angulo.ir(relogio, [
      {
        para: 0,
        dur: DURATION.swing,
        curva: reduzirMovimento ? madeira : dobradica,
        fim: () => {
          f.estado = "fechada";
          saida.som("thud");
          if (lado === "dir" && folhas.esq.estado === "fechada" && maca.estado !== "presa") vencer();
          saida.mudou();
        },
      },
    ]);
    saida.mudou();
  }

  function abrir(lado: Lado) {
    const f = folhas[lado];
    f.estado = "abrindo";
    saida.som("creak");
    f.angulo.ir(relogio, [
      {
        para: (lado === "esq" ? -1 : 1) * ABERTA,
        dur: DURATION.swing,
        curva: madeira,
        fim: () => {
          f.estado = "aberta";
          saida.mudou();
        },
      },
    ]);
    saida.mudou();
  }

  /* Voce comecou a fechar: ele adianta o arremesso, se estiver de bobeira. */
  function reagir() {
    if (venceu || maca.estado !== "mao" || pose !== "mastigando") return;
    const mira = agenda.find((a) => a.tag === "mira");
    if (mira && mira.t <= relogio + reacao()) return;
    agendar(reacao(), mirar, "mira");
    if (!reagiu) {
      reagiu = true;
      fala("pressa");
    }
  }

  function vencer() {
    venceu = true;
    agenda.length = 0;
    pose = "derrotado";
    saida.som("latch");
    trinco.ir(relogio, [
      {
        para: 0,
        dur: DURATION.quick,
        curva: madeira,
        fim: () => {
          saida.fala(FALA_FIM);
          saida.fechou();
        },
      },
    ]);
    saida.mudou();
  }

  return {
    get pose() {
      return pose;
    },
    get venceu() {
      return venceu;
    },
    folhas,
    trinco,
    maca,

    iniciar(agora: number) {
      relogio = agora;
      agendar(0.9, mirar, "mira");
      for (const [seg, texto] of DEMORA) agendar(seg, () => !venceu && saida.fala(texto));
    },

    passo(agora: number) {
      const dt = Math.min(0.05, Math.max(0, agora - relogio));
      relogio = agora;

      /* Agenda: roda o que venceu, inclusive o que uma tarefa agendar para ja. */
      for (let i = 0; i < agenda.length; ) {
        if (agenda[i].t <= agora) agenda.splice(i, 1)[0].fn();
        else i += 1;
      }

      folhas.esq.angulo.passo(agora);
      folhas.dir.angulo.passo(agora);
      trinco.passo(agora);

      if (maca.estado === "voando") {
        /* Parabola de verdade: posicao fechada no tempo, nao keyframes. */
        const t = agora - maca.t0;
        if (t >= VOO) chegou();
        else {
          maca.x = maca.x0 + maca.vx * t;
          maca.y = maca.y0 + maca.vy * t + 0.5 * GRAVIDADE * t * t;
          maca.giro = maca.vgiro * t;
        }
      } else if (maca.estado === "caindo") {
        maca.vy += GRAVIDADE * dt;
        maca.x += maca.vx * dt;
        maca.y += maca.vy * dt;
        maca.giro += maca.vgiro * dt;
        if (maca.y >= CHAO) {
          maca.y = CHAO;
          if (maca.vy > 160) {
            maca.vy *= -0.35;
            maca.vx *= 0.6;
          } else {
            maca.vy = 0;
            maca.vx *= 0.9;
            maca.alfa -= dt * 2.5;
            if (maca.alfa <= 0) {
              maca.estado = "mao";
              saida.mudou();
            }
          }
        }
      }
      maca.tremor = Math.max(0, maca.tremor - dt * 4);
    },

    tocarFolha(lado: Lado) {
      if (venceu) return;
      const f = folhas[lado];
      if (f.estado === "fechando" || f.estado === "abrindo" || f.estado === "batendo") return;
      if (f.estado === "fechada") {
        if (lado === "dir") abrir("dir"); // reabrir a direita destrava a esquerda
        return;
      }
      if (maca.estado === "presa") {
        bater(lado, "maca");
        fala("bateu");
        return;
      }
      const dir = folhas.dir.estado;
      if (lado === "esq" && (dir === "fechada" || dir === "fechando")) {
        bater("esq", "ordem");
        fala("ordem");
        return;
      }
      fechar(lado);
      reagir();
    },

    tirarMaca() {
      if (venceu || maca.estado !== "presa") return;
      Object.assign(maca, {
        estado: "caindo",
        vx: (sorte() - 0.5) * 90,
        vy: -140,
        vgiro: reduzirMovimento ? 0 : 360,
      });
      tiradas += 1;
      saida.som("plop");
      fala("tirou");
      posar("bravo");
      agendar(0.7, pegar, "mira");
      saida.mudou();
    },
  };
}

export type Motor = ReturnType<typeof criarMotor>;
