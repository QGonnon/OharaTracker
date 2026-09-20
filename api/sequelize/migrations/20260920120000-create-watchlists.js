'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Watchlist', {
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
    title: {
      type: Sequelize.STRING(80),
      allowNull: false
    },
    description: {
      type: Sequelize.STRING(300)
    },
    // Jeton d'URL publique : une liste reste privée tant qu'elle n'est pas partagée.
    share_token: {
      type: Sequelize.STRING(22),
      unique: true
    },
    is_public: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.createTable('WatchlistItem', {
    id_watchlist: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Watchlist', key: 'id' },
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
    },
    position: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  });

  await queryInterface.createTable('WatchlistFollower', {
    id_watchlist: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Watchlist', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name_client: {
      type: Sequelize.STRING(24),
      allowNull: false,
      primaryKey: true,
      references: { model: 'Client', key: 'name' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    followed_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('WatchlistFollower');
  await queryInterface.dropTable('WatchlistItem');
  await queryInterface.dropTable('Watchlist');
}

export default { up, down };
