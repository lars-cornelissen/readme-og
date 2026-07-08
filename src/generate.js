import {
  seededRandom,
  roughRect,
  roughCircle,
  roughStar,
  roughUnderline,
  roughLine,
} from './rough.js';

const WIDTH = 1280;
const HEIGHT = 640;

// GitHub linguist-ish colors for common languages.
const LANGUAGE_COLORS = {
  javascript: '#f1e05a',
  typescript: '#3178c6',
  python: '#3572A5',
  go: '#00ADD8',
  rust: '#dea584',
  java: '#b07219',
  ruby: '#701516',
  'c++': '#f34b7d',
  c: '#555555',
  'c#': '#178600',
  php: '#4F5D95',
  swift: '#F05138',
  kotlin: '#A97BFF',
  shell: '#89e051',
  html: '#e34c26',
  css: '#563d7c',
};

const THEMES = {
  paper: {
    bg: '#fdfaf3',
    ink: '#2b2b2b',
    accent: '#d94f30',
    muted: '#7a746a',
  },
  dark: {
    bg: '#1e1e2a',
    ink: '#eceae4',
    accent: '#f5c542',
    muted: '#9a97a8',
  },
  blueprint: {
    bg: '#12314e',
    ink: '#dbe9f7',
    accent: '#7fd1ff',
    muted: '#8fb3d1',
  },
};

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStars(n) {
  if (n == null) return null;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

// Naive word wrap for the description (SVG has no automatic wrapping).
function wrapText(text, maxCharsPerLine, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxCharsPerLine) {
      lines.push(line.trim());
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line += ' ' + word;
    }
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim());
  if (words.join(' ').length > maxCharsPerLine * maxLines) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, ' …');
  }
  return lines;
}

/**
 * Generate a hand-drawn style OG image as an SVG string.
 *
 * @param {object} opts
 * @param {string} opts.repo        e.g. "octocat/hello-world"
 * @param {string} [opts.description]
 * @param {string} [opts.language]
 * @param {number} [opts.stars]
 * @param {string} [opts.theme]     paper | dark | blueprint
 */
export function generateSvg({ repo, description = '', language, stars, theme = 'paper' }) {
  if (!repo) throw new Error('repo is required, e.g. "owner/name"');
  const t = THEMES[theme] ?? THEMES.paper;
  const rnd = seededRandom(repo + theme);

  const [owner, name = ''] = repo.split('/');
  const title = name || owner;
  const titleSize = title.length > 22 ? 64 : title.length > 14 ? 82 : 96;
  const descLines = wrapText(description, 52, 2);
  const starsLabel = formatStars(stars);
  const langColor = language ? LANGUAGE_COLORS[language.toLowerCase()] ?? t.accent : null;

  // Layout anchors
  const left = 110;
  const titleY = 250;
  const underlineY = titleY + 22;
  const descY = titleY + 90;
  const footerY = HEIGHT - 110;

  // Decorative sketch bits
  const border = roughRect(45, 45, WIDTH - 90, HEIGHT - 90, rnd, 3.5);
  const cornerDoodle = roughLine(WIDTH - 200, 90, WIDTH - 110, 90, rnd, 2);
  const underline = roughUnderline(left, underlineY, Math.min(680, title.length * titleSize * 0.52), rnd);

  const footerItems = [];
  let footerX = left;

  if (langColor) {
    footerItems.push(`
    <g stroke="${langColor}" stroke-width="3" fill="${langColor}" fill-opacity="0.35">
      ${roughCircle(footerX + 14, footerY - 8, 14, rnd)}
    </g>
    <text x="${footerX + 42}" y="${footerY}" class="hand meta">${escapeXml(language)}</text>`);
    footerX += 42 + language.length * 15 + 70;
  }

  if (starsLabel) {
    footerItems.push(`
    <g stroke="${t.ink}" stroke-width="2.5">
      ${roughStar(footerX + 14, footerY - 10, 17, rnd)}
    </g>
    <text x="${footerX + 42}" y="${footerY}" class="hand meta">${escapeXml(starsLabel)} stars</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&amp;family=Caveat:wght@600&amp;display=swap');
    .hand  { font-family: 'Patrick Hand', 'Comic Sans MS', 'Segoe Print', cursive; fill: ${t.ink}; }
    .title { font-family: 'Caveat', 'Patrick Hand', 'Comic Sans MS', cursive; font-weight: 600; fill: ${t.ink}; }
    .owner { font-size: 34px; fill: ${t.muted}; }
    .desc  { font-size: 34px; }
    .meta  { font-size: 30px; }
  </style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${t.bg}" />

  <!-- sketchy double border -->
  <g stroke="${t.ink}" stroke-width="3" fill="none" stroke-linecap="round">
    ${border}
  </g>

  <!-- corner doodle -->
  <g stroke="${t.accent}" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="${cornerDoodle}" />
  </g>

  <text x="${left}" y="150" class="hand owner">${escapeXml(owner)} /</text>

  <text x="${left}" y="${titleY}" class="title" font-size="${titleSize}">${escapeXml(title)}</text>
  <g stroke="${t.accent}" stroke-width="5" fill="none" stroke-linecap="round">
    ${underline}
  </g>

  ${descLines
    .map(
      (line, i) =>
        `<text x="${left}" y="${descY + i * 46}" class="hand desc">${escapeXml(line)}</text>`
    )
    .join('\n  ')}

  ${footerItems.join('\n')}
</svg>
`;
}
