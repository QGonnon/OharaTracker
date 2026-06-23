'use strict';

export default (sequelize, DataTypes) => {
  const Permissions = sequelize.define('Permissions', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50)
    }
  }, {
    tableName: 'Permissions',
    freezeTableName: true,
    timestamps: false
  });

  Permissions.associate = models => {
    Permissions.hasMany(models.SubscriptionPermissions, { foreignKey: 'id_permissions', as: 'subscriptionLinks' });
    Permissions.belongsToMany(models.Subscription, {
      through: models.SubscriptionPermissions,
      foreignKey: 'id_permissions',
      otherKey: 'id_subscription',
      as: 'subscriptions'
    });
  };

  return Permissions;
};