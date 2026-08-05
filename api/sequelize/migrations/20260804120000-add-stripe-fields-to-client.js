'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Client', 'stripe_customer_id', {
    type: Sequelize.STRING(255),
    allowNull: true
  });

  await queryInterface.addColumn('Client', 'stripe_subscription_id', {
    type: Sequelize.STRING(255),
    allowNull: true
  });

  await queryInterface.sequelize.query(
    `INSERT INTO "Subscription" (id, name) VALUES (2, 'Pro') ON CONFLICT (id) DO NOTHING`
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Client', 'stripe_subscription_id');
  await queryInterface.removeColumn('Client', 'stripe_customer_id');
}

export default { up, down };
