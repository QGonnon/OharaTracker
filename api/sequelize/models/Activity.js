'use strict';

export default (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING(60)
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Activity',
    freezeTableName: true,
    timestamps: false
  });

  Activity.associate = models => {
    Activity.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
    Activity.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
  };

  return Activity;
};
