"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls, type DOMKeyframesDefinition, type Transition } from "motion/react";
import type { FaseApi } from "@/console/contrato";
import { bump, DURATION, EASE_HINGE, EASE_WOOD, hingeClose, impactShake } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Cabeca, Fogo, FolhaArte, Sala, Tocha, type Olho } from "./Cena";
import { criarRitmo, PASSOS, REACAO, type Fase, type Momento } from "./ritmo";
import styles from "./Cena.module.css";

/*
 * Fase 8 — O Dragao na Janela. A cabeca do dragao entra pelo vao e ele cospe
 * fogo num padrao. Empurrar a folha so funciona no folego (depois do fogo,
 * quando ele abaixa a cabeca e solta fumaca). Tres pancadas certas fecham;
 * ser pego na inspirada, no fogo ou na finta e erro e a folha volta um passo.
 */
const QUEM = "o dragão";
/** rotateY da folha por passo: aberta para dentro da sala ate bater no batente. */
const ANGULO = [-100, -62, -36, 0];
/** A cabeca recua (px) conforme a folha avanca: o focinho fica na fresta que sobra. */
const RECUO = [0, 56, 108];
const SAIDA = 220;
/** Altura da cabeca (px) em cada fase: ergue para inspirar, abaixa cansada no folego. */
const POSE: Record<Fase, number> = { calmo: 0, inspira: -8, fogo: 4, finta: -8, folego: 12 };

const PEGO = ["Tá quentinho aí?", "Churrasco de porteiro.", "Errou o compasso.", "Eu vi você chegando."];
const EMPURRAO = ["Empurra mais, que eu empurro de volta.", "Cócegas.", "Hmpf. Fraquinho."];
const ACERTO = ["", "Opa. Sorte.", "Tá, agora é sério."];

const agora = () => performance.now() / 1000;
const olhoDa = (fase: Fase | null): Olho => (fase === "finta" ? "finta" : fase === "folego" ? "cansado" : "aberto");

export default function Jogo({ api }: { api: FaseApi }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 0.94);
  const tremor = useRef<HTMLDivElement>(null);
  const recuo = useRef<HTMLDivElement>(null);
  const pose = useRef<HTMLDivElement>(null);
  const mandibula = useRef<SVGGElement>(null);
  const narinas = useRef<SVGGElement>(null);
  const folha = useRef<HTMLDivElement>(null);
  const trinco = useRef<HTMLSpanElement>(null);
  const clarao = useRef<HTMLDivElement>(null);
  const poeira = useRef<HTMLDivElement>(null);
  const empurrar = useRef<() => void>(() => {});
  const ultimaTecla = useRef(0);

  const [fase, setFase] = useState<Fase | null>("calmo");
  const [passo, setPasso] = useState(0);
  const [pego, setPego] = useState(false);
  const [fechada, setFechada] = useState(false);

  const reduz = api.reduzirMovimento;
  const simples = reduz || api.qualidade === "baixa";

  useEffect(() => {
    const r = criarRitmo(agora());
    const animacoes = new Set<AnimationPlaybackControls>();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let vivo = true;
    let empurroes = 0;
    let erros = 0;
    let acertou = false;

    const anima = (el: Element | null, kf: DOMKeyframesDefinition, t: Transition) => {
      if (!el) return Promise.resolve();
      const c = animate(el, kf, t);
      animacoes.add(c);
      return c.finished.then(() => void animacoes.delete(c));
    };
    const fala = (texto: string) => texto && api.fala(texto, QUEM);

    /* A cabeca em repouso: boca fechada, narinas apagadas. */
    const repousar = () => {
      anima(mandibula.current, { y: 0 }, { duration: DURATION.snap });
      anima(narinas.current, { opacity: 0 }, { duration: DURATION.snap });
      anima(pose.current, { y: 0 }, { duration: DURATION.quick, ease: EASE_WOOD });
    };

    /* Comeco de um trecho do padrao: pose, boca, narinas e som. */
    const entrar = (m: Momento) => {
      setFase(m.fase);
      setPego(false);
      const lento = m.fase === "inspira" ? { duration: m.dur, ease: "linear" as const } : { duration: DURATION.quick, ease: EASE_WOOD };
      anima(pose.current, { y: reduz ? 0 : POSE[m.fase] }, lento);
      anima(mandibula.current, { y: m.fase === "fogo" ? 3 : 0 }, { duration: DURATION.snap });
      if (m.fase === "inspira") anima(narinas.current, { opacity: [0, 1] }, { duration: m.dur, ease: "linear" });
      else anima(narinas.current, { opacity: m.fase === "fogo" ? 1 : 0 }, { duration: DURATION.snap });
      if (m.fase === "inspira") sfx.inspira(m.dur);
      if (m.fase === "fogo") sfx.baforada(m.dur);
    };

    const fechar = () => {
      setFechada(true);
      setFase(null);
      setPego(false);
      fala("Ai, meu focinho!");
      repousar();
      sfx.creak(DURATION.swing);
      anima(recuo.current, { x: SAIDA }, { duration: DURATION.quick, ease: EASE_WOOD });
      anima(folha.current, { rotateY: [ANGULO[PASSOS - 1], 0] }, hingeClose).then(() => {
        if (!vivo) return;
        sfx.slam(1);
        sfx.latch();
        if (!reduz) anima(tremor.current, { x: impactShake.x }, impactShake.transition);
        anima(poeira.current, reduz ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 0], y: [0, -8, -16] }, {
          duration: DURATION.swing,
          ease: EASE_WOOD,
        });
        anima(trinco.current, { rotate: [-82, 0] }, { duration: DURATION.quick, ease: EASE_HINGE }).then(() => {
          if (vivo) api.fechou();
        });
      });
    };

    empurrar.current = () => {
      const t = agora();
      const antes = r.momento(t);
      const de = r.passo;
      const j = r.empurrar(t);
      if (!j) return;
      const para = r.passo;
      setPasso(para);

      if (j === "empurrao") {
        sfx.thud();
        const a = ANGULO[de];
        anima(folha.current, { rotateY: [a, a + 6, a] }, bump);
        anima(recuo.current, { x: [RECUO[de], RECUO[de] - 8, RECUO[de]] }, bump);
        const n = empurroes++;
        if (n % 3 === 0) fala(EMPURRAO[(n / 3) % EMPURRAO.length]);
        return;
      }

      if (j === "acerto") {
        acertou = true;
        if (r.fechou) return fechar();
        setFase(null);
        repousar();
        sfx.slam(0.5);
        anima(folha.current, { rotateY: [ANGULO[de], ANGULO[para] + 6, ANGULO[para]] }, bump);
        anima(recuo.current, { x: [RECUO[de], RECUO[para] + 12, RECUO[para]] }, bump);
        fala(ACERTO[para]);
        return;
      }

      /* Pego: ele cospe na hora, a folha voa um passo para tras. */
      api.erro();
      setFase(null);
      setPego(true);
      sfx.baforada(REACAO);
      sfx.thud();
      anima(mandibula.current, { y: 3 }, { duration: DURATION.snap });
      anima(narinas.current, { opacity: 1 }, { duration: DURATION.snap });
      anima(folha.current, { rotateY: [ANGULO[de], ANGULO[para] - 10, ANGULO[para]] }, bump);
      anima(recuo.current, { x: [RECUO[de], RECUO[para]] }, { duration: DURATION.quick, ease: EASE_WOOD });
      anima(clarao.current, { opacity: [0, reduz ? 0.25 : 0.45, 0] }, { duration: DURATION.base });
      if (!reduz) anima(tremor.current, { x: impactShake.x }, impactShake.transition);
      fala(antes?.fase === "finta" ? "Caiu! Nem tinha fogo." : PEGO[erros++ % PEGO.length]);
    };

    fala(api.jaFechou ? "Voltou pra apanhar de novo?" : "Fecha. Se conseguir.");
    timers.push(
      setTimeout(() => !acertou && fala("Psst: depois de cuspir eu tusso. Não conta pra ninguém."), 12000),
    );

    /* Um quadro: so troca estado quando o dragao muda de trecho. */
    let chave = "";
    let quadro = 0;
    const tique = () => {
      const m = r.momento(agora());
      const nova = m ? `${r.passo}:${m.indice}` : "reage";
      if (nova !== chave) {
        chave = nova;
        if (m) entrar(m);
      }
      if (!r.fechou) quadro = requestAnimationFrame(tique);
    };
    quadro = requestAnimationFrame(tique);

    const tecla = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      const alvo = e.target as Node;
      if (alvo !== document.body && !caixa.current?.contains(alvo)) return;
      e.preventDefault();
      if (e.repeat) return;
      ultimaTecla.current = performance.now();
      empurrar.current();
    };
    window.addEventListener("keydown", tecla);

    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      timers.forEach(clearTimeout);
      animacoes.forEach((c) => c.stop());
      window.removeEventListener("keydown", tecla);
      empurrar.current = () => {};
    };
  }, [api, reduz]);

  const rotulo = fechada ? "Janela fechada" : `Empurrar a folha (${passo} de ${PASSOS})`;

  return (
    <div ref={caixa} className={styles.mundo}>
      <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <div ref={tremor} className={styles.tremor}>
          <Sala />
          <Tocha lado="esq" viva={!simples} />
          <Tocha lado="dir" viva={!simples} />

          <div className={styles.vao}>
            <div ref={recuo} className={styles.cabeca}>
              <div ref={pose} className={styles.cabeca}>
                <Cabeca
                  className={styles.cabeca}
                  olho={olhoDa(fase)}
                  mandibulaRef={mandibula}
                  narinasRef={narinas}
                  fumaca={fase === "folego"}
                />
              </div>
            </div>
          </div>

          <div className={styles.palcoFolha}>
            <div ref={folha} className={styles.folha} style={{ transform: `rotateY(${ANGULO[0]}deg)` }}>
              <div className={styles.verso} />
              <FolhaArte />
              <span ref={trinco} className={styles.trinco} style={{ transform: "rotate(-82deg)" }} />
            </div>
          </div>

          {(fase === "fogo" || pego) && (
            <div className={styles.fogoTrilho} style={{ transform: `translateX(${RECUO[Math.min(passo, PASSOS - 1)]}px)` }}>
              <div className={`${styles.fogo} ${pego ? styles.fogoForte : ""}`}>
                <Fogo simples={simples} />
              </div>
            </div>
          )}

          <div ref={clarao} className={styles.clarao} />
          <div ref={poeira} className={styles.poeira}>
            <span style={{ left: 0, top: 16 }} />
            <span style={{ left: 36, top: 4 }} />
            <span style={{ left: 76, top: 20 }} />
            <span style={{ left: 112, top: 0 }} />
            <span style={{ left: 152, top: 16 }} />
          </div>

          <button
            type="button"
            className={styles.alvo}
            aria-label={rotulo}
            aria-disabled={fechada}
            onPointerDown={(e) => e.button === 0 && empurrar.current()}
            onClick={(e) => {
              /* Teclado/leitor de tela (detail 0) sem a tecla ja ter empurrado. */
              if (e.detail === 0 && performance.now() - ultimaTecla.current > 500) empurrar.current();
            }}
          />
        </div>
      </div>
    </div>
  );
}
