"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Qualidade } from "@/console/contrato";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import Praca, { type JanelaNaPraca } from "./Praca";
import { arranjo, cortar, criarHidra, lugarDaEstatua, praca, rngDe, type Cabeca, type Sol } from "./regra";
import { useArranjo, useCena, useTamanho } from "./useCena";
import styles from "./hidra.module.css";

/* Na parede: o sol passa devagar, as sombras giram, e de tempos em tempos uma copia racha em duas. */
const CICLO_MS = 3400;
const MAX_PREVIA = 5;

export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const caixa = useRef<HTMLDivElement>(null);
  const tam = useTamanho(caixa);
  const p = useMemo(() => (tam ? praca(tam.l, tam.a) : null), [tam]);
  const parada = qualidade === "baixa";
  const cena = useCena(parada);
  const { vistas, tween } = cena;

  const [rng] = useState(() => rngDe(4));
  const [cabecas, setCabecas] = useState<Cabeca[]>(() => criarHidra(rng));
  const [rodada, setRodada] = useState(1);
  const [sol] = useState<Sol>({ x: 0.18, elevacao: 20 });
  const proximoId = useRef(100);
  const atual = useRef(cabecas);
  atual.current = cabecas;

  const ids = useMemo(() => cabecas.map((c) => c.id), [cabecas]);
  const lugares = useMemo(() => (p ? arranjo(p, ids.length, rngDe(rodada)) : []), [p, ids.length, rodada]);
  const estatua = useMemo(() => (p ? lugarDaEstatua(p, -1) : null), [p]);
  useArranjo(cena, ids, lugares, p);

  /* Sol em time-lapse: vai e volta pelo lado esquerdo do ceu. */
  useEffect(() => {
    if (parada) return;
    let vivo = true;
    const ir = async () => {
      while (vivo) {
        await Promise.all([
          tween(sol, "x", 0.24, { duration: DURATION.stroll * 4, ease: "easeInOut" }),
          tween(sol, "elevacao", 13, { duration: DURATION.stroll * 4, ease: "easeInOut" }),
        ]);
        if (!vivo) return;
        await Promise.all([
          tween(sol, "x", 0.06, { duration: DURATION.stroll * 4, ease: "easeInOut" }),
          tween(sol, "elevacao", 24, { duration: DURATION.stroll * 4, ease: "easeInOut" }),
        ]);
      }
    };
    void ir();
    return () => {
      vivo = false;
    };
  }, [parada, sol, tween]);

  /* A cada ciclo uma copia racha e vira duas; passou do limite, a hidra recomeca. */
  useEffect(() => {
    if (parada) return;
    const relogio = setInterval(() => {
      const atuais = atual.current;
      setRodada((r) => r + 1);
      if (atuais.length >= MAX_PREVIA) {
        vistas.clear();
        setCabecas(criarHidra(rng));
        return;
      }
      const copia = atuais.find((c) => c.geracao > 0);
      const v = copia && vistas.get(copia.id);
      if (!copia || !v) return;
      const id = proximoId.current;
      proximoId.current += 2;
      vistas.delete(copia.id);
      vistas.set(id, { ...v, x: v.x - 20 * v.s, racha: 0, tremor: 0 });
      vistas.set(id + 1, { ...v, x: v.x + 20 * v.s, racha: 0, tremor: 0 });
      setCabecas(cortar(atuais, copia.id, rng, id));
    }, CICLO_MS);
    return () => clearInterval(relogio);
  }, [parada, rng, vistas]);

  /* Pouco antes de rachar, a racha corre pela copia da vez. */
  useEffect(() => {
    if (parada) return;
    const copia = cabecas.find((c) => c.geracao > 0);
    const v = copia && vistas.get(copia.id);
    if (!v || cabecas.length >= MAX_PREVIA) return;
    const t = setTimeout(() => void tween(v, "racha", 1, { duration: DURATION.base, ease: EASE_WOOD }), CICLO_MS - 700);
    return () => clearTimeout(t);
  }, [cabecas, parada, tween, vistas]);

  const janelas: JanelaNaPraca[] = cabecas.flatMap((c) => {
    const vista = vistas.get(c.id);
    return vista ? [{ id: c.id, mentira: c.mentira, vista }] : [];
  });

  return (
    <div ref={caixa} className={`${styles.mundo} ${styles.previa}`} aria-hidden="true">
      {p && estatua && <Praca p={p} sol={sol} lado={-1} estatua={estatua} janelas={janelas} detalhe={!parada} />}
    </div>
  );
}
