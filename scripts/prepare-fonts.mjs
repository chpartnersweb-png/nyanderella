import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Ask Google Fonts for just the characters used by this site's source, then
// serve the resulting fonts locally. Re-run after adding Japanese copy.
async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? sourceFiles(path.join(directory, entry.name))
    : /\.(astro|ts)$/.test(entry.name) ? [path.join(directory, entry.name)] : []))).flat();
}
const sources = await sourceFiles('src');
const copy = (await Promise.all(sources.map(file => readFile(file, 'utf8')))).join('');
const text = [...new Set([...copy, ...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i))])]
  .filter(character => character.codePointAt(0) >= 32).sort().join('');
const api = new URL('https://fonts.googleapis.com/css2');
api.searchParams.set('family', 'Zen Maru Gothic:wght@400;700');
api.searchParams.set('display', 'swap');
api.searchParams.set('text', text);
const response = await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error(`Font CSS request failed: ${response.status}`);
const stylesheet = await response.text();
const faces = [...stylesheet.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)];
await mkdir('public/fonts', { recursive: true });
const localFaces = [];
for (const [, block] of faces) {
  const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
  const remote = block.match(/url\(([^)]+)\)/)?.[1];
  const format = block.match(/format\(['"]([^'"]+)['"]\)/)?.[1];
  if (!weight || !remote || new URL(remote).hostname !== 'fonts.gstatic.com') throw new Error('Unexpected font response');
  const ext = format === 'woff2' ? 'woff2' : 'ttf';
  const name = `zen-maru-gothic-${weight}.${ext}`;
  const font = await fetch(remote);
  if (!font.ok) throw new Error(`Font download failed: ${font.status}`);
  const buffer = Buffer.from(await font.arrayBuffer());
  await writeFile(path.join('public/fonts', name), buffer);
  localFaces.push(`@font-face{font-family:'Zen Maru Gothic';font-style:normal;font-weight:${weight};font-display:swap;src:url('/fonts/${name}') format('${format}');}`);
  console.log(`${name}: ${buffer.length} bytes`);
}
if (localFaces.length !== 2) throw new Error('Expected two font weights');
await writeFile('public/fonts/zen-maru-gothic.css', localFaces.join('\n') + '\n');
const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/OFL.txt');
if (!license.ok) throw new Error('Font license download failed');
await writeFile('public/fonts/OFL-ZenMaruGothic.txt', await license.text());
console.log(`Prepared ${text.length} characters and font license.`);
