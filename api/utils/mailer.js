import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
const MAIL_FROM = process.env.MAIL_FROM || 'Ohara Tracker <no-reply@oharatracker.com>';

let transport = null;

if (SMTP_HOST) {
    transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        // 465 est le seul port implicitement chiffré ; ailleurs on passe par STARTTLS.
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    });
} else {
    console.warn('⚠️  SMTP_HOST manquant: les e-mails (rapport hebdomadaire) sont désactivés.');
}

const mailerEnabled = () => transport !== null;

async function sendMail({ to, subject, html, text }) {
    if (!transport || !to) return false;

    try {
        await transport.sendMail({ from: MAIL_FROM, to, subject, html, text });
        return true;
    } catch (err) {
        console.error(`❌ Erreur envoi e-mail à ${to}:`, err.message);
        return false;
    }
}

export { sendMail, mailerEnabled };
