'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('Library', 'description', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'type', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'demographic', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'published', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'status', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'artist', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'author', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'theme', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'publishers', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Tag', 'name', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('Tag', 'type', {
    type: Sequelize.TEXT,
    allowNull: true,
  });

  await queryInterface.changeColumn('libraryusage', 'note', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('Library', 'description', {
    type: Sequelize.STRING(500),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'type', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'demographic', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'published', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'status', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'artist', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'author', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'theme', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Library', 'publishers', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Tag', 'name', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('Tag', 'type', {
    type: Sequelize.STRING(50),
    allowNull: true,
  });

  await queryInterface.changeColumn('libraryusage', 'note', {
    type: Sequelize.STRING(500),
    allowNull: true,
  });
}

export default { up, down };