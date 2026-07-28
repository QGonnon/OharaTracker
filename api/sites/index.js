import puppeteer from 'puppeteer';
import { mangadex } from './mangadex.js';
import { scan_manga } from './scan_manga.js';
import { asura } from './asura.js';
import { moviedb } from './moviedb.js';
import { anime_sama } from './anime_sama.js';

async function scrapeAll() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    console.log('🔍 Scraping des sites...');
    // await mangadex();
    // await asura(page);
    // await moviedb();
    await scan_manga(page);
    // await anime_sama(page);
    console.log('⏳ Prochaine mise à jour dans 30 secondes...');
    await browser.close();
    setTimeout(() => { scrapeAll(); }, 30000);
}

export { scrapeAll };