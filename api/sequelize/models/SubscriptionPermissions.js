'use strict';

export default (sequelize, DataTypes) => {
  const SubscriptionPermissions = sequelize.define('SubscriptionPermissions', {
    id_subscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_permissions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'SubscriptionPermissions',
    freezeTableName: true,
    timestamps: false
  });

  SubscriptionPermissions.associate = models => {
    SubscriptionPermissions.belongsTo(models.Subscription, { foreignKey: 'id_subscription', as: 'subscription' });
    SubscriptionPermissions.belongsTo(models.Permissions, { foreignKey: 'id_permissions', as: 'permission' });
  };

  return SubscriptionPermissions;
};