import type { DemoController } from './demo-player';

/**
 * Activation and lifecycle for scripted paper demos.
 *
 * This is the only demo code in the initial page payload. The player and the
 * paper's own module are imported on first activation, so a visitor who never
 * touches a demo downloads neither.
 *
 * Vite needs a literal glob to produce lazy chunks. Do not pass
 * `{ eager: true }` here — that would bundle every demo into the first load.
 */
const demoModules = import.meta.glob<{ demo: import('../demos/types').PaperDemo }>(
  '../demos/papers/*.ts'
);

const mounted = new WeakMap<HTMLElement, DemoController>();
const pending = new WeakMap<HTMLElement, Promise<DemoController | null>>();
const wired = new WeakSet<HTMLElement>();

async function mount(root: HTMLElement): Promise<DemoController | null> {
  const id = root.dataset.demoId;
  const loader = demoModules[`../demos/papers/${id}.ts`];
  if (!loader) return null;

  const [{ demo }, { createPlayer }] = await Promise.all([
    loader(),
    import('./demo-player'),
  ]);
  const controller = createPlayer(root, demo);
  mounted.set(root, controller);
  return controller;
}

function wire(root: HTMLElement) {
  if (wired.has(root)) return;
  wired.add(root);

  // Controls are hidden until this runs, so a visitor without JS is never
  // shown a button that cannot work.
  root.querySelector<HTMLElement>('[data-demo-controls]')?.removeAttribute('hidden');

  root.addEventListener('click', async event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-demo-action]');
    if (!button || !root.contains(button) || button.disabled) return;

    const action = button.dataset.demoAction!;
    const status = root.querySelector<HTMLElement>('[data-demo-status]');

    const existing = mounted.get(root);
    if (existing) return existing.act(action);

    root.setAttribute('aria-busy', 'true');
    try {
      let promise = pending.get(root);
      if (!promise) {
        promise = mount(root);
        pending.set(root, promise);
      }
      const controller = await promise;
      if (!controller) return;
      status?.setAttribute('hidden', '');
      controller.act(action);
    } catch (error) {
      // Leave the server-rendered first scene and the transcript in place.
      pending.delete(root);
      if (status) {
        status.removeAttribute('hidden');
        status.textContent =
          'The interactive example could not load. The walkthrough below describes it.';
      }
      console.error('Paper demo failed to load', error);
    } finally {
      root.removeAttribute('aria-busy');
    }
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
}

initDemos();
document.addEventListener('astro:after-swap', initDemos);
document.addEventListener('astro:before-swap', teardownDemos);
