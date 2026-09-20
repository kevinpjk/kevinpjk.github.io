import type { DemoContext, DemoController, PaperDemo } from '../types';
import { esc } from '../types';

/**
 * Cocoa — an interactive plan a researcher and an agent execute together,
 * a step at a time, the way cells run in a computational notebook.
 *
 * A reconstruction of the plan and sidebar from Figure 2, simplified to three
 * cells. The figure's toolbar and surrounding document are left out: the plan
 * and the sidebar beside it are what the interaction is about.
 *
 * Each cell is assigned to the agent or to the researcher, and the assignment
 * is the point — so the toggle is live, the cell output opens in the sidebar,
 * and the cell that asks for guidance takes it. The sidebar is editable, as in
 * the figure's (D) and (E): a paper the agent did not find can be added to the
 * step's output, then kept or discarded.
 *
 * The greyed bars stand in for body text, as the paper's own figure does. The
 * one full citation in the sidebar is the one the figure itself shows, and the
 * other two entries name systems the figure names, with nothing else asserted
 * about them. Nothing here reports a finding from the study. See the "Claims
 * that must not appear on the site" section of
 * _new_material/website-update-brief.md.
 */

type Owner = 'ai' | 'user';

interface CellDef {
  id: string;
  owner: Owner;
  text: string;
  /** What the cell says once it has run. */
  out?: string;
  /** The researcher's rewrite, typed in during the intro. */
  edit?: { keep: string; tail: string; out: string };
}

const CELLS: CellDef[] = [
  {
    id: 'topics',
    owner: 'ai',
    text: 'Generate topics relevant to eliciting human feedback',
    out: '10 topics, including HCI and adaptive control…',
  },
  {
    id: 'seed',
    owner: 'user',
    text: 'Identify papers that seed exploration in interactive feedback',
    out: '5 papers, including Guidelines for Human-AI Interaction…',
    edit: {
      keep: 'Identify papers that seed exploration in ',
      tail: 'mixed-initiative systems',
      out: '7 papers, re-sorted by relevance…',
    },
  },
  {
    id: 'connect',
    owner: 'ai',
    text: 'Suggest connections between feedback mechanisms and AI agents, grounded in literature',
  },
];

const TOPICS = ['Human-computer interaction', 'Adaptive control', 'Mixed-initiative systems'];
const TOPICS_MORE = 7;

/**
 * The sidebar's library. The full entry is the citation the paper's own figure
 * shows; the other two name systems it names, and claim nothing further.
 */
interface PaperDef {
  id: string;
  title: string;
  authors?: string;
  venue?: string;
  summary?: string;
  bars?: number;
}

const PAPERS: PaperDef[] = [
  {
    id: 'renaud',
    title: 'Feedback in human-computer interaction — characteristics and recommendations',
    authors: 'K. Renaud and R. Cooper (2000)',
    venue: 'South African Computer Journal • Computer Science',
    summary: 'Argues for graphical rather than textual feedback, and sets out the features an application should provide.',
  },
  { id: 'guidelines', title: 'Guidelines for Human-AI Interaction', bars: 2 },
  { id: 'constitution', title: 'ConstitutionMaker', bars: 2 },
];

const GUIDANCE_PROMPT = 'Which connection should I follow?';

// --- artwork -----------------------------------------------------------------
// Inline 24x24 line icons, stroked with currentColor.

const ICONS: Record<string, string> = {
  robot: `<rect x="3.6" y="8" width="16.8" height="11.4" rx="3"/>
    <path d="M12 8V4.6"/><circle cx="12" cy="3.4" r="1.3"/>
    <circle cx="8.8" cy="13.4" r="1.15"/><circle cx="15.2" cy="13.4" r="1.15"/>`,
  person: `<circle cx="12" cy="8" r="3.6"/>
    <path d="M5 20.4c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6"/>`,
  check: `<path d="M4.5 12.6 9.6 17.7 19.5 6.9"/>`,
  help: `<circle cx="12" cy="12" r="9"/>
    <path d="M9.4 9.4a2.7 2.7 0 1 1 3.4 2.6v1.6"/>
    <circle cx="12.6" cy="17" r="0.9" fill="currentColor" stroke="none"/>`,
  rerun: `<path d="M20.2 12a8.2 8.2 0 1 1-2.6-6"/><path d="M20.4 4.2v5h-5"/>`,
  collapse: `<path d="M5.5 5.5 18.5 18.5"/><path d="M18.5 5.5 5.5 18.5"/>`,
  trash: `<path d="M4.4 6.6h15.2"/><path d="M9.4 6.6V4.4h5.2v2.2"/>
    <path d="M6.6 6.6 7.6 20h8.8l1-13.4"/>`,
  save: `<path d="M4.6 4.6h11.2l3.6 3.6v11.2H4.6z"/>
    <path d="M8 4.6v5h7V4.6"/><path d="M8 19.4v-5.6h8v5.6"/>`,
  close: `<path d="M6 6 18 18"/><path d="M18 6 6 18"/>`,
  search: `<circle cx="10.6" cy="10.6" r="6.4"/><path d="M15.4 15.4 20.4 20.4"/>`,
  venue: `<path d="M4.4 4.4v15.2"/><path d="M8 4.4v15.2"/><path d="M12.2 4.6l5.6 14.6"/>`,
  lines: `<path d="M4.6 7h14.8"/><path d="M4.6 12h14.8"/><path d="M4.6 17h9.6"/>`,
  people: `<circle cx="9.4" cy="8.4" r="3.2"/>
    <path d="M3.6 19.4c0-3.1 2.6-5 5.8-5s5.8 1.9 5.8 5"/>
    <path d="M16.2 5.6a3.2 3.2 0 0 1 0 5.6"/><path d="M17.4 14.8c1.8.5 3 1.9 3 4.6"/>`,
};

function icon(name: string, cls = ''): string {
  return `<svg class="cc-icon ${cls}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** Grey stand-in bars, as the paper's figure uses for unelaborated text. */
function bars(count: number): string {
  const widths = [94, 72, 86, 58];
  let out = '<span class="cc-bars" aria-hidden="true">';
  for (let i = 0; i < count; i++) out += `<i style="width:${widths[i % widths.length]}%"></i>`;
  return out + '</span>';
}

/**
 * `final` renders the cell as the intro leaves it — the researcher's rewrite
 * applied, the last step handed back for guidance. The static scene uses it,
 * so a visitor without JavaScript sees the state the walkthrough describes;
 * the live demo rebuilds from the initial state and animates its way there.
 */
function cellMarkup(cell: CellDef, index: number, final = false): string {
  const edited = final && cell.edit;
  const asking = final && cell.id === 'connect';
  const owner = asking ? 'user' : cell.owner;
  const state = asking ? 'guidance' : 'done';
  const text = edited ? cell.edit!.keep + cell.edit!.tail : cell.text;
  const out = asking ? 'User guidance requested' : (edited ? cell.edit!.out : cell.out ?? '');

  return `<li class="cc-cell" data-cell="${cell.id}" data-owner="${owner}"
      data-state="${state}"${edited ? ' data-edited="true"' : ''} style="--i:${index}">
    <span class="cc-mark" aria-hidden="true">${icon('check', 'cc-mark-icon')}${icon('help', 'cc-mark-icon cc-mark-icon--help')}</span>

    <div class="cc-cell-main">
      <button class="cc-cell-text" type="button" data-open="${cell.id}"
              aria-label="Show this step's output in the sidebar">
        <span data-label="${cell.id}">${esc(text)}</span>
      </button>

      <p class="cc-out">
        <span class="cc-edited" data-edited="${cell.id}">Edited</span>
        <span class="cc-out-arrow" aria-hidden="true">↳</span>
        <span data-out="${cell.id}">${esc(out)}</span>
      </p>

      <form class="cc-guide" data-guide="${cell.id}">
        <input class="cc-guide-input" type="text" autocomplete="off"
               placeholder="${esc(GUIDANCE_PROMPT)}"
               aria-label="Give the agent guidance for this step" />
        <button class="cc-guide-send" type="submit">Send</button>
      </form>
    </div>

    <button class="cc-toggle" type="button" data-toggle="${cell.id}"
            role="switch" aria-checked="${owner === 'user'}"
            aria-label="Assign this step to the researcher instead of the agent">
      <span class="cc-knob">${icon('robot', 'cc-knob-ai')}${icon('person', 'cc-knob-user')}</span>
    </button>
  </li>`;
}

function paperMarkup(paper: PaperDef, added = false): string {
  return `<li class="cc-paper" data-paper="${paper.id}"${added ? ' data-added="true"' : ''}>
    <span class="cc-paper-title">${esc(paper.title)}</span>
    ${paper.authors ? `<span class="cc-paper-row">${icon('people')}<span>${esc(paper.authors)}</span></span>` : ''}
    ${paper.venue ? `<span class="cc-paper-row">${icon('venue')}<span>${esc(paper.venue)}</span></span>` : ''}
    ${paper.summary ? `<span class="cc-paper-row">${icon('lines')}<span>${esc(paper.summary)}</span></span>` : ''}
    ${paper.bars ? bars(paper.bars) : ''}
    ${added ? '<span class="cc-paper-tag">added by you</span>' : ''}
  </li>`;
}

function scene(): string {
  // `done` rather than `idle`: the plan is revealed a cell at a time, so a
  // visitor without JavaScript would otherwise get an empty frame. The frame's
  // inline script rewinds it before paint. See PaperDemo.astro.
  return `<div class="cc" data-cc data-stage="done">

  <section class="cc-plan">
    <p class="cc-step">
      <span class="cc-step-n">1.</span>
      What are new ways for AI agents to interactively elicit human feedback?
    </p>

    <div class="cc-tools" data-tools>
      <button class="cc-btn cc-btn--run" type="button" data-action="rerun">
        ${icon('rerun')}Update and run
      </button>
      <button class="cc-btn cc-btn--collapse" type="button" data-action="collapse">
        ${icon('collapse')}Collapse
      </button>
      <button class="cc-btn cc-btn--delete" type="button" data-action="delete">
        ${icon('trash')}Delete all
      </button>
      <span class="cc-keys">Cmd/Ctrl + ⏎ to add step</span>
    </div>

    <ol class="cc-cells" data-cells>${CELLS.map((c, i) => cellMarkup(c, i, true)).join('')}</ol>
    <p class="cc-empty" data-empty hidden>No steps. Update and run to rebuild the plan.</p>
  </section>

  <aside class="cc-side">
   <div class="cc-side-inner">
    <h4 class="cc-side-label"><span data-side-label>Topics, grounded in literature</span></h4>

    <div class="cc-side-body" data-side-body>
      <ul class="cc-topics" data-topics>
        ${TOPICS.map(t => `<li class="cc-topic">${esc(t)}</li>`).join('')}
        <li class="cc-topic cc-topic--more">+${TOPICS_MORE} more</li>
      </ul>
      <ul class="cc-papers" data-papers>${PAPERS.map(p => paperMarkup(p)).join('')}</ul>
    </div>

    <div class="cc-side-foot">
      <div class="cc-acts">
        <button class="cc-act cc-act--save" type="button" data-action="save">
          ${icon('save')}Save
        </button>
        <button class="cc-act cc-act--cancel" type="button" data-action="cancel">
          ${icon('close')}Cancel
        </button>
        <span class="cc-saved" data-saved hidden>Saved</span>
      </div>
      <form class="cc-search" data-search>
        <input class="cc-search-input" data-search-input type="text" autocomplete="off"
               placeholder="Search for papers…" aria-label="Add a paper the agent did not find" />
        <button class="cc-search-go" type="submit" aria-label="Add">${icon('search')}</button>
      </form>
    </div>
   </div>
  </aside>
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const cc = q<HTMLElement>('[data-cc]');
  const cells = q<HTMLElement>('[data-cells]');
  const empty = q<HTMLElement>('[data-empty]');
  const sideLabel = q<HTMLElement>('[data-side-label]');
  const topics = q<HTMLElement>('[data-topics]');
  const papers = q<HTMLElement>('[data-papers]');
  const saved = q<HTMLElement>('[data-saved]');
  const search = q<HTMLFormElement>('[data-search]');
  const searchInput = q<HTMLInputElement>('[data-search-input]');

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };

  let timers: number[] = [];
  let running = false;
  let paused = false;
  let finished = false;
  let added = 0;
  let opened = 'topics';

  const clearTimers = () => {
    timers.forEach(t => window.clearTimeout(t));
    timers = [];
  };

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      if (paused || aborter.signal.aborted) return;
      timers.push(window.setTimeout(resolve, ms));
    });

  const setStage = (stage: string) => { cc.dataset.stage = stage; };
  const cellEl = (id: string) => cells.querySelector<HTMLElement>(`[data-cell="${id}"]`);
  const labelEl = (id: string) => cells.querySelector<HTMLElement>(`[data-label="${id}"]`);
  const outEl = (id: string) => cells.querySelector<HTMLElement>(`[data-out="${id}"]`);

  // --- the sidebar ---------------------------------------------------------

  /**
   * Which step's output the sidebar is showing. Only the two steps that
   * gathered anything have papers to show; the third is still waiting on the
   * researcher, so the sidebar says so rather than showing a stale list.
   */
  const SIDE_LABEL: Record<string, string> = {
    topics: 'Topics, grounded in literature',
    seed: 'Papers for this step',
    connect: 'Waiting on your guidance',
  };

  function openCell(id: string, label?: string) {
    opened = id;
    // Deliberately not `data-open`: the cells' own buttons carry that, and a
    // `closest('[data-open]')` lookup from anywhere inside the demo would
    // then match this root and swallow every other click.
    cc.dataset.showing = id;
    sideLabel.textContent = label ?? SIDE_LABEL[id] ?? 'Output';
    topics.hidden = id !== 'topics';
    cells.querySelectorAll<HTMLElement>('.cc-cell').forEach(el => {
      el.classList.toggle('is-open', el.dataset.cell === id);
    });
    ctx.announce(`Sidebar showing: ${SIDE_LABEL[id] ?? 'output'}.`);
  }

  /** A paper the agent did not find, added by hand — the figure's (E). */
  function addPaper(title: string) {
    added += 1;
    papers.insertAdjacentHTML('beforeend', paperMarkup(
      { id: `added-${added}`, title, bars: 1 }, true,
    ));
    papers.scrollTop = papers.scrollHeight;
    ctx.announce(`Added ${title} to this step's output.`);
  }

  search.addEventListener('submit', event => {
    event.preventDefault();
    const text = searchInput.value.trim();
    if (!text) return;
    searchInput.value = '';
    addPaper(text);
  }, listen);

  // --- the plan ------------------------------------------------------------

  function setOwner(id: string, owner: Owner) {
    const el = cellEl(id);
    if (!el) return;
    el.dataset.owner = owner;
    el.querySelector('[data-toggle]')?.setAttribute('aria-checked', String(owner === 'user'));
  }

  function restoreCells() {
    cells.innerHTML = CELLS.map(cellMarkup).join('');
    cells.hidden = false;
    empty.hidden = true;
    added = 0;
  }

  root.addEventListener('click', event => {
    const target = event.target as Element;

    const toggle = target.closest<HTMLElement>('[data-toggle]');
    if (toggle?.dataset.toggle) {
      const el = cellEl(toggle.dataset.toggle);
      const next: Owner = el?.dataset.owner === 'user' ? 'ai' : 'user';
      setOwner(toggle.dataset.toggle, next);
      ctx.announce(next === 'user' ? 'Assigned to you.' : 'Assigned to the agent.');
      return;
    }

    const open = target.closest<HTMLElement>('[data-open]');
    if (open?.dataset.open) {
      openCell(open.dataset.open);
      return;
    }

    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'rerun') {
      restoreCells();
      clearTimers();
      paused = false;
      finished = false;
      setStage('idle');
      void run();
      return;
    }
    if (action === 'collapse') {
      const collapsed = cc.dataset.collapsed === 'true';
      cc.dataset.collapsed = String(!collapsed);
      ctx.announce(collapsed ? 'Steps expanded.' : 'Steps collapsed.');
      return;
    }
    if (action === 'delete') {
      cells.innerHTML = '';
      cells.hidden = true;
      empty.hidden = false;
      ctx.announce('All steps deleted. Update and run rebuilds the plan.');
      return;
    }
    if (action === 'save') {
      papers.querySelectorAll<HTMLElement>('[data-added]').forEach(el => {
        el.dataset.saved = 'true';
      });
      saved.hidden = false;
      timers.push(window.setTimeout(() => { saved.hidden = true; }, 1600));
      ctx.announce('Saved to this step.');
      return;
    }
    if (action === 'cancel') {
      // Only what has not been kept yet: Cancel discards this round of edits,
      // it does not undo a save.
      papers.querySelectorAll<HTMLElement>('[data-added]:not([data-saved])')
        .forEach(el => el.remove());
      searchInput.value = '';
      ctx.announce('Discarded unsaved additions.');
      return;
    }
  }, listen);

  /** The cell that asked for guidance takes it, and stops asking. */
  cells.addEventListener('submit', event => {
    const form = (event.target as Element).closest<HTMLFormElement>('[data-guide]');
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('.cc-guide-input')!;
    const text = input.value.trim();
    if (!text) return;
    const id = form.dataset.guide!;
    input.value = '';
    const el = cellEl(id);
    if (el) el.dataset.state = 'done';
    const out = outEl(id);
    if (out) out.textContent = `Guidance received: ${text}`;
    openCell(id, 'Guidance recorded');
    ctx.announce(`Guidance sent: ${text}`);
  }, listen);

  // --- the automated sequence ----------------------------------------------

  /** Types the researcher's rewrite in, so the edit reads as an edit. */
  async function typeEdit(id: string, keep: string, tail: string) {
    const label = labelEl(id);
    if (!label) return;
    label.textContent = keep;
    for (let c = 1; c <= tail.length; c++) {
      if (paused || aborter.signal.aborted) return;
      label.textContent = keep + tail.slice(0, c);
      await wait(c % 5 === 0 ? 34 : 18);
    }
  }

  function settle() {
    running = false;
    finished = true;
    ctx.setRunning(false);
    setStage('done');
  }

  function resetScene() {
    restoreCells();
    cc.dataset.collapsed = 'false';
    papers.querySelectorAll<HTMLElement>('[data-added]').forEach(el => el.remove());
    searchInput.value = '';
    saved.hidden = true;
    CELLS.forEach(c => setOwner(c.id, c.owner));
    openCell('topics');
  }

  async function run() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    const seed = CELLS[1];
    const connect = CELLS[2];

    if (ctx.reducedMotion) {
      if (seed.edit) {
        labelEl(seed.id)!.textContent = seed.edit.keep + seed.edit.tail;
        outEl(seed.id)!.textContent = seed.edit.out;
        cellEl(seed.id)!.dataset.edited = 'true';
      }
      setOwner(connect.id, 'user');
      cellEl(connect.id)!.dataset.state = 'guidance';
      outEl(connect.id)!.textContent = 'User guidance requested';
      setStage('done');
      ctx.announce(
        'A three-step plan. The agent generated topics, the researcher rewrote ' +
        'the second step, and the agent is asking for guidance on the third.'
      );
      settle();
      return;
    }

    setStage('head');
    ctx.announce('A plan step, with its controls.');
    await wait(900);
    if (paused || aborter.signal.aborted) return;

    setStage('run1');
    openCell('topics');
    ctx.announce('The agent runs the first step and generates topics.');
    await wait(900);
    if (paused || aborter.signal.aborted) return;

    setStage('papers');
    ctx.announce('The topics are grounded in papers, shown in the sidebar.');
    await wait(1700);
    if (paused || aborter.signal.aborted) return;

    setStage('run2');
    ctx.announce('A second step, this one assigned to the researcher.');
    await wait(1200);
    if (paused || aborter.signal.aborted) return;

    setStage('edit2');
    cellEl(seed.id)!.dataset.editing = 'true';
    ctx.announce('The researcher rewrites the step to follow a different direction.');
    if (seed.edit) {
      await typeEdit(seed.id, seed.edit.keep, seed.edit.tail);
      if (paused || aborter.signal.aborted) return;
      cellEl(seed.id)!.dataset.editing = 'false';
      cellEl(seed.id)!.dataset.edited = 'true';
      outEl(seed.id)!.textContent = seed.edit.out;
    }
    openCell(seed.id);
    await wait(1200);
    if (paused || aborter.signal.aborted) return;

    setStage('run3');
    ctx.announce('A third step, assigned to the agent.');
    await wait(1400);
    if (paused || aborter.signal.aborted) return;

    setStage('guide');
    setOwner(connect.id, 'user');
    cellEl(connect.id)!.dataset.state = 'guidance';
    outEl(connect.id)!.textContent = 'User guidance requested';
    openCell(connect.id);
    ctx.announce('The agent hands the third step back and asks for guidance.');
    await wait(900);
    if (paused || aborter.signal.aborted) return;

    settle();
  }

  setStage('idle');
  resetScene();

  return {
    play() {
      if (running || finished) return;
      paused = false;
      void run();
    },
    reset() {
      clearTimers();
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
      running = false;
      ctx.setRunning(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (!finished) void run();
    },
    destroy() {
      clearTimers();
      aborter.abort();
    },
  };
}

export const demo: PaperDemo = {
  id: 'cocoa',
  stageLabel:
    'An interactive plan: one research question with three steps beneath it, each assigned by a toggle to either the AI agent or the researcher, beside a sidebar showing the selected step’s output as literature the agent grounded it in, which the researcher can add to',
  hint: 'Flip a step between the agent and yourself, open one to see its output, or answer the step that is asking for guidance.',
  transcript: [
    'A research question — what are new ways for AI agents to interactively elicit human feedback? — is followed by a plan of steps that run like cells in a notebook, with controls to update and run the plan, collapse it, or delete every step.',
    'The first step is assigned to the agent: generate topics relevant to eliciting human feedback. It returns ten topics, and the sidebar shows the topics alongside the papers they are grounded in.',
    'The second step is assigned to the researcher instead. They rewrite it to seed exploration in mixed-initiative systems rather than in interactive feedback generally, and the step is marked as edited.',
    'The third step is assigned to the agent, which hands it back: rather than guess, it turns amber and asks the researcher for guidance.',
    'Every step’s toggle is live: a step can be reassigned between the agent and the researcher at any time. Selecting a step opens its output in the sidebar.',
    'The sidebar is editable. A paper the agent did not find can be searched for and added to the step’s output, then kept or discarded.',
    'The step asking for guidance takes an answer, and records it as its output.',
    'This is an illustrative reconstruction of the interface. It reports no result from the study.',
  ],
  scene,
  mount,
};
