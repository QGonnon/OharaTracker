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
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.TEXT
    },
    demographic: {
      type: DataTypes.TEXT
    },
    published: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.TEXT
    },
    artist: {
      type: DataTypes.TEXT
    },
    author: {
      type: DataTypes.TEXT
    },
    theme: {
      type: DataTypes.TEXT
    },
    publishers: {
      type: DataTypes.TEXT
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