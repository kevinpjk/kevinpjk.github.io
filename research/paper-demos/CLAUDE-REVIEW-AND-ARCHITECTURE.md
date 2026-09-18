# Paper demos: review of the prototype, and proposed production architecture

Written 18 September 2026, after integrating the rest of the site update. This
responds to `CLAUDE-HANDOFF.md` and to a read of the prototype source. Nothing
here has been implemented — the demo work is deliberately unbuilt pending
Kevin's sign-off and a second opinion from Codex.

## Summary

The prototype's **shape is right and I would keep it**: a static first scene in
HTML, a tiny always-loaded listener, and the player plus paper module imported
only on first activation. The measured 4.2 KB gzip initial / 2.7 KB on
activation is a good budget and worth defending.

Two things need to change before this ships:

1. **Lifecycle is not implemented**, only described. This is a correctness bug
   in this repo, not a style preference — see below.
2. **Fidelity.** Kevin's own assessment is that the scenes are too static and
   not faithful enough to the real systems. I agree, and the fix is real
   reference material rather than a different architecture.

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

## Proposed production architecture

Codex's file layout is sound. This adopts it with the lifecycle gap closed.

```text
src/components/PaperDemo.astro   # static frame, first scene, transcript, controls
src/scripts/demo-loader.ts       # activation, lazy import, teardown registry
src/scripts/demo-player.ts       # shared stepping/play/pause (from player.js)
src/demos/types.ts               # shared contract, discriminated union
src/demos/<slug>.ts              # one module per paper
public/assets/demos/<slug>/      # optimized media only
```

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

Per-paper modules return DOM nodes, or clone a `<template>` and set
`textContent`, rather than returning an HTML string. Same authoring
ergonomics, and the injection question never arises when a demo later wants to
show a real paper title.

### Placement

The handoff recommends wider selected-work rows and warns against squeezing a
desktop UI into the 340px column. I agree, but note the column has since
changed: cards now carry a 72px teaser thumbnail, an author line, and an
explicit `[data-open-paper]` trigger.

My recommendation is **demo in the detail overlay, poster on the card**:

- The card keeps its teaser thumbnail, which already reads well at 340px.
- Opening a paper gives the demo the full overlay width, comfortably past the
  480px minimum, with no homepage reflow.
- Mounting is then naturally scoped: mount on open, `destroy()` on close. That
  is a cleaner lifecycle than "mounted but scrolled out of view", and it means
  a visitor who never opens a paper downloads zero demo code.

The cost is that the demo is one click less discoverable. If Kevin would
rather have it inline on the homepage, that is a layout change to the
right-hand column and should be decided before any demo is built, since it
determines the scene width budget.

Note the overlay's own accessibility is currently incomplete regardless of
demos: it sets `aria-hidden` and fades `#main-content` with opacity, but does
not trap focus, mark the background `inert`, or restore focus on close. If
demos go in the overlay, that needs fixing first — a keyboard user would
otherwise tab from the demo straight into the hidden page behind it.

### Per-paper format

I agree with Codex's table and would not change the assignments:

| Paper | Format | Why |
| --- | --- | --- |
| Codellaborator | Scripted widget | Agent presence and provenance are invisible in a still. |
| Cocoa | Scripted widget | Assignment and interleaving need a few deterministic clicks. |
| ProMemAssist | Short muted video, frames until footage exists | Physical context is the point; a memory meter would obscure it. |
| IdeaSynth | Captioned screenshots | The real canvas and citations matter more than a fake graph editor. |
| SemanticOn | Captioned screenshots | Preserves the programming-by-demonstration context. |

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

1. **Placement** — demo in the overlay (my recommendation) or inline on the
   homepage? Determines the scene width budget.
2. **Scope** — build all five, or ship Codellaborator and Cocoa (the two
   scripted widgets, which need no footage) and add the rest as assets arrive?
3. **The overlay's focus handling** — worth fixing on its own merits, but it
   becomes a blocker if demos live there.

## Budget

Codex's targets are reasonable and I would hold to them: ≤10 KB compressed for
the shared loader and styles, ≤20 KB per scripted scene loaded only on
activation, ≤300 KB for a screenshot sequence, ≤1 MB for a short muted video.

One correction to the framing: the handoff calls the homepage figure an
engineering target rather than a measurement, which is right. For reference,
the homepage after the image-pipeline work now serves its profile photo at
1.5–6 KB and teaser thumbnails at roughly 2–6 KB each, so there is real
headroom — but the PDFs in `public/assets/pdf/` still total 70 MB, with
`storyensemble_uist_2025.pdf` alone at 33 MB. Those are linked rather than
embedded, so they do not affect page weight, but they are the largest
remaining weight problem on the site.
