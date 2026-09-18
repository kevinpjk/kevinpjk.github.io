import type { DemoContext, DemoController, PaperDemo } from '../types';

/**
 * ProMemAssist — timely proactive assistance via working-memory modelling.
 *
 * A flow diagram rather than a UI reconstruction, because the system has no
 * screen: it is smart glasses that watch, listen, and decide when to speak.
 * The three columns follow Figures 2 and 3 of the paper: perception on the
 * left, the working-memory model in the middle, the timing decision and spoken
 * assistance on the right.
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
  /** Relevance to the assistance the system ends up offering. */
  relevance: 'high' | 'low';
}

/** Order matters: this is the order they enter working memory. */
const ITEMS: Item[] = [
  { id: 'banana', label: 'Banana', kind: 'visuospatial', relevance: 'low' },
  { id: 'cup', label: 'Cup', kind: 'visuospatial', relevance: 'low' },
  { id: 'plate', label: 'Plate', kind: 'visuospatial', relevance: 'high' },
  { id: 'fork', label: 'Fork', kind: 'visuospatial', relevance: 'high' },
  { id: 'speech', label: '“four of us for dinner”', kind: 'phonological', relevance: 'high' },
];

const QUOTE = 'There’s gonna be four of us for dinner…';
const ASSIST = 'You might need more utensils for four guests';

// --- artwork -----------------------------------------------------------------
// Compact 24x24 line icons, stroked with currentColor so each inherits its
// state colour.

const ICONS: Record<string, string> = {
  banana: `<path d="M4 7.5c0 6.4 4.6 10.5 10.6 10.5 2.7 0 4.7-1.5 5.9-3.4-1.8.9-3.7.7-5-.4 1.6-2.5 1.5-5.7-.3-7.9.2 2.8-1 5.1-2.9 6.2-2.4 1.4-5.6-.7-7.1-4.3-.3-.8-1.1-1-1.2-.7z"/>`,
  cup: `<path d="M5 7h11v7a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14z"/><path d="M16 9h1.6a2.4 2.4 0 0 1 0 4.8H16"/>`,
  plate: `<ellipse cx="12" cy="11.4" rx="9" ry="6.2"/><path d="M6.6 12.4a5.6 4 0 0 0 10.8 0"/>`,
  fork: `<path d="M8.4 3v5.6a3.2 3.2 0 0 0 6.4 0V3"/><path d="M11.6 3v6"/><path d="M11.6 11.8V21"/>`,
  glasses: `<rect x="2.2" y="9" width="8" height="6.4" rx="2.4"/><rect x="13.8" y="9" width="8" height="6.4" rx="2.4"/><path d="M10.2 11.6h3.6"/>`,
  speaker: `<path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4z"/><path d="M15.4 9.4a4 4 0 0 1 0 5.2"/><path d="M17.8 7a7.4 7.4 0 0 1 0 10"/>`,
  hand: `<path d="M8 12V5.6a1.6 1.6 0 0 1 3.2 0V11"/><path d="M11.2 10.4V4.4a1.6 1.6 0 0 1 3.2 0v6.4"/><path d="M14.4 11V6.8a1.6 1.6 0 0 1 3.2 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.4-2.6L4 14.4a1.6 1.6 0 0 1 2.6-1.8z"/>`,
};

function icon(name: string, cls = ''): string {
  return `<svg class="pm-icon ${cls}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

const KIND_LABEL: Record<Kind, string> = {
  visuospatial: 'Visuospatial',
  phonological: 'Phonological',
};

function itemMarkup(item: Item, index: number): string {
  return `<li class="pm-item" data-item="${item.id}" data-kind="${item.kind}"
      data-relevance="${item.relevance}" style="--i:${index}" tabindex="0"
      aria-label="${KIND_LABEL[item.kind]} memory item: ${item.label}">
    <span class="pm-item-rank">${index + 1}</span>
    <span class="pm-item-main">
      <span class="pm-item-label">${item.label}</span>
      <span class="pm-item-kind">${KIND_LABEL[item.kind]}</span>
    </span>
    <span class="pm-embed" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  </li>`;
}

function scene(): string {
  return `<div class="pm" data-pm>
  <svg class="pm-links" data-links aria-hidden="true"></svg>

  <section class="pm-col pm-col--scene">
    <h4 class="pm-col-label">Perception</h4>

    <div class="pm-view">
      <span class="pm-wearer" data-wearer>
        ${icon('glasses', 'pm-glasses')}
        <span class="pm-wearer-tag">Smart glasses</span>
      </span>

      <span class="pm-cone" data-cone aria-hidden="true"></span>

      <span class="pm-obj pm-obj--banana" data-src="banana">${icon('banana')}</span>
      <span class="pm-obj pm-obj--cup" data-src="cup">${icon('cup')}</span>
      <span class="pm-obj pm-obj--plate" data-src="plate">${icon('plate')}</span>
      <span class="pm-obj pm-obj--fork" data-src="fork">${icon('fork')}</span>
    </div>

    <div class="pm-heard" data-src="speech">
      <span class="pm-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <q class="pm-quote">${QUOTE}</q>
    </div>
  </section>

  <section class="pm-col pm-col--memory">
    <h4 class="pm-col-label">
      Working memory
      <span class="pm-col-note">estimated from what is seen and heard</span>
    </h4>
    <ol class="pm-items" data-items>${ITEMS.map(itemMarkup).join('')}</ol>
  </section>

  <section class="pm-col pm-col--assist">
    <h4 class="pm-col-label">Timing</h4>

    <div class="pm-pickup" data-pickup>
      ${icon('hand', 'pm-hand')}
      <span class="pm-pickup-text">picks up the <b>plate</b> and <b>fork</b></span>
    </div>

    <div class="pm-verdict" data-verdict>
      <span class="pm-verdict-row"><b>High</b> relevance &amp; importance</span>
      <span class="pm-verdict-row"><b>Low</b> cost of displacement</span>
    </div>

    <button class="pm-voice" data-voice type="button"
            aria-label="Spoken assistance. Show why this was said now.">
      ${icon('speaker')}
      <span class="pm-voice-text">${ASSIST}</span>
    </button>
    <p class="pm-voice-hint" data-voice-hint>hover to see why</p>
  </section>
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const pm = q<HTMLElement>('[data-pm]');
  const links = q<SVGSVGElement>('[data-links]');
  const voice = q<HTMLButtonElement>('[data-voice]');

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

  /**
   * Draws the dotted runs from the spoken line to the items that made it
   * worth saying, and marks the one that would be displaced to make room.
   */
  function explainTiming(on: boolean) {
    pm.classList.toggle('is-explaining', on);
    clearLines();

    root.querySelectorAll<HTMLElement>('.pm-item').forEach(el => {
      el.classList.remove('is-relevant', 'is-displaced');
    });
    if (!on) return;

    const items = [...root.querySelectorAll<HTMLElement>('.pm-item')];
    const relevant = items.filter(el => el.dataset.relevance === 'high');
    // The oldest low-relevance item is the one displacement would cost least.
    const displaced = items.find(el => el.dataset.relevance === 'low');

    relevant.forEach(el => el.classList.add('is-relevant'));
    displaced?.classList.add('is-displaced');

    const box = pm.getBoundingClientRect();
    links.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const from = voice.getBoundingClientRect();
    const x1 = from.left - box.left;
    const y1 = from.top - box.top + from.height / 2;

    for (const el of relevant) {
      const to = el.getBoundingClientRect();
      const x2 = to.right - box.left;
      const y2 = to.top - box.top + to.height / 2;
      const mid = (x1 + x2) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
      path.setAttribute('class', 'pm-link');
      links.appendChild(path);
    }

    ctx.announce(
      `Spoken because the plate, the fork and the overheard guest count are highly relevant, ` +
      `and the least relevant item, the banana, is cheap to displace.`
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

  async function run() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    if (ctx.reducedMotion) {
      setStage('done');
      ctx.announce('The glasses see a banana, cup, plate and fork, hear the guest count, and offer assistance as the wearer picks up the plate and fork.');
      settle();
      return;
    }

    setStage('look');
    ctx.announce('The wearer looks at the table.');
    await wait(900);
    if (paused || aborter.signal.aborted) return;

    setStage('see');
    ctx.announce('Objects on the table enter view.');
    await wait(1500);
    if (paused || aborter.signal.aborted) return;

    setStage('hear');
    ctx.announce('The wearer hears how many people are coming to dinner.');
    await wait(1200);
    if (paused || aborter.signal.aborted) return;

    setStage('encode');
    ctx.announce('Each signal is encoded and placed in working memory.');
    await wait(1800);
    if (paused || aborter.signal.aborted) return;

    setStage('pickup');
    ctx.announce('The wearer picks up the plate and fork.');
    await wait(1100);
    if (paused || aborter.signal.aborted) return;

    setStage('done');
    ctx.announce(`The glasses speak: ${ASSIST}.`);
    settle();
  }

  setStage('idle');

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
    'Flow diagram: smart glasses see a banana, cup, plate and fork and hear a guest count; those signals become items in an estimated working memory; the glasses then offer spoken assistance as the wearer picks up the plate and fork',
  hint: 'Hover a memory item to see where it came from, or the spoken line to see why it was said then.',
  transcript: [
    'A wearer of smart glasses looks across a dinner table. Their field of view fans out to a banana, a cup, a plate and a fork.',
    'They also overhear someone say “There’s gonna be four of us for dinner”.',
    'Each signal is encoded and placed in an estimated working memory: four visuospatial items for the objects, one phonological item for what was said. The estimate is built from what the glasses can observe, not from any direct reading of the wearer.',
    'The wearer picks up the plate and the fork.',
    'The timing predictor weighs the moment: the plate, the fork and the overheard guest count are highly relevant, and the least relevant item in memory is cheap to displace. So the glasses speak now rather than earlier.',
    'The glasses say: “You might need more utensils for four guests.”',
    'Hovering any memory item highlights the object or the spoken phrase it came from. Hovering the spoken line draws its reasoning back to the items that justified it.',
  ],
  scene,
  mount,
};
