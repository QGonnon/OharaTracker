'use strict';

export default (sequelize, DataTypes) => {
  const ClientTagAssignment = sequelize.define('ClientTagAssignment', {
    id_client_tag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'ClientTagAssignment',
    freezeTableName: true,
    timestamps: false
  });

  ClientTagAssignment.associate = models => {
    ClientTagAssignment.belongsTo(models.ClientTag, { foreignKey: 'id_client_tag', as: 'tag' });
    ClientTagAssignment.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
  };

  return ClientTagAssignment;
};
