import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

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
  code: string | null;
}

export interface Publication {
  slug: string;
  title: string;
  authors: Author[];
  venue: string;
  year: number;
  category: string;
  award: string | null;
  links: PubLinks;
  abstract: string;
  selected: boolean;
  teaser: string;
  teaser_type: string;
  ring_concept: string;
  ring_keywords: string[];
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
