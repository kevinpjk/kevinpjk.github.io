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

    if (button.dataset.demoAction === 'reset') controller.reset();
    if (button.dataset.demoAction === 'pause') controller.pause();
  });

  // Mount when the demo first becomes visible; pause when it leaves.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        void activate(root);
      } else {
        mounted.get(root)?.pause();
      }
    }
  }, { threshold: 0.35 });

  observer.observe(root);
  observers.add(observer);
}

function pauseAllIfHidden() {
  if (!document.hidden) return;
  document.querySelectorAll<HTMLElement>('[data-paper-demo]').forEach(root => {
    mounted.get(root)?.pause();
  });
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
}

document.addEventListener('visibilitychange', pauseAllIfHidden);
initDemos();
document.addEventListener('astro:after-swap', initDemos);
document.addEventListener('astro:before-swap', teardownDemos);
