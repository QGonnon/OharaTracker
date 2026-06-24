'use strict';

export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "Chapters_pkey"`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ALTER COLUMN chapter TYPE DECIMAL(10, 2) USING chapter::DECIMAL(10, 2)`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_pkey" PRIMARY KEY (id_library, id_source, chapter)`
  );
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" DROP CONSTRAINT IF EXISTS "Chapters_pkey"`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ALTER COLUMN chapter TYPE VARCHAR(50) USING chapter::VARCHAR(50)`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_pkey" PRIMARY KEY (id_library, id_source, chapter)`
  );
}

export default { up, down };
