"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { FaseApi } from "@/console/contrato";
import { DURATION, EASE_HINGE, EASE_WOOD, hingeClose, hingeOpen } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import Praca, { type JanelaNaPraca } from "./Praca";
import {
  CABECAS_MAX,
  arranjo,
  criarHidra,
  cortar,
  descreverSombra,
  embaralhar,
  lugarDaEstatua,
  peDoSol,
  praca,
  razaoDoSol,
  rngDe,
  sombra,
  sortearSol,
  type Cabeca,
  type Sol,
} from "./regra";
import { useArranjo, useCena, useTamanho } from "./useCena";
import styles from "./hidra.module.css";

/*
 * Fase 4 — As Janelas Hidra. Fecha uma, nascem duas. So a original faz a
 * sombra que o sol manda (igual a da estatua); cada cabeca nova mente melhor.
 * Fechar a errada: erro + ela racha em duas, o sol anda e todas trocam de
 * lugar. Fechar a certa: as copias voltam para dentro dela e acabou.
 */
const QUEM = "a hidra";
const ERROS = [
  "Corta uma, nascem duas. Todo mundo sabe disso.",
  "Cada cabeça nova mente melhor.",
  "Uma de nós não sabe mentir pro sol.",
  "Até a estátua sabe onde o sol está.",
  "Olha pro chão.",
];
const DEPOIS = ["Mais uma cabeça. Obrigada.", "A gente adora quando você erra.", "Olha pro chão. Compara."];
const OCIOSO: [number, string][] = [
  [9000, "A gente pode ficar aqui o dia todo. O sol, não."],
  [20000, "Escolhe. Uma de nós é de verdade."],
];

const novaSemente = () => Math.floor(Math.random() * 2 ** 32);

export default function Jogo({ api }: { api: FaseApi }) {
  const caixa = useRef<HTMLDivElement>(null);
  const tam = useTamanho(caixa);
  const p = useMemo(() => (tam ? praca(tam.l, tam.a) : null), [tam]);
  const cena = useCena(api.reduzirMovimento);
  const { vistas, tween } = cena;

  const [rng] = useState(() => rngDe(novaSemente()));
  const [lado] = useState<-1 | 1>(() => (rng() < 0.5 ? -1 : 1));
  const [cabecas, setCabecas] = useState<Cabeca[]>(() => criarHidra(rng));
  const [rodada, setRodada] = useState(novaSemente);
  /* `sol` e o valor animado (desenho); `solAlvo` e para onde ele vai (texto acessivel). */
  const [sol] = useState<Sol>(() => sortearSol(rng, lado));
  const [solAlvo, setSolAlvo] = useState<Sol>(() => ({ ...sol }));
  const [fechada, setFechada] = useState(false);

  const ocupado = useRef(false);
  const erros = useRef(0);
  const proximoId = useRef(100);
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const focar = useRef<number | null>(null);
  useEffect(() => {
    if (focar.current === null) return;
    caixa.current?.querySelector<HTMLButtonElement>(`[data-cabeca="${focar.current}"]`)?.focus();
    focar.current = null;
  }, [cabecas]);

  const ids = useMemo(() => cabecas.map((c) => c.id), [cabecas]);
  const lugares = useMemo(() => (p ? arranjo(p, ids.length, rngDe(rodada)) : []), [p, ids.length, rodada]);
  const estatua = useMemo(() => (p ? lugarDaEstatua(p, lado) : null), [p, lado]);
  useArranjo(cena, ids, lugares, p);

  useEffect(() => {
    api.fala(api.jaFechou ? "Voltou pra cortar cabeça? A gente cresce de novo." : "Somos todas a original.", QUEM);
  }, [api]);

  const [quieto, setQuieto] = useState(0);
  useEffect(() => {
    if (fechada) return;
    const timers = OCIOSO.map(([ms, texto]) => setTimeout(() => api.fala(texto, QUEM), ms));
    return () => timers.forEach(clearTimeout);
  }, [api, fechada, quieto]);

  async function errar(c: Cabeca) {
    const v = vistas.get(c.id);
    if (!v) return;
    const tinhaFoco = document.activeElement instanceof HTMLElement && document.activeElement.dataset.cabeca === String(c.id);
    sfx.creak(DURATION.base);
    await tween(v, "abertura", 0.4, { duration: DURATION.base, ease: EASE_HINGE });
    if (!vivo.current) return;
    api.erro();
    erros.current += 1;

    if (cabecas.length >= CABECAS_MAX) {
      sfx.hiss();
      api.fala("Não cabe mais ninguém. Mas o erro conta.", QUEM);
      v.tremor = 1;
      void tween(v, "tremor", 0, { duration: DURATION.base, ease: "linear" });
      await tween(v, "abertura", 1, hingeOpen);
      ocupado.current = false;
      return;
    }

    sfx.split();
    v.tremor = 1;
    void tween(v, "tremor", 0, { duration: DURATION.quick, ease: "linear" });
    await tween(v, "racha", 1, { duration: DURATION.quick, ease: "easeOut" });
    if (!vivo.current) return;
    sfx.hiss();
    const n = erros.current;
    api.fala(n <= ERROS.length ? ERROS[n - 1] : DEPOIS[(n - ERROS.length - 1) % DEPOIS.length], QUEM);

    /* As filhas nascem do corpo da mae, abertas, e saem para os lugares novos. */
    const id = proximoId.current;
    proximoId.current += 2;
    vistas.delete(c.id);
    for (const [filha, dx] of [
      [id, -1],
      [id + 1, 1],
    ]) {
      vistas.set(filha, { x: v.x + dx * 26 * v.s, y: v.y, s: v.s * 0.92, abertura: 1, racha: 0, tremor: 0, alfa: 1 });
    }
    /* Quem joga no teclado nao perde o foco: ele passa para uma das filhas. */
    if (tinhaFoco) focar.current = id;
    setCabecas(embaralhar(cortar(cabecas, c.id, rng, id), rng));
    setRodada(novaSemente());

    const proximo = sortearSol(rng, lado);
    setSolAlvo(proximo);
    const t = { duration: DURATION.swing, ease: EASE_WOOD };
    void tween(sol, "elevacao", proximo.elevacao, t);
    await tween(sol, "x", proximo.x, t);
    ocupado.current = false;
  }

  async function vencer(c: Cabeca) {
    const v = vistas.get(c.id);
    if (!v) return;
    sfx.creak(DURATION.swing);
    await tween(v, "abertura", 0, hingeClose);
    if (!vivo.current) return;
    sfx.thud();
    sfx.latch();
    setFechada(true);

    const copias = cabecas.filter((o) => o.id !== c.id);
    if (copias.length > 0) sfx.toss();
    const t = { duration: DURATION.base, ease: EASE_WOOD };
    await Promise.all(
      copias.flatMap((o, i) => {
        const w = vistas.get(o.id);
        if (!w) return [];
        const ti = { ...t, delay: i * 0.03 };
        return [tween(w, "x", v.x, ti), tween(w, "y", v.y, ti), tween(w, "s", 0, ti), tween(w, "alfa", 0, ti)];
      }),
    );
    if (!vivo.current) return;
    api.fala("…a gente era uma só, né.", QUEM);
    api.fechou();
    /* Enfeite depois do placar: o sol se poe e a sombra dela atravessa a praca. */
    void tween(sol, "elevacao", 4, { duration: DURATION.stroll * 2, ease: "easeInOut" });
  }

  function escolher(c: Cabeca) {
    if (ocupado.current || fechada) return;
    ocupado.current = true;
    setQuieto((n) => n + 1);
    void (c.geracao === 0 ? vencer(c) : errar(c));
  }

  /* Setas andam entre as janelas na ordem da praca (fileira por fileira). */
  function navegar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!passo) return;
    const botoes = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-cabeca]"));
    const i = botoes.indexOf(document.activeElement as HTMLButtonElement);
    const alvo = botoes[(i + passo + botoes.length) % botoes.length];
    if (alvo) {
      e.preventDefault();
      alvo.focus();
    }
  }

  const janelas: JanelaNaPraca[] = cabecas.flatMap((c) => {
    const vista = vistas.get(c.id);
    return vista ? [{ id: c.id, mentira: c.mentira, vista }] : [];
  });

  const pe = p ? peDoSol(p, solAlvo) : null;
  const razao = razaoDoSol(solAlvo.elevacao);
  const descricaoEstatua =
    p && estatua && pe ? descreverSombra(sombra({ giro: 0, escala: 1 }, estatua, pe, razao).angulo, razao) : "";

  return (
    <div ref={caixa} className={styles.mundo} onKeyDown={navegar}>
      {p && estatua && (
        <Praca p={p} sol={sol} lado={lado} estatua={estatua} janelas={janelas} detalhe={api.qualidade !== "baixa"}>
          <p className={styles.sr}>
            Praça com {cabecas.length} janelas. Sol {solAlvo.elevacao < 18 ? "baixo" : "alto"} à{" "}
            {solAlvo.x < 0.5 ? "esquerda" : "direita"}. A estátua faz {descricaoEstatua}.
          </p>
          {cabecas.map((c, i) => {
            const l = lugares[i];
            const v = vistas.get(c.id);
            if (!l || !v || !pe) return null;
            const s = sombra(c.mentira, l, pe, razao);
            return (
              <button
                key={c.id}
                type="button"
                data-cabeca={c.id}
                className={styles.alvo}
                style={{ left: v.x - 82 * v.s, top: v.y - 160 * v.s, width: 164 * v.s, height: 160 * v.s }}
                onClick={() => escolher(c)}
                aria-disabled={fechada}
                aria-label={
                  fechada
                    ? "Janela fechada"
                    : `Fechar a janela ${i + 1} de ${cabecas.length}: ${descreverSombra(s.angulo, s.razao)}`
                }
              />
            );
          })}
        </Praca>
      )}
    </div>
  );
}
