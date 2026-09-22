'use strict';

// Passage du barème /10 au barème /5 avec demi-étoiles.
//
// Conversion : score/2 arrondi au demi-point le plus proche, soit ROUND(score) / 2
// (8 -> 4 ; 7 -> 3,5 ; 1 -> 0,5 ; 10 -> 5). La colonne était déjà numeric(_, 1),
// donc les demi-points s'y écrivent sans perte ; elle est resserrée à numeric(2,1)
// et bornée par contrainte, pour que la base refuse d'elle-même une note hors barème.
export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `UPDATE libraryusage SET score = ROUND(score) / 2 WHERE score IS NOT NULL`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE libraryusage ALTER COLUMN score TYPE numeric(2,1)`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE libraryusage ADD CONSTRAINT libraryusage_score_range
     CHECK (score IS NULL OR (score >= 0 AND score <= 5 AND (score * 2) = FLOOR(score * 2)))`
  );
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TABLE libraryusage DROP CONSTRAINT IF EXISTS libraryusage_score_range`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE libraryusage ALTER COLUMN score TYPE numeric(15,1)`
  );

  // Retour au /10. Les demi-points redeviennent des entiers (3,5 -> 7), mais
  // l'arrondi appliqué à l'aller n'est pas réversible : 7 et 8 donnent tous deux 4,
  // qui revient à 8.
  await queryInterface.sequelize.query(
    `UPDATE libraryusage SET score = score * 2 WHERE score IS NOT NULL`
  );
}

export default { up, down };
