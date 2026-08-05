'use strict';

export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `UPDATE "Subscription" SET name = 'Lite' WHERE id = 2`
  );
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query(
    `UPDATE "Subscription" SET name = 'Pro' WHERE id = 2`
  );
}

export default { up, down };
