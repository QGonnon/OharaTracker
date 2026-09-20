'use strict';

export async function up(queryInterface, Sequelize) {
  // Un profil est privé par défaut : il ne devient trouvable que sur décision explicite.
  await queryInterface.addColumn('Client', 'is_public', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.createTable('Friendship', {
    name_client: {
      type: Sequelize.STRING(24),
      allowNull: false,
      primaryKey: true,
      references: { model: 'Client', key: 'name' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name_friend: {
      type: Sequelize.STRING(24),
      allowNull: false,
      primaryKey: true,
      references: { model: 'Client', key: 'name' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    // 'pending' tant que le destinataire n'a pas accepté ; la ligne inverse est
    // créée à l'acceptation, ce qui rend la relation symétrique et simple à lire.
    status: {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'pending'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.createTable('Activity', {
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
    id_library: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Library', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    detail: {
      type: Sequelize.STRING(60)
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('Activity', ['name_client', 'created_at'], {
    name: 'activity_client_recent_idx'
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Activity', 'activity_client_recent_idx');
  await queryInterface.dropTable('Activity');
  await queryInterface.dropTable('Friendship');
  await queryInterface.removeColumn('Client', 'is_public');
}

export default { up, down };
