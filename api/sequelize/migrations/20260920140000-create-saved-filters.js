'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('SavedFilter', {
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
      type: Sequelize.STRING(40),
      allowNull: false
    },
    // Forme du filtre côté client (recherche, type, tags, statut) : le serveur
    // la conserve telle quelle, c'est la vue qui sait l'interpréter.
    payload: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addConstraint('SavedFilter', {
    fields: ['name_client', 'label'],
    type: 'unique',
    name: 'saved_filter_unique_label_per_client'
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('SavedFilter');
}

export default { up, down };
