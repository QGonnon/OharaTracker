'use strict';

export default (sequelize, DataTypes) => {
  const ClientTag = sequelize.define('ClientTag', {
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
      type: DataTypes.STRING(30),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(7)
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ClientTag',
    freezeTableName: true,
    timestamps: false
  });

  ClientTag.associate = models => {
    ClientTag.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
    ClientTag.hasMany(models.ClientTagAssignment, { foreignKey: 'id_client_tag', as: 'assignments' });
    ClientTag.belongsToMany(models.Library, {
      through: models.ClientTagAssignment,
      foreignKey: 'id_client_tag',
      otherKey: 'id_library',
      as: 'works'
    });
  };

  return ClientTag;
};
