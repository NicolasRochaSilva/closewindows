import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Desligado: o R3F v9 herda o StrictMode, e o <Html> do drei cria uma raiz
   * React propria sobre o MESMO elemento. No efeito duplo do StrictMode, o
   * desmonte adiado da 1a raiz apaga o conteudo da 2a (o formulario do login
   * some). So acontece em dev; producao nao roda efeito duplo.
   */
  reactStrictMode: false,
};

export default nextConfig;
