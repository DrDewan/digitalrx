/**
 * Regression tests for the overlay layout engine, run against a simulated text
 * box so no browser is needed.
 *
 *   npm test
 *
 * The engine decides what lands on a pre-printed hospital pad, so the property
 * that matters most is the one asserted hardest: no character of a prescription
 * may ever be dropped.
 */
import { layoutSection, splitAtFit, type Measurer } from "../src/lib/rx/overlay";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name} ${detail}`);
  }
}

/**
 * Fake box: at 11pt it holds `cols` characters per line and `rows` lines.
 * Smaller fonts hold proportionally more of both.
 */
function fakeMeasurer(cols: number, rows: number) {
  let pt = 11;
  let text = "";
  const state = { pt: () => pt };
  const m: Measurer = {
    setFontSize(next) {
      pt = next;
    },
    setText(next) {
      text = next;
    },
    fits() {
      const scale = 11 / pt;
      const width = Math.floor(cols * scale);
      const height = Math.floor(rows * scale);
      return wrapLines(text, width) <= height;
    },
  };
  return { m, state };
}

function wrapLines(text: string, width: number): number {
  if (!text) return 0;
  let lines = 0;
  for (const para of text.split("\n")) {
    if (!para.length) {
      lines += 1;
      continue;
    }
    let used = 0;
    for (const word of para.split(" ")) {
      const w = word.length;
      if (used === 0) {
        used = w;
        lines += 1;
      } else if (used + 1 + w <= width) {
        used += 1 + w;
      } else {
        used = w;
        lines += 1;
      }
      while (used > width) {
        used -= width;
        lines += 1;
      }
    }
  }
  return lines;
}

const words = (n: number) =>
  Array.from({ length: n }, (_, i) => `word${String(i).padStart(3, "0")}`).join(" ");

console.log("overlay layout engine");

// 1. Empty input
{
  const { m } = fakeMeasurer(40, 20);
  const r = layoutSection(m, "   ");
  check("empty text yields one empty page", r.pages.length === 1 && r.pages[0] === "");
  check("empty text is not truncated", r.truncated === false);
}

// 2. Short text keeps the largest font and a single page
{
  const { m } = fakeMeasurer(40, 20);
  const r = layoutSection(m, "Cholelithiasis (suspected)");
  check("short text uses max font", r.fontPt === 11, `got ${r.fontPt}`);
  check("short text is one page", r.pages.length === 1);
  check("short text preserved exactly", r.pages[0] === "Cholelithiasis (suspected)");
}

// 3. Medium text steps the font down instead of paginating
{
  const { m } = fakeMeasurer(30, 8);
  const text = words(34); // fits at 9pt but not at 11pt
  const r = layoutSection(m, text);
  check("medium text stays on one page", r.pages.length === 1, `pages=${r.pages.length}`);
  check("medium text shrank the font", r.fontPt < 11, `got ${r.fontPt}`);
  check("medium text lost nothing", r.pages.join(" ") === text);
}

// 4. Long text paginates, loses nothing, and breaks on word boundaries
{
  const { m } = fakeMeasurer(30, 6);
  const text = words(300);
  const r = layoutSection(m, text, { maxPages: 20 });
  check("long text paginates", r.pages.length > 1, `pages=${r.pages.length}`);
  check("long text is not truncated", r.truncated === false);
  check("long text uses the minimum font", r.fontPt === 9, `got ${r.fontPt}`);
  const rejoined = r.pages.join(" ").replace(/\s+/g, " ").trim();
  check("no content lost across pages", rejoined === text, `len ${rejoined.length} vs ${text.length}`);
  const brokenWord = r.pages.some((p) => /word\d{0,2}$/.test(p.trim()));
  check("no page ends mid-word", !brokenWord);
}

// 5. maxPages is respected and reported
{
  const { m } = fakeMeasurer(20, 4);
  const r = layoutSection(m, words(2000), { maxPages: 2 });
  check("respects maxPages", r.pages.length === 2, `pages=${r.pages.length}`);
  check("reports truncation", r.truncated === true);
}

// 6. A single unbreakable token still makes progress
{
  const { m } = fakeMeasurer(10, 2);
  const r = layoutSection(m, "x".repeat(400), { maxPages: 20 });
  check("unbreakable token still paginates", r.pages.length > 1);
  check("unbreakable token loses nothing", r.pages.join("") === "x".repeat(400));
}

// 7. splitAtFit never returns an empty head
{
  const { m } = fakeMeasurer(5, 1);
  m.setFontSize(9);
  const { head } = splitAtFit(m, "alpha beta gamma");
  check("split always advances", head.length > 0);
}

// 8. Custom font range is honoured
{
  const { m } = fakeMeasurer(30, 10);
  const r = layoutSection(m, words(20), { maxPt: 14, minPt: 12 });
  check("respects a custom font range", r.fontPt <= 14 && r.fontPt >= 12, `got ${r.fontPt}`);
}

console.log(failures === 0 ? "\nAll overlay checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
