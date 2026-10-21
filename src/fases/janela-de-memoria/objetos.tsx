/*
 * As seis lembrancas, desenhadas como fotograma de cianotipia: silhueta do
 * objeto que ficou sobre o papel. Caixa 100x100, cor = currentColor.
 */

export const OBJETOS = [
  { nome: "chave", de: "da" },
  { nome: "lua", de: "da" },
  { nome: "olho", de: "do" },
  { nome: "pena", de: "da" },
  { nome: "ampulheta", de: "da" },
  { nome: "escada", de: "da" },
] as const;

export const rotulo = (id: number) => `${OBJETOS[id].de} ${OBJETOS[id].nome}`;

const FORMAS = [
  /* chave */
  <g key="chave">
    <path fillRule="evenodd" d="M30 32a18 18 0 1 0 0 36a18 18 0 1 0 0-36Zm0 9a9 9 0 1 1 0 18a9 9 0 1 1 0-18Z" />
    <rect x="46" y="46" width="42" height="8" rx="1" />
    <rect x="70" y="54" width="6" height="10" />
    <rect x="80" y="54" width="6" height="15" />
  </g>,
  /* lua, com duas estrelas */
  <g key="lua">
    <path d="M72 20A31 31 0 1 0 72 80A41 41 0 0 1 72 20Z" />
    <circle cx="80" cy="34" r="2.6" />
    <circle cx="24" cy="22" r="2" />
  </g>,
  /* olho */
  <g key="olho">
    <path fillRule="evenodd" d="M8 50Q50 12 92 50Q50 88 8 50ZM50 35a15 15 0 1 0 0 30a15 15 0 1 0 0-30Z" />
    <circle cx="50" cy="50" r="7" />
  </g>,
  /* pena */
  <g key="pena">
    <path d="M26 86C21 60 36 31 78 10C75 41 61 67 26 86Z" />
    <path d="M20 95Q46 56 77 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </g>,
  /* ampulheta: o vidro e meio transparente, como no fotograma */
  <g key="ampulheta">
    <rect x="24" y="8" width="52" height="6" rx="1" />
    <rect x="24" y="86" width="52" height="6" rx="1" />
    <path opacity="0.45" d="M30 14C30 32 44 40 46 50C44 60 30 68 30 86H70C70 68 56 60 54 50C56 40 70 32 70 14Z" />
    <path d="M35 24H65C62 34 52 40 50 46C48 40 38 34 35 24Z" />
    <rect x="49" y="46" width="2" height="26" />
    <path d="M34 86C38 76 46 72 50 70C54 72 62 76 66 86Z" />
  </g>,
  /* escada, torta */
  <g key="escada" transform="rotate(-9 50 50)">
    <rect x="30" y="4" width="6" height="92" rx="1" />
    <rect x="64" y="4" width="6" height="92" rx="1" />
    {[14, 28, 42, 56, 70, 84].map((y) => (
      <rect key={y} x="36" y={y} width="28" height="5" />
    ))}
  </g>,
];

export function Objeto({ id, className }: { id: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      {FORMAS[id]}
    </svg>
  );
}
