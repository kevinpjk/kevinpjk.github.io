import type { PaperDemo } from './types';

/**
 * Build-time registry of paper demos, keyed by publication slug.
 *
 * Eager on purpose: this is imported from PaperDemo.astro's frontmatter, which
 * runs only at build time, so it never reaches the browser. It exists so the
 * first scene and the transcript can be rendered into static HTML.
 *
 * The browser-side counterpart in src/scripts/demo-loader.ts uses a lazy glob
 * over the same directory. Demo modules live in ./papers/ precisely so that
 * this file and types.ts are not themselves matched by either glob. Adding a
 * paper means adding one module to ./papers/; both globs pick it up.
 */
const modules = import.meta.glob<{ demo: PaperDemo }>('./papers/*.ts', { eager: true });

export const demos: Record<string, PaperDemo> = Object.fromEntries(
  Object.values(modules)
    .filter(mod => mod.demo)
    .map(mod => [mod.demo.id, mod.demo])
);
