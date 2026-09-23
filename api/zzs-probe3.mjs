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

// --- 1. icone du bouton de theme dans les deux etats ---
const themeIcon = () => {
  const b = document.querySelector('.nav-theme-toggle');
  const i = b.querySelector('i,svg,span');
  return {
    dark: document.documentElement.classList.contains('dark-theme'),
    aria: b.getAttribute('aria-label'),
    innerHTML: b.innerHTML.replace(/\s+/g, ' ').slice(0, 160),
    iconClass: i ? i.getAttribute('class') : null,
  };
};
await load('/fr', 390, 844, true);
console.log('\n=== BOUTON THEME (page sombre) ===\n' + JSON.stringify(await page.evaluate(themeIcon), null, 1));
await load('/fr', 390, 844, false);
console.log('\n=== BOUTON THEME (page claire) ===\n' + JSON.stringify(await page.evaluate(themeIcon), null, 1));

// --- 2. drawer mobile ---
await load('/fr', 390, 844, true);
await page.evaluate(() => {
  const b = document.querySelector('header button.md\\:hidden') ||
    Array.from(document.querySelectorAll('header button')).find(x => /ouvrir le menu/i.test(x.getAttribute('aria-label') || ''));
  if (b) b.click();
});
await sleep(1600);
const drawer = await page.evaluate(() => {
  const d = document.querySelector('.p-drawer');
  if (!d) return { trouve: false, classes: Array.from(document.body.children).map(c => c.className).slice(-4) };
  const items = [];
  d.querySelectorAll('a,button,[role="button"],input,select').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    items.push({ label: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 38), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  });
  const cs = getComputedStyle(d);
  return { trouve: true, largeur: cs.width, bg: cs.backgroundColor, nb: items.length, items };
});
console.log('\n=== DRAWER MOBILE ===\n' + JSON.stringify(drawer, null, 1));
await page.screenshot({ path: path.join(OUT, 'zzs-m-drawer-dark.png') });

// --- 3. texte rogne signale sur decouverte / communaute / listes ---
for (const [n, u] of [['decouverte', '/fr/decouverte'], ['communaute', '/fr/communaute'], ['listes', '/fr/listes']]) {
  await load(u, 390, 844, true, 3200);
  const c = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      let own = false;
      for (const nn of el.childNodes) if (nn.nodeType === 3 && nn.textContent.trim()) own = true;
      if (!own) return;
      if (el.scrollWidth <= el.clientWidth + 2) return;
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.textOverflow === 'ellipsis') return;
      out.push({ tag: el.tagName, cls: (el.getAttribute('class') || '').slice(0, 90), scrollW: el.scrollWidth, clientW: el.clientWidth, ws: cs.whiteSpace, ov: cs.overflow, txt: el.textContent.trim().slice(0, 50) });
    });
    return out;
  });
  console.log(`\n=== TEXTE ROGNE ${n} ===\n` + JSON.stringify(c, null, 1));
}

// --- 4. bordures des controles du header en mode sombre ---
await load('/fr', 1440, 900, true);
const bord = await page.evaluate(() => {
  const pc = c => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1 }; };
  const bl = (f,b) => ({ r:f.r*f.a+b.r*(1-f.a), g:f.g*f.a+b.g*(1-f.a), b:f.b*f.a+b.b*(1-f.a), a:1 });
  const L = c => { const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); };
  const R = (a,b) => { const l1=L(a),l2=L(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  const hex = c => '#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const page = pc(getComputedStyle(document.body).backgroundColor);
  const out = [];
  for (const sel of ['.nav-theme-toggle', '.nav-lang-trigger', '.footer-social-btn', '.layout-topbar', '.layout-footer', '.footer-bottom', '.p-accordionpanel']) {
    const el = document.querySelector(sel);
    if (!el) { out.push({ sel, absent: true }); continue; }
    const cs = getComputedStyle(el);
    const bcRaw = pc(cs.borderTopColor === 'rgba(0, 0, 0, 0)' && cs.borderBottomColor ? cs.borderBottomColor : cs.borderTopColor);
    // fond derriere : le header/footer ont un fond semi-transparent -> on aplatit sur le fond de page
    let behind = pc(cs.backgroundColor);
    if (behind.a < 1) behind = bl(behind, page);
    const bc = bcRaw.a < 1 ? bl(bcRaw, behind) : bcRaw;
    out.push({ sel, bordure: cs.borderTopWidth + ' ' + cs.borderTopColor + ' / bas ' + cs.borderBottomColor,
      bordureAplatie: hex(bc), fondAplati: hex(behind), ratio: +R(bc, behind).toFixed(3),
      taille: (() => { const r = el.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height); })() });
  }
  return out;
});
console.log('\n=== BORDURES (sombre) ===\n' + JSON.stringify(bord, null, 1));

await browser.close();
