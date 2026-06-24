'use strict';

export default (sequelize, DataTypes) => {
  const LibraryType = sequelize.define('LibraryType', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'LibraryType',
    freezeTableName: true,
    timestamps: false
  });

  LibraryType.associate = models => {
    LibraryType.hasMany(models.LibrarySource, { foreignKey: 'id_library_type', as: 'librarySources' });
  };

  return LibraryType;
};