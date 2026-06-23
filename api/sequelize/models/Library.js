'use strict';

export default (sequelize, DataTypes) => {
  const Library = sequelize.define('Library', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500)
    },
    type: {
      type: DataTypes.STRING(50)
    },
    demographic: {
      type: DataTypes.STRING(50)
    },
    published: {
      type: DataTypes.STRING(50)
    },
    status: {
      type: DataTypes.STRING(50)
    },
    artist: {
      type: DataTypes.STRING(50)
    },
    author: {
      type: DataTypes.STRING(50)
    },
    theme: {
      type: DataTypes.STRING(50)
    },
    publishers: {
      type: DataTypes.STRING(50)
    },
    cover_path: {
      type: DataTypes.STRING(255)
    },
    cover_url: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'Library',
    freezeTableName: true,
    timestamps: false
  });

  Library.associate = models => {
    Library.hasMany(models.Tag, { foreignKey: 'id_library', as: 'tags' });
    Library.hasMany(models.AssociativeTitle, { foreignKey: 'id_library', as: 'associativeTitles' });
    Library.hasMany(models.LibraryUsage, { foreignKey: 'id_library', as: 'usages' });
    Library.hasMany(models.LastChapters, { foreignKey: 'id_library', as: 'lastChapters' });
    Library.hasMany(models.LibrarySource, { foreignKey: 'id_library', as: 'sourcesLinks' });
    Library.belongsToMany(models.Languages, {
      through: models.LangPref,
      foreignKey: 'id_library',
      otherKey: 'id_languages',
      as: 'languages'
    });
  };

  return Library;
};