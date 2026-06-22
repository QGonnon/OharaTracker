import dotenv from 'dotenv';
import { initDb } from './utils/index.js';
import { scrapeAll } from './sites/index.js';
import startApp from './app.js'

// Load environment variables FIRST
dotenv.config();

// Initialisation de la base de données au démarrage
initDb()

// Lancer le scraping en arrière-plan toutes les 30 secondes
scrapeAll()
setInterval(scrapeAll, 30000);

startApp()