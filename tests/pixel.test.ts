import { describe, expect, it } from "vitest";
import { personaUrl } from "../src/ui/components/pixel";
import type { Final } from "../src/model/types";

const FINAIS: Final[] = ["arquiteto", "bombeiro", "jardineiro", "apostador"];

describe("retratos em pixel das personas finais", () => {
  it("todo final tem um desenho", () => {
    for (const f of FINAIS) expect(personaUrl(f)).toContain("data:image/svg+xml,");
  });

  it("o desenho é quadrado: nenhum pixel cai fora do viewBox", () => {
    for (const f of FINAIS) {
      const svg = decodeURIComponent(personaUrl(f).replace("data:image/svg+xml,", ""));
      const lado = Number(/viewBox="0 0 (\d+) (\d+)"/.exec(svg)![1]);
      const xs = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)"/g)].flatMap((m) => [Number(m[1]), Number(m[2])]);
      expect(xs.length).toBeGreaterThan(20); // não é um desenho vazio
      expect(Math.max(...xs)).toBeLessThan(lado);
    }
  });
});
