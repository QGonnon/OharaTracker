'use strict';

// La table Notification ne savait décrire qu'un nouveau chapitre : id_library,
// id_source et chapter étaient NOT NULL. Une demande d'ami n'a aucun des trois,
// elle ne pouvait donc pas y être stockée.
//
// La clé étrangère composite vers Chapters est conservée telle quelle : en
// MATCH SIMPLE (le défaut PostgreSQL), une ligne dont l'une des colonnes est NULL
// n'est pas vérifiée. Les notifications de chapitre restent donc contraintes
// exactement comme avant.
export async function up(queryInterface, Sequelize) {
  for (const column of ['id_library', 'id_source', 'chapter']) {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Notification" ALTER COLUMN ${column} DROP NOT NULL`
    );
  }

  // Auteur de l'événement social (celui qui envoie la demande, celui qui l'accepte).
  await queryInterface.addColumn('Notification', 'actor', {
    type: Sequelize.STRING(24),
    allowNull: true,
    references: { model: 'Client', key: 'name' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Notification', 'actor');

  // Les notifications sociales n'ont pas d'équivalent dans l'ancien schéma :
  // elles sont supprimées, sinon le retour au NOT NULL échouerait.
  await queryInterface.sequelize.query(
    `DELETE FROM "Notification" WHERE id_library IS NULL OR id_source IS NULL OR chapter IS NULL`
  );

  for (const column of ['id_library', 'id_source', 'chapter']) {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Notification" ALTER COLUMN ${column} SET NOT NULL`
    );
  }
}

export default { up, down };
