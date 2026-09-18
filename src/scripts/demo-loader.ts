import type { DemoContext, DemoController, PaperDemo } from '../demos/types';

/**
 * Activation and lifecycle for live paper demos.
 *
 * This is the only demo code in the initial page payload. A paper's own module
 * is imported when its demo first scrolls into view, so a visitor who never
 * reaches one downloads nothing extra.
 *
 * Vite needs a literal glob to produce lazy chunks. Do not pass
 * `{ eager: true }` — that would bundle every demo into the first load.
 */
const demoModules = import.meta.glob<{ demo: PaperDemo }>('../demos/papers/*.ts');

const mounted = new WeakMap<HTMLElement, DemoController>();
const pending = new WeakMap<HTMLElement, Promise<DemoController | null>>();
const wired = new WeakSet<HTMLElement>();
const observers = new Set<IntersectionObserver>();

/**
 * At most one demo animates at a time.
 *
 * Several demos sit on one page, and letting each autoplay as it scrolls past
 * means a visitor arrives to a wall of motion, misses the interactions, and
 * has nothing to focus on. A demo becomes the active one when it is
 * substantially in view AND the most visible demo on screen, or as soon as the
 * visitor clicks or focuses inside it. Starting one pauses the previous.
 */
let activeRoot: HTMLElement | null = null;
const roots = new Set<HTMLElement>();

/** How much of a demo must be on screen before it may start on its own. */
const AUTO_PLAY_RATIO = 0.55;

/** Fraction of a demo currently within the viewport, measured live. */
function visibleFraction(root: HTMLElement): number {
  const box = root.getBoundingClientRect();
  if (box.height === 0) return 0;
  const shown = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
  return Math.max(0, Math.min(1, shown / box.height));
}

async function makeActive(root: HTMLElement) {
  if (activeRoot === root) return;

  const previous = activeRoot;
  activeRoot = root;
  if (previous) mounted.get(previous)?.pause();

  const controller = await activate(root);
  // Another demo may have taken over while this one was loading.
  if (controller && activeRoot === root) controller.play();
}

/**
 * Pick the demo that should be playing: the most visible one, provided it is
 * substantially on screen. Ratios are measured here rather than read from
 * cached IntersectionObserver entries, because those are recorded at
 * different moments per element and comparing them left the slot stuck on a
 * demo that had already scrolled past.
 */
let rebalanceQueued = false;
function rebalance() {
  if (rebalanceQueued) return;
  rebalanceQueued = true;

  requestAnimationFrame(() => {
    rebalanceQueued = false;

    let best: HTMLElement | null = null;
    let bestRatio = AUTO_PLAY_RATIO;
    roots.forEach(root => {
      const ratio = visibleFraction(root);
      if (ratio >= bestRatio) {
        best = root;
        bestRatio = ratio;
      }
    });

    if (best) {
      void makeActive(best);
    } else if (activeRoot) {
      mounted.get(activeRoot)?.pause();
      activeRoot = null;
    }
  });
}

const REDUCED = '(prefers-reduced-motion: reduce)';

function makeContext(root: HTMLElement): DemoContext {
  const live = root.querySelector<HTMLElement>('[data-demo-live]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-demo-action="pause"]');

  return {
    reducedMotion: window.matchMedia(REDUCED).matches,
    announce(text) {
      if (live) live.textContent = text;
    },
    setRunning(running) {
      root.dataset.demoRunning = String(running);
      // Pause is only meaningful while something is animating, so it is
      // hidden rather than left as a button that does nothing.
      if (pauseBtn) {
        pauseBtn.hidden = !running;
        pauseBtn.textContent = 'Pause';
        pauseBtn.setAttribute('aria-label', 'Pause the demo animation');
      }
    },
  };
}

async function mount(root: HTMLElement): Promise<DemoController | null> {
  const id = root.dataset.demoId;
  const loader = demoModules[`../demos/papers/${id}.ts`];
  if (!loader) return null;

  const { demo } = await loader();
  const controller = demo.mount(root, makeContext(root));
  mounted.set(root, controller);
  return controller;
}

async function activate(root: HTMLElement): Promise<DemoController | null> {
  const existing = mounted.get(root);
  if (existing) return existing;

  let promise = pending.get(root);
  if (!promise) {
    promise = mount(root).catch(error => {
      // Leave the server-rendered scene and the transcript in place.
      pending.delete(root);
      const status = root.querySelector<HTMLElement>('[data-demo-status]');
      if (status) {
        status.removeAttribute('hidden');
        status.textContent =
          'The interactive example could not load. The walkthrough below describes it.';
      }
      console.error('Paper demo failed to load', error);
      return null;
    });
    pending.set(root, promise);
  }
  return promise;
}

function wire(root: HTMLElement) {
  if (wired.has(root)) return;
  wired.add(root);

  // Controls stay hidden until now, so a visitor without JS never sees a
  // button that cannot work.
  root.querySelector<HTMLElement>('[data-demo-controls]')?.removeAttribute('hidden');

  root.addEventListener('click', async event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-demo-action]');
    if (!button || !root.contains(button)) return;

    const controller = await activate(root);
    if (!controller) return;

    if (button.dataset.demoAction === 'reset') {
      await makeActive(root);
      mounted.get(root)?.reset();
      return;
    }
    if (button.dataset.demoAction === 'pause') {
      controller.pause();
      if (activeRoot === root) activeRoot = null;
    }
  });

  // Direct interaction always wins over the visibility heuristic: if the
  // visitor reaches for a demo, that is the one they mean.
  const claim = () => void makeActive(root);
  root.addEventListener('pointerdown', claim);
  root.addEventListener('focusin', claim);

  // Mounting and playing are separate concerns. A demo mounts as soon as any
  // part of it is on screen, so its hover and keyboard interactions are live
  // even while a different demo is the one animating. Only the most visible
  // demo actually plays.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {

      // Mount as soon as any part is on screen so hover and keyboard
      // interactions are live even while a different demo is animating.
      if (entry.isIntersecting) void activate(root);
    }
    rebalance();
  }, { threshold: [0, 0.2, 0.4, AUTO_PLAY_RATIO, 0.75, 1] });

  roots.add(root);
  observer.observe(root);
  observers.add(observer);

  // Scrolling between two thresholds still changes which demo is most
  // visible, so re-check on scroll as well as on threshold crossings.
  window.addEventListener('scroll', rebalance, { passive: true });
}

function pauseAllIfHidden() {
  if (!document.hidden) return;
  document.querySelectorAll<HTMLElement>('[data-paper-demo]').forEach(root => {
    mounted.get(root)?.pause();
  });
  activeRoot = null;
}

function initDemos() {
  document.querySelectorAll<HTMLElement>('[data-paper-demo]').forEach(wire);
}

/**
 * Dispose every mounted controller before a view transition swaps the DOM.
 * Roots are re-wired after the swap; PaperDetailOverlays also relocates
 * .paper-detail nodes to <body>, so a root can be re-encountered.
 */
function teardownDemos() {
  document.querySelectorAll<HTMLElement>('[data-paper-demo]').forEach(root => {
    mounted.get(root)?.destroy();
    mounted.delete(root);
    pending.delete(root);
  });
  observers.forEach(o => o.disconnect());
  observers.clear();
  roots.clear();
  activeRoot = null;
}

document.addEventListener('visibilitychange', pauseAllIfHidden);
initDemos();
document.addEventListener('astro:after-swap', initDemos);
document.addEventListener('astro:before-swap', teardownDemos);
