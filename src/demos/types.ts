/**
 * Shared contract for live paper demos.
 *
 * One module per paper under src/demos/papers/<slug>.ts. Adding a paper means
 * adding a module — no layout code changes.
 *
 * These are interactive reconstructions, not slideshows and not recordings.
 * A demo owns its own animation and input handling; the frame around it only
 * supplies Reset/Pause, an aria-live region, and lifecycle.
 *
 * `scene()` returns an HTML string rather than DOM nodes so the same function
 * produces the server-rendered initial scene (in PaperDemo.astro, where there
 * is no `document`) and the browser's reset state. Pass anything that is not
 * an authored literal through `esc()`.
 */

export interface DemoContext {
  /** True when the visitor asked for reduced motion. Skip animation. */
  reducedMotion: boolean;
  /** Announce a state change in the demo's aria-live caption. */
  announce(text: string): void;
  /**
   * Report whether an automated sequence is currently running, so the frame
   * can show or hide its Pause control rather than leave a dead button.
   */
  setRunning(running: boolean): void;
}

export interface DemoController {
  /** Restore the demo to its initial state and restart any intro sequence. */
  reset(): void;
  /** Halt automated motion. Direct interaction stays available. */
  pause(): void;
  /** Resume automated motion, if any remains. */
  resume(): void;
  /** Cancel timers, drop listeners, release everything. */
  destroy(): void;
}

export interface PaperDemo {
  /** Must match the publication or manuscript slug. */
  id: string;
  /** Describes the reconstructed interface for assistive technology. */
  stageLabel: string;
  /** One-line description of what the visitor can do, shown under the stage. */
  hint: string;
  /**
   * Complete text alternative. Rendered into static HTML so the demo degrades
   * to a readable walkthrough without JavaScript.
   */
  transcript: string[];
  /** Markup for the initial state. Must be pure and side-effect free. */
  scene(): string;
  /** Browser-only. Wires up the live widget. */
  mount(root: HTMLElement, ctx: DemoContext): DemoController;
}

/** Escapes a value for interpolation into `scene()` output. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Minimal Python tokenizer for the reconstructed editors. Authored input only. */
const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'self', 'for', 'in', 'if', 'else', 'elif',
  'lambda', 'pass', 'import', 'from', 'None', 'True', 'False', 'and', 'or', 'not',
]);
const PY_BUILTINS = new Set(['sorted', 'sum', 'len', 'print', 'list', 'dict', 'range']);

/** Highlights one line of Python, escaping as it goes. */
export function highlightPython(line: string): string {
  if (line.trim() === '') return '&nbsp;';

  // Comments win over everything to their right.
  const hash = line.indexOf('#');
  if (hash !== -1) {
    const before = line.slice(0, hash);
    const comment = line.slice(hash);
    return highlightPython(before === '' ? ' ' : before).replace('&nbsp;', ' ')
      + `<span class="cd-t-com">${esc(comment)}</span>`;
  }

  return line.replace(/("[^"]*"|'[^']*')|([A-Za-z_][A-Za-z0-9_]*)|([^A-Za-z_"']+)/g,
    (_m, str, word, other) => {
      if (str) return `<span class="cd-t-str">${esc(str)}</span>`;
      if (word) {
        if (PY_KEYWORDS.has(word)) return `<span class="cd-t-kw">${esc(word)}</span>`;
        if (PY_BUILTINS.has(word)) return `<span class="cd-t-fn">${esc(word)}</span>`;
        return esc(word);
      }
      return esc(other ?? '');
    });
}
