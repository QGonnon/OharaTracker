'use strict';

export async function up(queryInterface) {
  // queryInterface.changeColumn sur Postgres perd la clause SET DEFAULT quand elle est
  // combinée à allowNull dans le même appel : la colonne finit NOT NULL sans défaut réel
  // en base, ce qui casse les INSERT ne listant pas created_at. On passe donc par du SQL
  // brut pour être sûr que le défaut est bien posé.
  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
  );

  await queryInterface.sequelize.query(
    `UPDATE "Chapters" SET created_at = NOW() WHERE created_at IS NULL`
  );

  await queryInterface.sequelize.query(
    `ALTER TABLE "Chapters" ALTER COLUMN created_at SET NOT NULL`
  );
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Chapters', 'created_at');
}

export default { up, down };
