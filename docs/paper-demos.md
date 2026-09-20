# Building a paper demo

Every Selected Work row carries a small live reconstruction of the paper's
interface. This is how they are put together, and the things that have
actually gone wrong while building the five that exist.

Adding a paper means adding **one module** under `src/demos/papers/` and
**one stylesheet** under `src/styles/`. Nothing else in the layout changes.

---

## 1. The moving parts

| File | What it does |
|---|---|
| `src/demos/types.ts` | The contract: `PaperDemo`, `DemoController`, `DemoContext`, and the `esc()` helper. |
| `src/demos/registry.ts` | Build-time glob over `./papers/*.ts`. Feeds the static scene and transcript into the HTML. **Never reaches the browser.** |
| `src/scripts/demo-loader.ts` | Browser side. Lazy-imports a demo when it scrolls near, decides which one plays, owns the whole lifecycle. |
| `src/components/PaperDemo.astro` | The frame: stage, Pause/Reset, the `aria-live` region, the visually-hidden transcript. |
| `src/styles/_demo-frame.scss` | Rules shared by every frame. |
| `src/styles/_demo-<slug>.scss` | One per demo. Imported from `global.scss`. |

Two globs cover `src/demos/papers/` — one eager (build), one lazy (browser).
That is why `types.ts` and `registry.ts` live a directory up: a module in
`papers/` is a demo, full stop.

## 2. The contract

```ts
export interface PaperDemo {
  id: string;            // must equal the publication or manuscript slug
  stageLabel: string;    // describes the reconstructed interface for AT
  hint: string;          // one line under the stage: what you can do
  transcript: string[];  // the complete text alternative
  scene(): string;       // HTML string — pure, no side effects, no `document`
  mount(root, ctx): DemoController;   // browser only
}

export interface DemoController {
  play(): void;     // rewind to the start and run
  reset(): void;    // same, but announced — the Reset button
  pause(): void;    // freeze where it is
  finish(): void;   // stop and jump to the finished state
  resume(): void;   // the demo is on screen again
  destroy(): void;  // cancel everything
}
```

`scene()` returns a **string**, not DOM, because the same function has to run
in Astro's frontmatter (no `document`) and in the browser. Anything that is
not an authored literal goes through `esc()`.

## 3. Lifecycle — the part that is easy to get wrong

```
page load      →  scene() rendered into HTML, at its FINISHED state
scrolled near  →  module imported, mount() called → showEnd()
first ≥55% visible →  play(): rewind to blank, run the intro
loses the slot →  finish(): settle into the end state
on screen again →  resume(); no second automatic run
Reset          →  reset(): rewind and run again
```

Three rules fall out of this, and each was learned by breaking it:

**A demo rests at its finished state, not blank.** Half-scrolling a demo into
view used to show an empty frame. `mount()` must call a `showEnd()` that puts
the demo where the intro ends. This is also the no-JavaScript state, so the
static markup and the resting state are the same thing — `scene()` should
render the finished scene (`data-stage="done"`).

**Each demo autoplays once.** Replaying on every pass makes scrolling back up
the page a wall of restarting animation. The loader tracks this; a demo does
not need to.

**`finish()` is not `pause()`.** `pause()` freezes (the Pause button).
`finish()` settles (lost the slot, hidden tab). Since there is no second
automatic run, freezing would be permanent. Guard it:

```ts
finish() {
  if (!running) return;   // never started, or stopped by hand — leave it
  ...
  showEnd();
}
```

## 4. Writing one

### The scene

Absolute or flow layout, your choice, but **the frame's width is not the
viewport's**. The same demo appears in a Selected Work row (~658px) and in a
paper detail column (~680px) on the same screen. Size everything with
container queries:

```scss
.paper-demo { container: demo / inline-size; }   // already set by the frame

@container demo (min-width: 700px) { .xx { font-size: 0.78rem; } }
@container demo (max-width: 560px) { /* the narrow layout */ }
```

`@media (max-width: …)` in a demo stylesheet is almost always a bug.

### Staging

Reveal the scene in beats with a `data-stage` attribute and cascading
selector lists:

```scss
$after-look: "[data-stage='look'], [data-stage='see'], … , [data-stage='done']";
.xx:is(#{$after-look}) .xx-thing { opacity: 1; }
```

Every stage list must end in `done`, so the finished state shows everything.

### The intro

```ts
async function run() {
  if (ctx.reducedMotion) { showEnd(); settle(); return; }
  setStage('a');  await wait(900);  if (stopped()) return;
  setStage('b');  await wait(1200); if (stopped()) return;
  ...
}
```

Check `stopped()` after **every** await. `wait()` never resolves once paused,
so a missed check leaves a run half-applied.

Aim for 12–25 seconds. Sidecar is the longest at ~24s and it is the ceiling.

### Interactions

Whatever the intro demonstrates, a visitor should be able to do by hand —
ideally through the same code path. Sidecar's scripted pointer literally
moves to real elements and clicks them.

Give every gesture a keyboard equivalent. A drag is no use to someone who
cannot make one: IdeaSynth's suggestions drag *and* place on Enter; its
connection handles drag *and* arm on click.

## 5. Traps that have actually bitten

**A deferred measurement outliving what it measured.** Three times now.
`requestAnimationFrame(...)` to measure geometry, then the state it was
measuring gets torn down before the frame arrives, and the callback runs
anyway. Symptoms: a connector drawn across a rewound editor; a canvas that
silently jumps back to its finished state mid-intro. Either cancel the frame,
or re-check the state inside it — preferably both:

```ts
frame = requestAnimationFrame(() => {
  frame = 0;
  if (panel.dataset.open !== 'true') return;   // still relevant?
  ...
});
function close() { if (frame) { cancelAnimationFrame(frame); frame = 0; } ... }
```

If you can measure synchronously at mount, do that instead.

**`Array#map` passing three arguments.** `CELLS.map(cellMarkup)` hands
`cellMarkup(cell, index, array)`. If the third parameter is an option flag,
the array lands in it and is truthy. Write `CELLS.map((c, i) => f(c, i))`.

**A state attribute on the root that collides with a child's.** Cocoa tracked
the open step as `data-open` on its root — the same attribute its cell buttons
used — so `closest('[data-open]')` from anywhere in the demo matched the root
and swallowed every other click. Namespace root state distinctly.

**`display: flex` beating `[hidden]`.** The UA rule for `[hidden]` is
`display: none`, and any `display` you set outranks it. The frame's controls
were visible with JavaScript off until `&[hidden] { display: none; }` was
added.

**A grid row sized by its tallest item.** Cocoa's sidebar grew with its own
content, so adding a paper made the whole demo taller. Lifting the sidebar's
contents out of flow (`position: absolute; inset: 0`) leaves the other column
setting the height.

**`new Date('2026-04-01')`** parses as UTC and formats in local time. Build
west of UTC and every month renders one early. Use `new Date(y, m - 1, 1)`.

**Transitions firing on a rewind.** The loader sets `data-demo-rewind` for one
frame and `_demo-frame.scss` kills transitions, so the jump back is a cut. If
you add a demo, nothing to do — it is inherited.

## 6. Accuracy and claims

These are illustrative reconstructions. They must not assert results.

- Check `_new_material/website-update-brief.md` → **"Claims that must not
  appear on the site"** before writing any copy.
- Grey placeholder bars for body text the figure does not spell out. All five
  demos do this, following the papers' own figures.
- Do not invent citations. Where a paper title appears, it is one the paper's
  own figure shows. Counts like "3 excerpts" are interface state, not claims.
- Where the demo would have to invent the system's judgement — a verdict on a
  pairing a visitor made up — leave it out rather than fake it.
- Say so in the module header, and end the transcript with a line stating it
  is a reconstruction reporting no result.

## 7. Checklist before you call one done

Drive a real browser. Every one of these was green in the build and broken on
screen.

- [ ] Intro plays through; `data-stage` reaches `done`
- [ ] Rests at the finished state before it is ever activated — check with a
      viewport shorter than the demo, so nothing can reach the 55% threshold
- [ ] Every interaction works by mouse **and** keyboard
- [ ] Reset rewinds and replays; Pause freezes; clicking after Pause does not
      restart it
- [ ] Dark mode
- [ ] `prefers-reduced-motion` → the end state, no animation
- [ ] 390px wide, and no horizontal page overflow
- [ ] JavaScript off → the finished scene, no dead controls
- [ ] In the paper detail overlay as well as the homepage row
- [ ] No more than one demo animating at a time, with all of them on the page

A viewport trick worth knowing: set the browser to 150px tall. No demo can
reach the autoplay threshold, so you can read every demo's true resting state.
