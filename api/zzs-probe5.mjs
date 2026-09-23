import puppeteer from 'puppeteer';
import fs from 'node:fs';

const AUTH = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const BASE = 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(BASE, '')); });

await page.goto(BASE + '/fr', { waitUntil: 'domcontentloaded' });
await page.evaluate((u) => { localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('theme', 'dark'); }, AUTH);

for (const [w, h, label] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  bad.length = 0;
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await page.evaluate((u) => localStorage.setItem('user', JSON.stringify(u)), AUTH);
  await page.goto(BASE + '/fr', { waitUntil: 'networkidle2' }).catch(() => {});
  await sleep(4000);
  const st = await page.evaluate(() => ({
    url: location.pathname,
    user: !!JSON.parse(localStorage.getItem('user') || 'null'),
  }));
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(st));
  console.log('reponses >=400 :', JSON.stringify(bad, null, 1));
}
await browser.close();
