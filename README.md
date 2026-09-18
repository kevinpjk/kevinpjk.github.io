# kevinpjk.github.io

Personal academic site for Kevin Pu — built with [Astro](https://astro.build/), plain SCSS, and YAML content files.

## Develop

```sh
npm ci          # requires Node >= 22.12
npm run dev     # http://localhost:4321
npm run build   # static output to ./dist
npm run preview # serve the built site
```

## Content

All site content lives in `src/data/` as YAML and is loaded through `src/lib/data.ts`:

| File | Contents |
| --- | --- |
| `publications.yaml` | Full publication list. `selected: true` promotes a paper to the homepage. |
| `news.yaml` | News entries, newest first. Supports `**bold**`, `_italic_`, and `[links](url)`. |
| `venues.yaml` | Per-venue display colors and full names. |
| `gallery.yaml` | Generated — see below. |

Teaser images and PDFs are served from `public/assets/`.

### Gallery

`src/data/gallery.yaml` is generated from the folders in
`public/assets/img/gallery/`:

```sh
node scripts/rebuild-gallery.mjs
```

Each folder becomes an event. A still with a same-named video beside it
(`IMG_1234.jpg` + `IMG_1234.MP4`) is emitted as a `live` photo. Existing
`location` and `date` fields are preserved across runs.

## Deploy

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages. Work on a branch; merging to `master`
is what goes live.
