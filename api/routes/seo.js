import express from 'express';
import { sitemap, sitemapPages, sitemapMedia, robotsTxt } from '../utils/seoRoutes.js';

const router = express.Router();

router.get('/sitemap.xml', (_req, res) => {
    sitemap((err, xml) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=3600');
        res.status(200).send(xml);
    });
});

router.get('/sitemap-pages.xml', (_req, res) => {
    sitemapPages((err, xml) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=3600');
        res.status(200).send(xml);
    });
});

router.get('/sitemap-media-:chunk.xml', async (req, res) => {
    const chunkParam = req.params.chunk;
    sitemapMedia(chunkParam, (err, xml) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=3600');
        res.status(200).send(xml);
    });
});

// Généré (pas statique) car l'URL du sitemap dépend du domaine et le hors-prod doit rester noindex.
router.get('/robots.txt', (_req, res) => {
    robotsTxt((err, body) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600');
        res.status(200).send(body);
    });
});

export default router;
