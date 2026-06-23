'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.renameTable('LastChapters', 'Chapters');

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "LastChapters_pkey"`
  );

  await queryInterface.changeColumn('Chapters', 'chapter', {
    type: Sequelize.STRING(50),
    allowNull: false
  });

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_pkey" PRIMARY KEY (id_library, id_source, chapter)`
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "Chapters_pkey"`
  );

  await queryInterface.changeColumn('Chapters', 'chapter', {
    type: Sequelize.STRING(50),
    allowNull: true
  });

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ADD CONSTRAINT "LastChapters_pkey" PRIMARY KEY (id_library, id_source)`
  );

  await queryInterface.renameTable('Chapters', 'LastChapters');
}

export default { up, down };
