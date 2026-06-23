'use strict';

export default (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
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
    tableName: 'Subscription',
    freezeTableName: true,
    timestamps: false
  });

  Subscription.associate = models => {
    Subscription.hasMany(models.Client, { foreignKey: 'id_subscription', as: 'clients' });
    Subscription.hasMany(models.SubscriptionPermissions, { foreignKey: 'id_subscription', as: 'permissionLinks' });
    Subscription.belongsToMany(models.Permissions, {
      through: models.SubscriptionPermissions,
      foreignKey: 'id_subscription',
      otherKey: 'id_permissions',
      as: 'permissions'
    });
  };

  return Subscription;
};