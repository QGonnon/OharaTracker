'use strict';

export default (sequelize, DataTypes) => {
  const Friendship = sequelize.define('Friendship', {
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false,
      primaryKey: true
    },
    name_friend: {
      type: DataTypes.STRING(24),
      allowNull: false,
      primaryKey: true
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pending'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Friendship',
    freezeTableName: true,
    timestamps: false
  });

  Friendship.associate = models => {
    Friendship.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
    Friendship.belongsTo(models.Client, { foreignKey: 'name_friend', targetKey: 'name', as: 'friend' });
  };

  return Friendship;
};
