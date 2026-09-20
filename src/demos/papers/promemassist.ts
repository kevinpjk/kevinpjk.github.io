import type { DemoContext, DemoController, PaperDemo } from '../types';

/**
 * ProMemAssist — timely proactive assistance via working-memory modelling.
 *
 * A flow diagram rather than a UI reconstruction, because the system has no
 * screen: it is smart glasses that watch, listen, and decide when to speak.
 * Three columns follow Figures 2 and 3 of the paper: the scene the wearer is
 * looking at, the estimated working memory, and the timing decision.
 *
 * All artwork is inline SVG drawn here rather than fetched, so the scene has
 * no network cost, scales cleanly, animates per-part, and themes with the page.
 *
 * IMPORTANT, per the paper: the system estimates working memory from
 * observable signals — what is in view and what was said. It does not read
 * anyone's mind. The memory column is labelled an estimate for that reason.
 *
 * This is an illustrative reconstruction, not a recording, and it makes no
 * claim about measured outcomes. See the "Claims that must not appear on the
 * site" section of _new_material/website-update-brief.md.
 */

type Kind = 'visuospatial' | 'phonological';

interface Item {
  id: string;
  label: string;
  kind: Kind;
  /** A compact stand-in for the encoded vector, as in Figure 3. */
  vector: string;
}

/** Order matters: this is the order they enter working memory. */
const ITEMS: Item[] = [
  { id: 'banana', label: 'Banana', kind: 'visuospatial', vector: '0.8 0.5 0.3' },
  { id: 'cup', label: 'Cup', kind: 'visuospatial', vector: '0.6 0.2 0.7' },
  { id: 'plate', label: 'Plate', kind: 'visuospatial', vector: '0.4 0.9 0.5' },
  { id: 'fork', label: 'Fork', kind: 'visuospatial', vector: '0.7 0.9 0.4' },
  { id: 'speech', label: '“four for dinner”', kind: 'phonological', vector: '0.9 0.6 0.8' },
];

/** Items that justify speaking, and the one displacement would cost least. */
const RELEVANT = ['plate', 'fork', 'speech'];
const DISPLACED = 'banana';

/** What takes the displaced slot once the assistance is spoken. */
const REPLACEMENT = {
  id: 'utensils',
  label: '“more utensils”',
  kind: 'phonological' as Kind,
  vector: '0.9 0.8 0.6',
};

const QUOTE = 'There’s gonna be four of us for dinner…';
const ASSIST = 'You might need more utensils for four guests';

// --- artwork -----------------------------------------------------------------
// 24x24 line icons, stroked with currentColor so each inherits its state colour.

const ICONS: Record<string, string> = {
  // A person wearing the glasses, seen head-on. One bar across both eyes
  // rather than two lenses: at the size this renders, separate lenses inside
  // the head outline merge into a smudge.
  user: `<circle cx="12" cy="7.6" r="5.4"/>
    <rect x="6.7" y="5.9" width="10.6" height="3.5" rx="1.7"/>
    <path d="M12 5.9v3.5"/>
    <path d="M3.4 21.6c0-4.2 3.9-6.8 8.6-6.8s8.6 2.6 8.6 6.8"/>`,

  // A crescent with a stem, lying at an angle.
  banana: `<path d="M3.8 4.6c.4 7.8 6.9 14 14.8 14 1.4 0 2.8-.2 4.1-.6-.6-2.6-3-4.5-5.8-4.5-5.4 0-9.9-4.1-10.4-9.4a1.4 1.4 0 0 0-2.7.5z"/>`,

  // A dish in side profile: the rim line over a shallow bowl.
  plate: `<path d="M2.4 8.8h19.2"/>
    <path d="M4 8.8c.5 4.8 3.9 8.2 8 8.2s7.5-3.4 8-8.2"/>`,

  // A mug with a handle.
  cup: `<path d="M4.6 6.6h11.2v7.6a4.6 4.6 0 0 1-4.6 4.6H9.2a4.6 4.6 0 0 1-4.6-4.6z"/>
    <path d="M15.8 8.6h1.8a2.6 2.6 0 0 1 0 5.2h-1.8"/>`,

  fork: `<path d="M8.2 3v5.8a3.4 3.4 0 0 0 6.8 0V3"/>
    <path d="M11.6 3v6.2"/>
    <path d="M11.6 12.2V21"/>`,

  // A hand closing around something.
  grab: `<path d="M8.4 12.2V6a1.7 1.7 0 0 1 3.4 0v4.8"/>
    <path d="M11.8 10.6V4.6a1.7 1.7 0 0 1 3.4 0v6"/>
    <path d="M15.2 11.2V7.4a1.7 1.7 0 0 1 3.4 0V15a6.2 6.2 0 0 1-6.2 6.2h-1a5.2 5.2 0 0 1-4.5-2.7l-2.6-4.4a1.7 1.7 0 0 1 2.7-1.9z"/>`,

  // Speaker body only; the waves are separate so they can animate.
  speakerBody: `<path d="M3.6 9.2h3.6L12 5v14L7.2 14.8H3.6z"/>`,
};

function icon(name: string, cls = ''): string {
  return `<svg class="pm-icon ${cls}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** Speaker whose arcs light up one after another as the line is spoken. */
function speakerIcon(): string {
  return `<svg class="pm-icon pm-speaker" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">
    ${ICONS.speakerBody}
    <path class="pm-wv pm-wv--1" d="M14.6 9.6a3.4 3.4 0 0 1 0 4.8"/>
    <path class="pm-wv pm-wv--2" d="M17 7.2a6.8 6.8 0 0 1 0 9.6"/>
    <path class="pm-wv pm-wv--3" d="M19.4 4.8a10.2 10.2 0 0 1 0 14.4"/>
  </svg>`;
}

const KIND_LABEL: Record<Kind, string> = {
  visuospatial: 'Visuospatial',
  phonological: 'Phonological',
};

function cardMarkup(item: Item | typeof REPLACEMENT, extraClass = ''): string {
  return `<div class="pm-item ${extraClass}" data-item="${item.id}"
      data-kind="${item.kind}" tabindex="0"
      aria-label="${KIND_LABEL[item.kind]} memory item: ${item.label}">
    <span class="pm-item-main">
      <span class="pm-item-label">${item.label}</span>
      <span class="pm-item-kind">${KIND_LABEL[item.kind]}</span>
    </span>
    <span class="pm-vec" aria-hidden="true">[${item.vector} …]</span>
  </div>`;
}

function slotMarkup(item: Item, index: number): string {
  // The displaceable slot holds two cards stacked in the same space: the
  // current one, and the item that takes its place once the line is spoken.
  // Stacking means the swap needs no reflow and nothing jumps.
  if (item.id === DISPLACED) {
    return `<li class="pm-slot pm-slot--swap" style="--i:${index}">
      ${cardMarkup(item, 'pm-item--leaving')}
      ${cardMarkup(REPLACEMENT, 'pm-item--arriving')}
    </li>`;
  }
  return `<li class="pm-slot" style="--i:${index}">${cardMarkup(item)}</li>`;
}

function scene(): string {
  return `<div class="pm" data-pm>
  <svg class="pm-links" data-links aria-hidden="true"></svg>

  <section class="pm-col pm-col--scene">
    <h4 class="pm-col-label">What the glasses see and hear</h4>

    <div class="pm-view">
      <span class="pm-cone" data-cone aria-hidden="true"></span>

      <span class="pm-user" data-user>
        ${icon('user', 'pm-user-icon')}
        <span class="pm-user-tag">wearer</span>
      </span>

      <span class="pm-table" data-table aria-hidden="true"></span>

      <span class="pm-obj pm-obj--banana" data-src="banana" title="Banana">${icon('banana')}</span>
      <span class="pm-obj pm-obj--cup" data-src="cup" title="Cup">${icon('cup')}</span>
      <span class="pm-obj pm-obj--plate" data-src="plate" title="Plate">${icon('plate')}</span>
      <span class="pm-obj pm-obj--fork" data-src="fork" title="Fork">${icon('fork')}</span>
    </div>

    <div class="pm-heard" data-src="speech" data-heard>
      <span class="pm-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <q class="pm-quote">${QUOTE}</q>
    </div>
  </section>

  <section class="pm-col pm-col--memory">
    <h4 class="pm-col-label">
      Working memory
      <span class="pm-col-note">estimated from what is seen and heard</span>
    </h4>
    <ol class="pm-items" data-items>${ITEMS.map(slotMarkup).join('')}</ol>

    <p class="pm-col-foot" data-step="encoded">
      Visual and audio signals are encoded and stored as working memory items.
    </p>
  </section>

  <section class="pm-col pm-col--assist">
    <h4 class="pm-col-label">When to speak</h4>

    <div class="pm-step pm-step--pickup" data-step="pickup">
      ${icon('grab', 'pm-grab')}
      <span class="pm-step-text">The user picks up the <b>plate</b> and <b>fork</b></span>
    </div>

    <button class="pm-voice" data-voice type="button"
            aria-label="Generated assistance. Show why this was said now.">
      <span class="pm-voice-label">assistance generated</span>
      <span class="pm-voice-text" data-voice-text></span>
    </button>

    <div class="pm-step pm-step--verdict" data-step="verdict">
      <span class="pm-verdict-row"><b>High</b> relevance &amp; importance</span>
      <span class="pm-verdict-row"><b>Low</b> cost of displacement</span>
    </div>

    <div class="pm-step pm-step--play" data-step="play">
      ${speakerIcon()}
      <span class="pm-step-text">spoken aloud to the wearer</span>
    </div>

    <div class="pm-step pm-step--displace" data-step="displace">
      <span class="pm-step-text">
        What was said becomes new audio information, displacing the memory item
        with the lowest cost of displacement and interference
      </span>
    </div>

    <p class="pm-voice-hint" data-voice-hint>hover the message to see why</p>
  </section>
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const pm = q<HTMLElement>('[data-pm]');
  const links = q<SVGSVGElement>('[data-links]');
  const voice = q<HTMLButtonElement>('[data-voice]');
  const voiceText = q<HTMLElement>('[data-voice-text]');

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };

  let timers: number[] = [];
  let running = false;
  let paused = false;
  let finished = false;

  const clearTimers = () => {
    timers.forEach(t => window.clearTimeout(t));
    timers = [];
  };

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      if (paused || aborter.signal.aborted) return;
      timers.push(window.setTimeout(resolve, ms));
    });

  const setStage = (stage: string) => { pm.dataset.stage = stage; };

  // --- hover linking ------------------------------------------------------

  /** Lights a memory item and the perception signal it came from. */
  function lightSource(id: string | null) {
    root.querySelectorAll<HTMLElement>('[data-src], .pm-item').forEach(el => {
      const key = el.dataset.src ?? el.dataset.item;
      el.classList.toggle('is-lit', id !== null && key === id);
    });
  }

  function clearLines() {
    while (links.firstChild) links.removeChild(links.firstChild);
  }

  function drawLink(from: DOMRect, to: DOMRect, box: DOMRect, kind: string) {
    const x1 = from.left - box.left;
    const y1 = from.top - box.top + from.height / 2;
    const x2 = to.right - box.left;
    const y2 = to.top - box.top + to.height / 2;
    const mid = (x1 + x2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', `pm-link pm-link--${kind}`);
    links.appendChild(path);
  }

  /**
   * Shows why the line was worth saying now: the items that justified it, and
   * the one displaced to make room for what the system just said.
   */
  function explainTiming(on: boolean) {
    pm.classList.toggle('is-explaining', on);
    clearLines();

    root.querySelectorAll<HTMLElement>('.pm-item').forEach(el => {
      el.classList.remove('is-relevant', 'is-displaced');
    });
    if (!on) return;

    const byId = (id: string) =>
      root.querySelector<HTMLElement>(`.pm-item[data-item="${id}"]`);

    RELEVANT.forEach(id => byId(id)?.classList.add('is-relevant'));
    byId(DISPLACED)?.classList.add('is-displaced');

    const box = pm.getBoundingClientRect();
    links.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const from = voice.getBoundingClientRect();

    for (const id of RELEVANT) {
      const el = byId(id);
      if (el) drawLink(from, el.getBoundingClientRect(), box, 'keep');
    }
    // The displaced slot gets its own line, in the colour of the card leaving.
    const slot = root.querySelector<HTMLElement>('.pm-slot--swap');
    if (slot) drawLink(from, slot.getBoundingClientRect(), box, 'drop');

    ctx.announce(
      'Spoken because the plate, the fork and the overheard guest count are ' +
      'highly relevant. The banana is the least relevant item, so it is cheap ' +
      'to displace, and what was just said takes its place in memory.'
    );
  }

  root.querySelectorAll<HTMLElement>('.pm-item').forEach(el => {
    const id = el.dataset.item!;
    el.addEventListener('pointerenter', () => lightSource(id), listen);
    el.addEventListener('pointerleave', () => lightSource(null), listen);
    el.addEventListener('focus', () => lightSource(id), listen);
    el.addEventListener('blur', () => lightSource(null), listen);
  });

  voice.addEventListener('pointerenter', () => explainTiming(true), listen);
  voice.addEventListener('pointerleave', () => explainTiming(false), listen);
  voice.addEventListener('focus', () => explainTiming(true), listen);
  voice.addEventListener('blur', () => explainTiming(false), listen);
  // Tap works as well as hover on touch devices.
  voice.addEventListener('click', () => {
    explainTiming(!pm.classList.contains('is-explaining'));
  }, listen);

  window.addEventListener('resize', () => {
    if (pm.classList.contains('is-explaining')) explainTiming(true);
  }, listen);

  // --- the automated sequence ---------------------------------------------

  function settle() {
    running = false;
    finished = true;
    ctx.setRunning(false);
    setStage('done');
  }

  /** Types the assistance out, so it reads as being generated. */
  async function streamAssist() {
    for (let c = 1; c <= ASSIST.length; c++) {
      if (paused || aborter.signal.aborted) return;
      voiceText.textContent = ASSIST.slice(0, c);
      await wait(c % 6 === 0 ? 26 : 13);
    }
  }

  async function run() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    if (ctx.reducedMotion) {
      voiceText.textContent = ASSIST;
      setStage('done');
      ctx.announce(
        'The glasses see a banana, cup, plate and fork on the table, hear the ' +
        'guest count, and speak as the wearer picks up the plate and fork.'
      );
      settle();
      return;
    }

    voiceText.textContent = '';

    setStage('look');
    ctx.announce('The wearer looks across the table.');
    await wait(850);
    if (paused || aborter.signal.aborted) return;

    setStage('see');
    ctx.announce('Objects on the table come into view.');
    await wait(1700);
    if (paused || aborter.signal.aborted) return;

    setStage('hear');
    ctx.announce('The wearer hears how many people are coming to dinner.');
    await wait(1500);
    if (paused || aborter.signal.aborted) return;

    setStage('encode');
    ctx.announce('Each signal is encoded and placed in working memory.');
    await wait(1900);
    if (paused || aborter.signal.aborted) return;

    setStage('pickup');
    ctx.announce('The user picks up the plate and the fork.');
    await wait(1000);
    if (paused || aborter.signal.aborted) return;

    setStage('generate');
    ctx.announce('Assistance is generated.');
    await streamAssist();
    if (paused || aborter.signal.aborted) return;
    await wait(450);
    if (paused || aborter.signal.aborted) return;

    setStage('evaluate');
    ctx.announce('The moment is evaluated: high relevance, low cost of displacement.');
    await wait(1200);
    if (paused || aborter.signal.aborted) return;

    setStage('play');
    ctx.announce(`Spoken aloud: ${ASSIST}.`);
    await wait(1500);
    if (paused || aborter.signal.aborted) return;

    settle();
  }

  setStage('idle');
  voiceText.textContent = '';

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
      explainTiming(false);
      lightSource(null);
      voiceText.textContent = '';
      setStage('idle');
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
  id: 'promemassist',
  stageLabel:
    'Flow diagram: a wearer of smart glasses looks at a dinner table holding a banana, cup, plate and fork and hears a guest count; those signals become items in an estimated working memory; as the wearer picks up the plate and fork the glasses generate and speak a suggestion about utensils',
  hint: 'Hover a memory item to see where it came from, or the message to see why it was said then.',
  transcript: [
    'A wearer of smart glasses looks across a dinner table. Their field of view reaches a cup on the left, a plate in the middle, a fork on the right, and a banana further back.',
    'They also overhear someone say “There’s gonna be four of us for dinner”.',
    'Each signal is encoded into a vector and placed in an estimated working memory: four visuospatial items for the objects, one phonological item for what was said. The estimate is built from what the glasses can observe, not from any direct reading of the wearer.',
    'The user picks up the plate and the fork.',
    'Assistance is generated: “You might need more utensils for four guests.”',
    'The moment is then evaluated. The plate, the fork and the overheard guest count are all highly relevant, and the least relevant item in memory is cheap to displace, so the glasses speak now rather than earlier.',
    'The line is spoken aloud, and what was said takes the displaced item’s place in working memory.',
    'Hovering any memory item highlights the object or phrase it came from. Hovering the message draws its reasoning back to the items that justified it, and shows the banana card dropping out to make room.',
  ],
  scene,
  mount,
};
