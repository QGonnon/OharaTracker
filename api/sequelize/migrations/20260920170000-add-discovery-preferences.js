'use strict';

export async function up(queryInterface, Sequelize) {
  // Forme libre volontairement : la Découverte évoluera plus vite que le schéma.
  await queryInterface.addColumn('Client', 'discovery_preferences', {
    type: Sequelize.JSONB
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Client', 'discovery_preferences');
}

export default { up, down };
