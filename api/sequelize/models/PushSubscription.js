'use strict';

export default (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define('PushSubscription', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_client: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    p256dh: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    auth: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'PushSubscription',
    freezeTableName: true,
    timestamps: false
  });

  PushSubscription.associate = models => {
    PushSubscription.belongsTo(models.Client, { foreignKey: 'id_client', targetKey: 'id', as: 'client' });
  };

  return PushSubscription;
};
