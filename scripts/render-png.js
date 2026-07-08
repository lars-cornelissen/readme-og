// Render the SVG to PNG (needed because GitHub's social preview only accepts raster images).
// Downloads the handwritten fonts once (cached in .fonts/) and embeds them via resvg.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

// The exact same fonts the SVG's @import loads in the browser.
// We ask the Google Fonts CSS API for TTFs (by using a non-woff2 user agent)
// so we get the static instance at the right weight — a variable-font TTF
// would render at the default weight (400) in resvg and look different.
const FONT_CSS_URLS = [
  'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap',
];

async function resolveTtfUrls() {
  const urls = [];
  for (const cssUrl of FONT_CSS_URLS) {
    const res = await fetch(cssUrl, { headers: { 'user-agent': 'curl/8.0' } });
    if (!res.ok) throw new Error(`failed to fetch ${cssUrl}: ${res.status}`);
    const css = await res.text();
    const matches = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
    if (matches.length === 0) throw new Error(`no TTF urls found in ${cssUrl}`);
    urls.push(...matches);
  }
  return urls;
}

export async function ensureFonts(dir = '.fonts') {
  mkdirSync(dir, { recursive: true });
  const marker = `${dir}/.static-fonts`;
  const paths = [];
  if (existsSync(marker)) {
    return readFileSync(marker, 'utf8').split('\n').filter(Boolean);
  }
  for (const url of await resolveTtfUrls()) {
    const path = `${dir}/${url.split('/').pop()}`;
    if (!existsSync(path)) {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`failed to download ${url}: ${res.status}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      console.log(`⬇️  downloaded ${path}`);
    }
    paths.push(path);
  }
  writeFileSync(marker, paths.join('\n'));
  return paths;
}

export async function svgToPng(svgPath, pngPath) {
  const fontFiles = await ensureFonts();
  const svg = readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, {
    font: { fontFiles, loadSystemFonts: true, defaultFontFamily: 'Patrick Hand' },
  });
  writeFileSync(pngPath, resvg.render().asPng());
  console.log(`🖼️  wrote ${pngPath}`);
}

// CLI usage: node scripts/render-png.js in.svg out.png
if (import.meta.url === `file://${process.argv[1]}`) {
  const [svgPath = 'og.svg', pngPath = 'og.png'] = process.argv.slice(2);
  await svgToPng(svgPath, pngPath);
}
