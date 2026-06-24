'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('LibraryType', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    type: {
      allowNull: false,
      unique: true,
      type: Sequelize.STRING(50)
    }
  });

  const [distinctTypes] = await queryInterface.sequelize.query(
    'SELECT DISTINCT type FROM "Library" WHERE type IS NOT NULL'
  );

  for (const row of distinctTypes) {
    await queryInterface.sequelize.query(
      'INSERT INTO "LibraryType" (type) VALUES (:type) ON CONFLICT (type) DO NOTHING',
      {
        replacements: { type: row.type },
      }
    );
  }

  await queryInterface.addColumn('LibrarySource', 'id_library_type', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'LibraryType',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.sequelize.query(
    `UPDATE "LibrarySource" ls
     SET id_library_type = lt.id
     FROM "Library" l
     JOIN "LibraryType" lt ON lt.type = l.type
     WHERE ls.id_library = l.id AND l.type IS NOT NULL`
  );

  await queryInterface.addColumn('libraryusage', 'id_source', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'Source',
      key: 'id_source'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });

  await queryInterface.sequelize.query(
    `UPDATE "libraryusage" lu
     SET id_source = source_choice.id_source
     FROM (
       SELECT DISTINCT ON (id_library) id_library, id_source
       FROM "LibrarySource"
       ORDER BY id_library, id_source
     ) AS source_choice
     WHERE lu.id_library = source_choice.id_library`
  );

  await queryInterface.sequelize.query(
    'ALTER TABLE "libraryusage" DROP CONSTRAINT IF EXISTS libraryusage_pkey'
  );

  await queryInterface.changeColumn('libraryusage', 'id_source', {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Source',
      key: 'id_source'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });

  await queryInterface.sequelize.query(
    'ALTER TABLE "libraryusage" ADD PRIMARY KEY (id_library, name_client, id_source)'
  );

  await queryInterface.removeColumn('Library', 'type');

  await queryInterface.changeColumn('Client', 'password', {
    type: Sequelize.STRING(60),
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('Library', 'type', {
    type: Sequelize.STRING(50),
    allowNull: true
  });

  await queryInterface.sequelize.query(
    `UPDATE "Library" l
     SET type = lt.type
     FROM "LibrarySource" ls
     JOIN "LibraryType" lt ON lt.id = ls.id_library_type
     WHERE l.id = ls.id_library AND l.type IS NULL`
  );

  await queryInterface.sequelize.query('ALTER TABLE "libraryusage" DROP CONSTRAINT IF EXISTS libraryusage_pkey');

  await queryInterface.removeColumn('libraryusage', 'id_source');
  await queryInterface.removeColumn('LibrarySource', 'id_library_type');
  await queryInterface.dropTable('LibraryType');

  await queryInterface.sequelize.query(
    'ALTER TABLE "libraryusage" ADD PRIMARY KEY (id_library, name_client)'
  );
}

export default { up, down };