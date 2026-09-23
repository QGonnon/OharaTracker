import puppeteer from 'puppeteer';
import fs from 'node:fs';

const AUTH = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const BASE = 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE + '/fr', { waitUntil: 'domcontentloaded' });
await page.evaluate(u => localStorage.setItem('user', JSON.stringify(u)), AUTH);

const probe = async (url, w, h, dark, fn, label) => {
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await page.evaluate(d => document.documentElement.classList.toggle('dark-theme', d), dark);
  await sleep(3000);
  const out = await page.evaluate(fn);
  console.log('\n===== ' + label + ' =====');
  console.log(JSON.stringify(out, null, 1));
};

const logoProbe = () => {
  const a = document.querySelector('.topbar-logo a');
  const box = a.getBoundingClientRect();
  const hdr = document.querySelector('header.layout-topbar');
  const nav = hdr.querySelector('nav');
  const cs = getComputedStyle(a);
  const hcs = getComputedStyle(hdr);
  const logoDiv = document.querySelector('.topbar-logo');
  const range = document.createRange();
  range.selectNodeContents(a);
  const rects = Array.from(range.getClientRects()).map(r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }));
  return {
    texte: a.textContent.trim(),
    logoRect: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) },
    lignesDeTexte: rects,
    headerRect: (() => { const r = hdr.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    headerOverflow: hcs.overflow + ' / ' + hcs.overflowY,
    headerHeight: hcs.height,
    navOverflow: getComputedStyle(nav).overflow,
    logoDivScroll: { scrollW: logoDiv.scrollWidth, clientW: logoDiv.clientWidth, scrollH: logoDiv.scrollHeight, clientH: logoDiv.clientHeight },
    aScroll: { scrollW: a.scrollWidth, clientW: a.clientWidth, scrollH: a.scrollHeight, clientH: a.clientHeight },
    background: cs.backgroundImage.slice(0, 160),
    backgroundSize: cs.backgroundSize,
    fill: cs.webkitTextFillColor,
    headerBg: hcs.backgroundColor,
    fontSize: cs.fontSize,
  };
};

await probe('/fr', 390, 844, true, logoProbe, 'LOGO TOPBAR — mobile 390 sombre');
await probe('/fr', 1440, 900, true, logoProbe, 'LOGO TOPBAR — desktop 1440 sombre');

// boutons du header
const headerBtnProbe = () => {
  const out = [];
  document.querySelectorAll('header.layout-topbar button, header.layout-topbar a').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    const cs = getComputedStyle(el);
    out.push({
      sel: el.className.toString().slice(0, 60) || el.tagName,
      label: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 40),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      padding: cs.padding, minHeight: cs.minHeight, minWidth: cs.minWidth,
    });
  });
  return out;
};
await probe('/fr', 390, 844, true, headerBtnProbe, 'BOUTONS HEADER — mobile 390');

// menu mobile ouvert
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(BASE + '/fr', { waitUntil: 'networkidle2' }).catch(() => {});
await page.evaluate(() => document.documentElement.classList.add('dark-theme'));
await sleep(2500);
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('header button')).find(x => /menu/i.test(x.getAttribute('aria-label') || ''));
  if (b) b.click();
});
await sleep(1200);
const menuOut = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('header a, header button, [id*="mobile"] a, [id*="mobile"] button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    items.push({ label: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 35), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  });
  return { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, items };
});
console.log('\n===== MENU MOBILE OUVERT =====');
console.log(JSON.stringify(menuOut, null, 1));
await page.screenshot({ path: './zzs-out/zzs-menu-mobile-dark.png' });

await browser.close();
