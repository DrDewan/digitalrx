"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { domMeasurer, layoutSection, type SectionLayout } from "@/lib/rx/overlay";
import {
  OVERLAY_SECTIONS,
  type OverlayBoxes,
  type OverlaySectionKey,
} from "@/lib/rx/types";

export type PrintSheetProps = {
  texts: Record<OverlaySectionKey, string>;
  boxes: OverlayBoxes;
  fontMax: number;
  fontMin: number;
  /** Shows the sheet in the page instead of parking it off-screen. */
  preview: boolean;
  showGuides?: boolean;
  showBoxOutlines?: boolean;
  /** Keeps the box edges visible on paper — used by the calibration sheet only. */
  printBoxOutlines?: boolean;
  /** Reports pagination and overflow back to the workspace. */
  onLayout?: (info: { pages: number; truncated: OverlaySectionKey[] }) => void;
};

type Layouts = Record<OverlaySectionKey, SectionLayout>;

const EMPTY_LAYOUT: SectionLayout = { pages: [""], fontPt: 11, truncated: false };

function mm(value: number) {
  return `${value}mm`;
}

/**
 * Renders the text that will be printed onto the pre-printed hospital pad.
 *
 * The element is always mounted, even when not previewed, because the layout
 * engine measures real DOM boxes — an element with `display: none` reports
 * zero height and would silently produce a wrong result.
 */
export function PrintSheet({
  texts,
  boxes,
  fontMax,
  fontMin,
  preview,
  showGuides = false,
  showBoxOutlines = false,
  printBoxOutlines = false,
  onLayout,
}: PrintSheetProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Partial<Record<OverlaySectionKey, HTMLDivElement | null>>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [layouts, setLayouts] = useState<Layouts>(() => ({
    disease: { ...EMPTY_LAYOUT, fontPt: fontMax },
    treatment: { ...EMPTY_LAYOUT, fontPt: fontMax },
    diagnosis: { ...EMPTY_LAYOUT, fontPt: fontMax },
    advice: { ...EMPTY_LAYOUT, fontPt: fontMax },
  }));
  const [scale, setScale] = useState(1);

  // Re-flow whenever the content, the geometry or the font range changes.
  useLayoutEffect(() => {
    const measureEl = measureRef.current;
    if (!measureEl) return;

    const next = {} as Layouts;
    for (const section of OVERLAY_SECTIONS) {
      const boxEl = boxRefs.current[section];
      if (!boxEl) {
        next[section] = EMPTY_LAYOUT;
        continue;
      }
      next[section] = layoutSection(domMeasurer(measureEl, boxEl), texts[section], {
        maxPt: fontMax,
        minPt: fontMin,
        maxPages: 8,
      });
    }
    setLayouts(next);
  }, [texts, boxes, fontMax, fontMin]);

  const pageCount = useMemo(
    () => Math.max(1, ...OVERLAY_SECTIONS.map((s) => layouts[s].pages.length)),
    [layouts],
  );

  const truncated = useMemo(
    () => OVERLAY_SECTIONS.filter((s) => layouts[s].truncated),
    [layouts],
  );

  useEffect(() => {
    onLayout?.({ pages: pageCount, truncated });
  }, [pageCount, truncated, onLayout]);

  // Fit the A4 sheet to whatever column width the preview is given.
  useEffect(() => {
    if (!preview) return;
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth - 32; // padding
      const a4 = (210 / 25.4) * 96; // 210mm at CSS 96dpi
      setScale(Math.min(1, Math.max(0.25, available / a4)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [preview]);

  const pages = Array.from({ length: pageCount }, (_, i) => i);
  const a4HeightPx = (297 / 25.4) * 96;
  const stackHeight = preview ? pageCount * a4HeightPx * scale + (pageCount - 1) * 16 * scale : undefined;

  return (
    <div id="print-root" className={preview ? "" : "rx-offscreen"}>
      <div ref={scrollerRef} className={preview ? "rx-preview-scroller" : ""}>
        {/* Reserves the space the scaled sheet occupies on screen; the print
            stylesheet drops the height so paper is never padded. */}
        <div className="rx-preview-frame" style={preview ? { height: stackHeight } : undefined}>
          <div
            className={`rx-preview-stack ${showBoxOutlines ? "overlay-debug" : ""} ${
              printBoxOutlines ? "overlay-debug-print" : ""
            }`}
            style={preview ? { transform: `scale(${scale})` } : undefined}
          >
            {pages.map((pageIndex) => (
              <div key={pageIndex} className="rx-page">
                {showGuides && (
                  <>
                    <span className="rx-guide rx-guide-v" aria-hidden="true" />
                    <span className="rx-guide rx-guide-h" aria-hidden="true" />
                  </>
                )}

                {OVERLAY_SECTIONS.map((section) => {
                  const box = boxes[section];
                  const layout = layouts[section];
                  const text = layout.pages[pageIndex] ?? "";
                  return (
                    <div
                      key={section}
                      ref={
                        pageIndex === 0
                          ? (el) => {
                              boxRefs.current[section] = el;
                            }
                          : undefined
                      }
                      className="rx-box"
                      data-section={section}
                      style={{
                        top: mm(box.top),
                        left: mm(box.left),
                        width: mm(box.width),
                        height: mm(box.height),
                        fontSize: `${layout.fontPt}pt`,
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Off-screen ruler used by the layout engine. */}
      <div ref={measureRef} className="rx-measure" aria-hidden="true" />
    </div>
  );
}
