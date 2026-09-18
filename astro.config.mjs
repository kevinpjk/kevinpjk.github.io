// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://kevinpjk.github.io',

  // The publication list now lives on the homepage. Keep the old route
  // working for anyone who bookmarked or linked to it.
  redirects: {
    '/publications': '/#publications',
  },
});
