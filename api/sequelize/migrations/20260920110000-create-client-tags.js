'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ClientTag', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name_client: {
      type: Sequelize.STRING(24),
      allowNull: false,
      references: { model: 'Client', key: 'name' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    label: {
      type: Sequelize.STRING(30),
      allowNull: false
    },
    color: {
      type: Sequelize.STRING(7)
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addConstraint('ClientTag', {
    fields: ['name_client', 'label'],
    type: 'unique',
    name: 'client_tag_unique_label_per_client'
  });

  await queryInterface.createTable('ClientTagAssignment', {
    id_client_tag: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'ClientTag', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    id_library: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Library', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ClientTagAssignment');
  await queryInterface.dropTable('ClientTag');
}

export default { up, down };
