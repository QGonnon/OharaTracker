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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING(200)
    }
  }, {
    tableName: 'Chapters',
    freezeTableName: true,
    timestamps: false
  });

  LastChapters.associate = models => {
    LastChapters.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    LastChapters.belongsTo(models.Source, { foreignKey: 'id_source', targetKey: 'id_source', as: 'source' });
  };

  return LastChapters;
};