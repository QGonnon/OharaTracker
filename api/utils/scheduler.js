import { sendWeeklyDigests } from './digest.js';
import { mailerEnabled } from './mailer.js';

const HOUR_MS = 60 * 60 * 1000;
const DIGEST_HOUR_UTC = Number(process.env.DIGEST_HOUR_UTC ?? 9);

// Réveil horaire plutôt que quotidien : un redémarrage du serveur ne fait pas
// sauter le rapport de la journée, la garde en base empêchant tout doublon.
function startScheduler() {
    if (!mailerEnabled()) return;

    const tick = async () => {
        if (new Date().getUTCHours() !== DIGEST_HOUR_UTC) return;
        try {
            await sendWeeklyDigests();
        } catch (err) {
            console.error('❌ Erreur du rapport hebdomadaire:', err.message);
        }
    };

    tick();
    setInterval(tick, HOUR_MS);
    console.log(`🗓️  Rapport hebdomadaire planifié à ${DIGEST_HOUR_UTC}h UTC.`);
}

export { startScheduler };
