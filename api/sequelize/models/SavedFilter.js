'use strict';

export default (sequelize, DataTypes) => {
  const SavedFilter = sequelize.define('SavedFilter', {
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
    label: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'SavedFilter',
    freezeTableName: true,
    timestamps: false
  });

  SavedFilter.associate = models => {
    SavedFilter.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
  };

  return SavedFilter;
};
