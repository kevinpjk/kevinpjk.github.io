# Paper demos: prototype review and production architecture

Written 18 September 2026, after integrating the rest of the site update. This
responds to `CLAUDE-HANDOFF.md` and to a read of the prototype source.

**Status: implemented.** Kevin reviewed this document, accepted the defect
fixes, and overrode two of its design recommendations (see "Decisions" below).
Codellaborator is built and live on the branch; every other selected paper
renders a placeholder. The sections below describe what was built, with the
superseded recommendations kept for the record.

## Summary

The prototype's **shape is right and I would keep it**: a static first scene in
HTML, a tiny always-loaded listener, and the player plus paper module imported
only on first activation. The measured 4.2 KB gzip initial / 2.7 KB on
activation is a good budget and worth defending.

Two things needed to change before it could ship, and both are now addressed:

1. **Lifecycle was not implemented**, only described — a correctness bug in
   this repo, not a style preference. Fixed; see below.
2. **Fidelity.** Kevin's assessment is that the scenes are too static and not
   faithful enough to the real systems. I agree. The Codellaborator scene has
   been rebuilt closer to the paper's Figure 2, but the real fix is reference
   material, not a different architecture.

## Defects found by reading the prototype

These are specific and verifiable, not impressions.

### 1. `destroy()` is never called — the controller leaks

`player.js` returns `{ act, destroy }`, and `destroy()` correctly clears
timers, disconnects the `IntersectionObserver`, and aborts the listener
`AbortController`. But `loader.js` never calls it. Nothing does. Confirmed by
grep: `destroy` appears only in `player.js`'s own return.

Standalone this is harmless — the page never navigates. **In this repo it is
not.** `BaseLayout.astro` enables `<ClientRouter />`, so navigation is a DOM
swap, not a document load. A mounted player would keep its
`visibilitychange` listener, its `pagehide` listener, its reduced-motion
listener, and its observer alive against a detached root, and every visit
would add another set.

### 2. `loader.js` runs once at module scope and never re-initializes

The `for (const root of document.querySelectorAll(...))` loop runs at import
time. Under `ClientRouter` scripts do not re-execute after a swap, so demos on
a page reached by client-side navigation would never be wired up at all.

The handoff's requirement 5 states both of these correctly. The prototype
simply does not implement them, because a standalone static page cannot
exercise them. Worth being explicit so it is not mistaken for done.

### 3. Play is a dead control under reduced motion

`act()` returns immediately when `motion.matches`, but the button still
renders with its normal label. A user with reduced motion enabled sees a Play
button that silently does nothing. `shell.html` has a `[data-motion-note]`
explaining that stepping is manual, but the control should be removed or
genuinely disabled rather than no-op.

### 4. `stage.innerHTML = render(index)` is safe today, but the contract invites unsafety

Every value interpolated in `demos/codellaborator.js` is an authored constant,
so there is no injection risk as written. But the contract Codex proposes is
"one module per paper with a `render()` returning an HTML string", and the
moment one of those pulls a title or author from `publications.yaml` it
becomes one. Since demos will sit next to publication data, I would close this
now rather than rely on a convention.

### Things the prototype got right, and I would keep

- `aria-live="polite" aria-atomic="true"` on the caption region — present in
  `shell.html:27`, correct, and easy to get wrong.
- Real `<button>` elements with explicit `aria-label`s, so keyboard activation
  needs no emulation.
- Pausing on `visibilitychange`, `pagehide`, and leaving the viewport.
- Failure path that keeps the static scene and transcript when the module
  import fails.
- Generating the first scene and full transcript into static HTML, so the demo
  degrades to a captioned figure with JS disabled.

## Decisions

Kevin's calls, which override parts of this document and Codex's handoff:

1. **All demos are scripted widgets.** Both tables below proposed video for
   ProMemAssist and screenshot sequences for IdeaSynth and SemanticOn. That is
   rejected: there is no ProMemAssist footage, and screenshots alone are not
   wanted. Material will arrive per paper.
2. **Demos sit beside selected work on the homepage**, in wider rows — not
   poster-on-card with the demo in the overlay as recommended below. The
   overlay additionally shows the larger teaser, the tree rings, *and* the
   demo.
3. **No teaser thumbnail on selected work.** The teaser belongs to the full
   publication list and the overlay.
4. **The site is now one page.** The full publication list sits directly below
   the main content; only the gallery and the CV PDF are separate.
5. **Decorative animation is gone**, so `prefers-reduced-motion` was audited
   rather than removed — it still guards the remaining hover/focus
   transitions, smooth anchor scrolling, and demo auto-advance.

## Production architecture, as built

Codex's file layout is sound. This adopts it with the lifecycle gap closed.

```text
src/components/PaperDemo.astro   # static frame, first scene, transcript, controls
src/components/SelectedWork.astro # wide row: citation + demo
src/components/PublicationEntry.astro # full-list row: teaser + citation
src/scripts/demo-loader.ts       # activation, lazy import, teardown registry
src/scripts/demo-player.ts       # shared stepping/play/pause
src/demos/types.ts               # shared contract + esc() helper
src/demos/registry.ts            # build-time eager registry, never shipped
src/demos/papers/<slug>.ts       # one module per paper
public/assets/demos/<slug>/      # optimized media only
```

Demo modules live in `papers/` deliberately. When `types.ts` and `registry.ts`
were siblings they matched both globs, which put an eager registry chunk into
the browser bundle and would have pulled every demo into the first load.

### Lifecycle, concretely

A module-level `WeakMap<HTMLElement, Controller>` holds mounted controllers.
The loader registers once and handles both directions of navigation:

```ts
const mounted = new WeakMap<HTMLElement, Controller>();

function initDemos() { /* wire [data-paper-demo] roots not already in the map */ }

function teardownDemos() {
  document.querySelectorAll<HTMLElement>('[data-paper-demo]').forEach(root => {
    mounted.get(root)?.destroy();
    mounted.delete(root);
  });
}

initDemos();
document.addEventListener('astro:after-swap', initDemos);
document.addEventListener('astro:before-swap', teardownDemos);
```

`initDemos()` must be idempotent — it is called on every swap, and the overlay
code in `PaperDetailOverlays.astro` relocates `.paper-detail` nodes to
`document.body`, so a root can be re-encountered.

### Rendering

I recommended returning DOM nodes rather than HTML strings. **As built,
`render()` returns a string** — I softened my own recommendation for a
concrete reason: the same function has to produce the server-rendered first
scene inside `PaperDemo.astro`'s frontmatter, where there is no `document`.
Returning DOM would mean two renderers and two sources of truth for the
markup.

The injection concern is handled instead by an `esc()` helper in `types.ts`
and a stated rule: anything that is not an authored literal goes through it.
Every value in `codellaborator.ts` today is an authored constant.

### Placement, as built

I recommended poster-on-card with the demo confined to the overlay, on the
grounds that it scopes mounting and costs nothing on first load. **Kevin chose
inline on the homepage instead**, which is the more discoverable arrangement
and the one the reference site uses.

What that changed:

- The narrow 340px right column is gone. Selected work is now a full-width
  row at roughly 34% citation / 66% demo, which clears the 480px minimum on
  desktop and stacks below 860px.
- No teaser on those rows, per Kevin's call.
- The overlay shows teaser, tree ring and demo together, for selected papers
  only.
- Because demos are now on first paint, the lazy-loading discipline matters
  more than it would have under my proposal, not less. Measured: the initial
  payload carries only the 2.6 kB loader; the paper module and player are
  fetched on first activation and confirmed absent before it.

**Still outstanding, and now more pressing:** the overlay does not trap focus,
mark the background `inert`, or restore focus on close. It sets `aria-hidden`
and fades `#main-content` with opacity, which does not remove the page behind
it from the keyboard order. With a demo inside the overlay, a keyboard user
can tab out of the demo and into the hidden page. This should be fixed before
launch. It is pre-existing, not introduced by the demos.

### Per-paper format — superseded

Codex's table and my agreement with it are both overridden by decision 1:
**every demo is a scripted widget.** Recorded here for the record only.

| Paper | Was proposed | Now |
| --- | --- | --- |
| Codellaborator | Scripted widget | Scripted widget — **built** |
| Cocoa | Scripted widget | Scripted widget — placeholder |
| ProMemAssist | Short muted video | Scripted widget — placeholder |
| IdeaSynth | Captioned screenshots | Scripted widget — placeholder |
| SemanticOn | Captioned screenshots | Scripted widget — placeholder |

A scripted widget for ProMemAssist is the hardest of the four remaining,
because the paper's story is physical: a dining-table task interrupted by a
competing one. A widget has to convey a real-world scene without footage,
probably as a simple schematic of the task state plus the assistant's timing
decision. Worth discussing before building.

One caution on ProMemAssist: any reconstructed internal state must be labelled
illustrative. The system estimates working memory from observable signals, and
a demo that looks like it reads a wearer's mind would misrepresent the paper.

Captions must also respect the brief's do-not-publish list. The site's paper
summaries were rewritten for exactly this reason; demo captions are the same
surface and the same constraint.

## What is needed from Kevin

The formats above are chosen to degrade gracefully, so work can start before
all of this arrives.

| Paper | Minimum | Nice to have |
| --- | --- | --- |
| Codellaborator | One screenshot with the AI caret and status bubble; one with a breakout conversation. Approve or replace the prototype's docstring story. | 15–25s screen capture, trigger through follow-up |
| Cocoa | Plan with assignment controls, a pause at a user step, the output sidebar, an updated plan. Text of one short research task. | 15–25s: assign → run → pause → edit → resume |
| ProMemAssist | Four frames: initial task, reminder-relevant item, competing task, return. Exact approved reminder wording. | 12–20s continuous, real-world context visible |
| IdeaSynth | Four crops from one idea: starting facet, feedback with a readable citation, a variant, the composed brief. | — |
| SemanticOn | Highlighted source content, condition tags, demonstrated extraction, refinement. One example throughout. | — |

Native resolution PNG or original recordings, no baked-in captions — captions
belong in HTML so they stay selectable, translatable, and screen-reader
accessible.

## Open questions

1. **Overlay focus handling** — now a launch blocker rather than a nicety,
   since demos live inside the overlay too. See "Placement, as built".
2. **ProMemAssist as a widget** — the one case where the format decision
   fights the paper's physical framing. Needs a treatment agreed before build.
3. **Per-paper material** — Kevin is supplying figures and demo frames one
   paper at a time. Each arrival is one new module under `src/demos/papers/`.

## Budget

Codex's targets are reasonable and I would hold to them: ≤10 KB compressed for
the shared loader and styles, ≤20 KB per scripted scene loaded only on
activation, ≤300 KB for a screenshot sequence, ≤1 MB for a short muted video.

Measured on the built output rather than estimated:

- Initial demo JavaScript: **2.6 KB** (`demo-loader`), confirmed to be the
  only demo code requested before interaction.
- On activation: `codellaborator` 3.7 KB + `demo-player` 1.7 KB.
- `registry` does not appear in the client bundle at all.
- Profile photo resolves to 1.5–6 KB; teaser thumbnails 2–6 KB each.

The PDFs in `public/assets/pdf/` remain the largest weight problem on the
site: 70 MB total, with `storyensemble_uist_2025.pdf` alone at 33 MB. They are
linked rather than embedded, so they do not affect page weight, but they do
affect anyone who clicks. Kevin has a 5 MB replacement for that file which has
not yet reached the branch.
