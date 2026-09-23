import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/noahd/AppData/Local/Temp/claude/a--Users-noahd-Cours-ISITECH-OharaTracker/3dde0905-aa65-449b-ab85-04aac16516cb/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });
const AUTH = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const BASE = 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE + '/fr', { waitUntil: 'domcontentloaded' });

const load = async (url, w, h, dark, wait = 3000) => {
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await page.evaluate((u, d) => { localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('theme', d ? 'dark' : 'light'); }, AUTH, dark);
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await sleep(wait);
};

// 1. etat du bouton de theme, reellement pilote par localStorage
for (const dark of [true, false]) {
  await load('/fr', 1440, 900, dark);
  const st = await page.evaluate(() => {
    const b = document.querySelector('.nav-theme-toggle');
    return { classeDark: document.documentElement.classList.contains('dark-theme'),
      aria: b.getAttribute('aria-label'), icone: b.querySelector('svg')?.getAttribute('data-icon') };
  });
  console.log(`\n=== BOUTON THEME (localStorage=${dark ? 'dark' : 'light'}) ===\n` + JSON.stringify(st));
}

// 2. drawer mobile connecte
await load('/fr', 390, 844, true);
const loggedIn = await page.evaluate(() => !!JSON.parse(localStorage.getItem('user') || 'null'));
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('header button')).find(x => /ouvrir le menu/i.test(x.getAttribute('aria-label') || ''));
  if (b) b.click();
});
await sleep(1600);
const drawer = await page.evaluate(() => {
  const d = document.querySelector('.p-drawer');
  if (!d) return { trouve: false };
  const items = [];
  d.querySelectorAll('a,button,[role="button"],input,select').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    items.push({ label: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 38), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  });
  return { trouve: true, largeur: getComputedStyle(d).width, nb: items.length, items };
});
console.log('\n=== DRAWER MOBILE (connecte=' + loggedIn + ') ===\n' + JSON.stringify(drawer, null, 1));
await page.screenshot({ path: path.join(OUT, 'zzs-m-drawer-dark.png') });

// 3. bordures : meme selecteurs en clair et en sombre
const borderProbe = () => {
  const pc = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const bl = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const L = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const R = (a, b) => { const l1 = L(a), l2 = L(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const pageBg = pc(getComputedStyle(document.body).backgroundColor);
  const out = [];
  const cases = [
    ['.nav-theme-toggle', 'borderTopColor'],
    ['.nav-lang-trigger', 'borderTopColor'],
    ['.footer-social-btn', 'borderTopColor'],
    ['.layout-topbar', 'borderBottomColor'],
    ['.layout-footer', 'borderTopColor'],
    ['.footer-bottom', 'borderTopColor'],
    ['.p-accordionpanel', 'borderBottomColor'],
    ['.p-card', 'borderTopColor'],
  ];
  for (const [sel, prop] of cases) {
    const el = document.querySelector(sel);
    if (!el) { out.push({ sel, absent: true }); continue; }
    const cs = getComputedStyle(el);
    const raw = pc(cs[prop]);
    if (!raw) { out.push({ sel, pasDeBordure: cs[prop] }); continue; }
    let behind = pc(cs.backgroundColor);
    if (!behind || behind.a < 1) behind = bl(behind || { r: 0, g: 0, b: 0, a: 0 }, pageBg);
    const bc = raw.a < 1 ? bl(raw, behind) : raw;
    out.push({ sel, cote: prop, brut: cs[prop], largeur: cs[prop.replace('Color', 'Width')],
      aplatie: hex(bc), fond: hex(behind), ratio: +R(bc, behind).toFixed(3) });
  }
  return out;
};
for (const dark of [true, false]) {
  await load('/fr/faq', 1440, 900, dark);
  console.log(`\n=== BORDURES /faq (${dark ? 'sombre' : 'clair'}) ===\n` + JSON.stringify(await page.evaluate(borderProbe), null, 1));
}

await browser.close();
