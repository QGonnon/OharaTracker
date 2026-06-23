'use strict';

export default (sequelize, DataTypes) => {
  const Languages = sequelize.define('Languages', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50)
    }
  }, {
    tableName: 'Languages',
    freezeTableName: true,
    timestamps: false
  });

  Languages.associate = models => {
    Languages.hasMany(models.LangPref, { foreignKey: 'id_languages', as: 'preferences' });
    Languages.belongsToMany(models.Library, {
      through: models.LangPref,
      foreignKey: 'id_languages',
      otherKey: 'id_library',
      as: 'libraries'
    });
  };

  return Languages;
};