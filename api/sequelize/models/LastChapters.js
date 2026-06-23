'use strict';

export default (sequelize, DataTypes) => {
  const LastChapters = sequelize.define('LastChapters', {
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_source: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    chapter: {
      type: DataTypes.STRING(50)
    },
    url: {
      type: DataTypes.STRING(200)
    }
  }, {
    tableName: 'LastChapters',
    freezeTableName: true,
    timestamps: false
  });

  LastChapters.associate = models => {
    LastChapters.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    LastChapters.belongsTo(models.Source, { foreignKey: 'id_source', targetKey: 'id_source', as: 'source' });
  };

  return LastChapters;
};