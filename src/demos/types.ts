/**
 * Shared contract for scripted paper demos.
 *
 * One module per paper under src/demos/<slug>.ts. Adding a paper means adding
 * a module — no layout code changes.
 *
 * `render` returns an HTML string rather than DOM nodes so that exactly the
 * same function produces the server-rendered first scene (in PaperDemo.astro,
 * where there is no `document`) and every later scene in the browser. That
 * keeps one source of truth for the markup. The tradeoff is that interpolation
 * is the author's responsibility: pass any value that is not an authored
 * literal through `esc()` below.
 */

export interface DemoStep {
  /** Short name for this state, shown as "2 / 4 · Visible presence". */
  label: string;
  /** Visible label for the Next control while on this step. */
  action: string;
  /** One sentence explaining what just happened. Announced politely. */
  caption: string;
  /** Milliseconds to hold this step during automatic playback. */
  duration?: number;
}

export interface PaperDemo {
  /** Must match the publication slug in publications.yaml. */
  id: string;
  /** Describes the reconstructed interface for assistive technology. */
  stageLabel: string;
  steps: DemoStep[];
  /**
   * Complete text alternative, one entry per step. Rendered into static HTML
   * so the demo degrades to a readable walkthrough without JavaScript.
   */
  transcript: string[];
  /** Returns the markup for one step. Must be pure and side-effect free. */
  render(index: number): string;
}

/** Escapes a value for interpolation into `render()` output. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
