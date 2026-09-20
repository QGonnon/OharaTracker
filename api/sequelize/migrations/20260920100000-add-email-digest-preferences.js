'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Client', 'locale', {
    type: Sequelize.STRING(5)
  });
  await queryInterface.addColumn('Client', 'email_digest_enabled', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  });
  // 0 = dimanche, jour par défaut du rapport hebdomadaire de l'offre gratuite.
  await queryInterface.addColumn('Client', 'email_digest_day', {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0
  });
  await queryInterface.addColumn('Client', 'email_digest_last_sent_at', {
    type: Sequelize.DATE
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Client', 'email_digest_last_sent_at');
  await queryInterface.removeColumn('Client', 'email_digest_day');
  await queryInterface.removeColumn('Client', 'email_digest_enabled');
  await queryInterface.removeColumn('Client', 'locale');
}

export default { up, down };
