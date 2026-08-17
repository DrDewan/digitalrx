/**
 * Overlay layout engine.
 *
 * The hospital pad is pre-printed. We print nothing but the doctor's text, at
 * millimetre-exact positions, onto a blank A4 fed through the printer. Each
 * block has a fixed box; text must fit inside it or the ink lands on the
 * pad's own printing.
 *
 * Strategy, unchanged in spirit from the original implementation:
 *   1. try the largest font that fits the whole block,
 *   2. step down one point at a time to the minimum,
 *   3. at the minimum, break across additional pages.
 *
 * Two behaviours are deliberately different from the original:
 *   - breaks happen at a word boundary, not mid-word;
 *   - overflow past page two starts a page three (and so on) instead of being
 *     silently discarded. Losing the tail of a prescription is not acceptable.
 *
 * The measurement itself is abstracted behind `Measurer` so the algorithm can
 * be tested without a browser.
 */

export type Measurer = {
  setFontSize(pt: number): void;
  setText(text: string): void;
  /** True when the current text fits the box at the current font size. */
  fits(): boolean;
};

export type LayoutOptions = {
  maxPt?: number;
  minPt?: number;
  /** Hard stop so a pathological input cannot loop forever. */
  maxPages?: number;
};

export type SectionLayout = {
  /** One string per printed page. Always at least one entry. */
  pages: string[];
  fontPt: number;
  /** True when text had to be dropped because maxPages was reached. */
  truncated: boolean;
};

const DEFAULTS = { maxPt: 11, minPt: 9, maxPages: 6 } as const;

/** Largest prefix of `text` that fits, preferring to end on a word boundary. */
export function splitAtFit(measurer: Measurer, text: string): { head: string; tail: string } {
  let lo = 0;
  let hi = text.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    measurer.setText(text.slice(0, mid));
    if (measurer.fits()) lo = mid;
    else hi = mid - 1;
  }

  if (lo <= 0) lo = 1; // always make progress

  // Prefer breaking at whitespace rather than through a word, but only if that
  // still leaves a usefully long line.
  if (lo < text.length && !/\s/.test(text[lo] ?? "")) {
    const boundary = text.slice(0, lo).search(/\s\S*$/);
    if (boundary > 0 && boundary >= Math.floor(lo * 0.5)) lo = boundary;
  }

  return { head: text.slice(0, lo), tail: text.slice(lo).replace(/^\s+/, "") };
}

export function layoutSection(
  measurer: Measurer,
  text: string,
  options: LayoutOptions = {},
): SectionLayout {
  const maxPt = options.maxPt ?? DEFAULTS.maxPt;
  const minPt = Math.min(options.minPt ?? DEFAULTS.minPt, maxPt);
  const maxPages = Math.max(1, options.maxPages ?? DEFAULTS.maxPages);

  const full = (text ?? "").replace(/\r\n/g, "\n");
  if (!full.trim()) return { pages: [""], fontPt: maxPt, truncated: false };

  for (let pt = maxPt; pt >= minPt; pt -= 1) {
    measurer.setFontSize(pt);
    measurer.setText(full);
    if (measurer.fits()) return { pages: [full], fontPt: pt, truncated: false };
  }

  measurer.setFontSize(minPt);
  const pages: string[] = [];
  let remaining = full;

  while (remaining.trim() && pages.length < maxPages) {
    const { head, tail } = splitAtFit(measurer, remaining);
    pages.push(head);
    if (tail === remaining) break; // defensive: no progress
    remaining = tail;
  }

  if (!pages.length) pages.push(full);

  return { pages, fontPt: minPt, truncated: remaining.trim().length > 0 };
}

/** A Measurer backed by a real off-screen element. */
export function domMeasurer(measureEl: HTMLElement, boxEl: HTMLElement): Measurer {
  const cs = window.getComputedStyle(boxEl);
  measureEl.style.width = cs.width;
  measureEl.style.height = cs.height;

  /**
   * Copy the line-height RATIO, never the resolved pixel value.
   *
   * `.rx-box` declares a unitless `line-height: 1.4`, which getComputedStyle
   * resolves to px against the box's *current* font size. Copying that px value
   * would pin the leading while the trial font size changes underneath it, so a
   * box that last rendered at 9pt would measure 11pt candidates with 9pt leading,
   * declare that they fit, and let `overflow: hidden` crop the end of a
   * prescription with no overflow warning.
   */
  const lineHeightPx = parseFloat(cs.lineHeight);
  const fontSizePx = parseFloat(cs.fontSize);
  const ratio =
    Number.isFinite(lineHeightPx) && Number.isFinite(fontSizePx) && fontSizePx > 0
      ? lineHeightPx / fontSizePx
      : 1.4;
  measureEl.style.lineHeight = String(ratio);

  measureEl.style.fontFamily = cs.fontFamily;
  measureEl.style.letterSpacing = cs.letterSpacing;
  measureEl.style.whiteSpace = "pre-wrap";
  measureEl.style.wordBreak = "break-word";
  measureEl.style.overflow = "hidden";

  return {
    setFontSize(pt) {
      measureEl.style.fontSize = `${pt}pt`;
    },
    setText(value) {
      measureEl.textContent = value;
    },
    fits() {
      // Half a pixel of slack absorbs sub-pixel rounding.
      return measureEl.scrollHeight <= measureEl.clientHeight + 0.5;
    },
  };
}
