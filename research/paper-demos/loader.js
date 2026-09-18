// The only initial JavaScript. Demo code loads after explicit interaction.
for (const root of document.querySelectorAll('[data-paper-demo]')) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  root.querySelector('[data-controls]').hidden = false;
  root.querySelector('[data-motion-note]').hidden = !motion.matches;
  let mounted;
  let busy = false;
  root.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !root.contains(button) || button.getAttribute('aria-disabled') === 'true' || busy) return;
    busy = true;
    const status = root.querySelector('[data-load-status]');
    root.setAttribute('aria-busy', 'true');
    try {
      mounted ??= import(root.dataset.demoModule).then(module => module.mount(root));
      const controller = await mounted;
      status.hidden = true;
      controller.act(button.dataset.action);
    } catch (error) {
      mounted = undefined;
      status.hidden = false;
      status.textContent = 'The interactive example could not load. Try again or read the walkthrough below.';
      console.error('Paper demo failed to load', error);
    } finally {
      root.removeAttribute('aria-busy');
      busy = false;
    }
  });
  motion.addEventListener('change', event => {
    root.querySelector('[data-motion-note]').hidden = !event.matches;
  });
}
