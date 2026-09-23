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
await page.evaluate(u => localStorage.setItem('user', JSON.stringify(u)), AUTH);

const load = async (url, w, h, dark, wait = 3000) => {
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await page.evaluate(d => document.documentElement.classList.toggle('dark-theme', d), dark);
  await sleep(wait);
};

const shot = (name, clip) => page.screenshot({ path: path.join(OUT, `zzs-${name}.png`), ...(clip ? { clip, captureBeyondViewport: true } : {}) });

// 1. Header mobile : le wordmark deborde-t-il hors du header ?
await load('/fr', 390, 844, true);
await shot('m-home-top', { x: 0, y: 0, width: 390, height: 190 });
await load('/fr', 390, 844, false);
await shot('m-home-top-light', { x: 0, y: 0, width: 390, height: 190 });

// 2. Menu mobile (Drawer teleporte dans body)
await load('/fr', 390, 844, true);
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(x => /menu/i.test(x.getAttribute('aria-label') || ''));
  if (b) b.click();
});
await sleep(1500);
const drawer = await page.evaluate(() => {
  const d = document.querySelector('.p-drawer');
  if (!d) return { trouve: false, html: document.body.lastElementChild?.className };
  const items = [];
  d.querySelectorAll('a,button,[role="button"],input,select').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    items.push({ label: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 38), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  });
  const cs = getComputedStyle(d);
  return { trouve: true, largeur: cs.width, bg: cs.backgroundColor, items };
});
console.log('\n=== DRAWER MOBILE ===\n' + JSON.stringify(drawer, null, 1));
await shot('m-drawer-dark');

// 3. Pages mobiles en sombre : pleine page
for (const [n, u] of [['tarifs', '/fr/tarifs'], ['manga', '/fr/manga/tsuyokute-new-saga'], ['bibliotheque', '/fr/bibliotheque'], ['statistiques', '/fr/statistiques'], ['listes', '/fr/listes'], ['communaute', '/fr/communaute'], ['decouverte', '/fr/decouverte'], ['profil', '/fr/profil'], ['faq', '/fr/faq']]) {
  await load(u, 390, 844, true, 3200);
  await page.screenshot({ path: path.join(OUT, `zzs-m-${n}-dark.png`), fullPage: true });
}

await browser.close();
console.log('\nOK ->', OUT);
