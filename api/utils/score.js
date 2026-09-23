// Barème des notes personnelles : 5 étoiles, demi-étoile autorisée.
// Seule source de vérité côté serveur : la validation, l'affichage dans le fil
// d'activité et la pondération des recommandations s'y réfèrent, plutôt que de
// recoder « 10 » ou « 5 » chacun de leur côté.
const SCORE_MAX = 5;
const SCORE_STEP = 0.5;

// Note « ni bonne ni mauvaise » : le milieu du barème. Sert de valeur par défaut
// quand une œuvre n'est pas notée, pour ne pas la pénaliser ni la favoriser.
const SCORE_NEUTRAL = SCORE_MAX / 2;

// En dessous de ce nombre de votes, une moyenne communautaire n'est pas
// représentative : deux notes extrêmes suffiraient à la faire mentir. On ne
// l'affiche donc pas du tout plutôt que d'afficher un chiffre trompeur.
const MIN_RATINGS_FOR_AVERAGE = 10;

/**
 * Moyenne communautaire publiable : `null` tant que le seuil n'est pas atteint.
 * `count` reste renvoyé pour que l'appelant puisse expliquer l'absence.
 */
function publicAverage(average, count) {
    const votes = Number(count ?? 0);
    if (votes < MIN_RATINGS_FOR_AVERAGE || average === null || average === undefined) {
        return { averageScore: null, ratingCount: votes };
    }
    return { averageScore: Number(average), ratingCount: votes };
}

/** Arrondit au demi-point le plus proche, borné au barème. */
function roundToStep(value) {
    const clamped = Math.min(Math.max(value, 0), SCORE_MAX);
    return Math.round(clamped / SCORE_STEP) * SCORE_STEP;
}

/** Une note valide est un multiple exact du pas, entre 0 et SCORE_MAX. */
function isValidScore(value) {
    return Number.isFinite(value)
        && value >= 0
        && value <= SCORE_MAX
        && Math.abs(value / SCORE_STEP - Math.round(value / SCORE_STEP)) < 1e-9;
}

/** `null` pour « pas de note » ; sinon un nombre, ou undefined si la saisie est invalide. */
function parseScore(raw) {
    if (raw === undefined || raw === null || raw === '') return null;

    const value = Number(raw);
    return isValidScore(value) ? value : undefined;
}

export {
    SCORE_MAX,
    SCORE_STEP,
    SCORE_NEUTRAL,
    MIN_RATINGS_FOR_AVERAGE,
    roundToStep,
    isValidScore,
    parseScore,
    publicAverage,
};
