import type { PaperDemo } from '../demos/types';

export interface DemoController {
  act(action: string): void;
  destroy(): void;
}

const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Shared stepping and playback for scripted paper demos.
 *
 * Every listener and observer is registered through one AbortController /
 * IntersectionObserver pair, so destroy() genuinely tears the instance down.
 * The loader calls it on navigation; without that, listeners would accumulate
 * against detached roots because this site navigates via <ClientRouter />.
 */
export function createPlayer(root: HTMLElement, demo: PaperDemo): DemoController {
  const { steps } = demo;
  const stage = root.querySelector<HTMLElement>('[data-demo-stage]');
  const caption = root.querySelector<HTMLElement>('[data-demo-caption]');
  const counter = root.querySelector<HTMLElement>('[data-demo-counter]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-demo-action="play"]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-demo-action="next"]');
  const backBtn = root.querySelector<HTMLButtonElement>('[data-demo-action="back"]');

  if (!stage || !caption || !counter || !nextBtn || !backBtn) {
    return { act() {}, destroy() {} };
  }

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };
  const motion = window.matchMedia(REDUCED);

  let index = 0;
  let playing = false;
  let timer: number | undefined;

  function clearTimer() {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  }

  function stop() {
    clearTimer();
    playing = false;
    syncControls();
  }

  function syncControls() {
    root.dataset.demoPlaying = String(playing);
    backBtn!.disabled = index === 0;
    nextBtn!.textContent = steps[index].action;

    if (!playBtn) return;
    // Under reduced motion automatic playback is withheld entirely, so the
    // control is removed rather than left as a button that does nothing.
    playBtn.hidden = motion.matches;
    const atEnd = index === steps.length - 1;
    const label = playing ? 'Pause' : atEnd ? 'Replay' : 'Play';
    playBtn.textContent = label;
    playBtn.setAttribute('aria-label', `${label} the walkthrough`);
  }

  function show(next: number) {
    index = Math.max(0, Math.min(next, steps.length - 1));
    stage!.innerHTML = demo.render(index);
    counter!.textContent = `${index + 1} / ${steps.length} · ${steps[index].label}`;
    caption!.textContent = steps[index].caption;
    syncControls();
  }

  function schedule() {
    clearTimer();
    timer = window.setTimeout(() => {
      if (motion.matches || document.hidden || index >= steps.length - 1) {
        stop();
        return;
      }
      show(index + 1);
      if (index >= steps.length - 1) stop();
      else schedule();
    }, steps[index].duration ?? 3000);
  }

  function act(action: string) {
    switch (action) {
      case 'play':
        if (playing) return stop();
        if (motion.matches) return;
        if (index === steps.length - 1) show(0);
        playing = true;
        syncControls();
        schedule();
        return;
      case 'next':
        stop();
        show(index === steps.length - 1 ? 0 : index + 1);
        return;
      case 'back':
        stop();
        show(index - 1);
        return;
      case 'reset':
        stop();
        show(0);
        return;
    }
  }

  // Pause whenever the demo can no longer be seen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  }, listen);
  window.addEventListener('pagehide', stop, listen);

  // Respond to the preference changing mid-session.
  motion.addEventListener('change', () => {
    stop();
    if (motion.matches && document.activeElement === playBtn) nextBtn!.focus();
  }, listen);

  const observer = new IntersectionObserver(entries => {
    if (!entries[0]?.isIntersecting) stop();
  });
  observer.observe(root);

  show(0);

  return {
    act,
    destroy() {
      stop();
      observer.disconnect();
      aborter.abort();
    },
  };
}
