'use strict';

export default (sequelize, DataTypes) => {
  const AssociativeTitle = sequelize.define('AssociativeTitle', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200)
    },
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'AssociativeTitle',
    freezeTableName: true,
    timestamps: false
  });

  AssociativeTitle.associate = models => {
    AssociativeTitle.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
  };

  return AssociativeTitle;
};