'use strict';

export default (sequelize, DataTypes) => {
  const LibrarySource = sequelize.define('LibrarySource', {
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
    url: {
      type: DataTypes.STRING(200)
    }
  }, {
    tableName: 'LibrarySource',
    freezeTableName: true,
    timestamps: false
  });

  LibrarySource.associate = models => {
    LibrarySource.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    LibrarySource.belongsTo(models.Source, { foreignKey: 'id_source', targetKey: 'id_source', as: 'source' });
  };

  return LibrarySource;
};