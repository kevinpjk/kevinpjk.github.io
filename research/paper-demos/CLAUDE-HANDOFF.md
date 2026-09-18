# Selected-paper demos: design and implementation handoff

Research and isolated prototype, 17 September 2026. Production `src/`, publication data, dependencies, and deployment configuration were not edited. Only Codellaborator is prototyped. Build the other demos after Kevin reviews the treatment and supplies the relevant assets.

## Recommendation

Use **small interactive explanations**: one recognizably paper-specific scene, one action at a time, and an immediately visible consequence. Keep the scene understandable while stopped. Use the same outer frame, caption, step controls, transcript, and loading policy for all selected papers; let the scene vary between a scripted widget, screenshot sequence, and short video.

The useful reference is [Tae Soo Kim’s selected publications](https://taesookim.com/): compact demos adjacent to the paper citation; Stylette reduces its interface to a sample page, request control, and visible styling alternatives. I inspected the live page and tried its request control. Its mini-interface makes the mechanism legible and supports exploration after the walkthrough. This proposal uses that interaction pattern, with original artwork/code and explicit user-started playback.

Prefer **click/tap/keyboard to start**, with manual stepping always available. Do not automatically play on scroll or hover. Hover can highlight the Start control. Motion is a brief transition between meaningful states, not a continuously moving decoration. Default to one pass and hold the result; offer Replay. Avoid a fake microphone or open-ended prompt field when the response is canned.

### Placement and visual treatment

- On desktop, use a selected-paper row with approximately 30–35% citation/one-sentence takeaway and 65–70% demo. Give the demo at least 480 CSS pixels where possible; stack below that available width.
- On mobile, stack citation then demo; simplify the depicted application, preserve readable text and 44px controls, and let the frame grow vertically. Do not shrink a whole screenshot of a desktop app until its text is illegible.
- Inherit the existing forest palette, typography, and light/dark theme. Use a quiet editor/notebook surface, one accent for the active element, a short caption below, and a visible “Scripted example” label on reconstructed interfaces.
- Start with 3–5 meaningful states and about 10–15 seconds per optional automated walkthrough. Keep the animation to a short highlight, opacity change, or cursor movement. Short transitions of roughly 150–250ms suffice; disable these under reduced motion.
- Keep Paper / Full video links outside the demo. Expose a “Read the walkthrough” disclosure with the complete text alternative.

## Format and story for each selected paper

These are authored condensations of mechanisms in the papers, not historical transcripts or measurements. The selected set comes from `src/data/publications.yaml`.

| Paper | First implementation | Show this one idea | Why this format |
| --- | --- | --- | --- |
| **Codellaborator** | Scripted widget — prototype included | Finish a function → Cody signals activity → an attributed edit appears → inspect a line-linked explanation | Separate agent presence and local context are hard to understand from one still, but inexpensive to express in HTML. |
| **Cocoa** | Scripted widget | Assign a plan step to yourself → agent executes an earlier step → pauses for your contribution → update the output/remaining plan → resume | The visitor can experience flexible agency and interleaving planning with execution with a few deterministic buttons. |
| **ProMemAssist** | Short muted video, or four captioned frames until footage is ready | Establish task context → competing task makes a reminder costly → defer → return and deliver | Real physical activity communicates the reason for timing; an abstract memory meter would obscure it. |
| **IdeaSynth** | Four captioned screenshots | Select an idea facet → inspect literature-grounded feedback → explore a variant → compose connected facets into a brief | The real canvas and citation evidence matter more than recreating a graph editor. Small highlights/crossfades provide sufficient motion. |
| **SemanticOn** | Four captioned screenshots | Highlight a semantic condition → demonstrate extraction → refine a mismatch → inspect the resulting output | Preserve the programming-by-demonstration context; a generic filter animation would misrepresent the idea. |

Paper grounding:

- [Codellaborator, §4 and Figure 2](https://arxiv.org/html/2502.18658v1): AI cursor/caret, activity/status bubble, purple edit provenance, and code-anchored breakout conversations. Finishing/outdenting a Python block can trigger proactive documentation. The prototype depicts an illustrative function and added docstring; it is not an accept/reject diff tool.
- [Cocoa, §4 and Figures 3–5](https://arxiv.org/html/2412.10999v4): user/agent assignment, sequential execution pausing at user steps, editable outputs, and replanning during execution. Use one of the paper’s research scenarios for final copy.
- [ProMemAssist, §4.1](https://arxiv.org/html/2507.21378v1): dining-table and egg-counting scenario offers a defer/revisit/deliver story. Label any reconstructed internal-state overlay “Illustrative model state.” The system estimates working-memory state from observable signals; do not depict direct access to someone’s mind.
- [IdeaSynth, §4.1 and Figures 4–6](https://arxiv.org/html/2410.04025v2): facets, alternatives, connected compositions, and feedback grounded in literature.
- [SemanticOn, §4.1 and Figures 4–6](https://kevinpjk.github.io/assets/pdf/Semanticon_UIST_2022.pdf): specifying/refining semantic conditions within recorded extraction workflows. The outdoor-destination example is a possible coherent source story.

Follow the factual limits in `website-update-brief.md`. Captions should explain system behavior. Avoid unsupported claims about overall programming speed, better idea quality, less interruption, or equivalent ease of use.

## Assets Kevin should supply

Raw screenshots/recordings are enough. No editing or voice-over needed. For each paper, provide one coherent example, a one-sentence takeaway, and the exact action/output wording that should survive simplification. Export screenshots without adding baked-in captions; captions belong in HTML. Prefer original PNG frames or native-resolution recordings so we can crop before compression.

| Paper | Minimum useful inputs | Optional footage |
| --- | --- | --- |
| Codellaborator | One editor image with AI caret/status and one image with the local breakout; approve the prototype’s simplified docstring story or replace it | 15–25 seconds from trigger through intervention and follow-up |
| Cocoa | Plan with assignment controls, pause at a user step, output sidebar, and updated plan; the text of one short research task | 15–25 seconds showing assignment → run → user pause → edit → resume |
| ProMemAssist | Four frames: initial table task, reminder-relevant item, competing fridge/counting task, return; exact approved reminder/timing text | Prefer 12–20 seconds of one continuous scenario, with real-world context visible |
| IdeaSynth | Four crops from the same idea: starting facet/literature, feedback with a readable citation, variant, composed brief | Existing demo timestamps are sufficient to locate these frames |
| SemanticOn | Highlighted source content, condition tags, demonstrated extraction, refinement/output; use one example throughout | Existing demo timestamps are sufficient |

Existing publication video links: [Codellaborator](https://youtu.be/mI-jd-IjfE4), [ProMemAssist](https://youtu.be/Z2pjXKUZtMg), [IdeaSynth](https://youtu.be/QxDKICfCWg4), [SemanticOn](https://www.youtube.com/watch?v=NBnc2ToS_j0). Cocoa has no video link in the current data. Original media or figures can improve fidelity; no footage is needed to evaluate the included Codellaborator concept.

## Astro architecture

Use vanilla JavaScript/TypeScript and static Astro rendering. The repo currently has Astro and no UI framework; these demos do not justify adding React, an editor emulator, an animation library, a graph library, or an embedded video player.

Proposed structure:

```text
src/components/PaperDemo.astro       # generic static frame/fallback/controls
src/scripts/paper-demo.ts           # small loader and lifecycle management
src/scripts/demo-player.ts          # common stepping/play/pause
src/demos/types.ts                  # shared contract
src/demos/codellaborator.ts          # metadata, states, renderer; one file per demo
src/demos/cocoa.ts
src/demos/promemassist.ts
src/demos/ideasynth.ts
src/demos/semanticon.ts
public/assets/demos/<slug>/         # optimized media only
```

Use each publication slug as the lookup key. Discover `src/demos/*.ts` at build time rather than hand-maintaining switches in the layout. Server-side eager imports may render metadata, first scene, and transcript into HTML; browser imports must stay lazy. Keep modules import-safe: no top-level `window`, `document`, media fetches, or timers. Put browser behavior inside `mount(root)`.

```ts
// Browser loader: filenames must be literal glob matches for Vite.
const modules = import.meta.glob('../demos/*.ts');
const load = modules[`../demos/${id}.ts`];
// Call only after activation, cache the promise, then mount this instance.
// Do not use { eager: true } in browser code.
```

Recommended contract: `demo = { id, kind, summary, poster?, steps, transcript, render? }` plus `mount(root) => { act, pause, destroy }`. Use a discriminated union for `video`, `storyboard`, and `widget`; shared renderers cover media types, a paper may supply a small custom scene renderer. Each root owns its state and selectors. New paper = one module plus optional assets; the publication layout is unchanged. Serve static state and all transcript text even with JS disabled.

[Vite’s default glob imports produce lazy chunks](https://vite.dev/guide/features.html#glob-import). [Astro supports native custom elements and component scripts](https://docs.astro.build/en/guides/client-side-scripts/). Do **not** put `client:visible` on `PaperDemo.astro`: [client directives apply to directly imported framework components](https://docs.astro.build/en/reference/directives-reference/#client-directives), not Astro/native elements. A small custom-element loader or equivalent root-scoped script is sufficient.

### Repo-specific integration requirements

1. `PublicationCard.astro` currently wraps the entire card in a `<button>`. Convert the outer wrapper to `<article>` and give the citation an explicit details link/button; put the demo beside it. Never nest controls inside another button.
2. `PaperDetailOverlays.astro` currently binds to every `[data-slug]`, including descendant elements. Narrow this to explicit `[data-open-paper]` triggers, and use a distinct `[data-demo-id]` for demos. Ensure both click and keyboard handlers ignore unrelated interactive descendants. Prefer native button activation rather than a second Enter/Space click emulation.
3. Current selected cards occupy a 340px column. Prefer wider selected-work rows for these mini-interfaces. If Claude retains the compact column, use posters there and full demos in details; do not squeeze a desktop UI into the column.
4. Hidden paper overlays must not fetch video or initialize all demos. If used, opening a detail can activate its shell; closing it must pause it. Complete accessible dialog focus handling, background `inert`, Escape, and return focus. Opacity/pointer-events alone do not hide background controls from keyboard users.
5. Initialization must be idempotent. The existing overlay code moves elements to `document.body`; connection callbacks may fire again. On disconnect/navigation, cancel timers, disconnect observers, remove listeners, and dispose the controller; create fresh state on reconnect. Support `astro:after-swap` if that navigation mode remains.
6. GitHub Pages remains a static build. No APIs, runtime services, credentials, or backend are needed.

## Performance and accessibility acceptance criteria

The following are **engineering targets**, not measured current-site metrics:

| Resource | Target |
| --- | --- |
| Shared demo loader + styles | ≤10 KB compressed across the page |
| Each scripted scene | ≤20 KB compressed, only on activation |
| One responsive poster | 30–60 KB; total five posters ≤300 KB |
| A screenshot sequence | ≤300 KB total per demo; request the current frame, then optionally the next after activation |
| Short muted video | Aim for ≤1 MB at roughly 720px wide, 15–24 fps; if illegible at that budget, use frames |
| Full homepage initial transfer | Aim for ≤750 KB compressed, ≤1 MB ceiling including fonts and visible images; measure with cache disabled |

- Serve first scenes as HTML or `<img loading="lazy" decoding="async" width height srcset sizes>` with a specific alt description of the visible scene. Do not use “paper image” as alt text. Keep an above-the-fold LCP image eager if necessary. Reserve media dimensions to prevent layout jumps.
- For video, withhold `src`/`<source>` until explicit activation. Add `muted`, `playsinline`, `preload="none"`; keep sound off, preferably remove the audio track entirely. `preload` alone is only a hint ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)). Catch playback failures and retain the poster/transcript. Avoid GIFs and first-paint YouTube iframes.
- A video does not support an image-style `alt`. Use a semantic poster image plus a visible caption and complete text walkthrough; include descriptive/caption tracks when the media content requires them. Explain meaningful silent action in text too.
- Use real buttons with visible focus; visible action words must occur in accessible names. Keep focus on controls as scenes change. No hover-only action, drag-only operation, keyboard trap, or active region nested inside a link/button. Target at least 44×44px controls.
- Give caption/state changes a concise `aria-live="polite"` announcement; do not announce animation frames. Mark fake cursor artwork decorative. Label AI-authored code in text as well as color.
- Under `prefers-reduced-motion: reduce`, use instant manual step changes and no autoplay/auto-advance, cursor travel, blinking or pulsing. Respond to preference changes during a session ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)).
- Provide persistent Pause during playback. Pause on page hiding, leaving the viewport, closing a detail, or navigating away; resume only on request. If multiple demos are possible, stop the earlier player when another starts. Hover/focus/scroll-started motion counts as automatic, and hover-out alone is not an adequate pause control ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).
- Verify 320px/360px/mobile and desktop, 200% zoom, light/dark themes, keyboard-only traversal, reduced motion, JS-disabled fallback, blocked module/media loading, and offscreen/tab-hidden pausing. Inspect the network waterfall to ensure inactive demos transfer no video/scene modules. Check contrast and conduct a screen-reader pass before publication.

## Included prototype and how to use it

Run from the repository root:

```sh
node research/paper-demos/build.mjs
python3 -m http.server 8765 --bind 127.0.0.1 --directory research/paper-demos
```

Then open `http://127.0.0.1:8765/`. Use HTTP; double-clicking the HTML as a `file:` URL will not reliably load JavaScript modules.

- `demos/codellaborator.js` owns all paper-specific copy, states, scene rendering, and transcript. Edit this file to change the example, then run the builder.
- `shell.html` is the generic frame. `build.mjs` discovers demo files and generates static first scenes and text alternatives. Astro will take over this build-time responsibility in production.
- `loader.js` is the only initial JS. `player.js` and the paper module load on the first enabled control activation. The paper module imports no external dependencies.
- `index.html` and `codellaborator.html` are generated output. Do not hand-edit them.
- `prototype.css` uses the repo palette with system fonts; map its tokens onto the live theme in the Astro integration.

Measured file sizes, without minification: initial HTML + CSS + loader **11,519 bytes raw / 4,221 bytes gzip**; activated player + paper content **6,748 bytes raw / 2,721 bytes gzip**. Entire working demo is approximately **18.3 KB raw / 6.9 KB gzip**, excluding response headers. Gzip figures are local estimates, not measured server transfer; the Python preview server serves uncompressed files.

The prototype uses no media, audio, external fonts, inference, or network calls beyond its local static files. Transitions are short; Play advances once and stops on the final state. Back/Next/Reset provide manual exploration. First scene and complete text remain in generated HTML without JS. Error UI preserves that fallback if importing fails.

Verification performed: JS syntax checks and static regeneration; browser activation with Enter and Space through all four states; Play/Pause; reverse stepping with focus retained when Back becomes unavailable; a 360px browser viewport with no horizontal overflow and 44px button heights. Preview server request logs confirmed HTML/CSS/loader first, then the paper module/player only after activation. Reduced-motion handling and automatic pause/cleanup were source-reviewed. These checks are not a complete screen-reader, cross-browser, or final homepage performance audit. The full production acceptance checks above belong to Claude’s integration pass.

Suggested next step for Claude: integrate **only this prototype** into the selected-paper treatment, using the shared contract and trigger fixes above. Review the resulting desktop/mobile card with Kevin before producing Cocoa and assembling the footage-dependent stories.
