'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('libraryusage', 'notify_enabled', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('libraryusage', 'notify_enabled');
}

export default { up, down };
