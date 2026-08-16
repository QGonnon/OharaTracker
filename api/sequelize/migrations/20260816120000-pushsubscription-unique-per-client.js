'use strict';

// L'unicité était sur endpoint seul : un même navigateur/appareil ne pouvait donc être
// associé qu'à un seul client à la fois (se connecter avec un autre compte sur le même
// poste "volait" l'abonnement push du compte précédent). On passe à une unicité
// composite (endpoint, id_client) pour qu'un même endpoint puisse avoir une ligne par client.
export async function up(queryInterface) {
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT conname FROM pg_constraint
    WHERE conrelid = '"PushSubscription"'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = '"PushSubscription"'::regclass AND attname = 'endpoint'
      )]
  `);

  for (const { conname } of constraints) {
    await queryInterface.removeConstraint('PushSubscription', conname);
  }

  await queryInterface.addConstraint('PushSubscription', {
    fields: ['endpoint', 'id_client'],
    type: 'unique',
    name: 'pushsubscription_endpoint_client_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeConstraint('PushSubscription', 'pushsubscription_endpoint_client_unique');

  // Ne conserve que la ligne la plus récente par endpoint avant de restaurer l'unicité simple,
  // sinon la contrainte échouerait s'il existe plusieurs clients pour un même endpoint.
  await queryInterface.sequelize.query(`
    DELETE FROM "PushSubscription" ps
    WHERE ps.id NOT IN (
      SELECT DISTINCT ON (endpoint) id
      FROM "PushSubscription"
      ORDER BY endpoint, created_at DESC
    )
  `);

  await queryInterface.addConstraint('PushSubscription', {
    fields: ['endpoint'],
    type: 'unique',
    name: 'PushSubscription_endpoint_key',
  });
}

export default { up, down };
