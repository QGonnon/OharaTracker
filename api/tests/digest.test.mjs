// Rendu du rapport hebdomadaire : ni base ni SMTP requis.
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

process.env.SITE_URL = 'https://oharatracker.com'

const { renderDigest } = await import('../utils/digest.js')

const client = locale => ({ id: 1, name: 'Noah', email: 'noah@example.com', locale })
const releases = [
    { idLibrary: 4, title: 'Solo Leveling', type: 'Manga', latestChapter: '182.00', releaseCount: 3 },
    { idLibrary: 9, title: 'One Piece', type: 'Anime', latestChapter: '21.05', releaseCount: 1 },
]

describe('Rapport hebdomadaire', () => {
    test('rend le sujet et le corps dans la langue du destinataire', () => {
        const fr = renderDigest(client('fr'), releases)
        const de = renderDigest(client('de'), releases)

        assert.match(fr.subject, /nouveautés de la semaine/)
        assert.match(de.subject, /Neuerscheinungen der Woche/)
        assert.match(fr.html, /Bonjour Noah/)
    })

    test('lie chaque œuvre vers son URL canonique localisée', () => {
        const { html } = renderDigest(client('fr'), releases)

        assert.match(html, /https:\/\/oharatracker\.com\/fr\/manga\/solo-leveling/)
        assert.match(html, /https:\/\/oharatracker\.com\/fr\/anime\/one-piece/)
    })

    test('retombe sur la langue par défaut si la locale est inconnue', () => {
        const { subject } = renderDigest(client('xx'), releases)

        assert.equal(subject, renderDigest(client('en'), releases).subject)
    })

    test('échappe le HTML des titres pour empêcher toute injection', () => {
        const { html } = renderDigest(client('fr'), [
            { idLibrary: 1, title: '<script>alert(1)</script>', type: 'Manga', latestChapter: '1.00', releaseCount: 1 },
        ])

        assert.ok(!html.includes('<script>'))
        assert.match(html, /&lt;script&gt;/)
    })
})
