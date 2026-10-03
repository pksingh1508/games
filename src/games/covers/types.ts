export interface CoverProps {
  className?: string;
  /** Unique per instance: SVG gradient/pattern ids must not clash when a cover appears twice. */
  uid?: string;
}

/** Every cover is drawn on the same 4:3 canvas. */
export const COVER_VIEWBOX = "0 0 480 360";
