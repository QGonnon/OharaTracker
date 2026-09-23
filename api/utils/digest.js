import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';
import { sendMail, mailerEnabled } from './mailer.js';
import { slugify, resolveMediaKind } from './slug.js';
import { mediaPath, LOCALES, DEFAULT_LOCALE } from './seoRoutes.js';
import { abs } from './xml.js';
import { t } from '../seo/head.js';

const DIGEST_WINDOW_DAYS = 7;

const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const localeOf = client => (LOCALES.includes(client.locale) ? client.locale : DEFAULT_LOCALE);

// Destinataires dont le rapport tombe aujourd'hui et qui n'ont pas déjà été servis
// cette semaine, la garde sur last_sent_at rend le job rejouable sans doublon.
async function getDueRecipients(now = new Date()) {
    return sequelize.query(
        `SELECT id, name, email, locale, email_digest_day AS "digestDay"
         FROM "Client"
         WHERE email_digest_enabled = true
           AND email IS NOT NULL
           AND email_digest_day = :weekday
           AND (email_digest_last_sent_at IS NULL
                OR email_digest_last_sent_at < NOW() - INTERVAL '6 days')`,
        { replacements: { weekday: now.getUTCDay() }, type: QueryTypes.SELECT }
    );
}

// Sorties des 7 derniers jours parmi les œuvres suivies par l'utilisateur.
async function getWeeklyReleases(username) {
    return sequelize.query(
        `SELECT
            l.id                        AS "idLibrary",
            l.name                      AS title,
            lt.type                     AS type,
            MAX(c.chapter)              AS "latestChapter",
            COUNT(DISTINCT c.chapter)   AS "releaseCount"
         FROM libraryusage lu
         JOIN "Library" l ON l.id = lu.id_library
         JOIN "Chapters" c ON c.id_library = lu.id_library
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id AND ls.id_source = lu.id_source
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         WHERE lu.name_client = :username
           AND c.created_at >= NOW() - INTERVAL '${DIGEST_WINDOW_DAYS} days'
         GROUP BY l.id, l.name, lt.type
         ORDER BY MAX(c.created_at) DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );
}

function renderDigest(client, releases) {
    const locale = localeOf(client);
    const heading = t(locale, 'digest.heading', { name: client.name });
    const intro = t(locale, 'digest.intro', { count: String(releases.length) });

    const items = releases.map(release => {
        const kind = resolveMediaKind(release.type);
        const url = abs(mediaPath(kind, slugify(release.title), locale));
        const count = Number(release.releaseCount ?? 0);
        const detail = t(locale, 'digest.item_detail', {
            count: String(count),
            chapter: String(release.latestChapter),
        });

        return `<li style="margin:0 0 12px 0">
            <a href="${esc(url)}" style="color:#7f22fe;font-weight:600;text-decoration:none">${esc(release.title)}</a>
            <div style="color:#475569;font-size:13px">${esc(detail)}</div>
        </li>`;
    }).join('');

    const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:20px;color:#101828;margin:0 0 8px">${esc(heading)}</h1>
        <p style="color:#475569;margin:0 0 20px">${esc(intro)}</p>
        <ul style="list-style:none;padding:0;margin:0 0 24px">${items}</ul>
        <a href="${esc(abs(`/${locale}`))}" style="color:#7f22fe;font-size:13px">${esc(t(locale, 'digest.cta'))}</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">${esc(t(locale, 'digest.footer'))}</p>
    </div>`;

    const text = [heading, '', intro, '', ...releases.map(r => `- ${r.title} (${r.latestChapter})`)].join('\n');

    return { subject: t(locale, 'digest.subject', { count: String(releases.length) }), html, text };
}

async function markDigestSent(clientId) {
    await sequelize.query(
        `UPDATE "Client" SET email_digest_last_sent_at = NOW() WHERE id = :clientId`,
        { replacements: { clientId }, type: QueryTypes.UPDATE }
    );
}

// Envoie le rapport à tous les destinataires du jour. Retourne le nombre d'envois réussis.
async function sendWeeklyDigests(now = new Date()) {
    if (!mailerEnabled()) return 0;

    const recipients = await getDueRecipients(now);
    let sent = 0;

    for (const client of recipients) {
        try {
            const releases = await getWeeklyReleases(client.name);
            // Pas de sortie cette semaine : on marque quand même pour ne pas repasser chaque heure.
            if (releases.length === 0) {
                await markDigestSent(client.id);
                continue;
            }

            const { subject, html, text } = renderDigest(client, releases);
            if (await sendMail({ to: client.email, subject, html, text })) {
                await markDigestSent(client.id);
                sent++;
            }
        } catch (err) {
            console.error(`❌ Rapport hebdomadaire impossible pour ${client.name}:`, err.message);
        }
    }

    if (sent > 0) console.log(`📧 Rapport hebdomadaire envoyé à ${sent} utilisateur(s).`);
    return sent;
}

export { sendWeeklyDigests, getWeeklyReleases, getDueRecipients, renderDigest };
