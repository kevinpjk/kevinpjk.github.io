import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ImageMetadata } from 'astro';

/**
 * Teaser images, keyed by the filename used in publications.yaml.
 *
 * They live in src/assets/ rather than public/ so Astro's build-time image
 * pipeline can emit resized, format-converted variants. Vite requires a
 * literal glob, so this map is the bridge between the YAML filename strings
 * and the imported modules.
 */
const teaserModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/papers/*.{png,jpg,jpeg,webp,avif}',
  { eager: true }
);

const teasers = new Map<string, ImageMetadata>(
  Object.entries(teaserModules).map(([filePath, mod]) => [
    filePath.split('/').pop()!,
    mod.default,
  ])
);

/** Returns the processed image for a teaser filename, or undefined if absent. */
export function getTeaser(filename: string | null): ImageMetadata | undefined {
  if (!filename) return undefined;
  return teasers.get(filename);
}

const dataDir = path.resolve('src/data');

function loadYaml<T>(filename: string): T {
  const raw = fs.readFileSync(path.join(dataDir, filename), 'utf-8');
  return yaml.load(raw) as T;
}

// Types
export interface Author {
  name: string;
  url: string | null;
  highlight?: boolean;
}

export interface PubLinks {
  pdf: string | null;
  video: string | null;
  arxiv: string | null;
  website: string | null;
  doi: string | null;
  code: string | null;
}

export interface Publication {
  slug: string;
  title: string;
  authors: Author[];
  venue: string;
  venue_full?: string;
  year: number;
  workshop?: boolean;
  category: string | null;
  award: string | null;
  links: PubLinks;
  abstract: string;
  selected: boolean;
  short_name?: string;
  short_desc?: string;
  emoji?: string;
  teaser: string | null;
  teaser_type: string | null;
  ring_concept: string;
  ring_keywords: string[];
}

export interface Manuscript {
  slug: string;
  title: string;
  short_name: string;
  short_desc: string;
  authors: Author[];
  year: number;
}

export interface SiteConfig {
  job_market_banner: {
    enabled: boolean;
    heading: string;
    body: string;
    links: { label: string; href: string }[];
    dismissible: boolean;
  };
  manuscripts_under_review: {
    enabled: boolean;
    heading: string;
    label: string;
  };
}

export function getSiteConfig(): SiteConfig {
  return loadYaml<SiteConfig>('site.yaml');
}

/**
 * Manuscripts under review. Returns an empty array unless the flag in
 * site.yaml is explicitly enabled, so nothing leaks by accident. These are
 * never part of getPublications() — they live in a separate file so no code
 * path can count them among published papers.
 */
export function getManuscriptsUnderReview(): Manuscript[] {
  if (!getSiteConfig().manuscripts_under_review.enabled) return [];
  return loadYaml<Manuscript[]>('manuscripts.yaml');
}

export interface NewsItem {
  date: string;
  content: string;
}

export interface VenueInfo {
  color: string;
  full_name: string;
}

export function getPublications(): Publication[] {
  return loadYaml<Publication[]>('publications.yaml');
}

/** Peer-reviewed conference papers only — excludes workshop papers. */
export function getConferencePublications(): Publication[] {
  return getPublications().filter(p => !p.workshop);
}

export function getWorkshopPublications(): Publication[] {
  return getPublications().filter(p => p.workshop);
}

export function getSelectedPublications(): Publication[] {
  return getPublications().filter(p => p.selected);
}

export function getNews(): NewsItem[] {
  return loadYaml<NewsItem[]>('news.yaml');
}

export interface GalleryPhoto {
  src: string;
  thumb: string;
  caption?: string;
  video?: string;
  type?: 'live' | 'image';
}

export interface GalleryEvent {
  event: string;
  location: string;
  date: string;
  cover: string;
  photos: GalleryPhoto[];
}

export function getVenues(): Record<string, VenueInfo> {
  return loadYaml<Record<string, VenueInfo>>('venues.yaml');
}

export function getGallery(): GalleryEvent[] {
  return loadYaml<GalleryEvent[]>('gallery.yaml');
}
