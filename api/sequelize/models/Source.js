'use strict';

export default (sequelize, DataTypes) => {
  const Source = sequelize.define('Source', {
    id_source: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50)
    }
  }, {
    tableName: 'Source',
    freezeTableName: true,
    timestamps: false
  });

  Source.associate = models => {
    Source.hasMany(models.LastChapters, { foreignKey: 'id_source', as: 'lastChapters' });
    Source.hasMany(models.LibrarySource, { foreignKey: 'id_source', as: 'libraryLinks' });
  };

  return Source;
};