'use strict';

export default (sequelize, DataTypes) => {
  const LibraryUsage = sequelize.define('LibraryUsage', {
    id_library: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name_client: {
      type: DataTypes.STRING(24),
      allowNull: false,
      primaryKey: true
    },
    score: {
      type: DataTypes.DECIMAL(15, 1)
    },
    note: {
      type: DataTypes.STRING(500)
    },
    last_chapter: {
      type: DataTypes.STRING(50)
    },
    reading_status: {
      type: DataTypes.STRING(50)
    }
  }, {
    tableName: 'libraryusage',
    freezeTableName: true,
    timestamps: false
  });

  LibraryUsage.associate = models => {
    LibraryUsage.belongsTo(models.Library, { foreignKey: 'id_library', as: 'library' });
    LibraryUsage.belongsTo(models.Client, { foreignKey: 'name_client', targetKey: 'name', as: 'client' });
  };

  return LibraryUsage;
};