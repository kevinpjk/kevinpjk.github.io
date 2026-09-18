// Prototype-only static rendering. Astro replaces this script in production.
// Run: node research/paper-demos/build.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const shell = await readFile(new URL('shell.html', root), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
for (const filename of (await readdir(new URL('demos/', root))).filter(name => name.endsWith('.js'))) {
  const { demo } = await import(new URL(`demos/${filename}`, root));
  if (!/^[a-z0-9-]+$/.test(demo.id)) throw new Error('Invalid demo id');
  const values = Object.fromEntries(Object.entries(demo).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(value)]));
  Object.assign(values, {
    initialStage: demo.render(0), // trusted, repo-authored markup only
    initialLabel: escape(`1 / ${demo.steps.length} · ${demo.steps[0].label}`),
    initialCaption: escape(demo.steps[0].caption),
    initialAction: escape(demo.steps[0].action),
    stepCount: demo.steps.length,
    transcript: demo.transcript.map(text => `<li>${escape(text)}</li>`).join('')
  });
  const html = shell.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value ${key}`);
    return values[key];
  });
  await writeFile(new URL(`${demo.id}.html`, root), html);
  if (demo.id === 'codellaborator') await writeFile(new URL('index.html', root), html);
  console.log(`Rendered ${demo.id}.html`);
}
