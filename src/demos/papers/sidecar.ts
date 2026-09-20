import type { DemoContext, DemoController, PaperDemo } from '../types';
import { esc } from '../types';

/**
 * Sidecar — a parallel assistant for the micro-waits inside an agent run.
 *
 * The main agent keeps working on the left; Sidecar floats beside it, reads
 * the run, and gives the person something to do with the wait: decisions the
 * agent made that are worth a second look, threads worth exploring, a chat
 * that stays in the panel, and a way to stage what comes out of it back into
 * the main agent.
 *
 * The whole point is that the main agent never stops, so its trace keeps
 * ticking over for as long as the demo is on screen — slowly, and behind the
 * panel, because the wait is the backdrop and not the subject.
 *
 * The scripted run is driven by a pointer that moves between real elements
 * and clicks them, so what it demonstrates and what a visitor can do by hand
 * are the same code path.
 *
 * This is an illustrative reconstruction of the interface. It reports no
 * result, and in particular makes no claim about what Sidecar did to anyone's
 * workload or experience. See the "Claims that must not appear on the site"
 * section of _new_material/website-update-brief.md.
 */

const PROMPT = 'Build a potluck dashboard that assigns dishes to guests';

/**
 * The main agent's trace. It cycles, because the run outlasts the visit — so
 * the list ends somewhere a loop back to the top reads as another pass rather
 * than as a glitch.
 */
const TRACES = [
  'reading project files…',
  'choosing an allocation strategy…',
  'writing assign_dishes()…',
  'running tests…',
  '2 of 9 tests failing…',
  'revising the allocation…',
  'building the menu view…',
  'wiring the dish cards…',
  'checking serving counts…',
  'revising the plan…',
];

const CODE = [
  { t: 'def ', c: 'kw' }, { t: 'assign_dishes', c: 'fn' }, { t: '(people, dishes):', c: '' },
];

const STACKS = {
  decision: 'The agent chose random assignment',
  explore: 'Dietary restrictions and allergen tracking',
};

const DRAFT =
  'Add an allergen check to every dish card: flag a conflict when a dish’s ' +
  'ingredients match a guest’s restriction.';

const ASK_TEXT = 'draft a prompt from this';

// --- artwork -----------------------------------------------------------------

const ICONS: Record<string, string> = {
  send: `<path d="M20.5 3.5 10.8 13.2"/><path d="M20.5 3.5l-6.2 17-3.5-7.3-7.3-3.5z"/>`,
  expand: `<path d="M14.4 4.2h5.4v5.4"/><path d="M9.6 19.8H4.2v-5.4"/>
    <path d="M19.8 4.2 13.4 10.6"/><path d="M4.2 19.8l6.4-6.4"/>`,
  spark: `<path d="M12 3.2l1.9 4.9 4.9 1.9-4.9 1.9L12 16.8l-1.9-4.9L5.2 10l4.9-1.9z"/>
    <path d="M18.4 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`,
  image: `<rect x="3.4" y="4.8" width="17.2" height="14.4" rx="2.4"/>
    <circle cx="8.6" cy="9.8" r="1.5"/><path d="M3.8 16.6 9 11.8l3.6 3.4 3-2.6 4.6 4"/>`,
  warn: `<path d="M12 3.6 22 20.4H2z"/><path d="M12 9.6v4.8"/>
    <circle cx="12" cy="17.6" r="0.9" fill="currentColor" stroke="none"/>`,
  bowl: `<path d="M3 10.4h18"/><path d="M4.4 10.4c.4 4.4 3.6 7.6 7.6 7.6s7.2-3.2 7.6-7.6"/>
    <path d="M9 7.2c0-1.2 1.4-1.6 1.4-3"/><path d="M13.4 7.2c0-1.2 1.4-1.6 1.4-3"/>`,
  arrow: `<path d="M4.6 12h14"/><path d="M13.2 6.6 18.6 12l-5.4 5.4"/>`,
  paperclip: `<path d="M20 11.2 11.4 19.8a5.2 5.2 0 0 1-7.4-7.4l8.8-8.8a3.5 3.5 0 0 1 4.9 4.9l-8.7 8.7a1.8 1.8 0 0 1-2.5-2.5l8-8"/>`,
  close: `<path d="M6 6 18 18"/><path d="M18 6 6 18"/>`,
};

function icon(name: string, cls = ''): string {
  return `<svg class="sc-icon ${cls}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** The pointer that drives the scripted run, drawn rather than fetched. */
function cursor(): string {
  return `<span class="sc-cursor" data-cursor aria-hidden="true">
    <svg viewBox="0 0 24 24"><path d="M5 2.6 19.2 12.2l-6.2.9-3.1 5.7z"/></svg>
    <span class="sc-cursor-ring"></span>
  </span>`;
}

// --- chat cards --------------------------------------------------------------
// Built by the same functions the runtime uses, so the static scene and the
// live panel cannot drift apart.

function decisionCard(): string {
  return `<li class="sc-card sc-card--decision" data-chat="decision">
    <span class="sc-card-kind">Decision</span>
    <p class="sc-card-title">${esc(STACKS.decision)}</p>
    <span class="sc-card-sub">Agent’s reasoning ·</span>
    <code class="sc-card-code">random.shuffle(dishes) — no category or dietary constraint</code>
    <span class="sc-fake-input">why / what instead…</span>
    <span class="sc-card-acts">
      <button class="sc-mini sc-mini--ok" type="button" data-act="decision-ok">OK</button>
      <button class="sc-mini" type="button" data-act="decision-flag">Flag</button>
      <button class="sc-mini" type="button" data-act="decision-dismiss">Dismiss</button>
      <span class="sc-reviewed" data-reviewed>Reviewed</span>
    </span>
  </li>`;
}

function exploreCard(): string {
  return `<li class="sc-card sc-card--explore" data-chat="explore">
    <span class="sc-card-kind">Explore</span>
    <p class="sc-card-title">${esc(STACKS.explore)}</p>
    <p class="sc-card-body">The plan assigns dishes and shows the menu, but nothing
      accommodates allergies or dietary preferences.</p>
    <span class="sc-card-sub">Your prompt ·</span>
    <span class="sc-chips">
      <span class="sc-chip">Add dietary tags</span>
      <span class="sc-chip">Keep scope simple</span>
      <button class="sc-vis" type="button" data-act="visualise"
              aria-label="Visualise this as a UI concept">${icon('image')}Visualise</button>
    </span>
  </li>`;
}

/**
 * The panel generates an image here. Rather than ship a picture, the mockup is
 * drawn in markup and mounted in a frame that reads as one — matted, centred
 * and captioned — so it costs no network and themes with the page.
 */
function mockCard(): string {
  return `<li class="sc-card sc-card--mock" data-chat="mock">
    <span class="sc-card-kind sc-card-kind--img">${icon('image')}Generated image</span>
    <figure class="sc-shot">
      <div class="sc-mock">
        <span class="sc-mock-bar">Potluck Dashboard</span>
        <div class="sc-dish">
          <span class="sc-dish-head">${icon('bowl')}<b>Spicy Thai Noodles</b></span>
          <span class="sc-dish-row"><i class="sc-av">S</i>Assigned to Sarah M.</span>
          <span class="sc-dish-row sc-dish-row--alert">${icon('warn')}Contains peanuts</span>
          <span class="sc-conflict">${icon('warn')}Allergen conflict</span>
          <span class="sc-dish-row sc-dish-row--meta">Serves 8–10 · Main dish</span>
        </div>
      </div>
      <figcaption class="sc-mock-cap">UI concept: an allergen conflict warning on dish cards.</figcaption>
    </figure>
    <span class="sc-card-acts">
      <button class="sc-mini sc-mini--go" type="button" data-act="mock-send">${icon('arrow')}Send</button>
      <button class="sc-mini sc-mini--go" type="button" data-act="mock-attach">${icon('paperclip')}Attach</button>
    </span>
  </li>`;
}

function userMsg(text: string): string {
  return `<li class="sc-msg sc-msg--you" data-chat="ask">${esc(text)}</li>`;
}

function draftCard(): string {
  return `<li class="sc-card sc-card--draft" data-chat="draft">
    <span class="sc-card-kind sc-card-kind--queue">Queued — main agent is busy</span>
    <p class="sc-card-body sc-card-body--draft">${esc(DRAFT)}</p>
    <span class="sc-card-acts">
      <button class="sc-mini sc-mini--go" type="button" data-act="stage">${icon('arrow')}Send to main agent</button>
      <button class="sc-mini" type="button" data-act="draft-dismiss">${icon('close')}</button>
    </span>
  </li>`;
}

function scene(): string {
  // `done` rather than `idle`: the run is revealed a beat at a time, so a
  // visitor without JavaScript would otherwise get an empty frame. The frame's
  // inline script rewinds it before paint. See PaperDemo.astro.
  return `<div class="sc" data-sc data-stage="done">

  <section class="sc-main" aria-label="The main agent's run">
    <p class="sc-prompt-sent">${esc(PROMPT)}</p>

    <ul class="sc-traces" data-traces>
      ${TRACES.slice(0, 4).map(t => `<li class="sc-trace">${esc(t)}</li>`).join('')}
    </ul>

    <pre class="sc-code" data-code><code><span class="sc-t-kw">def</span> <span class="sc-t-fn">assign_dishes</span>(people, dishes):
    <span class="sc-t-fn">random</span>.shuffle(dishes)
    <span class="sc-t-kw">return</span> zip(people, dishes)
<span class="sc-t-com"># no dietary check</span></code></pre>

    <p class="sc-changed" data-changed>214 lines of code changed</p>

    <div class="sc-compose">
      <span class="sc-compose-input">Your next prompt…</span>
      ${icon('send', 'sc-compose-send')}
    </div>

    <p class="sc-staged" data-staged data-on="true">${esc(DRAFT)}</p>
  </section>

  <aside class="sc-panel" data-panel aria-label="Sidecar">
    <header class="sc-panel-head">
      <span class="sc-live" aria-hidden="true"></span>
      <span class="sc-panel-title">Ask while you wait</span>
      ${icon('expand', 'sc-panel-expand')}
    </header>

    <ol class="sc-chat" data-chat-log>
      ${decisionCard()}${exploreCard()}${mockCard()}${userMsg(ASK_TEXT)}${draftCard()}
    </ol>

    <form class="sc-ask" data-ask>
      <input class="sc-ask-input" data-ask-input type="text" autocomplete="off"
             placeholder="Ask me — stays in this panel"
             aria-label="Ask Sidecar. Stays in this panel." />
      <button class="sc-ask-go" type="submit">Ask</button>
    </form>

    <div class="sc-stacks">
      <section class="sc-stack sc-stack--review">
        <h5 class="sc-stack-head">Decisions worth reviewing</h5>
        <button class="sc-item" type="button" data-item="decision">${esc(STACKS.decision)}</button>
      </section>
      <section class="sc-stack sc-stack--explore">
        <h5 class="sc-stack-head">Worth exploring</h5>
        <button class="sc-item" type="button" data-item="explore">${esc(STACKS.explore)}</button>
      </section>
    </div>
  </aside>

  ${cursor()}
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const sc = q<HTMLElement>('[data-sc]');
  const traces = q<HTMLElement>('[data-traces]');
  const chat = q<HTMLElement>('[data-chat-log]');
  const askForm = q<HTMLFormElement>('[data-ask]');
  const askInput = q<HTMLInputElement>('[data-ask-input]');
  const staged = q<HTMLElement>('[data-staged]');
  const pointer = q<HTMLElement>('[data-cursor]');

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };

  let timers: number[] = [];
  let running = false;
  let paused = false;
  let finished = false;
  let traceTimer = 0;
  let traceAt = 0;
  /** The panel's reply to a question. Not part of the scripted run, so
   *  pausing the run does not swallow an answer the visitor asked for. */
  let replyTimer = 0;

  const clearTimers = () => {
    timers.forEach(t => window.clearTimeout(t));
    timers = [];
  };

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      if (paused || aborter.signal.aborted) return;
      timers.push(window.setTimeout(resolve, ms));
    });

  const setStage = (stage: string) => { sc.dataset.stage = stage; };
  const stopped = () => paused || aborter.signal.aborted;

  // --- the main agent's run -------------------------------------------------

  /**
   * The trace never finishes. It keeps a short window of lines so the panel
   * beside it does not have to compete with a growing column, and runs at a
   * pace that reads as "still working" rather than as something to watch.
   */
  function tickTrace() {
    const line = document.createElement('li');
    line.className = 'sc-trace sc-trace--new';
    line.textContent = TRACES[traceAt % TRACES.length];
    traceAt += 1;
    traces.appendChild(line);
    requestAnimationFrame(() => line.classList.remove('sc-trace--new'));
    while (traces.children.length > 4) traces.removeChild(traces.firstElementChild!);
  }

  function startTrace() {
    if (traceTimer || ctx.reducedMotion) return;
    traceTimer = window.setInterval(tickTrace, 2400);
  }

  function stopTrace() {
    window.clearInterval(traceTimer);
    traceTimer = 0;
  }

  // --- the pointer ----------------------------------------------------------

  /** Moves the drawn pointer onto an element and, optionally, clicks it. */
  async function point(target: HTMLElement | null, { click = true } = {}) {
    if (!target || ctx.reducedMotion) return;
    const box = sc.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    pointer.dataset.on = 'true';
    pointer.style.transform =
      `translate(${r.left + r.width * 0.42 - box.left}px, ${r.top + r.height * 0.55 - box.top}px)`;
    await wait(720);
    if (stopped() || !click) return;
    pointer.dataset.click = 'true';
    await wait(240);
    pointer.dataset.click = 'false';
  }

  // --- the panel ------------------------------------------------------------

  const BUILDERS: Record<string, () => string> = {
    decision: decisionCard,
    explore: exploreCard,
    mock: mockCard,
    draft: draftCard,
  };

  function push(kind: string, html?: string) {
    if (chat.querySelector(`[data-chat="${kind}"]`)) return;
    chat.insertAdjacentHTML('beforeend', html ?? BUILDERS[kind]());
    const added = chat.lastElementChild as HTMLElement;
    added.classList.add('is-new');
    requestAnimationFrame(() => added.classList.remove('is-new'));
    chat.scrollTop = chat.scrollHeight;
  }

  function openItem(kind: 'decision' | 'explore') {
    push(kind);
    root.querySelector<HTMLElement>(`[data-item="${kind}"]`)?.setAttribute('data-used', 'true');
    ctx.announce(kind === 'decision'
      ? 'Opened the decision: the agent chose random assignment, with its reasoning.'
      : 'Opened the thread to explore: dietary restrictions and allergen tracking.');
  }

  function stagePrompt() {
    staged.dataset.on = 'true';
    ctx.announce('Queued for the main agent: ' + DRAFT);
  }

  root.addEventListener('click', event => {
    const target = event.target as Element;

    const item = target.closest<HTMLElement>('[data-item]');
    if (item?.dataset.item) {
      openItem(item.dataset.item as 'decision' | 'explore');
      return;
    }

    const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;

    if (act === 'visualise') {
      push('mock');
      ctx.announce('Sidecar drew a UI concept for the allergen warning.');
      return;
    }
    if (act === 'decision-ok' || act === 'decision-flag') {
      const card = chat.querySelector<HTMLElement>('[data-chat="decision"]');
      if (card) card.dataset.reviewed = act === 'decision-ok' ? 'ok' : 'flagged';
      ctx.announce(act === 'decision-ok' ? 'Decision marked reviewed.' : 'Decision flagged.');
      return;
    }
    if (act === 'stage') {
      stagePrompt();
      return;
    }
    if (act === 'mock-send' || act === 'mock-attach') {
      stagePrompt();
      ctx.announce('Sent to the main agent as context.');
      return;
    }
    if (act === 'decision-dismiss' || act === 'draft-dismiss') {
      chat.querySelector(`[data-chat="${act === 'decision-dismiss' ? 'decision' : 'draft'}"]`)?.remove();
      return;
    }
  }, listen);

  askForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = askInput.value.trim();
    if (!text) return;
    askInput.value = '';
    push('ask', userMsg(text));
    window.clearTimeout(replyTimer);
    replyTimer = window.setTimeout(() => {
      push('draft');
      ctx.announce('Sidecar drafted a prompt, queued for the main agent.');
    }, 520);
  }, listen);

  // --- the scripted run -----------------------------------------------------

  /** Types into the panel's own input, so the ask reads as an ask. */
  async function typeAsk(text: string) {
    for (let c = 1; c <= text.length; c++) {
      if (stopped()) return;
      askInput.value = text.slice(0, c);
      await wait(c % 4 === 0 ? 40 : 22);
    }
  }

  function settle() {
    running = false;
    finished = true;
    ctx.setRunning(false);
    setStage('done');
    pointer.dataset.on = 'false';
  }

  function resetScene() {
    window.clearTimeout(replyTimer);
    chat.innerHTML = '';
    traces.innerHTML = '';
    traceAt = 0;
    askInput.value = '';
    staged.dataset.on = 'false';
    pointer.dataset.on = 'false';
    pointer.dataset.click = 'false';
    root.querySelectorAll<HTMLElement>('[data-item]').forEach(el => {
      el.removeAttribute('data-used');
    });
  }

  const el = (sel: string) => root.querySelector<HTMLElement>(sel);

  async function run() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    if (ctx.reducedMotion) {
      traces.innerHTML = TRACES.slice(0, 4)
        .map(t => `<li class="sc-trace">${esc(t)}</li>`).join('');
      chat.innerHTML = decisionCard() + exploreCard() + mockCard() + userMsg(ASK_TEXT) + draftCard();
      const card = chat.querySelector<HTMLElement>('[data-chat="decision"]');
      if (card) card.dataset.reviewed = 'ok';
      staged.dataset.on = 'true';
      ctx.announce(
        'The main agent is running. Sidecar has surfaced a decision and a thread ' +
        'to explore, drawn a UI concept, and drafted a prompt queued for the agent.'
      );
      settle();
      return;
    }

    setStage('prompt');
    ctx.announce('The prompt goes to the main agent.');
    await wait(900);
    if (stopped()) return;

    setStage('traces');
    tickTrace();
    startTrace();
    ctx.announce('The agent starts working. Sidecar opens beside it.');
    await wait(2000);
    if (stopped()) return;

    setStage('stacks');
    ctx.announce('Sidecar surfaces a decision worth reviewing and a thread worth exploring.');
    await wait(1700);
    if (stopped()) return;

    setStage('act');
    await point(el('[data-item="decision"]'));
    if (stopped()) return;
    openItem('decision');
    await wait(1500);
    if (stopped()) return;

    await point(el('[data-act="decision-ok"]'));
    if (stopped()) return;
    const card = chat.querySelector<HTMLElement>('[data-chat="decision"]');
    if (card) card.dataset.reviewed = 'ok';
    ctx.announce('Decision marked reviewed.');
    await wait(900);
    if (stopped()) return;

    await point(el('[data-item="explore"]'));
    if (stopped()) return;
    openItem('explore');
    await wait(1500);
    if (stopped()) return;

    await point(el('[data-act="visualise"]'));
    if (stopped()) return;
    push('mock');
    ctx.announce('Sidecar draws a UI concept for the allergen warning.');
    await wait(1800);
    if (stopped()) return;

    await point(askInput, { click: false });
    if (stopped()) return;
    await typeAsk(ASK_TEXT);
    if (stopped()) return;
    await point(el('.sc-ask-go'));
    if (stopped()) return;
    askInput.value = '';
    push('ask', userMsg(ASK_TEXT));
    await wait(700);
    if (stopped()) return;

    push('draft');
    ctx.announce('Sidecar drafts a prompt, queued because the main agent is busy.');
    await wait(1500);
    if (stopped()) return;

    await point(el('[data-act="stage"]'));
    if (stopped()) return;
    stagePrompt();
    await wait(1000);
    if (stopped()) return;

    settle();
  }

  /** The finished run, without having animated its way there. */
  function showEnd() {
    traces.innerHTML = TRACES.slice(0, 4)
      .map(t => `<li class="sc-trace">${esc(t)}</li>`).join('');
    traceAt = 4;
    chat.innerHTML = decisionCard() + exploreCard() + mockCard() + userMsg(ASK_TEXT) + draftCard();
    const card = chat.querySelector<HTMLElement>('[data-chat="decision"]');
    if (card) card.dataset.reviewed = 'ok';
    staged.dataset.on = 'true';
    setStage('done');
  }

  // At rest the run shows where it got to, which is what the static markup
  // already renders — so a visitor who only half-scrolls past sees the panel
  // at work rather than an empty frame. Playing rewinds it first. The trace
  // stays still until then: one demo animates at a time.
  showEnd();

  return {
    play() {
      if (running) return;
      // Already played: keep the agent's trace alive rather than replaying.
      if (finished) { startTrace(); return; }
      paused = false;
      setStage('idle');
      resetScene();
      void run();
    },
    reset() {
      clearTimers();
      stopTrace();
      paused = false;
      finished = false;
      setStage('idle');
      resetScene();
      ctx.announce('Demo reset.');
      void run();
    },
    pause() {
      paused = true;
      clearTimers();
      stopTrace();
      running = false;
      pointer.dataset.on = 'false';
      ctx.setRunning(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      startTrace();
      if (!finished) void run();
    },
    destroy() {
      clearTimers();
      stopTrace();
      window.clearTimeout(replyTimer);
      aborter.abort();
    },
  };
}

export const demo: PaperDemo = {
  id: 'sidecar',
  stageLabel:
    'A coding agent running a long task on the left — a prompt, a ticking trace, generated code and a line count — with a floating Sidecar panel on the right holding a chat that stays in the panel and, beneath it, stacks of decisions worth reviewing and threads worth exploring',
  hint: 'Open a decision or a thread, visualise one, or ask the panel for a prompt — the main agent keeps running either way.',
  transcript: [
    'A prompt goes to a coding agent: build a potluck dashboard that assigns dishes to guests. The agent starts working, and its trace keeps ticking over — reading files, choosing a strategy, writing code — for as long as the run lasts.',
    'Sidecar floats beside it. While the agent works, it reads the run and fills two stacks: decisions worth reviewing, and threads worth exploring.',
    'Opening the decision — the agent chose random assignment — shows the agent’s own reasoning, the line of code it rests on, and a box to ask why or what instead. It can be marked reviewed, flagged, or dismissed.',
    'Opening the thread to explore — dietary restrictions and allergen tracking — shows what the plan leaves out, with prompts to take it further.',
    'Visualising that thread draws a UI concept in the panel: a dish card that flags an allergen conflict when a dish’s ingredients match a guest’s restriction.',
    'Asking the panel for a prompt drafts one. It is queued rather than sent, because the main agent is still busy, and can be staged into the main agent when it is ready.',
    'Everything here happens in the panel. The main agent is never interrupted, and the run continues throughout.',
    'This is an illustrative reconstruction of the interface. It reports no result from the study.',
  ],
  scene,
  mount,
};
