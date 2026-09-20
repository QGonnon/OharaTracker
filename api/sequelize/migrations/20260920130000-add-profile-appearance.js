'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Client', 'avatar_url', {
    type: Sequelize.STRING(300)
  });
  await queryInterface.addColumn('Client', 'banner_url', {
    type: Sequelize.STRING(300)
  });
  await queryInterface.addColumn('Client', 'theme', {
    type: Sequelize.STRING(20)
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Client', 'theme');
  await queryInterface.removeColumn('Client', 'banner_url');
  await queryInterface.removeColumn('Client', 'avatar_url');
}

export default { up, down };
