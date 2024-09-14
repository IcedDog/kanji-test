// glyphwiki_buhin.d.ts
import { Polygons, Kage } from "@kurgm/kage-engine";
declare module './glyphwiki_buhin.js' {
    export function drawGlyph(name: string): Polygons[];
    export const kage: Kage;
}
