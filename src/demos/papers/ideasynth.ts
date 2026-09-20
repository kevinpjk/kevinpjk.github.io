import type { DemoContext, DemoController, PaperDemo } from '../types';
import { esc } from '../types';

/**
 * IdeaSynth — developing a research idea as a canvas of idea facets, with
 * feedback grounded in a collected literature library.
 *
 * A reconstruction of the node canvas in Figure 4: two layers of facet nodes
 * (research questions above, proposed designs below), edges between them that
 * carry an expandable verdict on how well the two facets fit, an AI suggestion
 * panel on one node per layer citing a paper from the library, and a rail on
 * the left holding the collected papers and a question box over them.
 *
 * The canvas is live rather than a picture of one: nodes can be selected,
 * suggestions dragged out to become new nodes, and nodes connected to each
 * other. Only the three scripted edges carry a connection verdict; edges the
 * visitor draws are left plain, because the verdict would have to be invented.
 *
 * The greyed bars stand in for body text, exactly as the paper's own figure
 * does, and the question box answers with the same placeholder. Nothing here
 * reports a finding: the two paper titles are the ones the figure itself
 * shows, and the verdicts are the system speaking inside a scenario, not a
 * measured result. See the "Claims that must not appear on the site" section
 * of _new_material/website-update-brief.md.
 */

type Facet = 'rq' | 'design' | 'eval' | 'impact';

const FACET_LABEL: Record<Facet, string> = {
  rq: 'Problem Description & RQ',
  design: 'Proposed Design & Solution',
  eval: 'Evaluation Method',
  impact: 'Contribution & Impact',
};

interface Suggestion {
  facet: Facet;
  title: string;
  note: string;
}

interface NodeDef {
  id: string;
  facet: Facet;
  title: string;
  /** Real body copy, on the nodes the scenario is actually about. */
  body?: string;
  /** Placeholder bars, as in the paper's figure, for the rest. */
  bars?: number;
  /** Position and width, as a percentage of the canvas. */
  x: number;
  y: number;
  w: number;
  /** Which stage reveals this node. */
  layer: 'top' | 'bottom';
  /** Literature-grounded feedback, and the stage that types it in. */
  ai?: { stage: 'suggest' | 'assist'; text: string; paper: string };
  /** Offered when the node's caret is opened. */
  suggestions?: Suggestion[];
}

const NODES: NodeDef[] = [
  {
    id: 'rq-characters',
    facet: 'rq',
    layer: 'top',
    title: 'Using AI to generate interesting fictional characters',
    body: 'What kind of feedback helps a writer develop a character?',
    x: 4, y: 1, w: 45,
    ai: {
      stage: 'suggest',
      text: 'Could you specify what kind of feedback mechanism you have in mind?',
      paper: 'Social Dynamics of AI Support in Creative Writing',
    },
    suggestions: [
      {
        facet: 'design',
        title: 'Writer-in-the-loop revision history',
        note: 'Keeps the writer’s edits visible alongside the AI’s.',
      },
      {
        facet: 'rq',
        title: 'Which parts of a character do writers want to own?',
        note: 'Separates the authorship question from the generation one.',
      },
    ],
  },
  {
    id: 'rq-authorship',
    facet: 'rq',
    layer: 'top',
    title: 'Balancing AI creativity and authorship',
    bars: 3,
    x: 52, y: 1, w: 46,
  },
  {
    id: 'design-editor',
    facet: 'design',
    layer: 'bottom',
    title: 'Interactive AI-driven Character Editor',
    body: 'Writers revise the AI’s characters inline.',
    x: 4, y: 50, w: 30,
    ai: {
      stage: 'assist',
      text: 'Rate each suggestion as you revise it',
      paper: 'AI as an Active Writer (2023)',
    },
    suggestions: [
      {
        facet: 'eval',
        title: 'Evaluating AI-driven character development',
        note: 'Compare drafts written with and without the editor.',
      },
      {
        facet: 'impact',
        title: 'Impact of real-time feedback in character creation',
        note: 'What changes for the writer once feedback is immediate.',
      },
    ],
  },
  {
    id: 'design-complexity',
    facet: 'design',
    layer: 'bottom',
    title: 'AI-driven Character Complexity Enhancement',
    bars: 3,
    x: 37, y: 50, w: 30,
  },
  {
    id: 'design-multimodal',
    facet: 'design',
    layer: 'bottom',
    title: 'Multi-modal AI-driven Character Generator',
    bars: 3,
    x: 69, y: 50, w: 29,
  },
];

type Verdict = 'strong' | 'partial' | 'weak';

interface EdgeDef {
  from: string;
  to: string;
  verdict: Verdict;
  text: string;
}

/** The scripted edges, each carrying the system's read on the pairing. */
const EDGES: EdgeDef[] = [
  {
    from: 'rq-characters',
    to: 'design-editor',
    verdict: 'strong',
    text: 'The editor’s revision loop answers the question directly: the feedback mechanism is the thing being designed.',
  },
  {
    from: 'rq-characters',
    to: 'design-complexity',
    verdict: 'partial',
    text: 'Complexity is a property of the output. The question asks about the mechanism that gets you there.',
  },
  {
    from: 'rq-authorship',
    to: 'design-multimodal',
    verdict: 'weak',
    text: 'More input modes widen what the system can generate, but say nothing about who holds authorship.',
  },
];

const VERDICT_LABEL: Record<Verdict, string> = {
  strong: 'Strong fit',
  partial: 'Partial fit',
  weak: 'Weak fit',
};

/**
 * The library. Both titles are the ones the paper's own figure shows; nothing
 * else about them is asserted here, and the counts are interface state rather
 * than claims about the papers.
 */
const PAPERS = [
  { title: 'Social Dynamics of AI Support in Creative Writing', tag: '3 excerpts' },
  {
    title: 'AI as an Active Writer: Interaction Strategies with Generated Text in Human-AI Collaborative Fiction Writing',
    tag: '2 excerpts',
  },
];

const CHAT_REPLY = 'Based on this paper you collected…';

// --- artwork -----------------------------------------------------------------
// Inline 24x24 line icons, stroked with currentColor.

const ICONS: Record<string, string> = {
  paper: `<path d="M6 2.8h7.4L18.6 8v13.2H6z"/><path d="M13.2 2.8V8h5.4"/>
    <path d="M9 12.4h6.6"/><path d="M9 15.8h6.6"/>`,
  spark: `<path d="M12 3.2l1.9 4.9 4.9 1.9-4.9 1.9L12 16.8l-1.9-4.9L5.2 10l4.9-1.9z"/>
    <path d="M18.4 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`,
  link: `<path d="M10 13.8a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3"/>
    <path d="M14 10.2a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.3-1.3"/>`,
  caret: `<path d="M14.5 5.5 8 12l6.5 6.5"/>`,
  grip: `<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/>
    <circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/>
    <circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>`,
  send: `<path d="M20.5 3.5 10.8 13.2"/><path d="M20.5 3.5l-6.2 17-3.5-7.3-7.3-3.5z"/>`,
};

function icon(name: string, cls = ''): string {
  return `<svg class="ix-icon ${cls}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** Grey stand-in bars, as the paper's figure uses for unelaborated nodes. */
function bars(count: number): string {
  const widths = [92, 68, 84, 54, 76];
  let out = '<span class="ix-bars" aria-hidden="true">';
  for (let i = 0; i < count; i++) {
    out += `<i style="width:${widths[i % widths.length]}%"></i>`;
  }
  return out + '</span>';
}

function aiPanel(node: NodeDef): string {
  if (!node.ai) return '';
  return `<div class="ix-ai" data-ai-stage="${node.ai.stage}">
    <span class="ix-ai-head">
      ${icon('spark', 'ix-ai-spark')}
      <span class="ix-ai-label">AI suggestion</span>
    </span>
    <p class="ix-ai-text" data-ai-text>${esc(node.ai.text)}</p>
    <span class="ix-cite" title="Grounded in a paper in your library">
      ${icon('paper')}<span>${esc(node.ai.paper)}</span>
    </span>
  </div>`;
}

function nodeMarkup(node: NodeDef): string {
  const style = `left:${node.x}%;top:${node.y}%;width:${node.w}%`;
  const live = node.suggestions ? ' data-live="true"' : '';
  return `<article class="ix-node" data-node="${node.id}" data-facet="${node.facet}"
      data-layer="${node.layer}"${live} style="${style}" tabindex="0"
      aria-label="${esc(FACET_LABEL[node.facet])}: ${esc(node.title)}">
    ${node.suggestions ? `<button class="ix-caret" type="button" data-caret="${node.id}"
        aria-expanded="false" aria-label="Suggestions for this node">${icon('caret')}</button>` : ''}
    <span class="ix-facet">${esc(FACET_LABEL[node.facet])}</span>
    <h5 class="ix-title">${esc(node.title)}</h5>
    ${node.body ? `<p class="ix-body">${esc(node.body)}</p>` : ''}
    ${node.bars ? bars(node.bars) : ''}
    ${aiPanel(node)}
    <button class="ix-port" type="button" data-port="${node.id}"
            aria-label="Connect this node to another"></button>
  </article>`;
}

function suggestionMarkup(s: Suggestion, index: number): string {
  return `<button class="ix-sug" type="button" data-sug="${index}"
      data-facet="${s.facet}" aria-label="Add a ${esc(FACET_LABEL[s.facet])} node: ${esc(s.title)}. Drag onto the canvas, or press Enter to place it.">
    ${icon('grip', 'ix-sug-grip')}
    <span class="ix-sug-main">
      <span class="ix-sug-facet">${esc(FACET_LABEL[s.facet])}</span>
      <span class="ix-sug-title">${esc(s.title)}</span>
      <span class="ix-sug-note">${esc(s.note)}</span>
    </span>
  </button>`;
}

function scene(): string {
  // `done` rather than `idle`: the canvas is revealed stage by stage, so a
  // visitor without JavaScript would otherwise get an empty frame. The frame's
  // inline script rewinds it before paint. See PaperDemo.astro.
  return `<div class="ix" data-ix data-stage="done">

  <section class="ix-rail">
    <h4 class="ix-col-label">Collected papers</h4>
    <ul class="ix-papers" data-papers>
      ${PAPERS.map((p, i) => `<li class="ix-paper" style="--i:${i}">
        ${icon('paper', 'ix-paper-icon')}
        <span class="ix-paper-main">
          <span class="ix-paper-title">${esc(p.title)}</span>
          <span class="ix-paper-tag">${esc(p.tag)}</span>
        </span>
      </li>`).join('')}
      <li class="ix-paper ix-paper--more" style="--i:${PAPERS.length}">+6 more in library</li>
    </ul>

    <div class="ix-qa">
      <h4 class="ix-col-label">Ask your library</h4>
      <div class="ix-qa-log" data-qa-log></div>
      <form class="ix-qa-form" data-qa-form>
        <input class="ix-qa-input" data-qa-input type="text" autocomplete="off"
               placeholder="Ask a question…" aria-label="Ask your collected papers a question" />
        <button class="ix-qa-send" type="submit" aria-label="Send">${icon('send')}</button>
      </form>
    </div>
  </section>

  <section class="ix-canvas-col">
    <h4 class="ix-col-label">Idea canvas</h4>
    <div class="ix-canvas" data-canvas>
      <svg class="ix-edges" data-edges aria-hidden="true"></svg>
      ${NODES.map(nodeMarkup).join('')}
      <div class="ix-marks" data-marks></div>
      <div class="ix-panel" data-panel hidden>
        <span class="ix-panel-head">Suggestions for selected node</span>
        <div class="ix-panel-body" data-panel-body></div>
      </div>
    </div>
  </section>
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const ix = q<HTMLElement>('[data-ix]');
  const canvas = q<HTMLElement>('[data-canvas]');
  const edgeLayer = q<SVGSVGElement>('[data-edges]');
  const marks = q<HTMLElement>('[data-marks]');
  const panel = q<HTMLElement>('[data-panel]');
  const panelBody = q<HTMLElement>('[data-panel-body]');
  const qaLog = q<HTMLElement>('[data-qa-log]');
  const qaForm = q<HTMLFormElement>('[data-qa-form]');
  const qaInput = q<HTMLInputElement>('[data-qa-input]');

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  let timers: number[] = [];
  let running = false;
  let paused = false;
  let finished = false;

  /** Edges the visitor drew. They carry no verdict — it would be invented. */
  const userEdges: { from: string; to: string }[] = [];
  let created = 0;
  let selected: string | null = null;
  let armedPort: string | null = null;

  const clearTimers = () => {
    timers.forEach(t => window.clearTimeout(t));
    timers = [];
  };

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      if (paused || aborter.signal.aborted) return;
      timers.push(window.setTimeout(resolve, ms));
    });

  const setStage = (stage: string) => { ix.dataset.stage = stage; };
  const nodeEl = (id: string) => canvas.querySelector<HTMLElement>(`[data-node="${id}"]`);

  // --- edges ---------------------------------------------------------------

  /**
   * Edge geometry is measured from the live boxes rather than computed from
   * the percentages, because a node's height depends on its text and a
   * dropped node has no percentage of its own until it lands.
   */
  function layoutEdges() {
    const box = canvas.getBoundingClientRect();
    if (box.width === 0) return;
    edgeLayer.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

    const all = [
      ...EDGES.map(e => ({ ...e, kind: 'scripted' as const })),
      ...userEdges.map(e => ({ ...e, verdict: null, text: '', kind: 'user' as const })),
    ];

    edgeLayer.querySelectorAll('[data-edge]').forEach(el => el.remove());

    // Narrow frames drop the nodes into one column (see the stylesheet), and
    // there a curve between two node centres runs straight through whatever
    // is stacked in between. Those edges take a lane down the left gutter
    // instead, one lane each so they stay apart.
    const stacked = getComputedStyle(canvas).display === 'flex';

    all.forEach((edge, index) => {
      const a = nodeEl(edge.from);
      const b = nodeEl(edge.to);
      if (!a || !b) return;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', `ix-edge ix-edge--${edge.kind}`);
      path.setAttribute('data-edge', String(index));

      let markX: number;
      let markY: number;

      if (stacked) {
        const lane = 10 + (index % 3) * 7;
        const x1 = ra.left - box.left;
        const y1 = ra.top + ra.height / 2 - box.top;
        const x2 = rb.left - box.left;
        const y2 = rb.top + rb.height / 2 - box.top;
        path.setAttribute('d', `M${x1} ${y1} H${lane} V${y2} H${x2}`);
        markX = lane;
        markY = (y1 + y2) / 2;
      } else {
        // Leave from whichever side of the source faces the target, so an edge
        // drawn upward or sideways does not loop back through its own node.
        const downward = rb.top >= ra.bottom - 4;
        const x1 = ra.left + ra.width / 2 - box.left;
        const y1 = (downward ? ra.bottom : ra.top) - box.top;
        const x2 = rb.left + rb.width / 2 - box.left;
        const y2 = (downward ? rb.top : rb.bottom) - box.top;
        const bend = Math.max(18, Math.abs(y2 - y1) * 0.45) * (downward ? 1 : -1);
        path.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`);
        // The curve is symmetric, so t = 0.5 lands on the plain midpoint.
        markX = (x1 + x2) / 2;
        markY = (y1 + y2) / 2;
      }
      edgeLayer.appendChild(path);

      if (edge.kind === 'scripted') {
        const mark = marks.querySelector<HTMLElement>(`[data-mark="${index}"]`);
        if (mark) {
          mark.style.left = `${markX}px`;
          mark.style.top = `${markY}px`;
        }
      }
    });
  }

  /** One indicator per scripted edge, each expanding to its own verdict. */
  function buildMarks() {
    marks.innerHTML = EDGES.map((edge, index) => `
      <div class="ix-mark" data-mark="${index}" data-verdict="${edge.verdict}">
        <button class="ix-mark-btn" type="button" data-mark-btn="${index}"
                aria-expanded="false"
                aria-label="${VERDICT_LABEL[edge.verdict]} between these facets. Show why.">
          ${icon('link')}
        </button>
        <div class="ix-mark-pop" data-mark-pop="${index}" hidden>
          <span class="ix-mark-verdict">${VERDICT_LABEL[edge.verdict]}</span>
          <p class="ix-mark-text">${esc(edge.text)}</p>
        </div>
      </div>`).join('');
  }

  function toggleMark(index: number, open: boolean) {
    marks.querySelectorAll<HTMLElement>('[data-mark-pop]').forEach(pop => {
      const own = pop.dataset.markPop === String(index);
      pop.hidden = !(own && open);
    });
    marks.querySelectorAll<HTMLElement>('[data-mark-btn]').forEach(btn => {
      const own = btn.dataset.markBtn === String(index);
      btn.setAttribute('aria-expanded', String(own && open));
      btn.parentElement?.classList.toggle('is-open', own && open);
    });
    if (open) ctx.announce(`${VERDICT_LABEL[EDGES[index].verdict]}: ${EDGES[index].text}`);
  }

  // --- selection and the suggestion panel -----------------------------------

  function select(id: string | null) {
    selected = id;
    canvas.querySelectorAll<HTMLElement>('.ix-node').forEach(el => {
      el.classList.toggle('is-selected', el.dataset.node === id);
    });
    if (!id || !NODES.find(n => n.id === id)?.suggestions) closePanel();
  }

  function closePanel() {
    panel.hidden = true;
    canvas.querySelectorAll<HTMLElement>('[data-caret]').forEach(c => {
      c.setAttribute('aria-expanded', 'false');
    });
  }

  function openPanel(id: string) {
    const node = NODES.find(n => n.id === id);
    const el = nodeEl(id);
    if (!node?.suggestions || !el) return;

    panelBody.innerHTML = node.suggestions.map(suggestionMarkup).join('');
    panel.dataset.owner = id;
    panel.hidden = false;

    // Beside the node, on whichever side has room. Clamping a left-hand panel
    // back into the canvas would just park it on top of its own node.
    const box = canvas.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const width = panel.offsetWidth;
    const onLeft = rect.left - box.left - width - 8;
    const left = onLeft >= 4
      ? onLeft
      : Math.min(rect.right - box.left + 8, box.width - width - 4);
    const top = Math.max(4, Math.min(rect.top - box.top, box.height - panel.offsetHeight - 4));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    el.querySelector('[data-caret]')?.setAttribute('aria-expanded', 'true');
    ctx.announce('Two suggestions. Drag one onto the canvas, or press Enter to place it.');
  }

  // --- creating nodes -------------------------------------------------------

  const NEW_WIDTH = 30;

  function createNode(s: Suggestion, xPct: number, yPct: number) {
    created += 1;
    const id = `made-${created}`;
    const x = Math.max(0.5, Math.min(xPct - NEW_WIDTH / 2, 99.5 - NEW_WIDTH));
    const y = Math.max(0.5, Math.min(yPct, 88));

    const el = document.createElement('article');
    el.className = 'ix-node ix-node--new';
    el.dataset.node = id;
    el.dataset.facet = s.facet;
    el.dataset.layer = 'made';
    el.tabIndex = 0;
    el.setAttribute('aria-label', `${FACET_LABEL[s.facet]}: ${s.title}`);
    el.style.cssText = `left:${x}%;top:${y}%;width:${NEW_WIDTH}%`;
    el.innerHTML = `<span class="ix-facet">${esc(FACET_LABEL[s.facet])}</span>
      <h5 class="ix-title">${esc(s.title)}</h5>
      ${bars(2)}
      <button class="ix-port" type="button" data-port="${id}"
              aria-label="Connect this node to another"></button>`;
    canvas.appendChild(el);

    // The node's height depends on how its title wraps, which is only knowable
    // once it is in the document — so it is nudged back inside afterwards
    // rather than clamped against a guess.
    // offsetHeight, not the bounding box: the node is still wearing its
    // entrance transform, and a scaled box would under-report the overhang.
    const height = el.offsetHeight / canvas.clientHeight * 100;
    const overhang = height + y - 99;
    if (overhang > 0) el.style.top = `${Math.max(0.5, y - overhang)}%`;

    requestAnimationFrame(() => {
      el.classList.remove('ix-node--new');
      layoutEdges();
    });
    select(id);
    ctx.announce(`Added a ${FACET_LABEL[s.facet]} node: ${s.title}.`);
  }

  /** Where a keyboard-placed node goes, since there is no drop point. */
  function freeSpot(): { x: number; y: number } {
    return { x: 18 + (created % 3) * 32, y: 82 };
  }

  // --- dragging a suggestion out of the panel -------------------------------

  let ghost: HTMLElement | null = null;

  function dropPercent(clientX: number, clientY: number) {
    const box = canvas.getBoundingClientRect();
    return {
      inside:
        clientX >= box.left && clientX <= box.right &&
        clientY >= box.top && clientY <= box.bottom,
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  function beginDrag(event: PointerEvent, button: HTMLElement, s: Suggestion) {
    if (event.button !== 0) return;
    let moved = false;

    ghost = document.createElement('div');
    ghost.className = 'ix-ghost';
    ghost.dataset.facet = s.facet;
    ghost.textContent = s.title;
    root.appendChild(ghost);
    const place = (e: PointerEvent) => {
      if (ghost) ghost.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 10}px)`;
    };
    place(event);

    button.setPointerCapture(event.pointerId);

    const move = (e: PointerEvent) => {
      if (Math.abs(e.clientX - event.clientX) > 4 || Math.abs(e.clientY - event.clientY) > 4) {
        moved = true;
      }
      place(e);
      canvas.classList.toggle('is-dropzone', moved && dropPercent(e.clientX, e.clientY).inside);
    };

    const end = (e: PointerEvent) => {
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerup', end);
      button.removeEventListener('pointercancel', end);
      ghost?.remove();
      ghost = null;
      canvas.classList.remove('is-dropzone');
      // A press that never moved is a click, and click handles the keyboard
      // path too — let it through rather than dropping a node under the panel.
      if (!moved) return;
      button.dataset.dragged = 'true';
      const at = dropPercent(e.clientX, e.clientY);
      if (at.inside) {
        createNode(s, at.x, at.y);
        closePanel();
      }
    };

    button.addEventListener('pointermove', move);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
  }

  // --- connecting nodes -----------------------------------------------------

  let rubber: SVGPathElement | null = null;

  function clearRubber() {
    rubber?.remove();
    rubber = null;
  }

  function disarm() {
    armedPort = null;
    canvas.classList.remove('is-connecting');
    clearRubber();
  }

  function drawRubber(fromId: string, clientX: number, clientY: number) {
    const el = nodeEl(fromId);
    if (!el) return;
    const box = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x1 = r.left + r.width / 2 - box.left;
    const y1 = r.bottom - box.top;
    const x2 = clientX - box.left;
    const y2 = clientY - box.top;
    if (!rubber) {
      rubber = document.createElementNS(SVG_NS, 'path');
      rubber.setAttribute('class', 'ix-edge ix-edge--live');
      edgeLayer.appendChild(rubber);
    }
    const bend = Math.max(16, Math.abs(y2 - y1) * 0.45);
    rubber.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`);
  }

  function connect(fromId: string, toId: string) {
    if (fromId === toId) return;
    const exists = userEdges.some(e => e.from === fromId && e.to === toId) ||
      EDGES.some(e => e.from === fromId && e.to === toId);
    if (exists) return;
    userEdges.push({ from: fromId, to: toId });
    layoutEdges();
    ctx.announce('Connected.');
  }

  function beginConnect(event: PointerEvent, port: HTMLElement, fromId: string) {
    if (event.button !== 0) return;
    let moved = false;
    canvas.classList.add('is-connecting');
    port.setPointerCapture(event.pointerId);

    const move = (e: PointerEvent) => {
      if (Math.abs(e.clientX - event.clientX) > 4 || Math.abs(e.clientY - event.clientY) > 4) {
        moved = true;
      }
      if (moved) drawRubber(fromId, e.clientX, e.clientY);
    };

    const end = (e: PointerEvent) => {
      port.removeEventListener('pointermove', move);
      port.removeEventListener('pointerup', end);
      port.removeEventListener('pointercancel', end);
      if (!moved) {
        // A plain click arms the port instead, so connecting works without a
        // drag — which is also the keyboard path.
        armedPort = fromId;
        canvas.classList.add('is-connecting');
        ctx.announce('Now choose the node to connect to.');
        return;
      }
      port.dataset.dragged = 'true';
      const target = document.elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>('.ix-node');
      if (target?.dataset.node) connect(fromId, target.dataset.node);
      disarm();
    };

    port.addEventListener('pointermove', move);
    port.addEventListener('pointerup', end);
    port.addEventListener('pointercancel', end);
  }

  // --- wiring ---------------------------------------------------------------

  canvas.addEventListener('pointerdown', event => {
    const port = (event.target as Element).closest<HTMLElement>('[data-port]');
    if (port?.dataset.port) {
      event.stopPropagation();
      beginConnect(event, port, port.dataset.port);
    }
  }, listen);

  panel.addEventListener('pointerdown', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-sug]');
    const node = NODES.find(n => n.id === panel.dataset.owner);
    const s = node?.suggestions?.[Number(button?.dataset.sug)];
    if (button && s) beginDrag(event, button, s);
  }, listen);

  panel.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-sug]');
    if (!button) return;
    if (button.dataset.dragged === 'true') {
      delete button.dataset.dragged;
      return;
    }
    const node = NODES.find(n => n.id === panel.dataset.owner);
    const s = node?.suggestions?.[Number(button.dataset.sug)];
    if (!s) return;
    const at = freeSpot();
    createNode(s, at.x, at.y);
    closePanel();
  }, listen);

  canvas.addEventListener('click', event => {
    const target = event.target as Element;

    const markBtn = target.closest<HTMLElement>('[data-mark-btn]');
    if (markBtn) {
      const index = Number(markBtn.dataset.markBtn);
      toggleMark(index, markBtn.getAttribute('aria-expanded') !== 'true');
      return;
    }

    const caret = target.closest<HTMLElement>('[data-caret]');
    if (caret?.dataset.caret) {
      const open = caret.getAttribute('aria-expanded') !== 'true';
      if (open) openPanel(caret.dataset.caret);
      else closePanel();
      return;
    }

    const port = target.closest<HTMLElement>('[data-port]');
    if (port?.dataset.port) {
      if (port.dataset.dragged === 'true') {
        delete port.dataset.dragged;
        return;
      }
      // Keyboard activation lands here with no pointer sequence to arm it.
      if (armedPort === null) {
        armedPort = port.dataset.port;
        canvas.classList.add('is-connecting');
        ctx.announce('Now choose the node to connect to.');
      } else {
        disarm();
      }
      return;
    }

    const node = target.closest<HTMLElement>('.ix-node');
    if (node?.dataset.node) {
      if (armedPort && armedPort !== node.dataset.node) {
        connect(armedPort, node.dataset.node);
        disarm();
        return;
      }
      select(node.dataset.node);
      return;
    }

    disarm();
    select(null);
  }, listen);

  canvas.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      disarm();
      closePanel();
      toggleMark(-1, false);
    }
  }, listen);

  qaForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = qaInput.value.trim();
    if (!text) return;
    qaInput.value = '';
    qaLog.insertAdjacentHTML('beforeend',
      `<p class="ix-qa-msg ix-qa-msg--you">${esc(text)}</p>`);
    qaLog.insertAdjacentHTML('beforeend',
      `<div class="ix-qa-msg ix-qa-msg--ai">
        <span class="ix-qa-reply">${esc(CHAT_REPLY)}</span>${bars(2)}
      </div>`);
    qaLog.scrollTop = qaLog.scrollHeight;
    ctx.announce(CHAT_REPLY);
  }, listen);

  const relayout = () => {
    layoutEdges();
    if (!panel.hidden && panel.dataset.owner) openPanel(panel.dataset.owner);
  };
  window.addEventListener('resize', relayout, listen);

  // --- the automated sequence ----------------------------------------------

  const aiText = (stage: string) =>
    root.querySelector<HTMLElement>(`.ix-ai[data-ai-stage="${stage}"] [data-ai-text]`);

  const AI_FULL: Record<string, string> = {};
  NODES.forEach(n => { if (n.ai) AI_FULL[n.ai.stage] = n.ai.text; });

  /** Types a suggestion out, so it reads as being generated. */
  async function streamAi(stage: string) {
    const el = aiText(stage);
    const full = AI_FULL[stage];
    if (!el || !full) return;
    for (let c = 1; c <= full.length; c++) {
      if (paused || aborter.signal.aborted) return;
      el.textContent = full.slice(0, c);
      await wait(c % 6 === 0 ? 24 : 12);
    }
  }

  function settle() {
    running = false;
    finished = true;
    ctx.setRunning(false);
    setStage('done');
    layoutEdges();
  }

  function resetScene() {
    Object.keys(AI_FULL).forEach(stage => {
      const el = aiText(stage);
      if (el) el.textContent = '';
    });
    userEdges.length = 0;
    canvas.querySelectorAll('[data-layer="made"]').forEach(el => el.remove());
    created = 0;
    qaLog.innerHTML = '';
    qaInput.value = '';
    closePanel();
    disarm();
    select(null);
    toggleMark(-1, false);
    layoutEdges();
  }

  async function run() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    if (ctx.reducedMotion) {
      Object.keys(AI_FULL).forEach(stage => {
        const el = aiText(stage);
        if (el) el.textContent = AI_FULL[stage];
      });
      ctx.announce(
        'A canvas of idea facets: two research questions above, three proposed ' +
        'designs below, with the fit between them marked on each connection.'
      );
      settle();
      return;
    }

    setStage('papers');
    ctx.announce('Papers collected into the library.');
    await wait(1100);
    if (paused || aborter.signal.aborted) return;

    setStage('rq');
    ctx.announce('Two research questions on the canvas.');
    await wait(1200);
    if (paused || aborter.signal.aborted) return;

    setStage('suggest');
    ctx.announce('IdeaSynth suggests a refinement, grounded in a collected paper.');
    await streamAi('suggest');
    if (paused || aborter.signal.aborted) return;
    await wait(700);
    if (paused || aborter.signal.aborted) return;

    setStage('design');
    ctx.announce('Three proposed designs are generated from the questions.');
    await wait(1500);
    if (paused || aborter.signal.aborted) return;

    setStage('edges');
    layoutEdges();
    ctx.announce('Each connection carries a verdict on how well the two facets fit.');
    await wait(500);
    if (paused || aborter.signal.aborted) return;
    toggleMark(0, true);
    await wait(2400);
    if (paused || aborter.signal.aborted) return;
    toggleMark(-1, false);

    setStage('assist');
    await streamAi('assist');
    if (paused || aborter.signal.aborted) return;
    await wait(600);
    if (paused || aborter.signal.aborted) return;

    settle();
  }

  buildMarks();
  setStage('idle');
  resetScene();
  // Geometry is only measurable once the browser has laid the canvas out.
  requestAnimationFrame(layoutEdges);

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
      ghost?.remove();
      aborter.abort();
    },
  };
}

export const demo: PaperDemo = {
  id: 'ideasynth',
  stageLabel:
    'A research idea laid out as a canvas: two research-question nodes above three proposed-design nodes, connected by edges that each carry a verdict on how well the two facets fit, with a rail of collected papers and a question box beside it',
  hint: 'Select a node and open its caret to drag out a new one, or open a connection to see how well two facets fit.',
  transcript: [
    'A canvas holds the facets of one research idea. Two research questions sit on the upper layer: using AI to generate interesting fictional characters, and balancing AI creativity with authorship.',
    'Three proposed designs sit below them: an interactive AI-driven character editor, AI-driven character complexity enhancement, and a multi-modal AI-driven character generator.',
    'One node in each layer carries an AI suggestion grounded in a paper from the collected library, shown with the paper it draws on.',
    'Edges run from each question down to the designs that answer it. Every scripted edge carries an indicator that expands to say how well the two facets fit: strong, partial or weak, and why.',
    'Selecting a node with suggestions reveals a caret on its left edge. Opening it lists two further facets to add.',
    'A suggestion can be dragged onto the canvas to become a new node, or placed with the keyboard. New nodes can then be connected to any other node.',
    'A rail on the left lists the collected papers, with a question box that answers from them.',
    'This is an illustrative reconstruction of the interface. It reports no result from the study.',
  ],
  scene,
  mount,
};
