import { describe, expect, it } from "vitest";
import { chefaoUrl, iconeUrl, personaUrl, retratoUrl } from "../src/ui/components/pixel";
import type { Final } from "../src/model/types";

const FINAIS: Final[] = ["arquiteto", "bombeiro", "jardineiro", "apostador"];
const CHEFOES = ["ondaIA", "cacaTalentos", "auditoria"];
const RETRATOS = ["ceo", "cfo", "cto", "voz", "diretora", "diretor"];
const ICONES = [
  "build",
  "buy",
  "borrow",
  "bot",
  "atendimento",
  "dados",
  "credito",
  "backoffice",
  "tecnologia",
  "comercial",
  "risco",
  "lideranca",
  "sucessao",
  "caneta",
];

/** Nenhum pixel pode cair fora do viewBox: o sprite tem que ser quadrado de verdade. */
function conferirQuadrado(url: string, minPixels: number) {
  const svg = decodeURIComponent(url.replace("data:image/svg+xml,", ""));
  const lado = Number(/viewBox="0 0 (\d+) (\d+)"/.exec(svg)![1]);
  const xs = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)"/g)].flatMap((m) => [Number(m[1]), Number(m[2])]);
  expect(xs.length).toBeGreaterThan(minPixels);
  expect(Math.max(...xs)).toBeLessThan(lado);
}

describe("arte pixel gerada por código", () => {
  it("todo final tem um desenho quadrado", () => {
    for (const f of FINAIS) {
      expect(personaUrl(f)).toContain("data:image/svg+xml,");
      conferirQuadrado(personaUrl(f), 20);
    }
  });

  it("todo chefão tem um desenho quadrado", () => {
    for (const c of CHEFOES) {
      expect(chefaoUrl(c)).toContain("data:image/svg+xml,");
      conferirQuadrado(chefaoUrl(c), 20);
    }
  });

  it("todo retrato e todo ícone cabem no próprio viewBox", () => {
    for (const r of RETRATOS) conferirQuadrado(retratoUrl(r), 20);
    for (const i of ICONES) conferirQuadrado(iconeUrl(i), 8);
  });
});
