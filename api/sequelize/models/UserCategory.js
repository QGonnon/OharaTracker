'use strict';

export default (sequelize, DataTypes) => {
  const UserCategory = sequelize.define('UserCategory', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50)
    },
    description: {
      type: DataTypes.STRING(150)
    }
  }, {
    tableName: 'UserCategory',
    freezeTableName: true,
    timestamps: false
  });

  UserCategory.associate = models => {
    UserCategory.hasMany(models.ClientCategoryAssignment, { foreignKey: 'id_user_category', as: 'assignments' });
    UserCategory.belongsToMany(models.Client, {
      through: models.ClientCategoryAssignment,
      foreignKey: 'id_user_category',
      otherKey: 'name_client',
      as: 'clients'
    });
  };

  return UserCategory;
};