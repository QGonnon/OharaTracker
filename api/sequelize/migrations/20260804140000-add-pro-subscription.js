'use strict';

export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `INSERT INTO "Subscription" (id, name) VALUES (3, 'Pro') ON CONFLICT (id) DO NOTHING`
  );
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query(
    `DELETE FROM "Subscription" WHERE id = 3`
  );
}

export default { up, down };
