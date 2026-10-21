"use client";

import { useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import type { Qualidade } from "./contrato";
import styles from "./console.module.css";

/**
 * O canvas WebGL UNICO do jogo. Fica fixo sobre a pagina, sem capturar clique;
 * cada <View> do drei (login, previas 3D, fase 3D) desenha so no retangulo do
 * seu elemento DOM. Um contexto WebGL so, quantas janelas 3D houver.
 */
export default function Palco3D({ qualidade, children }: { qualidade: Qualidade; children: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null!);

  return (
    <div ref={raiz} className={styles.palco}>
      {children}
      <Canvas
        className={styles.canvas}
        eventSource={raiz}
        eventPrefix="client"
        dpr={qualidade === "alta" ? [1, 2] : qualidade === "media" ? [1, 1.5] : 1}
        gl={{ antialias: qualidade !== "baixa", alpha: true }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
