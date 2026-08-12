'use strict';

// Remplace la clé étrangère de PushSubscription : name_client (STRING -> Client.name)
// devient id_client (INTEGER -> Client.id), cohérent avec la clé primaire de Client.
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('PushSubscription', 'id_client', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'Client',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });

  await queryInterface.sequelize.query(`
    UPDATE "PushSubscription" ps
    SET id_client = c.id
    FROM "Client" c
    WHERE c.name = ps.name_client
  `);

  await queryInterface.changeColumn('PushSubscription', 'id_client', {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Client',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });

  await queryInterface.removeColumn('PushSubscription', 'name_client');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('PushSubscription', 'name_client', {
    type: Sequelize.STRING(24),
    allowNull: true,
    references: {
      model: 'Client',
      key: 'name'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });

  await queryInterface.sequelize.query(`
    UPDATE "PushSubscription" ps
    SET name_client = c.name
    FROM "Client" c
    WHERE c.id = ps.id_client
  `);

  await queryInterface.changeColumn('PushSubscription', 'name_client', {
    type: Sequelize.STRING(24),
    allowNull: false,
    references: {
      model: 'Client',
      key: 'name'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });

  await queryInterface.removeColumn('PushSubscription', 'id_client');
}

export default { up, down };
