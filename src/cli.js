#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { generateSvg } from './generate.js';

const { values } = parseArgs({
  options: {
    repo: { type: 'string', short: 'r' },
    description: { type: 'string', short: 'd' },
    language: { type: 'string', short: 'l' },
    stars: { type: 'string', short: 's' },
    theme: { type: 'string', short: 't', default: 'paper' },
    out: { type: 'string', short: 'o', default: 'og.svg' },
    fetch: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help || !values.repo) {
  console.log(`readme-og — hand-drawn style OG images for GitHub repos

Usage:
  readme-og --repo owner/name [options]

Options:
  -r, --repo         Repo slug, e.g. octocat/hello-world   (required)
  -d, --description  Description text
  -l, --language     Primary language
  -s, --stars        Star count
  -t, --theme        paper | dark | blueprint   (default: paper)
  -o, --out          Output file                (default: og.svg)
      --fetch        Fill missing fields from the GitHub API
  -h, --help         Show this help
`);
  process.exit(values.help ? 0 : 1);
}

let { repo, description, language, theme, out } = values;
let stars = values.stars != null ? Number(values.stars) : undefined;

if (values.fetch) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { accept: 'application/vnd.github+json' },
  });
  if (res.ok) {
    const data = await res.json();
    description ??= data.description ?? '';
    language ??= data.language ?? undefined;
    stars ??= data.stargazers_count;
  } else {
    console.warn(`warning: GitHub API returned ${res.status}, using provided values only`);
  }
}

const svg = generateSvg({ repo, description, language, stars, theme });
writeFileSync(out, svg);
console.log(`✏️  wrote ${out} (${theme} theme)`);
