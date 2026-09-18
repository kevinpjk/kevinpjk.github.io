// Shared, dependency-free playback. Paper-specific content lives in demos/*.js.
export function createPlayer(root, { steps, render }) {
  let index = 0;
  let playing = false;
  let timer;
  let animationTimer;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = root.querySelector('[data-stage]');
  const playButton = root.querySelector('[data-action="play"]');
  const nextButton = root.querySelector('[data-action="next"]');
  const previousButton = root.querySelector('[data-action="previous"]');
  const aborter = new AbortController();
  const options = { signal: aborter.signal };

  function updateControls() {
    root.dataset.playing = String(playing);
    playButton.textContent = playing ? 'Ⅱ Pause' : index === steps.length - 1 ? '▶ Replay' : '▶ Play';
    playButton.setAttribute('aria-label', playing ? 'Pause the walkthrough' : index === steps.length - 1 ? 'Replay the walkthrough' : 'Play the walkthrough');
    previousButton.setAttribute('aria-disabled', String(index === 0));
    // Keep Next focusable at the end so keyboard focus does not disappear.
    nextButton.textContent = steps[index].action || 'Start again →';
  }

  function stop() { clearTimeout(timer); playing = false; updateControls(); }

  function show(nextIndex) {
    index = nextIndex;
    stage.innerHTML = render(index);
    stage.classList.remove('is-transitioning');
    clearTimeout(animationTimer);
    if (!motion.matches) {
      void stage.offsetWidth;
      stage.classList.add('is-transitioning');
      animationTimer = setTimeout(() => stage.classList.remove('is-transitioning'), 260);
    }
    root.querySelector('[data-step-label]').textContent = `${index + 1} / ${steps.length} · ${steps[index].label}`;
    root.querySelector('[data-caption]').textContent = steps[index].caption;
    updateControls();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (motion.matches || document.hidden) { stop(); return; }
      if (index === steps.length - 1) { stop(); return; }
      show(index + 1);
      if (index === steps.length - 1) stop();
      else schedule();
    }, steps[index].duration || 3200);
  }

  function act(action) {
    if (action === 'previous' && index === 0) return;
    if (action === 'play') {
      if (playing) { stop(); return; }
      if (motion.matches) return;
      if (index === steps.length - 1) show(0);
      playing = true;
      updateControls();
      schedule();
    } else {
      stop();
      if (action === 'next') show((index + 1) % steps.length);
      if (action === 'previous') show(Math.max(0, index - 1));
      if (action === 'reset') show(0);
    }
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, options);
  window.addEventListener('pagehide', stop, options);
  motion.addEventListener('change', () => {
    stop();
    if (motion.matches) {
      stage.classList.remove('is-transitioning');
      if (document.activeElement === playButton) nextButton.focus();
    }
  }, options);
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stop();
  });
  observer.observe(root);
  updateControls();
  return {
    act,
    destroy() { stop(); clearTimeout(animationTimer); observer.disconnect(); aborter.abort(); }
  };
}
