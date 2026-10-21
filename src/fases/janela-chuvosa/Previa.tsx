"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { Qualidade } from "@/console/contrato";
import {
  ABERTA_MAX,
  Ceu,
  Chuva,
  Cipreste,
  COR,
  Cortina,
  distanciaCamera,
  Folha,
  Luzes,
  Morros,
  novoClima,
  passoRelampago,
  posicionarCamera,
  Quarto,
  Raio,
  useTexturas,
  Vela,
} from "./cena";
import { avancar, forca, novoVento } from "./vento";

/** Na parede: a mesma tempestade, sem ninguem para fechar. A folha bate sozinha. Sem som, sem toque. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const { camera, size } = useThree();
  const clima = useMemo(novoClima, []);
  const vento = useMemo(novoVento, []);
  const tex = useTexturas(false);
  const folha = useRef<THREE.Group>(null);
  const f = useMemo(() => ({ ang: ABERTA_MAX, vel: 0 }), []);

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 30);
    passoRelampago(clima, dt, false);
    avancar(vento, dt);
    clima.forca += (forca(vento) - clima.forca) * Math.min(1, dt * 5);
    clima.forcaDentro = clima.forca * Math.min(1, (f.ang / ABERTA_MAX) * 1.8);

    /* Sem mao: o vento empurra, a folha bate na parede e volta um pouco. */
    const sopro = -(0.5 + 15 * Math.pow(clima.forca, 1.6));
    f.vel += (sopro - 0.8 * f.vel) * dt;
    f.ang = Math.min(-0.25, f.ang + f.vel * dt);
    if (f.ang < ABERTA_MAX) {
      f.ang = ABERTA_MAX;
      f.vel = Math.abs(f.vel) * 0.45 + (vento.fase === "rajada" ? 1.4 : 0);
    }
    if (folha.current) folha.current.rotation.y = f.ang;

    posicionarCamera(camera as THREE.PerspectiveCamera, size, distanciaCamera(size, 2.2, 2.3));
  });

  return (
    <>
      <PerspectiveCamera makeDefault near={0.05} far={80} />
      <color attach="background" args={[COR.reboco]} />
      <Ceu clima={clima} qualidade="baixa" />
      <Morros clima={clima} />
      <Cipreste clima={clima} posicao={[-3.9, -3.4, -8]} altura={5.4} />
      <Raio clima={clima} />
      <Chuva clima={clima} quantidade={qualidade === "baixa" ? 200 : 450} />
      <Luzes clima={clima} />
      <Quarto tex={tex} />
      <Vela clima={clima} />
      <Cortina clima={clima} />
      <Folha clima={clima} tex={tex} folha={folha} camadas={1} angulo={ABERTA_MAX} />
    </>
  );
}
