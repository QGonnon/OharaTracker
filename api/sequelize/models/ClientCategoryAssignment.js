'use strict';

export default (sequelize, DataTypes) => {
  const ClientCategoryAssignment = sequelize.define('ClientCategoryAssignment', {
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false,
      primaryKey: true
    },
    id_user_category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'ClientCategoryAssignment',
    freezeTableName: true,
    timestamps: false
  });

  ClientCategoryAssignment.associate = models => {
    ClientCategoryAssignment.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
    ClientCategoryAssignment.belongsTo(models.UserCategory, { foreignKey: 'id_user_category', as: 'userCategory' });
  };

  return ClientCategoryAssignment;
};